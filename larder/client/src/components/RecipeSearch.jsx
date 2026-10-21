import { useState, useEffect, useCallback } from 'react';
import { api, normalizeIngredient } from '../api.js';

// Shared card for the random grid, the suggestions grid, and search
// results. `badge` is an optional override — suggestion cards show "uses
// 2 of your favourites" (computed server-side by findByIngredients)
// instead of the generic pantry-match count.
function RecipeCard({ recipe, pantryMap, onSelect, badge }) {
  let computedBadge = null;
  if (badge !== undefined) {
    computedBadge = badge;
  } else if (recipe.ingredientNames && recipe.ingredientNames.length > 0) {
    const total = recipe.ingredientNames.length;
    const have = recipe.ingredientNames.filter(
      (n) => pantryMap[normalizeIngredient(n)] === true
    ).length;
    computedBadge = `You have ${have} of ${total}`;
  }

  return (
    <button className="recipe-card" onClick={() => onSelect(recipe.id)}>
      {recipe.image && <img src={recipe.image} alt={recipe.title} />}
      <span className="recipe-card-title">{recipe.title}</span>
      {computedBadge && <span className="match-badge">{computedBadge}</span>}
    </button>
  );
}

function RecipeSearch({ onSelectRecipe }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  const [pantryMap, setPantryMap] = useState({});

  const [randomRecipes, setRandomRecipes] = useState([]);
  const [randomLoading, setRandomLoading] = useState(true);
  const [randomError, setRandomError] = useState('');

  const [favourites, setFavourites] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [suggestionsLoading, setSuggestionsLoading] = useState(true);
  const [suggestionsError, setSuggestionsError] = useState('');

  const loadPantry = useCallback(async () => {
    try {
      const data = await api.getPantry();
      const map = {};
      data.forEach((item) => { map[item.name] = item.have; });
      setPantryMap(map);
    } catch {
      // Badges are a nice-to-have, not core — fail quietly and just show
      // cards without them.
    }
  }, []);

  const loadRandom = useCallback(async () => {
    try {
      setRandomLoading(true);
      setRandomError('');
      const data = await api.getRandomRecipes(6);
      setRandomRecipes(data);
    } catch (err) {
      setRandomError(err.message || 'Could not load recipes right now');
    } finally {
      setRandomLoading(false);
    }
  }, []);

  const loadSuggestions = useCallback(async () => {
    try {
      setSuggestionsLoading(true);
      setSuggestionsError('');
      const data = await api.getSuggestions();
      setFavourites(data.favourites);
      setSuggestions(data.suggestions);
    } catch (err) {
      setSuggestionsError(err.message || 'Could not load suggestions right now');
    } finally {
      setSuggestionsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPantry();
    loadRandom();
    loadSuggestions();
  }, [loadPantry, loadRandom, loadSuggestions]);

  const handleSearch = async () => {
    if (!query.trim()) return;
    try {
      setLoading(true);
      setError('');
      const data = await api.searchRecipes(query.trim());
      setResults(data);
      setSearched(true);
    } catch (err) {
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  };

  const handleBackToHome = () => {
    setSearched(false);
    setQuery('');
    setResults([]);
    setError('');
  };

  return (
    <div className="recipe-search">
      <div className="search-bar">
        <input
          type="text"
          placeholder="Search for a recipe… e.g. chicken curry"
          value={query}
          onChange={e => setQuery(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && handleSearch()}
          autoFocus
        />
        <button onClick={handleSearch} disabled={loading || !query.trim()}>
          {loading ? 'Searching…' : 'Search'}
        </button>
      </div>

      {error && <p className="error">{error}</p>}

      {searched ? (
        <>
          <button className="back-link" onClick={handleBackToHome}>← Back to browse</button>

          {!loading && results.length === 0 && !error && (
            <p className="empty">No recipes found for "{query}" — try something else.</p>
          )}

          <div className="recipe-grid">
            {results.map(r => (
              <RecipeCard key={r.id} recipe={r} pantryMap={pantryMap} onSelect={onSelectRecipe} />
            ))}
          </div>
        </>
      ) : (
        <>
          <section className="suggestions-section">
            <h3>Based on your favourites</h3>
            {suggestionsLoading ? (
              <p className="loading">Loading suggestions…</p>
            ) : suggestionsError ? (
              <p className="error">{suggestionsError}</p>
            ) : favourites.length === 0 ? (
              <p className="empty">
                Favourite a few ingredients in your pantry to get suggestions here.
              </p>
            ) : (
              <>
                <p className="suggestions-hint">Because you love: {favourites.join(', ')}</p>
                {suggestions.length === 0 ? (
                  <p className="empty">No matching recipes found for those yet — try favouriting a couple more.</p>
                ) : (
                  <div className="recipe-grid">
                    {suggestions.map(r => (
                      <RecipeCard
                        key={r.id}
                        recipe={r}
                        pantryMap={pantryMap}
                        onSelect={onSelectRecipe}
                        badge={`Uses ${r.usedIngredientCount} of your favourites`}
                      />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <section className="random-section">
            <div className="random-header">
              <h3>Something to try</h3>
              <button className="shuffle-btn" onClick={loadRandom} disabled={randomLoading}>
                {randomLoading ? 'Shuffling…' : '🔀 Surprise me'}
              </button>
            </div>
            {randomError ? (
              <p className="error">{randomError}</p>
            ) : randomLoading && randomRecipes.length === 0 ? (
              <p className="loading">Loading recipes…</p>
            ) : (
              <div className="recipe-grid">
                {randomRecipes.map(r => (
                  <RecipeCard key={r.id} recipe={r} pantryMap={pantryMap} onSelect={onSelectRecipe} />
                ))}
              </div>
            )}
          </section>
        </>
      )}
    </div>
  );
}

export default RecipeSearch;
