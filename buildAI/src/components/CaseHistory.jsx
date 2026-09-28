import { useState, useEffect } from "react";
import { api } from "../api";

export default function CaseHistory({ caseId }) {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [open,    setOpen]    = useState(false);

  useEffect(() => {
    if (!open) return;
    (async () => {
      setLoading(true);
      try {
        const h = await api.caseHistory(caseId);
        setHistory(h);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    })();
  }, [open, caseId]);

  if (!open) {
    return (
      <button className="btn btn-ghost btn-sm" style={{ marginTop: 8 }} onClick={() => setOpen(true)}>
        🕒 View history
      </button>
    );
  }

  return (
    <div className="case-history">
      <div className="case-history-header">
        <span>Update History</span>
        <button className="auth-link" onClick={() => setOpen(false)}>Hide</button>
      </div>

      {loading ? (
        <p className="empty-state">Loading…</p>
      ) : history.length === 0 ? (
        <p className="empty-state">No updates yet — this is the original submission.</p>
      ) : (
        <div className="history-timeline">
          {[...history].reverse().map((h, i) => (
            <div key={h._id || i} className="history-entry">
              <div className="history-dot" />
              <div className="history-content">
                <div className="history-meta">
                  <span className="history-who">
                    {h.changedBy?.name || "Unknown"}
                    <span className="history-role"> · {h.role}</span>
                  </span>
                  <span className="history-date">
                    {new Date(h.changedAt).toLocaleDateString("en-GB", {
                      day: "numeric", month: "short", year: "numeric",
                    })}
                  </span>
                </div>
                {h.note && (
                  <p className="history-note">"{h.note}"</p>
                )}
                {h.snapshot && (
                  <details className="history-snapshot">
                    <summary>View snapshot</summary>
                    <div className="history-snapshot-body">
                      {h.snapshot.description && (
                        <div className="history-snap-row">
                          <span>Description</span>
                          <span>{h.snapshot.description}</span>
                        </div>
                      )}
                      {h.snapshot.bodySite && (
                        <div className="history-snap-row">
                          <span>Body site</span>
                          <span>{h.snapshot.bodySite}</span>
                        </div>
                      )}
                      {h.snapshot.durationDays != null && (
                        <div className="history-snap-row">
                          <span>Duration</span>
                          <span>{h.snapshot.durationDays} days</span>
                        </div>
                      )}
                      {h.snapshot.ai?.triage && (
                        <div className="history-snap-row">
                          <span>AI triage</span>
                          <span>{h.snapshot.ai.triage.replace(/_/g, " ")}</span>
                        </div>
                      )}
                    </div>
                  </details>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
