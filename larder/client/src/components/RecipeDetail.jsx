import { useState, useEffect, useMemo } from 'react';
import { api, normalizeIngredient } from '../api.js';

// Strip Spoonacular's HTML-ish instructions down to plain paragraphs.
function cleanInstructions(html) {
  if (!html) return [];
  return html
    .replace(/<\/?p>/g, '\n')
    .replace(/<li>/g, '- ')
    .replace(/<\/?[^>]+>/g, '')
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean);
}

function RecipeDetail({ recipeId, onBack }) {
  const [recipe, setRecipe] = useState(null);
  const [pantry, setPantry] = useState({}); // { normalizedName: have }
  const [have, setHave] = useState({});     // local per-ingredient checked state for THIS recipe
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError('');
        const [recipeData, pantryData] = await Promise.all([
          api.getRecipe(recipeId),
          api.getPantry(),
        ]);
        if (cancelled) return;

        const pantryMap = {};
        pantryData.forEach(p => { pantryMap[p.name] = p.have; });

        const initialHave = {};
        recipeData.ingredients.forEach(ing => {
          const key = normalizeIngredient(ing.name);
          // Only pre-tick when the pantry explicitly says so — an
          // ingredient we've never seen before stays unticked, not assumed
          // missing or assumed owned.
          if (pantryMap[key] === true) initialHave[ing.id] = true;
        });

        setRecipe(recipeData);
        setPantry(pantryMap);
        setHave(initialHave);
      } catch (err) {
        if (!cancelled) setError(err.message || 'Failed to load recipe');
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [recipeId]);

  const toggleIngredient = async (ingredient) => {
    const next = !have[ingredient.id];
    setHave(prev => ({ ...prev, [ingredient.id]: next }));
    try {
      await api.setPantryItem(ingredient.name, next);
    } catch {
      // Revert on failure so the UI doesn't lie about what's actually saved.
      setHave(prev => ({ ...prev, [ingredient.id]: !next }));
    }
  };

  const missing = useMemo(
    () => (recipe ? recipe.ingredients.filter(i => !have[i.id]) : []),
    [recipe, have]
  );

  const handleCopy = async () => {
    const text = missing.map(i => `- ${i.original}`).join('\n');
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Clipboard API can be unavailable (older browser, no HTTPS) — fail quietly,
      // the list is still visible on screen to copy by hand.
    }
  };

  if (loading) return <p className="loading">Loading recipe…</p>;
  if (error) return <p className="error">{error}</p>;
  if (!recipe) return null;

  const instructionLines = cleanInstructions(recipe.instructions);

  return (
    <div className="recipe-detail">
      <button className="back-link" onClick={onBack}>← Back to search</button>

      <div className="recipe-detail-header">
        {recipe.image && <img src={recipe.image} alt={recipe.title} />}
        <div>
          <h2>{recipe.title}</h2>
          <p className="recipe-meta">
            {recipe.servings ? `${recipe.servings} servings` : ''}
            {recipe.servings && recipe.readyInMinutes ? ' · ' : ''}
            {recipe.readyInMinutes ? `${recipe.readyInMinutes} min` : ''}
          </p>
        </div>
      </div>

      <div className="ingredients-section">
        <div className="ingredients-header">
          <h3>Ingredients</h3>
          <span className="ingredients-count">
            {missing.length} of {recipe.ingredients.length} needed
          </span>
        </div>

        <ul className="ingredient-list">
          {recipe.ingredients.map(ing => (
            <li key={ing.id} className={have[ing.id] ? 'ingredient-have' : ''}>
              <label>
                <input
                  type="checkbox"
                  checked={!!have[ing.id]}
                  onChange={() => toggleIngredient(ing)}
                />
                <span>{ing.original}</span>
              </label>
            </li>
          ))}
        </ul>

        <button className="copy-btn" onClick={handleCopy} disabled={missing.length === 0}>
          {copied ? '✓ Copied!' : `Copy shopping list (${missing.length})`}
        </button>
        <p className="copy-hint">Ticked items are remembered in your pantry for next time.</p>
      </div>

      {instructionLines.length > 0 && (
        <div className="instructions-section">
          <h3>Instructions</h3>
          <ol>
            {instructionLines.map((line, i) => (
              <li key={i}>{line.replace(/^-\s*/, '')}</li>
            ))}
          </ol>
        </div>
      )}

      {recipe.sourceUrl && (
        <a className="source-link" href={recipe.sourceUrl} target="_blank" rel="noreferrer">
          Full recipe source →
        </a>
      )}
    </div>
  );
}

export default RecipeDetail;
