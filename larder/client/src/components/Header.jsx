function Header({ username, view, onNavigate, onLogout }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo" onClick={() => onNavigate('search')}>
          <span className="logo-text">🧺 Larder</span>
        </div>

        <nav className="header-nav">
          <button
            className={`nav-link ${view === 'search' ? 'nav-link-active' : ''}`}
            onClick={() => onNavigate('search')}
          >
            Find a recipe
          </button>
          <button
            className={`nav-link ${view === 'pantry' ? 'nav-link-active' : ''}`}
            onClick={() => onNavigate('pantry')}
          >
            My pantry
          </button>
        </nav>

        {username && <span className="author-chip">{username}</span>}
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Header;
