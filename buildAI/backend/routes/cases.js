// backend/routes/cases.js
const router      = require("express").Router();
const mongoose    = require("mongoose");
const auth        = require("../middleware/auth");
const requireRole = require("../middleware/requireRole");
const Case        = require("../models/Case");
const OpenAI      = require("openai");

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/* ═════════════════════════════════════
   GPT-4o VISION TRIAGE
═════════════════════════════════════ */

async function analyseWithAI({ imageUrl, description = "", bodySite = "", durationDays, faultType = "" }) {
  const contextLines = [
    faultType    ? `Fault type selected by client: ${faultType}` : null,
    description  ? `Client description: ${description}`          : null,
    bodySite     ? `Location in property: ${bodySite}`           : null,
    durationDays ? `Present for: ${durationDays} days`           : null,
  ].filter(Boolean).join("\n");

  const prompt = `You are an expert building surveyor and construction fault analyst.
Analyse the provided image of a property fault or building issue.

Additional context from the client:
${contextLines || "No additional context provided."}

Respond ONLY with a valid JSON object — no markdown, no explanation, no backticks.

The JSON must follow this exact structure:
{
  "prediction": "short fault name in 2-4 words",
  "confidence": 0.00,
  "triage": "urgent | review_soon | non_urgent",
  "summary": "2-3 sentence plain-English summary of what you see and why",
  "abcde": {
    "s": true or false,
    "t": true or false,
    "e": true or false,
    "a": true or false,
    "m": true or false
  },
  "differentials": [
    { "label": "Most likely fault", "value": 0.00, "color": "var(--accent)"  },
    { "label": "Second possibility", "value": 0.00, "color": "var(--warn)"   },
    { "label": "Third possibility",  "value": 0.00, "color": "var(--danger)" },
    { "label": "Fourth possibility", "value": 0.00, "color": "var(--muted)"  }
  ]
}

Rules:
- "prediction" should be a concise fault name e.g. "Rising Damp", "Hairline Crack", "Roof Tile Damage"
- "confidence" is a float between 0 and 1 reflecting how certain you are given the image quality
- "triage" must be exactly one of: urgent, review_soon, non_urgent
  - urgent: immediate safety risk or rapid deterioration (structural failure, active water ingress, exposed wiring)
  - review_soon: needs attention within weeks to prevent worsening
  - non_urgent: cosmetic or stable issue, monitor only
- "abcde" maps to STEAM — be decisive, do NOT default everything to false. s=Structural element affected, t=Type clearly identifiable (almost always true), e=Extent is significant or spreading, a=Age/chronic long-standing damage, m=Materials visibly degraded. For damp flag t+e+m minimum. For cracks flag t+m. NEVER return all false.
  - at minimum t should be true if a fault is visible in the image
- "differentials" must have exactly 4 items with DIFFERENT labels — never repeat the same fault name. Values sum to ~1.0. Use realistic alternative faults that could explain the same visual symptoms.
- If image quality is too poor to assess, set triage to "review_soon" and confidence to 0.3`;

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      max_tokens: 600,
      messages: [
        {
          role: "user",
          content: [
            {
              type: "image_url",
              image_url: {
                url:    imageUrl,
                detail: "high",
              },
            },
            {
              type: "text",
              text: prompt,
            },
          ],
        },
      ],
    });

    const raw  = response.choices[0].message.content.trim();
    const clean = raw.replace(/^```json|^```|```$/gm, "").trim();
    const parsed = JSON.parse(clean);

    // Validate required fields — fall back to keyword triage if malformed
    if (!parsed.prediction || !parsed.triage || !parsed.confidence) {
      throw new Error("Incomplete AI response");
    }

    return {
      prediction:    parsed.prediction,
      confidence:    Math.min(1, Math.max(0, Number(parsed.confidence))),
      triage:        ["urgent", "review_soon", "non_urgent"].includes(parsed.triage)
                       ? parsed.triage : "review_soon",
      summary:       parsed.summary       || "",
      abcde:         parsed.abcde         || { s: false, t: false, e: false, a: false, m: false },
      differentials: parsed.differentials || [],
    };

  } catch (err) {
    console.error("GPT-4o analysis failed, falling back to keyword triage:", err.message);
    return fallbackTriage({ description, imageUrl });
  }
}

/* ── Fallback if GPT-4o fails or key not set ── */
function fallbackTriage({ imageUrl = "", description = "" }) {
  const t = `${imageUrl} ${description}`.toLowerCase();
  if (/crack|structur|collapse|unsafe|urgent|foundation|subsidence/.test(t)) {
    return { prediction: "Structural Damage",    confidence: 0.72, triage: "urgent",      abcde: { s: true,  t: true,  e: false, a: false, m: true  }, differentials: [] };
  }
  if (/damp|leak|mould|water|rust|ingress|wet/.test(t)) {
    return { prediction: "Damp / Water Ingress", confidence: 0.68, triage: "review_soon", abcde: { s: false, t: true,  e: true,  a: false, m: true  }, differentials: [] };
  }
  return   { prediction: "Surface Defect",       confidence: 0.60, triage: "non_urgent",  abcde: { s: false, t: true,  e: false, a: false, m: false }, differentials: [] };
}

/* ── Triage-sorted aggregation for doctor boards ── */
async function triageList(match) {
  return Case.aggregate([
    { $match: match },
    {
      $addFields: {
        severity: {
          $switch: {
            branches: [
              { case: { $eq: ["$ai.triage", "urgent"]      }, then: 0 },
              { case: { $eq: ["$ai.triage", "review_soon"] }, then: 1 },
              { case: { $eq: ["$ai.triage", "non_urgent"]  }, then: 2 },
            ],
            default: 3,
          },
        },
      },
    },
    { $lookup: { from: "users", localField: "doctorId",  foreignField: "_id", as: "doctor"  } },
    { $unwind: { path: "$doctor",  preserveNullAndEmptyArrays: true } },
    { $lookup: { from: "users", localField: "patientId", foreignField: "_id", as: "patient" } },
    { $unwind: { path: "$patient", preserveNullAndEmptyArrays: true } },
    { $sort: { severity: 1, createdAt: -1 } },
    // NOTE: the User schema stores the hash as `passwordHash`, not `password` —
    // exclude the real sensitive fields (a stray `"doctor.password": 0` here does nothing,
    // since there is no such field, and the full hash + reset tokens leak to the client).
    {
      $project: {
        severity: 0,
        "doctor.passwordHash": 0,
        "doctor.resetPasswordToken": 0,
        "doctor.resetPasswordExpires": 0,
        "patient.passwordHash": 0,
        "patient.resetPasswordToken": 0,
        "patient.resetPasswordExpires": 0,
      },
    },
  ]);
}

/* ═════════════════════════════════════
   CLIENT ROUTES
═════════════════════════════════════ */

// POST /api/cases — submit a new report
router.post("/", auth, async (req, res) => {
  try {
    const { imageUrl, description, bodySite, durationDays, priorTreatments, faultType } = req.body;
    if (!imageUrl) return res.status(400).json({ error: "imageUrl required" });

    // Run GPT-4o analysis (falls back to keyword if it fails)
    const ai = await analyseWithAI({ imageUrl, description, bodySite, durationDays, faultType });

    const saved = await Case.create({
      patientId: req.user.id,
      imageUrl, description, faultType, bodySite, durationDays, priorTreatments,
      ai,
    });

    res.json(saved);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/cases/mine — list client's own reports
router.get("/mine", auth, async (req, res) => {
  const items = await Case.find({ patientId: req.user.id }).sort({ createdAt: -1 });
  res.json(items);
});

// DELETE /api/cases/:id — client deletes their own report
router.delete("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id" });
    }
    const c = await Case.findOneAndDelete({
      _id: req.params.id,
      patientId: req.user.id,  // only owner can delete
    });
    if (!c) return res.status(404).json({ error: "Not found or not your report" });
    res.json({ deleted: true });
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// PATCH /api/cases/:id — client updates their own report (saves history snapshot)
router.patch("/:id", auth, async (req, res) => {
  try {
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ error: "Invalid id" });
    }

    const c = await Case.findOne({ _id: req.params.id, patientId: req.user.id });
    if (!c) return res.status(404).json({ error: "Not found or not your report" });

    const { imageUrl, description, bodySite, durationDays, priorTreatments, updateNote } = req.body;

    // Snapshot current state before overwriting
    c.history.push({
      changedAt: new Date(),
      changedBy: req.user.id,
      role:      "patient",
      note:      updateNote || "Client updated report",
      snapshot: {
        imageUrl:        c.imageUrl,
        description:     c.description,
        bodySite:        c.bodySite,
        durationDays:    c.durationDays,
        priorTreatments: c.priorTreatments,
        ai:              c.ai,
      },
    });

    // Track whether the image or description actually changed value —
    // re-running GPT-4o on every save (even a typo fix in bodySite) burns
    // an API call for nothing if the request just echoes the current values.
    const imageChanged =
      imageUrl !== undefined && imageUrl !== c.imageUrl;
    const descriptionChanged =
      description !== undefined && description !== c.description;

    if (imageUrl        !== undefined) c.imageUrl        = imageUrl;
    if (description     !== undefined) c.description     = description;
    if (bodySite        !== undefined) c.bodySite        = bodySite;
    if (durationDays    !== undefined) c.durationDays    = durationDays;
    if (priorTreatments !== undefined) c.priorTreatments = priorTreatments;

    // Re-run AI only if the image or description actually changed
    if (imageChanged || descriptionChanged) {
      c.ai     = await analyseWithAI({ imageUrl: c.imageUrl, description: c.description, bodySite: c.bodySite });
      c.status = "ai_reviewed";
    }

    await c.save();
    res.json(c);
  } catch (e) {
    res.status(500).json({ error: e.message });
  }
});

// GET /api/cases/:id/history
router.get("/:id/history", auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const c = await Case.findById(req.params.id).populate("history.changedBy", "name role");
  if (!c) return res.status(404).json({ error: "Not found" });
  if (req.user.role !== "doctor" && String(c.patientId) !== req.user.id) {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(c.history);
});

/* ═════════════════════════════════════
   EXPERT BOARDS  (specific routes FIRST)
═════════════════════════════════════ */

router.get("/board/inbox", auth, requireRole("doctor"), async (req, res) => {
  const rows = await triageList({
    status: { $in: ["open", "ai_reviewed"] },
    $or: [{ doctorId: { $exists: false } }, { doctorId: null }],
  });
  res.json(rows);
});

router.get("/board/mine", auth, requireRole("doctor"), async (req, res) => {
  const me = new mongoose.Types.ObjectId(req.user.id);
  const rows = await triageList({
    doctorId: me,
    status: { $in: ["open", "ai_reviewed", "doctor_claimed", "doctor_reviewed"] },
  });
  res.json(rows);
});

router.get("/board/collab", auth, requireRole("doctor"), async (req, res) => {
  const rows = await triageList({
    collabRequested: true,
    status: { $in: ["open", "ai_reviewed", "doctor_claimed", "doctor_reviewed"] },
  });
  res.json(rows);
});

router.get("/board/claimed", auth, requireRole("doctor"), async (req, res) => {
  const rows = await triageList({
    doctorId: { $ne: null },
    status: { $in: ["doctor_claimed", "doctor_reviewed"] },
  });
  res.json(rows);
});

router.patch("/:id/collab", auth, requireRole("doctor"), async (req, res) => {
  const { collabRequested, collabNote = "" } = req.body || {};
  if (typeof collabRequested !== "boolean") {
    return res.status(400).json({ error: "collabRequested boolean required" });
  }
  const updated = await Case.findByIdAndUpdate(
    req.params.id,
    { collabRequested, collabNote },
    { new: true }
  );
  if (!updated) return res.status(404).json({ error: "Not found" });
  res.json(updated);
});

/* ═════════════════════════════════════
   EXPERT ACTIONS
═════════════════════════════════════ */

router.get("/inbox", auth, requireRole("doctor"), async (req, res) => {
  const me = new mongoose.Types.ObjectId(req.user.id);
  const rows = await triageList({
    status: { $in: ["open", "ai_reviewed", "doctor_claimed", "doctor_reviewed"] },
    $or: [
      { doctorId: { $exists: false } },
      { doctorId: null },
      { doctorId: me },
    ],
  });
  res.json(rows);
});

router.post("/:id/claim", auth, requireRole("doctor"), async (req, res) => {
  const c = await Case.findOneAndUpdate(
    { _id: req.params.id, $or: [{ doctorId: { $exists: false } }, { doctorId: null }] },
    { doctorId: req.user.id, status: "doctor_claimed" },
    { new: true }
  );
  if (!c) return res.status(409).json({ error: "Already claimed or not found" });
  res.json(c);
});

router.patch("/:id/doctor-review", auth, requireRole("doctor"), async (req, res) => {
  const { doctorNotes, status = "doctor_reviewed" } = req.body;

  // Allow if: they are the claiming doctor OR the case has collab requested
  const c = await Case.findById(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });

  const isOwner  = String(c.doctorId) === String(req.user.id);
  const isCollab = !!c.collabRequested;

  if (!isOwner && !isCollab) {
    return res.status(403).json({ error: "Not your report — request collaboration first" });
  }

  const updates = { status };
  if (doctorNotes !== undefined) updates.doctorNotes = doctorNotes;
  // If a collaborator is reviewing, record them as the reviewer
  if (!isOwner && isCollab) updates.doctorId = req.user.id;

  const updated = await Case.findByIdAndUpdate(req.params.id, updates, { new: true });
  res.json(updated);
});

/* ═════════════════════════════════════
   GENERIC  (put LAST)
═════════════════════════════════════ */

router.get("/:id", auth, async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    return res.status(400).json({ error: "Invalid id" });
  }
  const c = await Case.findById(req.params.id);
  if (!c) return res.status(404).json({ error: "Not found" });
  if (String(c.patientId) !== req.user.id && req.user.role !== "doctor") {
    return res.status(403).json({ error: "Forbidden" });
  }
  res.json(c);
});

module.exports = router;