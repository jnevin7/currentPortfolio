import TriageBadge from "./TriageBadge";

const toThumb = (url) =>
  url?.includes("/upload/")
    ? url.replace("/upload/", "/upload/c_fill,w_120,h_120,q_auto,f_auto/")
    : url;

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function StatTile({ value, label, color, icon, delay = 0 }) {
  return (
    <div className="dash-stat" style={{ animationDelay: `${delay}ms` }}>
      <div className="dash-stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
      <div className="dash-stat-value" style={{ color }}>{value}</div>
      <div className="dash-stat-label">{label}</div>
    </div>
  );
}

/* STEAM reminder for construction */
const STEAM_ITEMS = [
  { l: "S", label: "Structural",  tip: "Is the structure or load-bearing element affected?" },
  { l: "T", label: "Type",        tip: "What kind of fault is it — crack, damp, corrosion?" },
  { l: "E", label: "Extent",      tip: "How far has the damage spread?" },
  { l: "A", label: "Age",         tip: "How long has this been present or worsening?" },
  { l: "M", label: "Materials",   tip: "Which materials are affected — wood, concrete, steel?" },
];

function STEAMReminder() {
  return (
    <div className="card dash-abcde-card">
      <div className="card-title"><span className="icon">🏠</span> STEAM Self-Check</div>
      <p className="dash-abcde-intro">
        Before submitting a report, consider these five factors. They help our AI
        and experts assess the severity of your issue quickly.
      </p>
      <div className="dash-abcde-row">
        {STEAM_ITEMS.map(({ l, label, tip }) => (
          <div key={l} className="dash-abcde-chip">
            <span className="dash-abcde-letter">{l}</span>
            <div>
              <div className="dash-abcde-chip-label">{label}</div>
              <div className="dash-abcde-chip-tip">{tip}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function RecentReportRow({ c, onClick }) {
  const thumb = toThumb(c.imageUrl);
  const reviewed = !!c.doctorNotes;
  return (
    <div className="dash-case-row" onClick={onClick}>
      {thumb && <img src={thumb} alt="" className="dash-case-thumb" />}
      <div className="dash-case-info">
        <div className="dash-case-name">{c.ai?.prediction?.replace(/_/g, " ") || "Pending assessment"}</div>
        <div className="row" style={{ marginBottom: 4, gap: 8 }}>
          <TriageBadge triage={c.ai?.triage} />
          <span className="dash-case-date">
            {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
          </span>
        </div>
      </div>
      <div className={`dash-review-pill ${reviewed ? "dash-reviewed" : "dash-pending"}`}>
        {reviewed ? "✓ Reviewed" : "⏳ Pending"}
      </div>
    </div>
  );
}

function UpcomingApptRow({ a }) {
  const when = new Date(a.when);
  const isToday = new Date().toDateString() === when.toDateString();
  return (
    <div className="dash-appt-row">
      <div className="dash-appt-date">
        <div className="dash-appt-day">{when.getDate()}</div>
        <div className="dash-appt-month">{when.toLocaleString("en-GB", { month: "short" })}</div>
      </div>
      <div className="dash-appt-info">
        <div className="dash-appt-time">
          {isToday && <span className="dash-today-pill">Today</span>}
          {when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </div>
        <div className="dash-appt-doctor">
          {a.doctorId?.name ? `Expert: ${a.doctorId.name}` : "Expert site visit"}
        </div>
      </div>
      <span className="status-pill">{a.status}</span>
    </div>
  );
}

function ReviewedNotice({ cases }) {
  const reviewed = cases.filter(c => c.doctorNotes);
  if (!reviewed.length) return null;
  return (
    <div className="dash-notice">
      <span className="dash-notice-icon">👷</span>
      <div>
        <div className="dash-notice-title">
          {reviewed.length === 1
            ? "An expert has reviewed your report"
            : `${reviewed.length} of your reports have been reviewed`}
        </div>
        <div className="dash-notice-sub">Open your reports below to read the expert's assessment.</div>
      </div>
    </div>
  );
}

export default function PatientDashboard({ user, cases, appts, onSubmitCase, onOpenCase }) {
  const critical  = cases.filter(c => c.ai?.triage === "urgent").length;
  const monitor   = cases.filter(c => c.ai?.triage === "review_soon").length;
  const lowRisk   = cases.filter(c => c.ai?.triage === "non_urgent").length;

  const upcoming = appts
    .filter(a => new Date(a.when) >= new Date())
    .sort((a, b) => new Date(a.when) - new Date(b.when))
    .slice(0, 3);

  return (
    <div className="dash-wrap">

      <div className="dash-welcome">
        <div>
          <div className="dash-greeting">{greeting()},</div>
          <div className="dash-name">{user?.name?.split(" ")[0] || "there"}</div>
          <div className="dash-sub">Here's an overview of your property reports.</div>
        </div>
        <button className="btn btn-primary dash-cta" onClick={onSubmitCase}>
          + Submit new report
        </button>
      </div>

      <ReviewedNotice cases={cases} />

      <div className="dash-stats">
        <StatTile value={cases.length} label="Total reports"   color="var(--accent)"  icon="📋" delay={0}   />
        <StatTile value={critical}     label="Critical"        color="var(--danger)"  icon="🔴" delay={60}  />
        <StatTile value={monitor}      label="Monitor"         color="var(--warn)"    icon="🟡" delay={120} />
        <StatTile value={lowRisk}      label="Low risk"        color="var(--success)" icon="🟢" delay={180} />
        <StatTile value={upcoming.length} label="Site visits"  color="#7c6fcd"        icon="📅" delay={240} />
      </div>

      <div className="dash-cols">
        <div className="card dash-col-card">
          <div className="card-title"><span className="icon">📋</span> Recent Reports</div>
          {cases.length === 0 ? (
            <div className="empty-state">No reports yet — submit your first one above.</div>
          ) : (
            cases.slice(0, 4).map(c => (
              <RecentReportRow key={c._id} c={c} onClick={() => onOpenCase(c)} />
            ))
          )}
        </div>

        <div className="card dash-col-card">
          <div className="card-title"><span className="icon">📅</span> Upcoming Site Visits</div>
          {upcoming.length === 0 ? (
            <div className="empty-state">No upcoming visits booked.</div>
          ) : (
            upcoming.map(a => <UpcomingApptRow key={a._id} a={a} />)
          )}
        </div>
      </div>

      <STEAMReminder />

    </div>
  );
}