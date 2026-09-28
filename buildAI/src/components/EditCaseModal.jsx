import { useState } from "react";
import { api, uploadImage } from "../api";

const FAULT_TYPES = [
  "", "Crack / Fracture", "Damp / Water Ingress", "Roof Damage",
  "Electrical Fault", "Plumbing Leak", "Structural Movement",
  "Mould / Fungal Growth", "Corrosion / Rust", "Foundation Issue", "Other",
];

export default function EditCaseModal({ c, onClose, onSaved }) {
  const [imageUrl,     setImageUrl]     = useState(c.imageUrl     || "");
  const [description,  setDescription]  = useState(
    (c.description || "").replace(/^\[.*?\]\s*/, "")
  );
  const [faultType,    setFaultType]    = useState(c.faultType    || "");
  const [bodySite,     setBodySite]     = useState(c.bodySite     || "");
  const [durationDays, setDurationDays] = useState(c.durationDays ?? "");
  const [updateNote,   setUpdateNote]   = useState("");
  const [file,         setFile]         = useState(null);
  const [saving,       setSaving]       = useState(false);
  const [error,        setError]        = useState("");

  async function handleSave(e) {
    e.preventDefault();
    if (!updateNote.trim()) {
      setError("Please describe what changed — this is saved to the report history.");
      return;
    }
    setSaving(true); setError("");
    try {
      let finalUrl = imageUrl;
      if (file) {
        const { url } = await uploadImage(file);
        finalUrl = url;
      }
      await api.updateCase(c._id, {
        imageUrl:     finalUrl,
        description,
        faultType:    faultType || undefined,
        bodySite:     bodySite  || undefined,
        durationDays: durationDays !== "" ? Number(durationDays) : undefined,
        updateNote,
      });
      onSaved();
      onClose();
    } catch (e) {
      setError(e.message || "Failed to save. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" style={{ maxWidth: 600 }} onClick={e => e.stopPropagation()}>
        <div className="modal-title">Update Report</div>

        <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: "1rem" }}>
          Editing this report will re-run the AI assessment and save the previous
          version to history so nothing is lost.
        </p>

        <form onSubmit={handleSave}>

          <div className="field">
            <label>Photo URL <span style={{ opacity: 0.5 }}>(or upload below)</span></label>
            <input type="text" value={imageUrl}
              onChange={e => setImageUrl(e.target.value)} placeholder="https://…" />
          </div>

          <div className="field">
            <label>Replace Photo</label>
            <label className="file-input-label">
              <span>📎</span>
              <span>{file ? file.name : "Choose a new close-up photo…"}</span>
              <input type="file" accept="image/*"
                onChange={e => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>

          <div className="auth-grid-2">
            <div className="field">
              <label>Fault type</label>
              <select value={faultType} onChange={e => setFaultType(e.target.value)}>
                {FAULT_TYPES.map(t => (
                  <option key={t} value={t}>{t || "Select type…"}</option>
                ))}
              </select>
            </div>
            <div className="field">
              <label>Location in property</label>
              <input type="text" value={bodySite}
                onChange={e => setBodySite(e.target.value)}
                placeholder="e.g. master bedroom ceiling" />
            </div>
          </div>

          <div className="field">
            <label>How long has this been present? (days)</label>
            <input type="number" min="0" value={durationDays}
              onChange={e => setDurationDays(e.target.value)}
              placeholder="e.g. 14" />
          </div>

          <div className="field">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe the current state of the fault — any changes since last report…" />
          </div>

          <div className="field">
            <label>
              What has changed? <span style={{ color: "var(--danger)" }}>*</span>
            </label>
            <textarea value={updateNote} onChange={e => setUpdateNote(e.target.value)}
              placeholder="e.g. The crack has widened by about 2cm and now has a damp patch around it…"
              style={{ minHeight: 70 }} />
          </div>

          {error && (
            <div style={{
              color: "var(--danger)", background: "var(--danger-dim)",
              border: "1px solid #e8b4ae", borderRadius: 8,
              padding: "10px 14px", fontSize: 13, marginBottom: 12,
            }}>
              {error}
            </div>
          )}

          <div className="row" style={{ gap: 10 }}>
            <button className="btn btn-primary" type="submit"
              disabled={saving} style={{ flex: 1 }}>
              {saving ? "Saving…" : "Save update →"}
            </button>
            <button className="btn btn-ghost" type="button" onClick={onClose}>
              Cancel
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}