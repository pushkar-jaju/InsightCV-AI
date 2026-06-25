const mongoose = require("mongoose");

const roadmapStepSchema = new mongoose.Schema(
  {
    step: { type: String, required: true },
    description: { type: String, default: "" },
    technologies: { type: [String], default: [] },
  },
  { _id: false }
);

const techRecSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    reason: { type: String, default: "" },
  },
  { _id: false }
);

const projectRecSchema = new mongoose.Schema(
  {
    title: { type: String, required: true },
    description: { type: String, default: "" },
    techStack: { type: [String], default: [] },
  },
  { _id: false }
);

const careerGuidanceSchema = new mongoose.Schema(
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
    careerGoal: {
      type: String,
      required: [true, "Career goal is required"],
      trim: true,
    },
    roadmap: {
      type: [roadmapStepSchema],
      default: [],
    },
    skillGap: {
      current: { type: [String], default: [] },
      missing: { type: [String], default: [] },
    },
    readiness: {
      technical: { type: Number, default: 0 },
      resume: { type: Number, default: 0 },
      interview: { type: Number, default: 0 },
      overall: { type: Number, default: 0 },
    },
    learningRecommendations: {
      technologies: { type: [techRecSchema], default: [] },
      certifications: { type: [String], default: [] },
      projects: { type: [projectRecSchema], default: [] },
      practiceAreas: { type: [String], default: [] },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("CareerGuidance", careerGuidanceSchema);
