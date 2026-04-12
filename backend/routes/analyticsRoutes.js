const express = require("express");
const router = express.Router();
const { getAnalyticsSummary } = require("../controllers/analyticsController");
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/analytics/summary
router.get("/summary", authMiddleware, getAnalyticsSummary);

module.exports = router;
