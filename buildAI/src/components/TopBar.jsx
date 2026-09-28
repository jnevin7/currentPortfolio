export default function TopBar({ role, onLogout }) {
  return (
    <header className="topbar">
      <div className="topbar-logo">
        <span className="logo-dot" />
        BuildAI
      </div>
      {role && (
        <div className="row" style={{ gap: 10 }}>
          <span style={{ fontSize: 13, color: "var(--muted)" }}>
            {role === "doctor" ? "Expert portal" : "Client portal"}
          </span>
          <button className="btn btn-ghost btn-sm" onClick={onLogout}>Sign out</button>
        </div>
      )}
    </header>
  );
}
