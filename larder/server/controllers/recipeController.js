const SPOONACULAR_BASE = 'https://api.spoonacular.com';

function requireApiKey(res) {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'Recipe search is not configured (missing SPOONACULAR_API_KEY)' });
    return null;
  }
  return key;
}

// GET /api/recipes/search?q=chicken+curry
// Thin proxy over Spoonacular's complexSearch — keeps the API key on the
// server and trims the response down to what the client actually needs
// for a results grid (id, title, image).
export const searchRecipes = async (req, res) => {
  try {
    const apiKey = requireApiKey(res);
    if (!apiKey) return;

    const query = (req.query.q || '').trim();
    if (!query) {
      return res.status(400).json({ error: 'Query parameter q is required' });
    }

    const url = new URL(`${SPOONACULAR_BASE}/recipes/complexSearch`);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('query', query);
    url.searchParams.set('number', '12');
    url.searchParams.set('addRecipeInformation', 'false');

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      console.error('Spoonacular search failed:', response.status, body);
      return res.status(502).json({ error: 'Recipe search failed' });
    }

    const data = await response.json();
    const results = (data.results || []).map((r) => ({
      id: r.id,
      title: r.title,
      image: r.image,
    }));

    res.json(results);
  } catch (err) {
    console.error('searchRecipes error:', err);
    res.status(500).json({ error: 'Recipe search failed' });
  }
};

// GET /api/recipes/:id
// Full recipe detail, including the structured ingredient list. Each
// ingredient keeps both `name` (clean, used for pantry matching) and
// `original` (the full "2 cups flour" text, used for the copyable list and
// for display) since those serve different purposes on the client.
export const getRecipe = async (req, res) => {
  try {
    const apiKey = requireApiKey(res);
    if (!apiKey) return;

    const { id } = req.params;
    if (!/^\d+$/.test(id)) {
      return res.status(400).json({ error: 'Invalid recipe id' });
    }

    const url = new URL(`${SPOONACULAR_BASE}/recipes/${id}/information`);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('includeNutrition', 'false');

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      console.error('Spoonacular recipe fetch failed:', response.status, body);
      return res.status(502).json({ error: 'Failed to fetch recipe' });
    }

    const data = await response.json();

    const ingredients = (data.extendedIngredients || []).map((i) => ({
      id: i.id,
      name: i.name,
      original: i.original,
      aisle: i.aisle || 'Other',
    }));

    res.json({
      id: data.id,
      title: data.title,
      image: data.image,
      servings: data.servings,
      readyInMinutes: data.readyInMinutes,
      sourceUrl: data.sourceUrl,
      instructions: data.instructions || '',
      ingredients,
    });
  } catch (err) {
    console.error('getRecipe error:', err);
    res.status(500).json({ error: 'Failed to fetch recipe' });
  }
};
