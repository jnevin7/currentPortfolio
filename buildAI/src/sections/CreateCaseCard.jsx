import { useState } from "react";
import { api, uploadImage } from "../api";

const FAULT_TYPES = [
  "", "Crack / Fracture", "Damp / Water Ingress", "Roof Damage",
  "Electrical Fault", "Plumbing Leak", "Structural Movement",
  "Mould / Fungal Growth", "Corrosion / Rust", "Foundation Issue", "Other",
];

/* ── AI analysis steps shown during loading ── */
const LOADING_STEPS = [
  { icon: "📤", text: "Uploading photo…"             },
  { icon: "🔍", text: "Analysing image with AI…"     },
  { icon: "🏗",  text: "Identifying fault type…"     },
  { icon: "📊", text: "Calculating STEAM factors…"   },
  { icon: "✅", text: "Finalising assessment…"        },
];

function AILoadingOverlay({ step }) {
  const current = LOADING_STEPS[Math.min(step, LOADING_STEPS.length - 1)];
  return (
    <div style={{
      position: "fixed", inset: 0,
      background: "rgba(44, 36, 22, 0.6)",
      backdropFilter: "blur(6px)",
      zIndex: 500,
      display: "flex",
      alignItems: "center",
      justifyContent: "center",
      padding: "1rem",
    }}>
      <div style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "2.5rem 2rem",
        maxWidth: 380,
        width: "100%",
        textAlign: "center",
        boxShadow: "var(--shadow-lg)",
      }}>
        {/* Animated icon */}
        <div style={{
          fontSize: "2.5rem",
          marginBottom: "1rem",
          animation: "spin 2s linear infinite",
          display: "inline-block",
        }}>
          {current.icon}
        </div>

        <div style={{
          fontFamily: "'Playfair Display', serif",
          fontSize: "1.2rem",
          marginBottom: "0.5rem",
          color: "var(--text)",
        }}>
          AI Assessment in Progress
        </div>

        <div style={{
          fontSize: 14,
          color: "var(--muted)",
          marginBottom: "1.5rem",
        }}>
          {current.text}
        </div>

        {/* Progress dots */}
        <div style={{ display: "flex", justifyContent: "center", gap: 8, marginBottom: "1.5rem" }}>
          {LOADING_STEPS.map((_, i) => (
            <div key={i} style={{
              width: 8, height: 8,
              borderRadius: "50%",
              background: i <= step ? "var(--accent)" : "var(--border)",
              transition: "background 0.3s",
            }} />
          ))}
        </div>

        {/* Progress bar */}
        <div style={{
          height: 4,
          background: "var(--surface2)",
          borderRadius: 99,
          overflow: "hidden",
          border: "1px solid var(--border-light)",
        }}>
          <div style={{
            height: "100%",
            width: `${((step + 1) / LOADING_STEPS.length) * 100}%`,
            background: "var(--accent)",
            borderRadius: 99,
            transition: "width 1.5s ease",
          }} />
        </div>

        <p style={{ fontSize: 12, color: "var(--muted)", marginTop: "1rem" }}>
          This usually takes 5–10 seconds
        </p>
      </div>

      <style>{`
        @keyframes spin {
          0%   { transform: rotate(0deg) scale(1);    }
          25%  { transform: rotate(5deg) scale(1.1);  }
          75%  { transform: rotate(-5deg) scale(1.1); }
          100% { transform: rotate(0deg) scale(1);    }
        }
      `}</style>
    </div>
  );
}

export default function CreateCaseCard({ consented, onCreated }) {
  const [imageUrl,     setImageUrl]     = useState("");
  const [description,  setDescription]  = useState("");
  const [bodySite,     setBodySite]     = useState("");
  const [durationDays, setDurationDays] = useState("");
  const [faultType,    setFaultType]    = useState("");
  const [file,         setFile]         = useState(null);
  const [loading,      setLoading]      = useState(false);
  const [loadStep,     setLoadStep]     = useState(0);

  async function handleSubmit(e) {
    e.preventDefault();
    if (!consented) return;
    setLoading(true);
    setLoadStep(0);

    // Advance loading steps to give visual feedback during the AI wait
    const stepTimer = setInterval(() => {
      setLoadStep(prev => {
        if (prev >= LOADING_STEPS.length - 2) { clearInterval(stepTimer); return prev; }
        return prev + 1;
      });
    }, 1800);

    try {
      let finalUrl = imageUrl;

      // Step 0 — uploading
      if (file) {
        const { url } = await uploadImage(file);
        finalUrl = url;
      }

      setLoadStep(1); // analysing with AI

      await api.createCase({
        imageUrl:    finalUrl,
        description,
        bodySite,
        faultType:   faultType || undefined,
        durationDays: durationDays ? Number(durationDays) : undefined,
      });

      setLoadStep(LOADING_STEPS.length - 1); // done
      await new Promise(r => setTimeout(r, 600)); // brief pause on final step

      setImageUrl(""); setDescription(""); setBodySite("");
      setDurationDays(""); setFaultType(""); setFile(null);
      onCreated();
    } finally {
      clearInterval(stepTimer);
      setLoading(false);
      setLoadStep(0);
    }
  }

  const disabled = !consented || loading;

  return (
    <>
      {loading && <AILoadingOverlay step={loadStep} />}

      <div className="card" style={{ opacity: consented ? 1 : 0.55 }}>
        <div className="card-title"><span className="icon">📸</span> Submit a New Report</div>

        {!consented && (
          <p style={{ fontSize: 13, color: "var(--muted)", marginBottom: 12 }}>
            Please accept the terms of use to submit reports.
          </p>
        )}

        {/* Photo guidance tip */}
        <div style={{
          display: "flex",
          gap: 10,
          padding: "10px 14px",
          background: "var(--accent-dim)",
          border: "1px solid var(--accent-light)",
          borderRadius: "var(--radius-sm)",
          marginBottom: "1rem",
          fontSize: 13,
          color: "var(--text-mid)",
          lineHeight: 1.5,
        }}>
          <span style={{ fontSize: "1.1rem", flexShrink: 0 }}>💡</span>
          <span>
            <strong style={{ color: "var(--accent)" }}>Photo tip:</strong> photograph the fault
            directly and up close — avoid wide shots of the whole room. Better photos lead to
            more accurate AI assessments.
          </span>
        </div>

        <form onSubmit={handleSubmit}>
          <div className="field">
            <label>Photo URL <span style={{ opacity: 0.5 }}>(or upload below)</span></label>
            <input type="text" value={imageUrl} onChange={e => setImageUrl(e.target.value)}
              placeholder="https://…" disabled={disabled} />
          </div>
          <div className="field">
            <label>Upload Photo</label>
            <label className="file-input-label">
              <span>📎</span>
              <span>{file ? file.name : "Choose a close-up photo of the fault…"}</span>
              <input type="file" accept="image/*"
                onChange={e => setFile(e.target.files?.[0] || null)} disabled={disabled} />
            </label>
          </div>
          <div className="auth-grid-2">
            <div className="field">
              <label>Fault type</label>
              <select value={faultType} onChange={e => setFaultType(e.target.value)} disabled={disabled}>
                {FAULT_TYPES.map(t => <option key={t} value={t}>{t || "Select type…"}</option>)}
              </select>
            </div>
            <div className="field">
              <label>Location in property</label>
              <input type="text" value={bodySite} onChange={e => setBodySite(e.target.value)}
                placeholder="e.g. master bedroom ceiling" disabled={disabled} />
            </div>
          </div>
          <div className="field">
            <label>How long has this been present? (days)</label>
            <input type="number" min="0" value={durationDays}
              onChange={e => setDurationDays(e.target.value)}
              placeholder="e.g. 14" disabled={disabled} />
          </div>
          <div className="field">
            <label>Description</label>
            <textarea value={description} onChange={e => setDescription(e.target.value)}
              placeholder="Describe the fault — size, colour, smell, whether it's spreading, any changes you've noticed…"
              disabled={disabled} />
          </div>
          <button className="btn btn-primary" type="submit"
            disabled={disabled || (!imageUrl && !file)}>
            Submit report →
          </button>
        </form>
      </div>
    </>
  );
}