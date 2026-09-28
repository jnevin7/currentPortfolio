import { useState } from "react";
import { api } from "../api";

export default function BookAppointmentCard({ doctors, cases, onBooked }) {
  const [doctorId, setDoctorId] = useState("");
  const [when, setWhen] = useState("");
  const [selectedCaseId, setSelectedCaseId] = useState("");
  const [loading, setLoading] = useState(false);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!doctorId || !when) return;
    setLoading(true);
    try {
      await api.createAppt({
        doctorId,
        when: new Date(when).toISOString(),
        ...(selectedCaseId ? { caseId: selectedCaseId } : {}),
      });
      setWhen("");
      setSelectedCaseId("");
      onBooked();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card">
      <div className="card-title"><span className="icon">📅</span> Book a Site Visit</div>
      <form onSubmit={handleSubmit} className="col">
        <div className="field">
          <label>Expert</label>
          <select value={doctorId} onChange={e => setDoctorId(e.target.value)}>
            <option value="">Select an expert…</option>
            {doctors.map(d => (
              <option key={d._id} value={d._id}>{d.name}</option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Link to a report <span style={{ opacity: 0.5 }}>(optional)</span></label>
          <select value={selectedCaseId} onChange={e => setSelectedCaseId(e.target.value)}>
            <option value="">No linked report</option>
            {cases.slice(0, 10).map(c => (
              <option key={c._id} value={c._id}>
                {new Date(c.createdAt).toLocaleDateString()} — {c.ai?.prediction || "Report"}
              </option>
            ))}
          </select>
        </div>
        <div className="field">
          <label>Date &amp; Time</label>
          <input
            type="datetime-local"
            value={when}
            onChange={e => setWhen(e.target.value)}
          />
        </div>
        <div>
          <button
            className="btn btn-primary"
            type="submit"
            disabled={loading || !doctorId || !when}
          >
            {loading ? "Booking…" : "Request site visit →"}
          </button>
        </div>
        <p style={{ fontSize: 12, color: "var(--muted)" }}>
          Times are saved in your local timezone.
        </p>
      </form>
    </div>
  );
}