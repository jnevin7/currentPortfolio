import { useState } from "react";
import { api, setToken } from "../api";

function Field({ label, children }) {
  return (
    <div className="field">
      <label>{label}</label>
      {children}
    </div>
  );
}

function Alert({ type, msg }) {
  if (!msg) return null;
  const color = type === "error" ? "var(--danger)" : "var(--success)";
  const bg    = type === "error" ? "var(--danger-dim)" : "var(--success-dim)";
  const border = type === "error" ? "#e8b4ae" : "#a8d4b8";
  return (
    <div style={{
      fontSize: 13, padding: "10px 14px", borderRadius: 8,
      border: `1px solid ${border}`, background: bg, color,
      marginBottom: 14, lineHeight: 1.5,
    }}>
      {msg}
    </div>
  );
}

/* ── Login ── */
function LoginForm({ onLogin, onGoRegister, onGoForgot }) {
  const [email,    setEmail]    = useState("");
  const [password, setPassword] = useState("");
  const [loading,  setLoading]  = useState(false);
  const [error,    setError]    = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setLoading(true);
    try {
      const { token } = await api.login({ email, password });
      setToken(token);
      const me = await api.me();
      onLogin(me);
    } catch (err) {
      setError(err?.message?.replace(/^\d+ /, "") || "Invalid email or password.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-heading">Welcome back</div>
      <div className="auth-sub">Sign in to your BuildAI account</div>
      <form onSubmit={handleSubmit}>
        <Alert type="error" msg={error} />
        <Field label="Email">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoComplete="email" />
        </Field>
        <Field label="Password">
          <input type="password" value={password} onChange={e => setPassword(e.target.value)}
            placeholder="••••••••" required autoComplete="current-password" />
        </Field>
        <div style={{ textAlign: "right", marginBottom: 16 }}>
          <button type="button" className="auth-link" onClick={onGoForgot}>Forgot password?</button>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} type="submit" disabled={loading}>
          {loading ? "Signing in…" : "Sign in →"}
        </button>
      </form>
      <div className="auth-footer">
        Don't have an account?{" "}
        <button className="auth-link" onClick={onGoRegister}>Create one</button>
      </div>
    </div>
  );
}

/* ── Register ── */
const SEX_OPTIONS = [
  { value: "",            label: "Prefer not to say" },
  { value: "male",        label: "Male"        },
  { value: "female",      label: "Female"      },
  { value: "intersex",    label: "Intersex"    },
  { value: "other",       label: "Other"       },
  { value: "unspecified", label: "Unspecified" },
];

function RegisterForm({ onLogin, onGoLogin }) {
  const [form, setForm] = useState({
    name: "", email: "", password: "", confirmPassword: "",
    role: "patient", dob: "", phone: "", sex: "",
  });
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");

  const set = (k) => (e) => setForm(f => ({ ...f, [k]: e.target.value }));

  async function handleSubmit(e) {
    e.preventDefault();
    setError("");
    if (form.password !== form.confirmPassword) return setError("Passwords do not match.");
    if (form.password.length < 8) return setError("Password must be at least 8 characters.");
    setLoading(true);
    try {
      const payload = {
        name: form.name, email: form.email, password: form.password, role: form.role,
        ...(form.dob   ? { dob: form.dob }   : {}),
        ...(form.phone ? { phone: form.phone }: {}),
        ...(form.sex   ? { sex: form.sex }    : {}),
      };
      const { token } = await api.register(payload);
      setToken(token);
      const me = await api.me();
      onLogin(me);
    } catch (err) {
      setError(err?.message?.replace(/^\d+ /, "") || "Registration failed. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-heading">Create account</div>
      <div className="auth-sub">Join BuildAI — free for property owners</div>
      <form onSubmit={handleSubmit}>
        <Alert type="error" msg={error} />

        <div className="role-toggle">
          {[
            { value: "patient", label: "🏠 Property Owner" },
            { value: "doctor",  label: "👷 Expert"         },
          ].map(r => (
            <button key={r.value} type="button"
              className={`role-btn ${form.role === r.value ? "role-btn-active" : ""}`}
              onClick={() => setForm(f => ({ ...f, role: r.value }))}>
              {r.label}
            </button>
          ))}
        </div>

        <div className="auth-grid-2">
          <Field label="Full name">
            <input type="text" value={form.name} onChange={set("name")}
              placeholder="Jane Smith" required autoComplete="name" />
          </Field>
          <Field label="Email">
            <input type="email" value={form.email} onChange={set("email")}
              placeholder="you@example.com" required autoComplete="email" />
          </Field>
        </div>
        <div className="auth-grid-2">
          <Field label="Password">
            <input type="password" value={form.password} onChange={set("password")}
              placeholder="Min. 8 characters" required autoComplete="new-password" />
          </Field>
          <Field label="Confirm password">
            <input type="password" value={form.confirmPassword} onChange={set("confirmPassword")}
              placeholder="Repeat password" required autoComplete="new-password" />
          </Field>
        </div>
        <div className="auth-grid-3">
          <Field label="Date of birth">
            <input type="date" value={form.dob} onChange={set("dob")} />
          </Field>
          <Field label="Phone">
            <input type="tel" value={form.phone} onChange={set("phone")} placeholder="+27 …" />
          </Field>
          <Field label="Gender">
            <select value={form.sex} onChange={set("sex")}>
              {SEX_OPTIONS.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
            </select>
          </Field>
        </div>

        <button className="btn btn-primary" style={{ width: "100%", marginTop: 4 }}
          type="submit" disabled={loading}>
          {loading ? "Creating account…" : "Create account →"}
        </button>
      </form>
      <div className="auth-footer">
        Already have an account?{" "}
        <button className="auth-link" onClick={onGoLogin}>Sign in</button>
      </div>
    </div>
  );
}

/* ── Forgot password ── */
function ForgotForm({ onGoLogin }) {
  const [email,   setEmail]   = useState("");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState("");
  const [success, setSuccess] = useState("");

  async function handleSubmit(e) {
    e.preventDefault();
    setError(""); setSuccess(""); setLoading(true);
    try {
      await api.forgotPassword({ email });
      setSuccess("If that email is registered, a reset link has been sent. Check your inbox.");
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="auth-card">
      <div className="auth-heading">Reset password</div>
      <div className="auth-sub">We'll send a reset link to your email</div>
      <form onSubmit={handleSubmit}>
        <Alert type="error"   msg={error}   />
        <Alert type="success" msg={success} />
        <Field label="Email">
          <input type="email" value={email} onChange={e => setEmail(e.target.value)}
            placeholder="you@example.com" required autoComplete="email" />
        </Field>
        <button className="btn btn-primary" style={{ width: "100%" }}
          type="submit" disabled={loading || !!success}>
          {loading ? "Sending…" : "Send reset link →"}
        </button>
      </form>
      <div className="auth-footer">
        <button className="auth-link" onClick={onGoLogin}>← Back to sign in</button>
      </div>
    </div>
  );
}

/* ── Root ── */
export default function AuthPage({ onLogin }) {
  const [view, setView] = useState("login");

  return (
    <div className="auth-page">
      <div className="auth-brand">
        <span className="logo-dot" style={{ width: 12, height: 12 }} />
        BuildAI
      </div>
      {view === "login"    && <LoginForm    onLogin={onLogin} onGoRegister={() => setView("register")} onGoForgot={() => setView("forgot")} />}
      {view === "register" && <RegisterForm onLogin={onLogin} onGoLogin={() => setView("login")} />}
      {view === "forgot"   && <ForgotForm   onGoLogin={() => setView("login")} />}
    </div>
  );
}
