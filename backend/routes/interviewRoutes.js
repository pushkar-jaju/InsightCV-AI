const express = require("express");
const router = Router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  generateInterviewQuestions,
  getInterviewPrepByResume,
} = require("../controllers/interviewController");

router.post("/generate", authMiddleware, generateInterviewQuestions);
router.get("/resume/:resumeId", authMiddleware, getInterviewPrepByResume);

module.exports = router;
