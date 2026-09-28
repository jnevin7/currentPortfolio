import { useState } from "react";
import { api } from "../api";
import TriageBadge from "./TriageBadge";

const toFull = (url) =>
  url?.includes("/upload/")
    ? url.replace("/upload/", "/upload/q_auto,f_auto,w_1200/")
    : url;

const STEAM = [
  { letter: "S", label: "Structural", desc: "Is the structure or load-bearing element affected?" },
  { letter: "T", label: "Type",       desc: "What type of damage or fault is present?" },
  { letter: "E", label: "Extent",     desc: "How far has the damage spread?" },
  { letter: "A", label: "Age",        desc: "How long has this been present?" },
  { letter: "M", label: "Materials",  desc: "Which materials are affected?" },
];

const PRIORITY_OPTIONS = ["non_urgent", "review_soon", "urgent"];
const PRIORITY_LABELS  = { non_urgent: "Low Risk", review_soon: "Monitor", urgent: "Critical" };

function ImageViewer({ url }) {
  const [zoomed, setZoomed] = useState(false);
  const full = toFull(url);
  return (
    <>
      <div className="drp-image-wrap" onClick={() => setZoomed(true)} title="Click to enlarge">
        <img src={full} alt="report" className="drp-image" />
        <div className="drp-image-hint">🔍 Click to enlarge</div>
      </div>
      {zoomed && (
        <div className="drp-zoom-overlay" onClick={() => setZoomed(false)}>
          <img src={full} alt="enlarged" className="drp-zoom-img" />
          <button className="drp-zoom-close" onClick={() => setZoomed(false)}>✕ Close</button>
        </div>
      )}
    </>
  );
}

function STEAMEditor({ flags, onChange, readOnly }) {
  return (
    <div className="drp-abcde-grid">
      {STEAM.map(({ letter, label, desc }) => {
        const key = letter.toLowerCase();
        const flagged = !!flags[key];
        return (
          <button key={letter} type="button"
            className={`drp-abcde-cell ${flagged ? "drp-abcde-on" : "drp-abcde-off"}`}
            onClick={() => !readOnly && onChange({ ...flags, [key]: !flagged })}
            disabled={readOnly} title={desc}>
            <div className="drp-abcde-letter">{letter}</div>
            <div className="drp-abcde-label">{label}</div>
            <div className="drp-abcde-state">{flagged ? "⚠ Flagged" : "✓ Clear"}</div>
          </button>
        );
      })}
    </div>
  );
}

function ConfBar({ label, value, color }) {
  return (
    <div style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13, marginBottom: 4, color: "var(--text-mid)" }}>
        <span>{label}</span>
        <span style={{ fontWeight: 600, color: "var(--text)" }}>{Math.round(value * 100)}%</span>
      </div>
      <div className="conf-track">
        <div className="conf-fill" style={{ width: `${value * 100}%`, background: color }} />
      </div>
    </div>
  );
}

export default function DoctorReviewPanel({ c, onClose, onSaved, canEdit = false }) {
  const ai = c.ai || {};
  const [notes,  setNotes]  = useState(c.doctorNotes || "");
  const [triage, setTriage] = useState(ai.triage || "non_urgent");
  const [steam,  setSteam]  = useState(ai.abcde  || { s: false, t: false, e: false, a: false, m: false });
  const [saving, setSaving] = useState(false);
  const [saved,  setSaved]  = useState(false);
  const [error,  setError]  = useState("");

  const isClaimed = canEdit; // use the prop passed from DoctorCaseCard

  async function handleSave() {
    if (!notes.trim()) { setError("Please add your assessment notes before saving."); return; }
    setSaving(true); setError("");
    try {
      await api.doctorReview(c._id, { doctorNotes: notes, status: "doctor_reviewed" });
      setSaved(true);
      setTimeout(() => { onSaved(); onClose(); }, 800);
    } catch (e) {
      setError(e.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const differentials = ai.differentials ?? [
    { label: ai.prediction?.replace(/_/g, " ") || "Surface Defect", value: ai.confidence ?? 0.78, color: "var(--accent)"  },
    { label: "Damp / Water Ingress",                                  value: 0.13,                  color: "var(--warn)"    },
    { label: "Structural Movement",                                    value: 0.06,                  color: "var(--danger)"  },
    { label: "Thermal Expansion",                                      value: 0.03,                  color: "var(--muted)"   },
  ];

  return (
    <div className="drp-overlay" onClick={onClose}>
      <div className="drp-panel" onClick={e => e.stopPropagation()}>

        <div className="drp-header">
          <div className="drp-header-left">
            <div className="drp-title">
              {c.ai?.prediction ? c.ai.prediction.replace(/_/g, " ") : "Unassessed Report"}
            </div>
            <div className="drp-meta">
              {c.patient?.name && <span>Client: <b>{c.patient.name}</b></span>}
              {c.createdAt && (
                <span>Submitted: {new Date(c.createdAt).toLocaleDateString("en-GB", {
                  day: "numeric", month: "long", year: "numeric",
                })}</span>
              )}
              <TriageBadge triage={ai.triage} />
              {c.status && <span className="status-pill">{c.status.replace(/_/g, " ")}</span>}
            </div>
          </div>
          <button className="result-close" onClick={onClose}>✕</button>
        </div>

        <div className="drp-body">

          <div className="drp-left">
            <div className="drp-section-label">Site Photo</div>
            {c.imageUrl ? <ImageViewer url={c.imageUrl} /> : <div className="drp-no-image">No photo submitted</div>}

            <div className="drp-section-label" style={{ marginTop: 20 }}>Client Description</div>
            <div className="drp-info-box">
              {c.faultType && (
                <div style={{ fontSize: 12, fontWeight: 600, color: "var(--accent)", marginBottom: 8 }}>
                  🏷 {c.faultType}
                </div>
              )}
              {c.description
                ? <p>{c.description.replace(/^\[.*?\]\s*/, "")}</p>
                : <p className="drp-muted">No description provided.</p>}
              {c.bodySite && <div className="drp-info-row"><span>Location</span><b>{c.bodySite}</b></div>}
              {c.durationDays != null && <div className="drp-info-row"><span>Duration</span><b>{c.durationDays} days</b></div>}
              {c.priorTreatments?.length > 0 && (
                <div className="drp-info-row"><span>Prior work</span><b>{c.priorTreatments.join(", ")}</b></div>
              )}
            </div>

            <div className="drp-section-label" style={{ marginTop: 20 }}>AI Fault Analysis</div>
            <div className="drp-info-box">
              {differentials.map(d => <ConfBar key={d.label} label={d.label} value={d.value} color={d.color} />)}
              <p className="drp-muted" style={{ marginTop: 8 }}>
                AI confidence: {Math.round((ai.confidence ?? 0) * 100)}% — not a professional assessment.
              </p>
            </div>
          </div>

          <div className="drp-right">
            <div className="drp-section-label">
              STEAM Assessment
              {!isClaimed && <span className="drp-section-hint"> — claim report to edit</span>}
            </div>
            <STEAMEditor flags={steam} onChange={setSteam} readOnly={!isClaimed} />

            <div className="drp-section-label" style={{ marginTop: 20 }}>
              Priority Level
              {!isClaimed && <span className="drp-section-hint"> — claim report to edit</span>}
            </div>
            <div className="drp-triage-row">
              {PRIORITY_OPTIONS.map(t => {
                const color = t === "urgent" ? "var(--danger)" : t === "review_soon" ? "var(--warn)" : "var(--success)";
                return (
                  <button key={t} type="button"
                    className={`drp-triage-btn ${triage === t ? "drp-triage-active" : ""}`}
                    style={triage === t ? { borderColor: color, color, background: `${color}18` } : {}}
                    onClick={() => isClaimed && setTriage(t)} disabled={!isClaimed}>
                    {PRIORITY_LABELS[t]}
                  </button>
                );
              })}
            </div>

            <div className="drp-section-label" style={{ marginTop: 20 }}>
              Expert Assessment Notes {isClaimed && <span style={{ color: "var(--danger)" }}>*</span>}
              {!isClaimed && <span className="drp-section-hint"> — claim report to add notes</span>}
            </div>

            {c.doctorNotes && (
              <div className="drp-existing-notes">
                <div className="drp-existing-label">Previously saved notes</div>
                <p>{c.doctorNotes}</p>
              </div>
            )}

            <textarea className="drp-notes"
              placeholder={isClaimed
                ? "Add your expert assessment — fault type, severity, recommended repairs, urgency, next steps…"
                : "Claim this report to add your assessment."}
              value={notes} onChange={e => setNotes(e.target.value)} disabled={!isClaimed} />

            {isClaimed && (
              <div className="drp-char-count">
                {notes.length} characters
                {notes.length < 20 && notes.length > 0 && (
                  <span style={{ color: "var(--warn)", marginLeft: 8 }}>— please add more detail</span>
                )}
              </div>
            )}

            {error && (
              <div style={{ color: "var(--danger)", background: "var(--danger-dim)", border: "1px solid #e8b4ae", borderRadius: 8, padding: "10px 14px", fontSize: 13, marginBottom: 12 }}>
                {error}
              </div>
            )}

            <div className="drp-actions">
              {isClaimed ? (
                <>
                  <button className={`btn btn-primary ${saved ? "drp-saved" : ""}`}
                    onClick={handleSave} disabled={saving || saved} style={{ flex: 1 }}>
                    {saved ? "✓ Saved!" : saving ? "Saving…" : "Save & mark reviewed"}
                  </button>
                  <button className="btn btn-ghost" onClick={onClose}>Cancel</button>
                </>
              ) : (
                <div className="drp-unclaimed-notice">
                  ⚠ This report has not been claimed yet. Go to the Queue tab to claim it first.
                </div>
              )}
            </div>

            <div className="drp-disclaimer">
              All notes are saved to the client record and visible to the client after review.
              Ensure your assessment is clear, accurate, and professionally worded.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}