import { useState } from 'react';
import Header from './components/Header.jsx';
import Auth from './components/Auth.jsx';
import RecipeSearch from './components/RecipeSearch.jsx';
import RecipeDetail from './components/RecipeDetail.jsx';
import PantryView from './components/PantryView.jsx';
import { getToken, getUsername, clearSession } from './api.js';
import './index.css';

function App() {
  const [username, setUsername] = useState(() => getUsername());
  const [token, setToken] = useState(() => getToken());
  const [view, setView] = useState('search');       // 'search' | 'recipe' | 'pantry'
  const [activeRecipeId, setActiveRecipeId] = useState(null);

  const handleAuth = (name) => {
    setUsername(name);
    setToken(getToken());
  };

  const handleLogout = () => {
    clearSession();
    setUsername('');
    setToken('');
    setView('search');
    setActiveRecipeId(null);
  };

  const handleNavigate = (nextView) => {
    setView(nextView);
    if (nextView !== 'recipe') setActiveRecipeId(null);
  };

  const handleSelectRecipe = (id) => {
    setActiveRecipeId(id);
    setView('recipe');
  };

  if (!username || !token) {
    return (
      <div className="app">
        <Auth onAuth={handleAuth} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header username={username} view={view} onNavigate={handleNavigate} onLogout={handleLogout} />
      <main className="main">
        {view === 'search' && <RecipeSearch onSelectRecipe={handleSelectRecipe} />}
        {view === 'recipe' && activeRecipeId && (
          <RecipeDetail recipeId={activeRecipeId} onBack={() => handleNavigate('search')} />
        )}
        {view === 'pantry' && <PantryView />}
      </main>
    </div>
  );
}

export default App;
