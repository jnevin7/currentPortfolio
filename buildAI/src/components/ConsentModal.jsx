export default function ConsentModal({ onAccept }) {
  return (
    <div className="modal-overlay">
      <div className="modal-box">
        <div className="modal-title">Terms of Use</div>
        <div className="modal-body">
          <p>
            BuildAI provides <strong>AI-assisted fault assessment</strong> and
            educational guidance only. It is <strong>not a professional structural
            or safety report</strong>.
          </p>
          <br />
          <p>
            A qualified expert will review your report before any advice is
            confirmed. Do not rely solely on AI triage for safety-critical decisions.
            By continuing, you consent to your images and descriptions being processed
            for assessment purposes.
          </p>
        </div>
        <button className="btn btn-primary" style={{ width: "100%" }} onClick={onAccept}>
          I understand and agree →
        </button>
      </div>
    </div>
  );
}
