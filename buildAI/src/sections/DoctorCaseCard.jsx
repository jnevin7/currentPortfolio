import { useState } from "react";
import { api } from "../api";
import TriageBadge from "../components/TriageBadge";
import DoctorReviewPanel from "../components/DoctorReviewPanel";

const toThumb = (url) =>
  url?.includes("/upload/")
    ? url.replace("/upload/", "/upload/c_fill,w_160,h_160,q_auto,f_auto/")
    : url;

export default function DoctorCaseCard({ c, onAction, currentUserId }) {
  const [reviewing, setReviewing] = useState(false);
  const [claiming,  setClaiming]  = useState(false);

  // Can claim if: unclaimed OR it's a collab case (any expert can join)
  const isUnclaimed   = !c.doctorId;
  const isCollab      = !!c.collabRequested;
  const isMyCase      = c.doctorId && String(c.doctorId) === String(currentUserId);
  const canClaim      = isUnclaimed;
  const canJoinCollab = isCollab && !isMyCase;

  // For the review panel — can edit if it's their claimed case OR it's a collab case
  const canEdit = isMyCase || isCollab;

  async function claim(e) {
    e.stopPropagation();
    setClaiming(true);
    try {
      await api.claimCase(c._id);
      onAction();
    } catch (err) {
      alert(err.message);
    } finally {
      setClaiming(false);
    }
  }

  async function joinCollab(e) {
    e.stopPropagation();
    setClaiming(true);
    try {
      // Claim the case as the collaborating expert
      await api.claimCase(c._id);
      onAction();
    } catch (err) {
      // If already claimed (409), just open for review — collab allows this
      if (err.message?.includes("409") || err.message?.includes("claimed")) {
        setReviewing(true);
      } else {
        alert(err.message);
      }
    } finally {
      setClaiming(false);
    }
  }

  async function toggleCollab(e) {
    e.stopPropagation();
    await api.setCollab(c._id, { collabRequested: !c.collabRequested });
    onAction();
  }

  const thumb = toThumb(c.imageUrl);

  return (
    <>
      <div className="case-card case-card-clickable" onClick={() => setReviewing(true)}>
        {thumb && <img src={thumb} alt="" className="case-thumb" />}
        <div className="case-info">
          <div className="case-prediction">
            {c.ai?.prediction?.replace(/_/g, " ") || "Pending"}
          </div>
          <div className="row" style={{ marginBottom: 6, gap: 6, flexWrap: "wrap" }}>
            <TriageBadge triage={c.ai?.triage} />
            {c.doctor && (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                {c.doctor?.name}
              </span>
            )}
            {c.patient?.name && (
              <span style={{ fontSize: 12, color: "var(--muted)" }}>
                · {c.patient.name}
              </span>
            )}
            {isCollab && (
              <span style={{
                fontSize: 11, fontWeight: 600, color: "var(--warn)",
                background: "var(--warn-dim)", padding: "2px 8px",
                borderRadius: 99, border: "1px solid #f0d0a0",
              }}>
                🤝 Collab
              </span>
            )}
          </div>
          <div className="edu-line">
            {(c.description || "No description").replace(/^\[.*?\]\s*/, "")}
          </div>
          <div className="edu-line" style={{ marginTop: 4 }}>
            {c.doctorNotes ? "✓ Notes added" : "⏳ Awaiting review"}
          </div>
        </div>

        <div className="drp-card-actions" onClick={e => e.stopPropagation()}>
          {canClaim && (
            <button className="btn btn-primary btn-sm" onClick={claim} disabled={claiming}>
              {claiming ? "…" : "Claim"}
            </button>
          )}
          {canJoinCollab && !isMyCase && (
            <button className="btn btn-primary btn-sm"
              style={{ background: "var(--warn)" }}
              onClick={joinCollab} disabled={claiming}>
              {claiming ? "…" : "Join"}
            </button>
          )}
          <button className="btn btn-ghost btn-sm" onClick={toggleCollab}>
            {isCollab ? "Unmark" : "Collab"}
          </button>
        </div>

        <div className="case-arrow">→</div>
      </div>

      {reviewing && (
        <DoctorReviewPanel
          c={c}
          canEdit={canEdit}
          onClose={() => setReviewing(false)}
          onSaved={() => { setReviewing(false); onAction(); }}
        />
      )}
    </>
  );
}