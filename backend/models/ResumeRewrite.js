const mongoose = require("mongoose");

const resumeRewriteSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    resumeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Resume",
      required: [true, "Resume ID is required"],
    },
    originalSections: {
      summary: { type: String, default: "" },
      skills: { type: String, default: "" },
      experience: { type: String, default: "" },
      projects: { type: String, default: "" },
      education: { type: String, default: "" },
    },
    improvedSections: {
      summary: { type: String, default: "" },
      skills: { type: String, default: "" },
      experience: { type: String, default: "" },
      projects: { type: String, default: "" },
      education: { type: String, default: "" },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("ResumeRewrite", resumeRewriteSchema);
