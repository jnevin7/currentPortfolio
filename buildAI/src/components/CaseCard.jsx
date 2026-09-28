import TriageBadge from "./TriageBadge";

const EDU = {
  urgent: [
    "This issue may pose a safety risk — do not ignore it.",
    "Contact a qualified expert as soon as possible.",
  ],
  review_soon: [
    "This fault should be assessed before it worsens.",
    "An expert can advise on repair options and timeline.",
  ],
  non_urgent: [
    "Monitor this issue for any signs of change or spreading.",
    "Schedule a routine inspection if it persists.",
  ],
};

const toThumb = (url) =>
  url?.includes("/upload/")
    ? url.replace("/upload/", "/upload/c_fill,w_160,h_160,q_auto,f_auto/")
    : url;

export default function CaseCard({ c, children }) {
  const thumb = toThumb(c.imageUrl);

  return (
    <div className="case-card">
      {thumb && <img src={thumb} alt="" className="case-thumb" />}
      <div className="case-info">
        <div className="case-prediction">{c.ai?.prediction?.replace(/_/g, " ") || "Pending assessment"}</div>
        <div className="row" style={{ marginBottom: 6 }}>
          <TriageBadge triage={c.ai?.triage} />
        </div>
        {c.description && (
          <div className="edu-line" style={{ marginBottom: 5 }}>{c.description}</div>
        )}
        {EDU[c.ai?.triage]?.map((line, i) => (
          <div key={i} className="edu-line">{line}</div>
        ))}
        {children}
      </div>
    </div>
  );
}
