import TriageBadge from "./TriageBadge";

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

const toThumb = (url) =>
  url?.includes("/upload/")
    ? url.replace("/upload/", "/upload/c_fill,w_100,h_100,q_auto,f_auto/")
    : url;

function StatTile({ value, label, color, icon, delay = 0, alert }) {
  return (
    <div className="dash-stat" style={{ animationDelay: `${delay}ms`, position: "relative" }}>
      {alert && <span className="dash-stat-alert" />}
      <div className="dash-stat-icon" style={{ background: `${color}18`, color }}>{icon}</div>
      <div className="dash-stat-value" style={{ color }}>{value}</div>
      <div className="dash-stat-label">{label}</div>
    </div>
  );
}

function SeverityBar({ urgent, reviewSoon, clear }) {
  const total = urgent + reviewSoon + clear || 1;
  const pct = (n) => `${Math.round((n / total) * 100)}%`;
  return (
    <div className="dash-severity-wrap">
      <div className="dash-severity-bar">
        <div style={{ width: pct(urgent),     background: "var(--danger)",  borderRadius: "6px 0 0 6px" }} />
        <div style={{ width: pct(reviewSoon), background: "var(--warn)" }} />
        <div style={{ width: pct(clear),      background: "var(--success)", borderRadius: "0 6px 6px 0" }} />
      </div>
      <div className="dash-severity-legend">
        <span><span className="sev-dot" style={{ background: "var(--danger)"  }} />{urgent} critical</span>
        <span><span className="sev-dot" style={{ background: "var(--warn)"    }} />{reviewSoon} monitor</span>
        <span><span className="sev-dot" style={{ background: "var(--success)" }} />{clear} low risk</span>
      </div>
    </div>
  );
}

function CriticalRow({ c }) {
  const thumb = toThumb(c.imageUrl);
  return (
    <div className="dash-urgent-row">
      {thumb && <img src={thumb} alt="" className="dash-case-thumb" />}
      <div className="dash-case-info">
        <div className="dash-case-name">{c.ai?.prediction?.replace(/_/g, " ") || "Pending"}</div>
        <div className="row" style={{ gap: 6, flexWrap: "wrap", alignItems: "center" }}>
          <TriageBadge triage={c.ai?.triage} />
          {c.patient?.name && <span className="dash-case-date">Client: {c.patient.name}</span>}
        </div>
        <div className="dash-case-date" style={{ marginTop: 2 }}>{c.description}</div>
      </div>
      {!c.doctorId && <span className="dash-unclaimed-pill">Unclaimed</span>}
    </div>
  );
}

function UpcomingApptRow({ a }) {
  const when = new Date(a.when);
  return (
    <div className="dash-appt-row">
      <div className="dash-appt-date">
        <div className="dash-appt-day">{when.getDate()}</div>
        <div className="dash-appt-month">{when.toLocaleString("en-GB", { month: "short" })}</div>
      </div>
      <div className="dash-appt-info">
        <div className="dash-appt-time">{when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}</div>
        <div className="dash-appt-doctor">{a.patientId?.name || "Client"}</div>
      </div>
      <span className="status-pill">{a.status}</span>
    </div>
  );
}

function CollabAlert({ count }) {
  if (!count) return null;
  return (
    <div className="dash-notice dash-notice-warn">
      <span className="dash-notice-icon">🤝</span>
      <div>
        <div className="dash-notice-title">
          {count} report{count > 1 ? "s" : ""} need{count === 1 ? "s" : ""} a second opinion
        </div>
        <div className="dash-notice-sub">A colleague has flagged these. Check the Collab tab.</div>
      </div>
    </div>
  );
}

export default function DoctorDashboard({ user, inbox, mine, collab, claimedAll, appts }) {
  const allCases   = [...inbox, ...claimedAll];
  const critical   = inbox.filter(c => c.ai?.triage === "urgent");
  const unreviewed = inbox.filter(c => !c.doctorId);
  const reviewSoon = allCases.filter(c => c.ai?.triage === "review_soon").length;
  const clear      = allCases.filter(c => c.ai?.triage === "non_urgent").length;

  const today = new Date().toDateString();
  const todayAppts = appts.filter(a => new Date(a.when).toDateString() === today);
  const upcomingAppts = appts
    .filter(a => new Date(a.when) >= new Date())
    .sort((a, b) => new Date(a.when) - new Date(b.when))
    .slice(0, 4);

  const reviewed       = mine.filter(c => c.status === "doctor_reviewed").length;
  const totalInQueue   = inbox.length + claimedAll.length;
  const totalClaimed   = claimedAll.length;

  return (
    <div className="dash-wrap">

      <div className="dash-welcome">
        <div>
          <div className="dash-greeting">{greeting()},</div>
          <div className="dash-name">{user?.name?.split(" ")[0] || "Expert"}</div>
          <div className="dash-sub">Here's your assessment queue for today.</div>
        </div>
        <div className="dash-reviewed-badge">
          <span style={{ fontSize: "1.2rem" }}>✅</span>
          <div>
            <div style={{ fontWeight: 600, fontSize: 18, color: "var(--text)" }}>{reviewed}</div>
            <div style={{ fontSize: 12, color: "var(--muted)" }}>reviewed today</div>
          </div>
        </div>
      </div>

      <CollabAlert count={collab.length} />

      <div className="dash-stats">
        <StatTile value={unreviewed.length} label="Awaiting review" color="var(--warn)"    icon="📋" delay={0}   alert={unreviewed.length > 0} />
        <StatTile value={critical.length}   label="Critical"        color="var(--danger)"  icon="🚨" delay={60}  alert={critical.length > 0}   />
        <StatTile value={todayAppts.length} label="Today's visits"  color="#7c6fcd"        icon="📅" delay={120} />
        <StatTile value={mine.length}       label="My reports"      color="var(--accent)"  icon="🗂" delay={180} />
        <StatTile value={collab.length}     label="Needs collab"    color="var(--warn)"    icon="🤝" delay={240} alert={collab.length > 0} />
      </div>

      <div className="card" style={{ marginBottom: "1.25rem" }}>
        <div className="card-title"><span className="icon">📊</span> Queue Severity Breakdown</div>
        <SeverityBar urgent={critical.length} reviewSoon={reviewSoon} clear={clear} />
      </div>

      <div className="dash-cols">
        <div className="card dash-col-card">
          <div className="card-title" style={{ color: "var(--danger)" }}>
            <span className="icon">🚨</span> Critical Reports
          </div>
          {critical.length === 0 ? (
            <div className="empty-state">No critical reports — queue is clear.</div>
          ) : (
            critical.slice(0, 5).map(c => <CriticalRow key={c._id} c={c} />)
          )}
        </div>

        <div className="card dash-col-card">
          <div className="card-title"><span className="icon">📅</span> Upcoming Site Visits</div>
          {upcomingAppts.length === 0 ? (
            <div className="empty-state">No upcoming visits.</div>
          ) : (
            upcomingAppts.map(a => <UpcomingApptRow key={a._id} a={a} />)
          )}
        </div>
      </div>

      <div className="card">
        <div className="card-title"><span className="icon">👥</span> Team Activity</div>
        <div className="dash-team-grid">
          <div className="dash-team-tile">
            <div className="dash-team-value">{totalInQueue}</div>
            <div className="dash-team-label">Total reports</div>
          </div>
          <div className="dash-team-tile">
            <div className="dash-team-value" style={{ color: "var(--warn)" }}>{unreviewed.length}</div>
            <div className="dash-team-label">Unclaimed</div>
          </div>
          <div className="dash-team-tile">
            <div className="dash-team-value" style={{ color: "var(--success)" }}>{totalClaimed}</div>
            <div className="dash-team-label">Claimed</div>
          </div>
          <div className="dash-team-tile">
            <div className="dash-team-value" style={{ color: "#7c6fcd" }}>{collab.length}</div>
            <div className="dash-team-label">Collab requests</div>
          </div>
        </div>
      </div>

    </div>
  );
}
