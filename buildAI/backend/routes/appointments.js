const router = require("express").Router();
const auth = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const Appointment = require("../models/Appointment");
const Case = require("../models/Case");            // <-- add
const User = require("../models/User");            // <-- add

// Patient requests an appointment
router.post("/", auth, async (req, res) => {
  try {
    const { doctorId, when, mode = "video", caseId } = req.body;

    // basic required fields
    if (!doctorId || !when) {
      return res.status(400).json({ error: "doctorId and when required" });
    }

    // validate mode
    const MODES = new Set(["video", "phone", "in_person"]);
    if (!MODES.has(mode)) {
      return res.status(400).json({ error: "Invalid mode" });
    }

    // parse/validate datetime
    const whenDate = new Date(when);
    if (isNaN(whenDate.getTime())) {
      return res.status(400).json({ error: "Invalid date/time" });
    }

    // ensure doctor exists and is a doctor
    const doctor = await User.findOne({ _id: doctorId, role: "doctor" }).select("_id");
    if (!doctor) {
      return res.status(400).json({ error: "doctorId must be a valid doctor" });
    }

    // optional: ensure caseId (if provided) belongs to this patient
    const link = {};
    if (caseId) {
      const ownCase = await Case.findOne({ _id: caseId, patientId: req.user.id }).select("_id");
      if (!ownCase) return res.status(400).json({ error: "Invalid caseId" });
      link.caseId = caseId;
    }

    const appt = await Appointment.create({
      patientId: req.user.id,
      doctorId,
      when: whenDate,
      mode,
      ...link,
    });

    res.json(appt);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// Patient: list my appointments (populate doctor + case)
router.get("/mine", auth, async (req, res) => {
  const list = await Appointment.find({ patientId: req.user.id })
    .sort({ when: -1 })
    .populate("doctorId", "name email")
    .populate("caseId", "ai triage description createdAt imageUrl");
  res.json(list);
});

// Doctor: list incoming (populate patient + case)
router.get("/doctor", auth, requireRole("doctor"), async (req, res) => {
  const list = await Appointment.find({ doctorId: req.user.id })
    .sort({ when: 1 })
    .populate("patientId", "name email")
    .populate("caseId", "ai triage description createdAt imageUrl");
  res.json(list);
});

// Doctor: update status (confirm/reschedule/cancel)
router.patch("/:id", auth, requireRole("doctor"), async (req, res) => {
  const { status, when } = req.body;

  // (optional) validate status
  const STATUSES = new Set(["pending", "confirmed", "cancelled"]);
  if (status && !STATUSES.has(status)) {
    return res.status(400).json({ error: "Invalid status" });
  }

  const updates = {};
  if (status) updates.status = status;
  if (when) {
    const dt = new Date(when);
    if (isNaN(dt.getTime())) return res.status(400).json({ error: "Invalid date/time" });
    updates.when = dt;
  }

  const updated = await Appointment.findOneAndUpdate(
    { _id: req.params.id, doctorId: req.user.id },
    updates,
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

module.exports = router;
