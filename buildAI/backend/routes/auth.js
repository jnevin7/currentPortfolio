const router    = require("express").Router();
const bcrypt    = require("bcryptjs");
const jwt       = require("jsonwebtoken");
const crypto    = require("crypto");
const User      = require("../models/User");
const rateLimit = require("../middleware/rateLimit");

/* ── helpers ── */
const signToken = (user) =>
  jwt.sign({ id: user._id, role: user.role }, process.env.JWT_SECRET, { expiresIn: "7d" });

/* ── brute-force protection on the sensitive auth endpoints ── */
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  message: "Too many login attempts. Please try again in a few minutes.",
});
const registerLimiter = rateLimit({
  windowMs: 60 * 60 * 1000,
  max: 10,
  message: "Too many accounts created from this address. Please try again later.",
});
const forgotLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: "Too many password reset requests. Please try again later.",
});

/* ─────────────────────────────────────────────
   POST /api/auth/register
───────────────────────────────────────────── */
router.post("/register", registerLimiter, async (req, res) => {
  try {
    const { name, email, password, role, dob, phone, sex } = req.body;

    // ── validation ──
    if (!name || !email || !password) {
      return res.status(400).json({ error: "name, email and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }
    const allowedRoles = ["patient", "doctor"];
    const assignedRole = allowedRoles.includes(role) ? role : "patient";

    const existing = await User.findOne({ email: email.toLowerCase().trim() });
    if (existing) return res.status(400).json({ error: "Email already in use" });

    const passwordHash = await bcrypt.hash(password, 12);

    const user = await User.create({
      name:  name.trim(),
      email: email.toLowerCase().trim(),
      passwordHash,
      role:  assignedRole,
      ...(dob   ? { dob: new Date(dob) } : {}),
      ...(phone  ? { phone }             : {}),
      ...(sex    ? { sex }               : {}),
    });

    const token = signToken(user);
    res.status(201).json({
      token,
      user: { id: user._id, name: user.name, role: user.role },
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────
   POST /api/auth/login
───────────────────────────────────────────── */
router.post("/login", loginLimiter, async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "email and password are required" });
    }

    const user = await User.findOne({ email: email.toLowerCase().trim() });
    if (!user) return res.status(400).json({ error: "Invalid credentials" });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return res.status(400).json({ error: "Invalid credentials" });

    // stamp last login
    user.lastLoginAt = new Date();
    await user.save();

    const token = signToken(user);
    res.json({ token, user: { id: user._id, name: user.name, role: user.role } });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────
   GET /api/auth/me
───────────────────────────────────────────── */
router.get("/me", require("../middleware/auth"), async (req, res) => {
  const user = await User.findById(req.user.id)
    .select("name email role consentAt dob phone sex");
  if (!user) return res.status(404).json({ error: "User not found" });
  res.json(user);
});

/* ─────────────────────────────────────────────
   POST /api/auth/forgot-password
   Generates a reset token and (in production) emails it.
   In development the token is returned in the response
   so you can test without an SMTP server.
───────────────────────────────────────────── */
router.post("/forgot-password", forgotLimiter, async (req, res) => {
  try {
    const { email } = req.body;
    if (!email) return res.status(400).json({ error: "email is required" });

    const user = await User.findOne({ email: email.toLowerCase().trim() });

    // Always respond 200 — never reveal whether email exists
    if (!user) {
      return res.json({ message: "If that email is registered, a reset link has been sent." });
    }

    // Generate a secure token (raw = what we send, hashed = what we store)
    const rawToken   = crypto.randomBytes(32).toString("hex");
    const hashedToken = crypto.createHash("sha256").update(rawToken).digest("hex");

    user.resetPasswordToken   = hashedToken;
    user.resetPasswordExpires = Date.now() + 60 * 60 * 1000; // 1 hour
    await user.save();

    // ── Production: send email via your mailer ──
    // e.g. await sendResetEmail(user.email, rawToken);
    //
    // const resetUrl = `${process.env.FRONTEND_URL}/reset-password?token=${rawToken}`;
    // await mailer.send({ to: user.email, subject: "BuildAI password reset", html: `...` });

    // ── Development: return token so you can test without SMTP ──
    const devPayload = process.env.NODE_ENV !== "production" ? { devToken: rawToken } : {};

    res.json({
      message: "If that email is registered, a reset link has been sent.",
      ...devPayload,
    });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

/* ─────────────────────────────────────────────
   POST /api/auth/reset-password
   Body: { token, password }
───────────────────────────────────────────── */
router.post("/reset-password", async (req, res) => {
  try {
    const { token, password } = req.body;
    if (!token || !password) {
      return res.status(400).json({ error: "token and password are required" });
    }
    if (password.length < 8) {
      return res.status(400).json({ error: "Password must be at least 8 characters" });
    }

    const hashedToken = crypto.createHash("sha256").update(token).digest("hex");

    const user = await User.findOne({
      resetPasswordToken:   hashedToken,
      resetPasswordExpires: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({ error: "Token is invalid or has expired" });
    }

    user.passwordHash          = await bcrypt.hash(password, 12);
    user.resetPasswordToken    = undefined;
    user.resetPasswordExpires  = undefined;
    await user.save();

    res.json({ message: "Password reset successfully. You can now log in." });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

module.exports = router;