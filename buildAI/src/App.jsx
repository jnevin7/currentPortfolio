import { useState, useEffect } from "react";
import { api, getToken, clearToken } from "./api";
import "./App.css";

import TopBar      from "./components/TopBar";
import AuthPage    from "./pages/AuthPage";
import PatientPage from "./pages/PatientPage";
import DoctorPage  from "./pages/DoctorPage";

export default function App() {
  const [authed,    setAuthed]    = useState(!!getToken());
  const [user,      setUser]      = useState(null);
  const [consented, setConsented] = useState(false);

  function handleLogin(me) {
    setUser(me);
    setConsented(!!me.consentAt);
    setAuthed(true);
  }

  function handleLogout() {
    clearToken();
    setAuthed(false);
    setUser(null);
    setConsented(false);
  }

  useEffect(() => {
    if (!authed) return;
    (async () => {
      try {
        const me = await api.me();
        setUser(me);
        setConsented(!!me.consentAt);
      } catch {
        handleLogout();
      }
    })();
  }, [authed]);

  return (
    <div className="app-shell">
      <TopBar role={user?.role} onLogout={handleLogout} />
      <main className="main-content">
        {!authed && <AuthPage onLogin={handleLogin} />}
        {authed && user?.role === "doctor"  && <DoctorPage  user={user} />}
        {authed && user?.role !== "doctor"  && (
          <PatientPage user={user} consented={consented} onConsent={() => setConsented(true)} />
        )}
      </main>
    </div>
  );
}
