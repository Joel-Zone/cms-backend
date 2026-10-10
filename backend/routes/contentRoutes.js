const express = require("express");

const {
    createContent,
    getAllContent,
    getContentById,
    updateContent,
    deleteContent,
    publishContent
} = require("../controllers/contentController");

const validateContent = require("../middleware/validationMiddleware");
const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");
const optionalAuthMiddleware = require("../middleware/optionalAuthMiddleware");

const router = express.Router();

router.post("/", authMiddleware, validateContent, createContent);
router.get("/", optionalAuthMiddleware, getAllContent);
router.get("/:id", optionalAuthMiddleware, getContentById);
router.patch("/:id/status", authMiddleware, publishContent);

router.put(
    "/:id",
    authMiddleware,
    validateContent,
    updateContent
);

router.delete(
    "/:id",
    authMiddleware,
    requireRole("admin"),
    deleteContent
);

router.patch(
    "/:id/publish",
    authMiddleware,
    publishContent
);

module.exports = router;