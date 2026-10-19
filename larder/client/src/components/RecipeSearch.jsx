import { useState } from 'react';
import { api } from '../api.js';

function RecipeSearch({ onSelectRecipe }) {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

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

      {searched && !loading && results.length === 0 && !error && (
        <p className="empty">No recipes found for "{query}" — try something else.</p>
      )}

      <div className="recipe-grid">
        {results.map(r => (
          <button key={r.id} className="recipe-card" onClick={() => onSelectRecipe(r.id)}>
            {r.image && <img src={r.image} alt={r.title} />}
            <span className="recipe-card-title">{r.title}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

export default RecipeSearch;
