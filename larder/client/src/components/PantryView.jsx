import { useState, useEffect } from 'react';
import { api } from '../api.js';

function PantryView() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [newItem, setNewItem] = useState('');

  const load = async () => {
    try {
      setLoading(true);
      setError('');
      const data = await api.getPantry();
      setItems(data.sort((a, b) => a.name.localeCompare(b.name)));
    } catch (err) {
      setError(err.message || 'Failed to load pantry');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const toggle = async (item) => {
    const next = !item.have;
    setItems(prev => prev.map(i => i.name === item.name ? { ...i, have: next } : i));
    try {
      await api.setPantryItem(item.name, next);
    } catch {
      setItems(prev => prev.map(i => i.name === item.name ? { ...i, have: !next } : i));
    }
  };

  const toggleFavourite = async (item) => {
    const next = !item.favourite;
    setItems(prev => prev.map(i => i.name === item.name ? { ...i, favourite: next } : i));
    try {
      await api.setFavourite(item.name, next);
    } catch {
      setItems(prev => prev.map(i => i.name === item.name ? { ...i, favourite: !next } : i));
    }
  };

  const addStaple = async () => {
    const name = newItem.trim();
    if (!name) return;
    setNewItem('');
    try {
      await api.setPantryItem(name, true);
      load();
    } catch (err) {
      setError(err.message || 'Failed to add item');
    }
  };

  if (loading) return <p className="loading">Loading pantry…</p>;

  return (
    <div className="pantry-view">
      <h2>My pantry</h2>
      <p className="pantry-intro">
        Everything you've ticked across any recipe lives here. Add staples you
        always have on hand so new recipes pre-tick them automatically, and
        star a few favourites to get recipe suggestions based on them.
      </p>

      <div className="pantry-add">
        <input
          type="text"
          placeholder="Add a staple… e.g. olive oil"
          value={newItem}
          onChange={e => setNewItem(e.target.value)}
          onKeyDown={e => e.key === 'Enter' && addStaple()}
        />
        <button onClick={addStaple} disabled={!newItem.trim()}>Add</button>
      </div>

      {error && <p className="error">{error}</p>}

      {items.length === 0 ? (
        <p className="empty">
          Nothing here yet — tick ingredients on a recipe, star a favourite, or add a staple above.
        </p>
      ) : (
        <ul className="pantry-list">
          {items.map(item => (
            <li key={item.name} className={item.have ? 'ingredient-have' : ''}>
              <label>
                <input type="checkbox" checked={item.have} onChange={() => toggle(item)} />
                <span>{item.name}</span>
              </label>
              <button
                className={`favourite-star ${item.favourite ? 'favourite-star-active' : ''}`}
                onClick={() => toggleFavourite(item)}
                title={item.favourite ? 'Unfavourite' : 'Favourite'}
                aria-label={item.favourite ? `Unfavourite ${item.name}` : `Favourite ${item.name}`}
              >
                {item.favourite ? '★' : '☆'}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default PantryView;
