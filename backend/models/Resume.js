const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    originalFileName: {
      type: String,
      trim: true,
    },
    fileUrl: {
      type: String,
      trim: true,
    },
    extractedText: {
      type: String,
    },
    fileSize: {
      type: Number,
    },
    fileType: {
      type: String,
      trim: true,
    },
    uploadDate: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Resume = mongoose.model("Resume", resumeSchema);

module.exports = Resume;
