
const express = require("express");

const { uploadMedia } = require("../controllers/mediaController");
const upload = require("../middleware/uploadMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// Only authenticated admins can upload media.
router.post(
    "/upload",
    authMiddleware,
    requireRole("admin"),
    upload.single("file"),
    uploadMedia
);

module.exports = router;
