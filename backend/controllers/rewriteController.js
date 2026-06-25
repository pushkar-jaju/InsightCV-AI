const Resume = require("../models/Resume");
const User = require("../models/User");
const ResumeRewrite = require("../models/ResumeRewrite");
const { generateAIContent } = require("../config/groq");

// @desc    Generate AI rewrite sections for a resume
// @route   POST /api/rewrites/generate
// @access  Private
const generateRewrite = async (req, res) => {
  try {
    const { resumeId } = req.body;
    const userId = req.user;

    if (!resumeId) {
      return res.status(400).json({ success: false, message: "Resume ID is required" });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    if (resume.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized resume access" });
    }

    // Check if rewrite already exists
    const existingRewrite = await ResumeRewrite.findOne({ resumeId, userId });
    if (existingRewrite) {
      return res.status(200).json({
        success: true,
        message: "Resume rewrite retrieved from cache",
        rewrite: existingRewrite,
        cached: true,
      });
    }

    const resumeText = resume.extractedText && resume.extractedText.trim();
    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: "No extracted text found. Please extract text from the resume first.",
      });
    }

    const prompt = `You MUST return ONLY valid JSON. Do NOT add explanations. Do NOT add text before or after the JSON. If you cannot comply, return an empty JSON object {}.

You are a professional resume writer and ATS optimizer. Segment the provided resume text into 5 standard sections: Professional Summary, Skills Section, Experience Section, Projects Section, and Education Section.
For each section:
1. Extract the "original" text block from the resume as-is.
2. Rewrite it into a premium "improved" version that is ATS-friendly, professional, uses strong action verbs, highlights achievements with metrics where relevant, and incorporates industry-relevant keywords.

Return ONLY a single valid JSON object in exactly this format:
{
  "summary": {
    "original": "<original summary text, or empty string if not found>",
    "improved": "<improved summary text>"
  },
  "skills": {
    "original": "<original skills list/text, or empty string if not found>",
    "improved": "<improved skills list/text>"
  },
  "experience": {
    "original": "<original experience text, or empty string if not found>",
    "improved": "<improved experience text>"
  },
  "projects": {
    "original": "<original projects text, or empty string if not found>",
    "improved": "<improved projects text>"
  },
  "education": {
    "original": "<original education text, or empty string if not found>",
    "improved": "<improved education text>"
  }
}

Rules:
- Return ONLY the JSON object. No markdown, no code fences.
- If a section does not exist in the resume, set "original" to "" and generate an appropriate "improved" section if appropriate, otherwise set "improved" to "".

Resume:
${resumeText}`;

    let parsedData;
    try {
      const text = await generateAIContent(prompt);
      let cleanText = text.replace(/```json/gi, "").replace(/```/g, "").trim();
      const jsonMatch = cleanText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error("No JSON found in response");
      }
      parsedData = JSON.parse(jsonMatch[0]);
    } catch (aiErr) {
      console.error("AI Resume Rewrite error:", aiErr.message);
      return res.status(500).json({
        success: false,
        message: "AI service failed to rewrite resume. Please try again.",
      });
    }

    const rewrite = await ResumeRewrite.create({
      userId,
      resumeId,
      originalSections: {
        summary: parsedData.summary?.original || "",
        skills: parsedData.skills?.original || "",
        experience: parsedData.experience?.original || "",
        projects: parsedData.projects?.original || "",
        education: parsedData.education?.original || "",
      },
      improvedSections: {
        summary: parsedData.summary?.improved || "",
        skills: parsedData.skills?.improved || "",
        experience: parsedData.experience?.improved || "",
        projects: parsedData.projects?.improved || "",
        education: parsedData.education?.improved || "",
      },
    });

    return res.status(201).json({
      success: true,
      message: "Resume rewrite generated successfully",
      rewrite,
      cached: false,
    });
  } catch (error) {
    console.error("Rewrite Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during resume rewrite" });
  }
};

// @desc    Get rewrite history for a resume
// @route   GET /api/rewrites/history/:resumeId
// @access  Private
const getRewriteHistory = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user;

    const rewrite = await ResumeRewrite.findOne({ resumeId, userId });
    if (!rewrite) {
      return res.status(404).json({ success: false, message: "No rewrite history found for this resume" });
    }

    return res.status(200).json({ success: true, rewrite });
  } catch (error) {
    console.error("Get Rewrite History Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching rewrite history" });
  }
};

// @desc    Save improved rewrite as a new resume version
// @route   POST /api/rewrites/save-version
// @access  Private
const saveRewriteAsVersion = async (req, res) => {
  try {
    const { resumeId, sections } = req.body;
    const userId = req.user;

    if (!resumeId || !sections) {
      return res.status(400).json({ success: false, message: "Resume ID and sections are required" });
    }

    const originalResume = await Resume.findById(resumeId);
    if (!originalResume) {
      return res.status(404).json({ success: false, message: "Original resume not found" });
    }

    if (originalResume.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized resume access" });
    }

    const { summary, skills, experience, projects, education } = sections;

    // Structure the concatenated content in a professional, readable layout
    const newExtractedText = `
# PROFESSIONAL SUMMARY
${summary || ""}

# TECHNICAL SKILLS
${skills || ""}

# PROFESSIONAL EXPERIENCE
${experience || ""}

# ACADEMIC PROJECTS
${projects || ""}

# EDUCATION
${education || ""}
`.trim();

    // Create a new resume version in MongoDB
    const improvedResume = await Resume.create({
      userId,
      originalFileName: `Improved_${originalResume.originalFileName || "Resume"}.txt`,
      fileUrl: `improved_${Date.now()}.txt`,
      extractedText: newExtractedText,
      fileSize: Buffer.byteLength(newExtractedText),
      fileType: "text/plain",
      uploadDate: new Date(),
    });

    // Update rewrite record to link to improvedResumeId if desired
    await ResumeRewrite.findOneAndUpdate(
      { resumeId, userId },
      { $set: { improvedResumeId: improvedResume._id } }
    );

    // Increment user total uploads
    await User.findByIdAndUpdate(userId, { $inc: { totalResumesUploaded: 1 } });

    return res.status(201).json({
      success: true,
      message: "Improved resume saved as a new version successfully",
      resume: improvedResume,
    });
  } catch (error) {
    console.error("Save Rewrite Version Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error saving improved version" });
  }
};

module.exports = {
  generateRewrite,
  getRewriteHistory,
  saveRewriteAsVersion,
};
