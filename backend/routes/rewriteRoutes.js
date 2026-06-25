const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateRewrite,
  getRewriteHistory,
  saveRewriteAsVersion,
} = require("../controllers/rewriteController");

router.post("/generate", authMiddleware, generateRewrite);
router.get("/history/:resumeId", authMiddleware, getRewriteHistory);
router.post("/save-version", authMiddleware, saveRewriteAsVersion);

module.exports = router;
