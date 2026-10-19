function Header({ author, theme, onThemeChange, themes, onLogout }) {
  return (
    <header className="header">
      <div className="header-inner">
        <div className="logo">
          <span className="logo-text">Acacia</span>
        </div>

        <div className="theme-switcher">
          {Object.values(themes).map(t => (
            <button
              key={t.id}
              className={`theme-btn${theme === t.id ? ' active' : ''}`}
              onClick={() => onThemeChange(t.id)}
              title={t.label}
              aria-label={`Switch to ${t.label} theme`}
            >
              <span
                className="theme-preview"
                style={{ background: t.preview[0], borderColor: t.preview[1] }}
              />
              <span
                className="theme-preview-inner"
                style={{ background: t.preview[1] }}
              />
            </button>
          ))}
        </div>

        {author && <span className="author-chip">{author}</span>}
        <button className="logout-btn" onClick={onLogout}>Logout</button>
      </div>
    </header>
  );
}

export default Header;