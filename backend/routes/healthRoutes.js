const express = require("express");
const router = express.Router();

// GET /api/health
router.get("/", (req, res) => {
  res.status(200).json({
    success: true,
    message: "Server running successfully",
  });
});

module.exports = router;
