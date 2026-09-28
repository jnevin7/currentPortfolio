import { useState } from "react";
import { api } from "../api";
import TriageBadge from "./TriageBadge";
import EditCaseModal from "./EditCaseModal";
import CaseHistory from "./CaseHistory";

const toThumb = (url) =>
  url?.includes("/upload/")
    ? url.replace("/upload/", "/upload/c_fill,w_600,h_400,q_auto,f_auto/")
    : url;

/* ── STEAM check (replaces ABCDE) ── */
const STEAM = [
  { letter: "S", label: "Structural",  desc: "Is the structure compromised?",        icon: "🏗" },
  { letter: "T", label: "Type",        desc: "What type of damage is present?",       icon: "🔍" },
  { letter: "E", label: "Extent",      desc: "How far has it spread?",                icon: "📐" },
  { letter: "A", label: "Age",         desc: "How long has this been present?",       icon: "🕐" },
  { letter: "M", label: "Materials",   desc: "Which materials are affected?",         icon: "🧱" },
];

const EDU = {
  urgent: [
    "This issue may pose an immediate safety risk.",
    "Contact a qualified expert as soon as possible.",
  ],
  review_soon: [
    "This fault should be assessed before it worsens.",
    "An expert can advise on repair options and timeline.",
  ],
  non_urgent: [
    "Monitor for any signs of spreading or worsening.",
    "Schedule a routine inspection if it persists.",
  ],
};

function ConfidenceBar({ label, value, color, delay = 0 }) {
  return (
    <div className="conf-row" style={{ animationDelay: `${delay}ms` }}>
      <div className="conf-label">
        <span>{label}</span>
        <span className="conf-pct">{Math.round(value * 100)}%</span>
      </div>
      <div className="conf-track">
        <div className="conf-fill" style={{ width: `${value * 100}%`, background: color, animationDelay: `${delay + 100}ms` }} />
      </div>
    </div>
  );
}

function STEAMGrid({ flags = {} }) {
  return (
    <div className="abcde-grid">
      {STEAM.map(({ letter, label, desc, icon }) => {
        const flagged = flags[letter.toLowerCase()] ?? false;
        return (
          <div key={letter} className={`abcde-cell ${flagged ? "abcde-flagged" : "abcde-clear"}`}>
            <div className="abcde-icon">{icon}</div>
            <div className="abcde-letter">{letter}</div>
            <div className="abcde-label">{label}</div>
            <div className="abcde-desc">{desc}</div>
            <div className="abcde-status">{flagged ? "⚠ Flagged" : "✓ Clear"}</div>
          </div>
        );
      })}
    </div>
  );
}

function ExpertReviewBanner({ notes, expertName, reviewedAt }) {
  if (!notes) return null;
  return (
    <div className="doctor-banner">
      <div className="doctor-banner-header">
        <span className="doctor-avatar">👷</span>
        <div>
          <div className="doctor-banner-title">Reviewed by {expertName || "Expert"}</div>
          {reviewedAt && (
            <div className="doctor-banner-date">
              {new Date(reviewedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
            </div>
          )}
        </div>
      </div>
      <p className="doctor-banner-notes">{notes}</p>
    </div>
  );
}

function mockAiData(c) {
  const ai = c.ai || {};
  return {
    prediction:    ai.prediction  || "Surface Crack",
    triage:        ai.triage      || "non_urgent",
    confidence:    ai.confidence  ?? 0.78,
    differentials: ai.differentials ?? [
      { label: ai.prediction || "Surface Crack",    value: ai.confidence ?? 0.78, color: "var(--accent)"  },
      { label: "Damp / Water Ingress",              value: 0.13,                  color: "var(--warn)"    },
      { label: "Structural Movement",               value: 0.06,                  color: "var(--danger)"  },
      { label: "Thermal Expansion",                 value: 0.03,                  color: "var(--muted)"   },
    ],
    steam:         ai.abcde ?? { s: false, t: false, e: false, a: false, m: false },
    doctorNotes:   ai.doctorNotes   || c.doctorNotes || null,
    expertName:    c.doctor?.name   || null,
    reviewedAt:    c.reviewedAt     || null,
    analysedAt:    c.createdAt,
  };
}

export default function CaseResult({ c, onClose, onUpdated }) {
  const [tab,       setTab]       = useState("overview");
  const [editing,   setEditing]   = useState(false);
  const [deleting,  setDeleting]  = useState(false);  // confirmation step
  const [deleteLoading, setDeleteLoading] = useState(false);
  const ai = mockAiData(c);

  const triageColor =
    ai.triage === "urgent"      ? "var(--danger)" :
    ai.triage === "review_soon" ? "var(--warn)"   : "var(--success)";

  async function handleDelete() {
    setDeleteLoading(true);
    try {
      await api.deleteCase(c._id);
      onUpdated?.();
      onClose();
    } catch (e) {
      alert(e.message);
    } finally {
      setDeleteLoading(false);
    }
  }

  return (
    <div className="result-overlay" onClick={onClose}>
      <div className="result-panel" onClick={e => e.stopPropagation()}>

        {/* Header */}
        <div className="result-header">
          <div>
            <div className="result-title">{ai.prediction}</div>
            <div className="result-meta">
              AI Assessment · {ai.analysedAt
                ? new Date(ai.analysedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
                : "Just now"}
            </div>
          </div>
          <div className="row" style={{ gap: 8 }}>
            <button className="btn btn-ghost btn-sm" onClick={() => setEditing(true)}>✏️ Edit</button>
            <button
              className="btn btn-ghost btn-sm"
              onClick={() => setDeleting(true)}
              style={{ color: "var(--danger)", borderColor: "var(--danger)" }}
            >
              🗑 Delete
            </button>
            <button className="result-close" onClick={onClose}>✕</button>
          </div>
        </div>

        {/* Delete confirmation */}
        {deleting && (
          <div style={{
            margin: "0 1.5rem",
            padding: "14px 16px",
            background: "var(--danger-dim)",
            border: "1px solid #e8b4ae",
            borderRadius: "var(--radius-sm)",
            display: "flex",
            alignItems: "center",
            gap: 12,
            flexWrap: "wrap",
          }}>
            <span style={{ fontSize: 13, color: "var(--danger)", flex: 1 }}>
              ⚠ Are you sure? This will permanently delete this report and cannot be undone.
            </span>
            <div className="row" style={{ gap: 8 }}>
              <button
                className="btn btn-sm"
                style={{ background: "var(--danger)", color: "#fff" }}
                onClick={handleDelete}
                disabled={deleteLoading}
              >
                {deleteLoading ? "Deleting…" : "Yes, delete"}
              </button>
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => setDeleting(false)}
                disabled={deleteLoading}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Hero */}
        <div className="result-hero">
          {c.imageUrl && <img src={toThumb(c.imageUrl)} alt="report" className="result-image" />}
          <div className="result-triage-strip" style={{ borderColor: triageColor }}>
            <TriageBadge triage={ai.triage} />
            <span className="result-disclaimer">AI assessment only — expert review required.</span>
            <span className="result-confidence">{Math.round(ai.confidence * 100)}% confidence</span>
          </div>
        </div>

        {/* Tabs */}
        <div className="result-tabs">
          {["overview", "steam", "differentials", "history"].map(t => (
            <button
              key={t}
              className={`result-tab ${tab === t ? "result-tab-active" : ""}`}
              onClick={() => setTab(t)}
            >
              {t === "overview"      ? "Overview"       : null}
              {t === "steam"         ? "STEAM Check"    : null}
              {t === "differentials" ? "Differentials"  : null}
              {t === "history"       ? "🕒 History"     : null}
            </button>
          ))}
        </div>

        {/* Body */}
        <div className="result-body">

          {tab === "overview" && (
            <div className="result-section">
              {c.faultType && (
                <div style={{
                  display: "inline-flex", alignItems: "center", gap: 6,
                  fontSize: 12, fontWeight: 600, textTransform: "uppercase",
                  letterSpacing: "0.07em", color: "var(--accent)",
                  background: "var(--accent-dim)", padding: "4px 12px",
                  borderRadius: 99, border: "1px solid var(--accent-light)",
                  marginBottom: 4,
                }}>
                  🏷 {c.faultType}
                </div>
              )}
              <div className="result-description">
                {(c.description || "No description provided.").replace(/^\[.*?\]\s*/, "")}
              </div>
              <div>
                <div className="result-block-label">Primary finding</div>
                <ConfidenceBar label={ai.prediction} value={ai.confidence} color="var(--accent)" />
              </div>
              <ExpertReviewBanner notes={ai.doctorNotes} expertName={ai.expertName} reviewedAt={ai.reviewedAt} />
              {!ai.doctorNotes && (
                <div className="pending-review">
                  <span className="pending-dot" />
                  Awaiting expert review
                </div>
              )}
              {EDU[ai.triage]?.map((line, i) => (
                <div key={i} className="edu-line">{line}</div>
              ))}
            </div>
          )}

          {tab === "steam" && (
            <div className="result-section">
              <p className="result-description" style={{ marginBottom: 16 }}>
                The STEAM criteria help identify the severity and nature of a building fault.
                Flagged criteria indicate areas requiring expert attention.
              </p>
              <STEAMGrid flags={ai.steam} />
            </div>
          )}

          {tab === "differentials" && (
            <div className="result-section">
              <p className="result-description" style={{ marginBottom: 16 }}>
                The AI considered the following fault types based on the image and description,
                ranked by likelihood.
              </p>
              {ai.differentials.map((d, i) => (
                <ConfidenceBar key={d.label} label={d.label} value={d.value} color={d.color} delay={i * 80} />
              ))}
            </div>
          )}

          {tab === "history" && (
            <div className="result-section">
              <CaseHistory caseId={c._id} />
            </div>
          )}

        </div>

        <div className="result-footer">
          BuildAI is an AI-assisted assessment tool. All findings must be confirmed by a
          qualified expert before any repair or safety decisions are made.
        </div>

      </div>

      {editing && (
        <EditCaseModal
          c={c}
          onClose={() => setEditing(false)}
          onSaved={() => { setEditing(false); onUpdated?.(); onClose(); }}
        />
      )}
    </div>
  );
}