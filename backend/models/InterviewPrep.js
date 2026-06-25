const mongoose = require("mongoose");

const questionSchema = new mongoose.Schema(
  {
    question: { type: String, required: true },
    answer: { type: String, required: true },
  },
  { _id: false }
);

const interviewPrepSchema = new mongoose.Schema(
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
    difficulty: {
      type: String,
      enum: ["beginner", "intermediate", "advanced"],
      required: true,
    },
    categories: {
      technical: { type: [questionSchema], default: [] },
      project: { type: [questionSchema], default: [] },
      hr: { type: [questionSchema], default: [] },
      scenario: { type: [questionSchema], default: [] },
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("InterviewPrep", interviewPrepSchema);
