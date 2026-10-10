
const express = require("express");

const {
    getDashboardStats,
    getRecentContent,
    getSevenDayViews,
} = require("../controllers/dashboardController");

const authMiddleware = require("../middleware/authMiddleware");
const requireRole = require("../middleware/roleMiddleware");

const router = express.Router();

// Only authenticated admins can view dashboard statistics.
router.get("/stats", authMiddleware, requireRole("admin"), getDashboardStats);
router.get("/recent", authMiddleware, requireRole("admin"), getRecentContent);
router.get("/views/7-days", authMiddleware, requireRole("admin"), getSevenDayViews);

module.exports = router;
