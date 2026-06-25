const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateCareerGuidance,
  getCareerGuidanceByResume,
} = require("../controllers/careerController");

router.post("/guidance", authMiddleware, generateCareerGuidance);
router.get("/guidance/:resumeId", authMiddleware, getCareerGuidanceByResume);

module.exports = router;
