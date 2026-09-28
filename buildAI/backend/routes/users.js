const router = require("express").Router();
const auth = require("../middleware/auth");
const User = require("../models/User");

// Get minimal doctor directory
router.get("/doctors", auth, async (_req, res) => {
  const docs = await User.find({ role: "doctor" }).select("_id name email");
  res.json(docs);
});

// POST /api/users/consent
router.post("/consent", require("../middleware/auth"), async (req, res) => {
  const user = await User.findByIdAndUpdate(
    req.user.id,
    { consentAt: new Date() },
    { new: true, select: "consentAt" }
  );
  res.json(user);
});


module.exports = router;
