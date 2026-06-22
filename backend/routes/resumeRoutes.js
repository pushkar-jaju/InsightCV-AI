const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const upload = require("../config/multerConfig");
const {
  uploadResume,
  extractResumeText,
  analyzeResumeWithAI,
  matchResumeWithJobDescription,
  getJobMatch,
  getResumes,
  getResumeReport,
  deleteResumeReport,
  getResumeHistory,
  deleteResume,
  getResumeFile,
  compareResumes
} = require("../controllers/resumeController");

// ─────────────────────────────────────────
// GET /api/resumes
// Protected: JWT required
// ─────────────────────────────────────────
router.get("/", authMiddleware, getResumes);

// ─────────────────────────────────────────
// GET /api/resumes/history
// Protected: JWT required
// ─────────────────────────────────────────
router.get("/history", authMiddleware, getResumeHistory);

// ─────────────────────────────────────────
// POST /api/resumes/compare
// Protected: JWT required
// ─────────────────────────────────────────
router.post("/compare", authMiddleware, compareResumes);

// ─────────────────────────────────────────
// POST /api/resumes/upload
// Protected: JWT required
// File field name: "resume"
// ─────────────────────────────────────────
router.post(
  "/upload",
  authMiddleware,
  (req, res, next) => {
    // Run multer, then intercept its errors for clean JSON responses
    upload.single("resume")(req, res, (err) => {
      if (err) {
        // Multer file size limit exceeded
        if (err.code === "LIMIT_FILE_SIZE") {
          return res.status(400).json({
            success: false,
            message: "File too large. Maximum allowed size is 5MB.",
          });
        }
        // Invalid file type or other multer error
        return res.status(400).json({
          success: false,
          message: err.message || "File upload error",
        });
      }
      next();
    });
  },
  uploadResume
);

// ─────────────────────────────────────────
// POST /api/resumes/:id/extract
// Protected: JWT required
// ─────────────────────────────────────────
router.post("/:id/extract", authMiddleware, extractResumeText);

// ─────────────────────────────────────────
// POST /api/resumes/:id/analyze
// Protected: JWT required
// ─────────────────────────────────────────
router.post("/:id/analyze", authMiddleware, analyzeResumeWithAI);

// ─────────────────────────────────────────
// POST /api/resumes/:id/match-job
// Protected: JWT required
// Body: { jobDescription: string }
// ─────────────────────────────────────────
router.post("/:id/match-job", authMiddleware, matchResumeWithJobDescription);

// ─────────────────────────────────────────
// GET /api/resumes/:id/job-match
// Protected: JWT required
// Returns saved job match analysis (or 404)
// ─────────────────────────────────────────
router.get("/:id/job-match", authMiddleware, getJobMatch);

// ─────────────────────────────────────────
// GET /api/resumes/:id/file
// Protected: JWT required
// Serves/streams the original PDF/DOCX file
// ─────────────────────────────────────────
router.get("/:id/file", authMiddleware, getResumeFile);

// ─────────────────────────────────────────
// GET /api/resumes/:id/report
// Protected: JWT required
// Returns saved ATS analysis report
// ─────────────────────────────────────────
router.get("/:id/report", authMiddleware, getResumeReport);

// ─────────────────────────────────────────
// DELETE /api/resumes/:id/report
// Protected: JWT required
// Deletes saved report (enables re-analysis)
// ─────────────────────────────────────────
router.delete("/:id/report", authMiddleware, deleteResumeReport);

// ─────────────────────────────────────────
// DELETE /api/resumes/:id
// Protected: JWT required
// Deletes resume, file, and report permanently
// ─────────────────────────────────────────
router.delete("/:id", authMiddleware, deleteResume);

module.exports = router;
