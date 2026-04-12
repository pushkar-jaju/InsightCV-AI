const mongoose = require("mongoose");

const skillGapSchema = new mongoose.Schema(
  {
    skill: { type: String },
    recommendation: { type: String },
  },
  { _id: false }
);

// ── Phase 6: Job Match subdocument ──────────
const jobMatchSchema = new mongoose.Schema(
  {
    jobDescription:         { type: String },
    matchScore:             { type: Number },
    matchingSkills:         { type: [String], default: [] },
    missingSkillsForJob:    { type: [String], default: [] },
    keywordMatchPercentage: { type: Number },
    improvementSuggestions: { type: [String], default: [] },
    overallFeedback:        { type: String },
  },
  { _id: false }
);

const analysisReportSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
    },
    atsScore: {
      type: Number,
    },
    keywordMatchPercentage: {
      type: Number,
    },
    missingKeywords: {
      type: [String],
      default: [],
    },
    detectedSkills: {
      type: [String],
      default: [],
    },
    skillGapAnalysis: {
      type: [skillGapSchema],
      default: [],
    },
    formattingIssues: {
      type: [String],
      default: [],
    },
    suggestions: {
      type: [String],
      default: [],
    },
    strengths: {
      type: [String],
      default: [],
    },
    weaknesses: {
      type: [String],
      default: [],
    },
    experienceLevelDetected: {
      type: String,
      trim: true,
    },
    // ── Phase 6: Job Description Match ──────
    jobMatchAnalysis: {
      type: jobMatchSchema,
      default: null,
    },
  },
  { timestamps: true }
);

const AnalysisReport = mongoose.model("AnalysisReport", analysisReportSchema);

module.exports = AnalysisReport;
