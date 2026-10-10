
const express = require("express");
const router = express.Router();

const {
    createCategory,
    getAllCategories,
    getCategoryById,
    updateCategory,
    deleteCategory,
} = require("../controllers/categoryController");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

// Public: retrieve categories
router.get("/", getAllCategories);
router.get("/:id", getCategoryById);

// Admin only: create, update, and delete categories
router.post("/", authMiddleware, requireRole("admin"), createCategory);
router.put("/:id", authMiddleware, requireRole("admin"), updateCategory);
router.delete("/:id", authMiddleware, requireRole("admin"), deleteCategory);

module.exports = router;