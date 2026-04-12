const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");

// GET /api/protected/profile
router.get("/profile", authMiddleware, (req, res) => {
  return res.status(200).json({
    message: "Protected route accessed",
    userId: req.user,
  });
});

module.exports = router;
