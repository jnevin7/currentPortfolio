import { useState, useEffect } from "react";
import { api } from "../api";
import DoctorDashboard from "../components/DoctorDashboard";
import CaseCard from "../components/CaseCard";
import DoctorCaseCard from "../sections/DoctorCaseCard";

const TABS = [
  { id: "dashboard", label: "🏠 Dashboard"   },
  { id: "inbox",     label: "📋 Queue"        },
  { id: "mine",      label: "🗂 My Reports"   },
  { id: "collab",    label: "🤝 Collab"       },
  { id: "team",      label: "👥 Team"         },
  { id: "appts",     label: "📅 Site Visits"  },
];

/* ── Expert appointment row with confirm/cancel ── */
function ExpertApptRow({ a, onAction }) {
  const [loading, setLoading] = useState(false);
  const when = new Date(a.when);
  const isPast = when < new Date();

  async function update(status) {
    setLoading(true);
    try { await api.updateAppt(a._id, { status }); onAction(); }
    catch (e) { alert(e.message); }
    finally { setLoading(false); }
  }

  return (
    <div className="appt-item" style={{ flexWrap: "wrap", gap: 10 }}>
      <div style={{ flex: 1, minWidth: 160 }}>
        <div style={{ fontWeight: 500 }}>
          {when.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}
          {" · "}
          {when.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
        </div>
        {a.patientId?.name && (
          <div style={{ fontSize: 12, color: "var(--muted)", marginTop: 2 }}>
            Client: {a.patientId.name}
          </div>
        )}
        {a.caseId?.ai?.prediction && (
          <div style={{ fontSize: 12, color: "var(--muted)" }}>
            Report: {a.caseId.ai.prediction.replace(/_/g, " ")}
          </div>
        )}
      </div>
      <div className="row" style={{ gap: 8 }}>
        <span className="status-pill">{a.status}</span>
        {!isPast && a.status === "pending" && (
          <>
            <button className="btn btn-primary btn-sm" onClick={() => update("confirmed")} disabled={loading}>Confirm</button>
            <button className="btn btn-ghost btn-sm" onClick={() => update("cancelled")} disabled={loading}
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>Cancel</button>
          </>
        )}
        {a.status === "confirmed" && !isPast && (
          <button className="btn btn-ghost btn-sm" onClick={() => update("cancelled")} disabled={loading}
            style={{ color: "var(--danger)", borderColor: "var(--danger)" }}>Cancel</button>
        )}
      </div>
    </div>
  );
}

function Board({ label, items, readOnly, onAction, currentUserId }) {
  return (
    <div className="board-section">
      <div className="board-label">{label} ({items.length})</div>
      {items.length === 0 ? (
        <p className="empty-state">Nothing here.</p>
      ) : (
        items.map(c =>
          readOnly
            ? <CaseCard key={c._id} c={c} />
            : <DoctorCaseCard key={c._id} c={c} onAction={onAction} currentUserId={currentUserId} />
        )
      )}
    </div>
  );
}

export default function DoctorPage({ user }) {
  const [tab,        setTab]        = useState("dashboard");
  const [unassigned, setUnassigned] = useState([]);
  const [mine,       setMine]       = useState([]);
  const [collab,     setCollab]     = useState([]);
  const [claimedAll, setClaimedAll] = useState([]);
  const [docAppts,   setDocAppts]   = useState([]);

  async function loadAll() {
    try {
      const [a, b, c, d, ap] = await Promise.all([
        api.doctorInboxBoard(), api.doctorMineBoard(),
        api.doctorCollabBoard(), api.doctorClaimedBoard(), api.doctorAppts(),
      ]);
      setUnassigned(a); setMine(b); setCollab(c); setClaimedAll(d); setDocAppts(ap);
    } catch (e) { console.error(e); }
  }

  useEffect(() => { loadAll(); }, []);

  const urgentCount = unassigned.filter(c => c.ai?.triage === "urgent").length;
  const collabCount = collab.length;

  return (
    <>
      <div className="page-tabs">
        {TABS.map(t => (
          <button key={t.id}
            className={`page-tab ${tab === t.id ? "page-tab-active" : ""}`}
            onClick={() => setTab(t.id)}>
            {t.label}
            {t.id === "inbox"  && urgentCount > 0 && <span className="tab-badge tab-badge-danger">{urgentCount}</span>}
            {t.id === "collab" && collabCount > 0  && <span className="tab-badge tab-badge-warn">{collabCount}</span>}
          </button>
        ))}
      </div>

      {tab === "dashboard" && (
        <DoctorDashboard user={user} inbox={unassigned} mine={mine}
          collab={collab} claimedAll={claimedAll} appts={docAppts} />
      )}
      {tab === "inbox"  && <Board label="Unassigned — priority queue" items={unassigned} onAction={loadAll} currentUserId={user?._id} />}
      {tab === "mine"   && <Board label="My claimed reports"          items={mine}       onAction={loadAll} currentUserId={user?._id} />}
      {tab === "collab" && <Board label="Needs second opinion"        items={collab}     onAction={loadAll} currentUserId={user?._id} />}
      {tab === "team"   && <Board label="All claimed (team view)"     items={claimedAll} readOnly />}
      {tab === "appts"  && (
        <div className="board-section">
          <div className="board-label">My Site Visits ({docAppts.length})</div>
          {docAppts.length === 0
            ? <p className="empty-state">No upcoming visits.</p>
            : docAppts.map(a => <ExpertApptRow key={a._id} a={a} onAction={loadAll} />)
          }
        </div>
      )}
    </>
  );
}