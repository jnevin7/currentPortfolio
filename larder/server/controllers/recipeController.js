import PantryItem from '../models/PantryItem.js';

const SPOONACULAR_BASE = 'https://api.spoonacular.com';

function requireApiKey(res) {
  const key = process.env.SPOONACULAR_API_KEY;
  if (!key) {
    res.status(500).json({ error: 'Recipe search is not configured (missing SPOONACULAR_API_KEY)' });
    return null;
  }
  return key;
}

// Shared shape for a result-grid card: just enough to render the card and
// compute a "you have X of Y" badge client-side against the pantry map.
// `ingredientNames` is deliberately just plain strings (not the richer
// {id, original, aisle} shape `getRecipe` returns) — a card only needs to
// know how many ingredients match, not display them individually.
function toCardSummary(r) {
  return {
    id: r.id,
    title: r.title,
    image: r.image,
    ingredientNames: (r.extendedIngredients || []).map((i) => i.name),
  };
}

// GET /api/recipes/search?q=chicken+curry
// Thin proxy over Spoonacular's complexSearch — keeps the API key on the
// server. Requests ingredient data inline (addRecipeInformation +
// fillIngredients) so result cards can show a pantry-match badge without a
// second round-trip per card.
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
    url.searchParams.set('addRecipeInformation', 'true');
    url.searchParams.set('fillIngredients', 'true');

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      console.error('Spoonacular search failed:', response.status, body);
      return res.status(502).json({ error: 'Recipe search failed' });
    }

    const data = await response.json();
    const results = (data.results || []).map(toCardSummary);

    res.json(results);
  } catch (err) {
    console.error('searchRecipes error:', err);
    res.status(500).json({ error: 'Recipe search failed' });
  }
};

// GET /api/recipes/random?number=6
// A handful of random recipes for the homepage, so there's something to
// browse before you've typed a search — and a "surprise me" button to
// re-roll the same set.
export const getRandomRecipes = async (req, res) => {
  try {
    const apiKey = requireApiKey(res);
    if (!apiKey) return;

    const requested = parseInt(req.query.number, 10);
    const number = Number.isFinite(requested) ? Math.min(Math.max(requested, 1), 12) : 6;

    const url = new URL(`${SPOONACULAR_BASE}/recipes/random`);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('number', String(number));

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      console.error('Spoonacular random fetch failed:', response.status, body);
      return res.status(502).json({ error: 'Failed to fetch random recipes' });
    }

    const data = await response.json();
    const results = (data.recipes || []).map(toCardSummary);

    res.json(results);
  } catch (err) {
    console.error('getRandomRecipes error:', err);
    res.status(500).json({ error: 'Failed to fetch random recipes' });
  }
};

// GET /api/recipes/suggestions
// Recipes that make good use of the ingredients you've starred as
// favourites — a lightweight "what can I make with what I like" feature
// built on Spoonacular's findByIngredients. If nothing's favourited yet,
// there's nothing to suggest from, so it returns an empty list rather than
// guessing.
export const getSuggestions = async (req, res) => {
  try {
    const apiKey = requireApiKey(res);
    if (!apiKey) return;

    const favourites = await PantryItem.find({ userId: req.user.id, favourite: true }).select('name -_id');
    const names = favourites.map((f) => f.name);

    if (names.length === 0) {
      return res.json({ favourites: [], suggestions: [] });
    }

    const url = new URL(`${SPOONACULAR_BASE}/recipes/findByIngredients`);
    url.searchParams.set('apiKey', apiKey);
    url.searchParams.set('ingredients', names.join(','));
    url.searchParams.set('number', '2');
    // ranking=1 maximizes how many of the given ingredients are used,
    // which fits "suggestions based on your favourites" better than
    // minimizing missing ingredients would.
    url.searchParams.set('ranking', '1');

    const response = await fetch(url);
    if (!response.ok) {
      const body = await response.text();
      console.error('Spoonacular findByIngredients failed:', response.status, body);
      return res.status(502).json({ error: 'Failed to fetch suggestions' });
    }

    const data = await response.json();
    const suggestions = (data || []).map((r) => ({
      id: r.id,
      title: r.title,
      image: r.image,
      usedIngredientCount: r.usedIngredientCount,
      missedIngredientCount: r.missedIngredientCount,
    }));

    res.json({ favourites: names, suggestions });
  } catch (err) {
    console.error('getSuggestions error:', err);
    res.status(500).json({ error: 'Failed to fetch suggestions' });
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
