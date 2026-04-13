const fs = require("fs");
const path = require("path");
const pdfParse = require("pdf-parse");
const Resume = require("../models/Resume");
const User = require("../models/User");
const AnalysisReport = require("../models/AnalysisReport");
const { generateAIContent } = require("../config/groq");

// ─────────────────────────────────────────
// @desc    Upload a resume file
// @route   POST /api/resumes/upload
// @access  Private (requires JWT)
// ─────────────────────────────────────────
const uploadResume = async (req, res) => {
  try {
    // Ensure a file was actually uploaded
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded. Please attach a PDF or DOCX file.",
      });
    }

    const { originalname, filename, path: filePath, size, mimetype } = req.file;
    const userId = req.user; // set by authMiddleware

    // The safe filename (handles both relative and absolute paths if user previously had them)
    const safeFilename = path.basename(filePath);
    const uploadDir = path.join(__dirname, "../uploads");
    console.log(`[uploadResume] File saved successfully at: ${filePath}`);

    // Create resume document in MongoDB
    const resume = await Resume.create({
      userId,
      originalFileName: originalname,
      fileUrl: safeFilename, // Save ONLY filename to avoid absolute path bugs across deploys
      fileSize: size,
      fileType: mimetype,
      extractedText: "", // placeholder for Phase 4
    });

    // Increment the user's totalResumesUploaded counter
    await User.findByIdAndUpdate(userId, {
      $inc: { totalResumesUploaded: 1 },
    });

    return res.status(201).json({
      success: true,
      message: "Resume uploaded successfully",
      resume,
    });
  } catch (error) {
    console.error("Upload Resume Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during resume upload",
    });
  }
};

// ─────────────────────────────────────────
// @desc    Get all resumes for the logged-in user
// @route   GET /api/resumes
// @access  Private (requires JWT)
// ─────────────────────────────────────────
const getResumes = async (req, res) => {
  try {
    const userId = req.user;
    const resumes = await Resume.find({ userId }).sort({ createdAt: -1 });
    const latestReport = await AnalysisReport.findOne({ userId }).sort({ createdAt: -1 });
    return res.status(200).json({
      success: true,
      resumes,
      latestReport: latestReport || null,
    });
  } catch (error) {
    console.error("Get Resumes Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching resumes" });
  }
};

// ─────────────────────────────────────────
// @desc    Extract text from an uploaded PDF resume
// @route   POST /api/resumes/:id/extract
// @access  Private (requires JWT)
// ─────────────────────────────────────────
const extractResumeText = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user;

    // Find resume and verify ownership
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    if (resume.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: This resume does not belong to you",
      });
    }

    // Only PDF files supported for text extraction
    if (resume.fileType !== "application/pdf") {
      return res.status(400).json({
        success: false,
        message: "Text extraction is only supported for PDF files",
      });
    }

    // Get the dynamic upload directory
    const uploadDir = path.join(__dirname, "../uploads");
    const filename = path.basename(resume.fileUrl);
    const correctFilePath = path.join(uploadDir, filename);

    console.log(`[extractResumeText] Requesting file read for: ${correctFilePath}`);

    // Verify the file still exists on disk
    if (!fs.existsSync(correctFilePath)) {
      console.error(`[extractResumeText] File NOT FOUND on server at path: ${correctFilePath}`);
      return res.status(404).json({
        success: false,
        message: "Resume file not found on server. Please re-upload.",
      });
    }

    console.log(`[extractResumeText] File successfully located, starting extraction...`);

    // Read and parse the PDF
    const dataBuffer = fs.readFileSync(correctFilePath);
    let data;
    try {
      data = await pdfParse(dataBuffer);
    } catch (parseErr) {
      console.error("PDF Parse Error:", parseErr.message);
      return res.status(400).json({
        success: false,
        message: "Failed to parse PDF. The file may be corrupted or password-protected.",
      });
    }

    // Clean extracted text — collapse multiple blank lines / trailing spaces
    const extractedText = data.text
      .replace(/[ \t]+/g, " ")       // collapse multiple spaces/tabs
      .replace(/\n{3,}/g, "\n\n")    // collapse 3+ newlines into 2
      .trim();

    // Persist extracted text to MongoDB
    resume.extractedText = extractedText;
    await resume.save();

    return res.status(200).json({
      success: true,
      message: "Resume text extracted successfully",
      extractedTextLength: extractedText.length,
    });
  } catch (error) {
    console.error("Extract Resume Text Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during text extraction",
    });
  }
};

// ─────────────────────────────────────────
// @desc    Analyze a resume with Groq AI (ATS report)
// @route   POST /api/resumes/:id/analyze
// @access  Private (requires JWT)
// ─────────────────────────────────────────
const analyzeResumeWithAI = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user;

    // ── 1. Find resume ──────────────────────
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // ── 2. Ownership check ──────────────────
    if (resume.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: This resume does not belong to you",
      });
    }

    // ── 2.5. Check if analysis already exists ──
    const existingReport = await AnalysisReport.findOne({ resumeId: resume._id, userId });
    if (existingReport) {
      console.log(`[analyzeResumeWithAI] Returning cached report for resume ${resumeId}`);
      return res.status(200).json({
        success: true,
        message: "Analysis already exists",
        report: existingReport,
        cached: true,
      });
    }

    // ── 3. Ensure extracted text exists ─────
    const resumeText = resume.extractedText && resume.extractedText.trim();
    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message:
          "No extracted text found. Please run text extraction before analyzing.",
      });
    }

    // ── 4. Build ATS prompt ─────────────────
    const prompt = `You MUST return ONLY valid JSON. Do NOT add explanations. Do NOT add text before or after the JSON. If you cannot comply, return an empty JSON object {}.

You are an ATS (Applicant Tracking System) expert. Analyze the resume below and return ONLY a single valid JSON object in exactly this format:

{
  "atsScore": <number 0-100>,
  "missingKeywords": [<string>, ...],
  "detectedSkills": [<string>, ...],
  "skillGapAnalysis": [
    { "skill": <string>, "recommendation": <string> }
  ],
  "suggestions": [<string>, ...],
  "strengths": [<string>, ...],
  "weaknesses": [<string>, ...],
  "experienceLevelDetected": <string>
}

Rules:
- Return ONLY the JSON object above. No markdown. No code fences. No explanation.
- Every field is required. Use empty arrays [] if a field has no values.
- atsScore must be a plain number, not a string.

Resume:
${resumeText}`;

    // ── 5. Call Groq AI ────────────────────
    let parsedData;

    try {
      const text = await generateAIContent(prompt);

      if (!text) {
        throw new Error("Empty response from AI");
      }

      console.log("AI RAW Response:", text);

      // ── JSON safety layer ───────────────────
      // 1. Strip markdown code fences if present
      let cleanText = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      // 2. Extract the outermost JSON object via regex
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.error("AI response contained no JSON object:", cleanText);
        throw new Error("No valid JSON object found in AI response");
      }

      // 3. Safe parse — never crash the server
      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error("JSON.parse failed on AI output:", jsonMatch[0]);
        throw new Error("AI returned malformed JSON");
      }

    } catch (aiErr) {
      // Categorize axios / API errors precisely
      const httpStatus = aiErr.response?.status;

      console.error(
        `Groq AI error [HTTP ${httpStatus ?? "N/A"}]:`,
        aiErr.message
      );

      if (httpStatus === 429) {
        return res.status(503).json({
          success: false,
          message: "AI service rate limit reached. Please try again later.",
        });
      }

      if (aiErr.code === "ECONNABORTED" || httpStatus === 504) {
        return res.status(504).json({
          success: false,
          message: "AI service timed out. Please try again.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to get a valid response from AI. Please try again.",
      });
    }

    // ── 6. Save AnalysisReport to MongoDB ───
    const report = await AnalysisReport.create({
      userId,
      resumeId,
      atsScore: parsedData.atsScore,
      missingKeywords: parsedData.missingKeywords || [],
      detectedSkills: parsedData.detectedSkills || [],
      skillGapAnalysis: parsedData.skillGapAnalysis || [],
      suggestions: parsedData.suggestions || [],
      strengths: parsedData.strengths || [],
      weaknesses: parsedData.weaknesses || [],
      experienceLevelDetected: parsedData.experienceLevelDetected || "",
      // Optional: derive keyword match % from atsScore if not returned by AI
      keywordMatchPercentage: parsedData.keywordMatchPercentage ?? null,
    });

    return res.status(201).json({
      success: true,
      message: "Resume analyzed successfully",
      report,
    });
  } catch (error) {
    console.error("Analyze Resume Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during resume analysis",
    });
  }
};

// ─────────────────────────────────────────
// @desc    Match a resume against a Job Description using Groq AI
// @route   POST /api/resumes/:id/match-job
// @access  Private (requires JWT)
// Runs AI ONLY if no saved match exists for this resume + job description.
// Pass { forceReAnalyze: true } in the body to overwrite existing result.
// ─────────────────────────────────────────
const matchResumeWithJobDescription = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId   = req.user;
    const { jobDescription, forceReAnalyze } = req.body;

    // ── 1. Validate job description ────────
    if (!jobDescription || !jobDescription.trim()) {
      return res.status(400).json({
        success: false,
        message: "Job description is required in the request body.",
      });
    }

    // ── 2. Find resume ─────────────────────
    const resume = await Resume.findById(resumeId);

    if (!resume) {
      return res.status(404).json({
        success: false,
        message: "Resume not found",
      });
    }

    // ── 3. Ownership check ─────────────────
    if (resume.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized: This resume does not belong to you",
      });
    }

    // ── 4. Check for existing job match (skip AI if match already saved) ───
    if (!forceReAnalyze) {
      const existingReport = await AnalysisReport.findOne({
        resumeId: resume._id,
        userId,
        "jobMatchAnalysis.jobDescription": jobDescription.trim(),
      });

      if (existingReport && existingReport.jobMatchAnalysis) {
        console.log(`[matchResumeWithJobDescription] Returning cached job match for resume ${resumeId}`);
        return res.status(200).json({
          success: true,
          message: "Job match already exists",
          jobMatchAnalysis: existingReport.jobMatchAnalysis,
          cached: true,
        });
      }
    }

    // ── 5. Ensure extracted text exists ────
    const resumeText = resume.extractedText && resume.extractedText.trim();
    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: "No extracted text found. Please run text extraction before matching.",
      });
    }

    // ── 6. Build Job Match prompt ──────────
    const prompt = `You MUST return ONLY valid JSON. Do NOT add explanations. Do NOT add text before or after the JSON. If you cannot comply, return an empty JSON object {}.

You are an ATS (Applicant Tracking System) expert. Compare the resume below against the provided job description and return ONLY a single valid JSON object in exactly this format:

{
  "matchScore": <number 0-100>,
  "matchingSkills": [<string>, ...],
  "missingSkillsForJob": [<string>, ...],
  "keywordMatchPercentage": <number 0-100>,
  "improvementSuggestions": [<string>, ...],
  "overallFeedback": <string>
}

Rules:
- Return ONLY the JSON object above. No markdown. No code fences. No explanation.
- Every field is required. Use empty arrays [] if a field has no values.
- matchScore and keywordMatchPercentage must be plain numbers, not strings.

Resume:
${resumeText}

Job Description:
${jobDescription.trim()}`;

    // ── 7. Call Groq AI ────────────────────
    let parsedData;

    try {
      const text = await generateAIContent(prompt);

      if (!text) {
        throw new Error("Empty response from AI");
      }

      console.log("Job Match AI RAW Response:", text);

      // ── JSON safety layer ─────────────────
      let cleanText = text
        .replace(/```json/gi, "")
        .replace(/```/g, "")
        .trim();

      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);

      if (!jsonMatch) {
        console.error("Job match AI response contained no JSON:", cleanText);
        throw new Error("No valid JSON object found in AI response");
      }

      try {
        parsedData = JSON.parse(jsonMatch[0]);
      } catch (parseErr) {
        console.error("JSON.parse failed on job match AI output:", jsonMatch[0]);
        throw new Error("AI returned malformed JSON");
      }

    } catch (aiErr) {
      const httpStatus = aiErr.response?.status;

      console.error(
        `Groq AI Job Match error [HTTP ${httpStatus ?? "N/A"}]:`,
        aiErr.message
      );

      if (httpStatus === 429) {
        return res.status(503).json({
          success: false,
          message: "AI service rate limit reached. Please try again later.",
        });
      }

      if (aiErr.code === "ECONNABORTED" || httpStatus === 504) {
        return res.status(504).json({
          success: false,
          message: "AI service timed out. Please try again.",
        });
      }

      return res.status(500).json({
        success: false,
        message: "Failed to get a valid response from AI. Please try again.",
      });
    }

    // ── 8. Save / overwrite job match result in MongoDB ────────────────────
    const jobMatchPayload = {
      jobDescription:         jobDescription.trim(),
      matchScore:             parsedData.matchScore             ?? 0,
      matchingSkills:         parsedData.matchingSkills         || [],
      missingSkillsForJob:    parsedData.missingSkillsForJob    || [],
      keywordMatchPercentage: parsedData.keywordMatchPercentage ?? null,
      improvementSuggestions: parsedData.improvementSuggestions || [],
      overallFeedback:        parsedData.overallFeedback        || "",
    };

    let report = await AnalysisReport.findOneAndUpdate(
      { resumeId, userId },
      { $set: { jobMatchAnalysis: jobMatchPayload } },
      { new: true, sort: { createdAt: -1 } }
    );

    if (!report) {
      report = await AnalysisReport.create({
        userId,
        resumeId,
        jobMatchAnalysis: jobMatchPayload,
      });
    }

    return res.status(200).json({
      success: true,
      message: forceReAnalyze ? "Job match re-analyzed and saved" : "Job match analysis completed",
      jobMatchAnalysis: report.jobMatchAnalysis,
      cached: false,
    });

  } catch (error) {
    console.error("Match Resume With JD Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during job match analysis",
    });
  }
};

// ─────────────────────────────────────────
// @desc    Get saved job match analysis for a resume
// @route   GET /api/resumes/:id/job-match
// @access  Private (requires JWT)
// ─────────────────────────────────────────
const getJobMatch = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId   = req.user;

    // Verify resume exists and belongs to the user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }
    if (resume.userId.toString() !== userId.toString()) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const report = await AnalysisReport.findOne({ resumeId, userId });

    if (!report || !report.jobMatchAnalysis) {
      return res.status(404).json({
        success: false,
        message: "No job match analysis found for this resume",
      });
    }

    return res.status(200).json({
      success: true,
      jobMatchAnalysis: report.jobMatchAnalysis,
    });
  } catch (error) {
    console.error("Get Job Match Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching job match" });
  }
};

// ─────────────────────────────────────────
// @desc    Get saved analysis report for a resume
// @route   GET /api/resumes/:id/report
// @access  Private (requires JWT)
// ─────────────────────────────────────────
const getResumeReport = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user;

    // Verify resume exists and belongs to the user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }
    if (resume.userId.toString() !== userId.toString()) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const report = await AnalysisReport.findOne({ resumeId, userId });
    if (!report) {
      return res.status(404).json({ success: false, message: "No analysis report found for this resume" });
    }

    return res.status(200).json({ success: true, report });
  } catch (error) {
    console.error("Get Resume Report Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching report" });
  }
};

// ─────────────────────────────────────────
// @desc    Delete analysis report (triggers re-analyze on next call)
// @route   DELETE /api/resumes/:id/report
// @access  Private (requires JWT)
// ─────────────────────────────────────────
const deleteResumeReport = async (req, res) => {
  try {
    const resumeId = req.params.id;
    const userId = req.user;

    // Verify resume exists and belongs to the user
    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }
    if (resume.userId.toString() !== userId.toString()) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }

    const deleted = await AnalysisReport.findOneAndDelete({ resumeId, userId });
    if (!deleted) {
      return res.status(404).json({ success: false, message: "No report found to delete" });
    }

    return res.status(200).json({ success: true, message: "Report deleted. You can now re-analyze." });
  } catch (error) {
    console.error("Delete Resume Report Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error deleting report" });
  }
};

module.exports = { uploadResume, getResumes, extractResumeText, analyzeResumeWithAI, matchResumeWithJobDescription, getJobMatch, getResumeReport, deleteResumeReport };
