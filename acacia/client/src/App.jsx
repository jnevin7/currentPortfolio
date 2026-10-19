import { useState, useEffect } from 'react';
import PostFeed from './components/PostFeed.jsx';
import PostForm from './components/PostForm.jsx';
import Header from './components/Header.jsx';
import Auth from './components/Auth.jsx';
import './index.css';

const CATEGORIES = ['general', 'news', 'question'];

export const THEMES = {
  light:    { id: 'light',    label: 'Light',    preview: ['#FFFFFF', '#111111'] },
  dark:     { id: 'dark',     label: 'Dark',     preview: ['#111111', '#FFFFFF'] },
  terminal: { id: 'terminal', label: 'Terminal', preview: ['#0D1200', '#39FF14'] },
};

function App() {
  const [posts, setPosts]     = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);
  const [filter, setFilter]   = useState({ category: '' });
  const [author, setAuthor]   = useState(() => localStorage.getItem('acacia_author') || '');
  const [token, setToken]     = useState(() => localStorage.getItem('acacia_token') || '');
  const [theme, setTheme]     = useState(() => localStorage.getItem('acacia_theme') || 'light');

  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme);
    localStorage.setItem('acacia_theme', theme);
  }, [theme]);

  const fetchPosts = async () => {
    try {
      setLoading(true); setError(null);
      const params = new URLSearchParams();
      if (filter.category) params.append('category', filter.category);
      const res = await fetch(`/api/posts?${params}`);
      if (!res.ok) throw new Error();
      setPosts(await res.json());
    } catch {
      setError('Could not load posts. You may be offline.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchPosts(); }, [filter]);

  const handleAuth = (username) => {
    setAuthor(username);
    setToken(localStorage.getItem('acacia_token'));
  };

  const handleLogout = () => {
    localStorage.removeItem('acacia_token');
    localStorage.removeItem('acacia_author');
    setAuthor('');
    setToken('');
  };

  const handlePost = async (postData) => {
    try {
      const res = await fetch('/api/posts', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ ...postData, author })
      });
      if (!res.ok) throw new Error();
      const newPost = await res.json();
      setPosts(prev => [newPost, ...prev]);
    } catch {
      alert('Could not post. Check your connection.');
    }
  };

  const handleReact = async (id) => {
    try {
      const res = await fetch(`/api/posts/${id}/react`, { method: 'PATCH' });
      if (!res.ok) throw new Error();
      const updated = await res.json();
      setPosts(prev => prev.map(p => p._id === id ? updated : p));
    } catch { /* silent */ }
  };

  if (!author || !token) {
    return (
      <div className="app">
        <Auth onAuth={handleAuth} />
      </div>
    );
  }

  return (
    <div className="app">
      <Header
        author={author}
        theme={theme}
        onThemeChange={setTheme}
        themes={THEMES}
        onLogout={handleLogout}
      />
      <main className="main">
        <PostForm onSubmit={handlePost} categories={CATEGORIES} />
        <div className="filters">
          <span className="filter-label">Filter:</span>
          {['', ...CATEGORIES].map(c => (
            <button
              key={c}
              className={`filter-btn${filter.category === c ? ' active' : ''}`}
              onClick={() => setFilter({ category: c })}
            >
              {c === '' ? 'All' : c}
            </button>
          ))}
        </div>
        {error && <p className="error">{error}</p>}
        {loading
          ? <p className="loading">Loading...</p>
          : <PostFeed posts={posts} onReact={handleReact} />
        }
      </main>
    </div>
  );
}

export default App;