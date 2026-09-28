// Priority levels: critical / monitor / low_risk
export default function TriageBadge({ triage }) {
  if (!triage) return null;

  const cls =
    triage === "urgent"      ? "triage-badge triage-urgent" :
    triage === "review_soon" ? "triage-badge triage-review" :
                               "triage-badge triage-non";

  const dot =
    triage === "urgent"      ? "🔴" :
    triage === "review_soon" ? "🟡" : "🟢";

  const label =
    triage === "urgent"      ? "Critical"  :
    triage === "review_soon" ? "Monitor"   : "Low Risk";

  return (
    <span className={cls}>
      {dot} {label}
    </span>
  );
}
