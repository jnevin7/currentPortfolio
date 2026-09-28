const mongoose = require("mongoose");

const userSchema = new mongoose.Schema({
  name:  { type: String, required: true, trim: true },
  email: { type: String, required: true, unique: true, lowercase: true, trim: true },
  passwordHash: { type: String, required: true },
  role:  { type: String, enum: ["patient", "doctor"], default: "patient", index: true },

  // profile fields
  dob:   Date,
  sex:   { type: String, enum: ["male", "female", "intersex", "other", "unspecified"] },
  phone: String,

  // activity
  lastLoginAt: Date,
  consentAt:   Date,

  // password reset
  resetPasswordToken:   String,
  resetPasswordExpires: Date,

}, { timestamps: true });

module.exports = mongoose.model("User", userSchema);