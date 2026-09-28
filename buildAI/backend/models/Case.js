const mongoose = require("mongoose");

const caseHistorySchema = new mongoose.Schema({
  changedAt:   { type: Date, default: Date.now },
  changedBy:   { type: mongoose.Schema.Types.ObjectId, ref: "User" },
  role:        { type: String, enum: ["patient", "doctor"] },
  note:        { type: String, default: "" },   // reason for update
  snapshot: {                                   // what changed
    imageUrl:        String,
    description:     String,
    bodySite:        String,
    durationDays:    Number,
    priorTreatments: [String],
    ai:              mongoose.Schema.Types.Mixed,
  },
}, { _id: true });

const caseSchema = new mongoose.Schema({
  patientId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true, index: true },
  doctorId:  { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },

  imageUrl:        { type: String, required: true },
  description:     String,
  faultType:       String,
  bodySite:        String,
  durationDays:    Number,
  priorTreatments: [String],

  ai: {
    prediction: String,
    confidence: Number,
    triage:     { type: String, enum: ["urgent", "review_soon", "non_urgent"] },
    abcde:      { type: mongoose.Schema.Types.Mixed, default: {} },
    differentials: [{ label: String, value: Number, color: String }],
  },

  doctorNotes: String,

  status: {
    type: String,
    enum: ["open", "ai_reviewed", "doctor_claimed", "doctor_reviewed", "closed"],
    default: "open",
    index: true,
  },

  collabRequested: { type: Boolean, default: false, index: true },
  collabNote:      { type: String,  default: "" },

  // ── update history ──
  history: [caseHistorySchema],

}, { timestamps: true });

module.exports = mongoose.model("Case", caseSchema);