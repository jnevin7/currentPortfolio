const router = require("express").Router();
const auth = require("../middleware/auth");
const cloudinary = require("cloudinary").v2;
const multer = require("multer");
const { CloudinaryStorage } = require("multer-storage-cloudinary");

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key:    process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary,
  params: {
    folder: "dermai",
    allowed_formats: ["jpg", "jpeg", "png", "webp"],
    transformation: [{ width: 1600, crop: "limit" }], // keep sizes sane
  },
});

const upload = multer({ storage });

// POST /api/upload/image  (form-data: image=<file>)
router.post("/image", auth, upload.single("image"), async (req, res) => {
  // req.file.path is the Cloudinary URL
  res.json({ url: req.file.path, public_id: req.file.filename });
});

module.exports = router;
