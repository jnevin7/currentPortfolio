// models/Appointment.js
const mongoose = require("mongoose");
const { Schema } = mongoose;

const appointmentSchema = new Schema({
  patientId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  doctorId:  { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  when:      { type: Date, required: true, index: true },

  // allow phone consults too
  mode:      { type: String, enum: ["video", "phone", "in_person"], default: "video" },

  // include both "pending" (new) and "requested" (old) so existing docs don't break
  status:    { type: String, enum: ["pending", "requested", "confirmed", "completed", "cancelled"], default: "pending", index: true },

  // optional linkage to a case (pre-booked review)
  caseId:    { type: Schema.Types.ObjectId, ref: "Case" }
}, { timestamps: true });

// helpful indexes for queries you already do
appointmentSchema.index({ patientId: 1, createdAt: -1 });
appointmentSchema.index({ doctorId: 1, when: 1 });

module.exports = mongoose.model("Appointment", appointmentSchema);
