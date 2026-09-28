import { useState } from "react";
import TriageBadge from "../components/TriageBadge";
import CaseResult from "../components/CaseResult";

const toThumb = (url) =>
  url?.includes("/upload/")
    ? url.replace("/upload/", "/upload/c_fill,w_160,h_160,q_auto,f_auto/")
    : url;

function CaseSummaryRow({ c, onClick }) {
  const thumb = toThumb(c.imageUrl);
  const confidence = c.ai?.confidence;

  return (
    <div className="case-card case-card-clickable" onClick={onClick}>
      {thumb && <img src={thumb} alt="" className="case-thumb" />}
      <div className="case-info">
        <div className="case-prediction">{c.ai?.prediction || "Pending analysis"}</div>
        <div className="row" style={{ marginBottom: 6, gap: 8 }}>
          <TriageBadge triage={c.ai?.triage} />
          {confidence != null && (
            <span className="conf-inline">{Math.round(confidence * 100)}% confidence</span>
          )}
        </div>
        <div className="edu-line">{c.description || "No description"}</div>
        <div className="edu-line" style={{ marginTop: 4 }}>
          {c.doctorNotes
            ? "✓ Expert reviewed"
            : "⏳ Awaiting review"}
        </div>
      </div>
      <div className="case-arrow">→</div>
    </div>
  );
}

export default function MyCasesCard({ cases }) {
  const [selected, setSelected] = useState(null);

  return (
    <>
      <div className="card">
        <div className="card-title"><span className="icon">🩺</span> My Cases</div>
        {cases.length === 0 ? (
          <p className="empty-state">No cases submitted yet.</p>
        ) : (
          cases.map(c => (
            <CaseSummaryRow
              key={c._id}
              c={c}
              onClick={() => setSelected(c)}
            />
          ))
        )}
      </div>

      {selected && (
        <CaseResult c={selected} onClose={() => setSelected(null)} />
      )}
    </>
  );
}
