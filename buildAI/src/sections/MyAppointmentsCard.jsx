export default function MyAppointmentsCard({ appts }) {
  return (
    <div className="card">
      <div className="card-title"><span className="icon">🗓</span> My Site Visits</div>
      {appts.length === 0 ? (
        <p className="empty-state">No site visits booked yet.</p>
      ) : (
        appts.map(a => (
          <div key={a._id} className="appt-item">
            <div>
              <div style={{ fontWeight: 500 }}>{new Date(a.when).toLocaleString()}</div>
              {a.caseId && (
                <div className="edu-line" style={{ marginTop: 2 }}>
                  Linked: {a.caseId.ai?.prediction || "Case"} — {a.caseId.ai?.triage}
                </div>
              )}
            </div>
            <span className="status-pill">{a.status}</span>
          </div>
        ))
      )}
    </div>
  );
}
