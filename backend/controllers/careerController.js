const Resume = require("../models/Resume");
const CareerGuidance = require("../models/CareerGuidance");
const { generateAIContent } = require("../config/groq");

// @desc    Generate career guidance (roadmap, skill gap, readiness scores, recommendations)
// @route   POST /api/career/guidance
// @access  Private
const generateCareerGuidance = async (req, res) => {
  try {
    const { resumeId, careerGoal, force } = req.body;
    const userId = req.user;

    if (!resumeId || !careerGoal) {
      return res.status(400).json({ success: false, message: "Resume ID and career goal are required" });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    if (resume.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized resume access" });
    }

    // Check for cached career guidance
    if (!force) {
      const cachedGuidance = await CareerGuidance.findOne({
        resumeId,
        userId,
        careerGoal: { $regex: new RegExp(`^${careerGoal.trim()}$`, "i") },
      });

      if (cachedGuidance) {
        return res.status(200).json({
          success: true,
          message: "Career guidance loaded from cache",
          guidance: cachedGuidance,
          cached: true,
        });
      }
    }

    const resumeText = resume.extractedText && resume.extractedText.trim();
    if (!resumeText) {
      return res.status(400).json({
        success: false,
        message: "No extracted text found. Please extract text from the resume first.",
      });
    }

    const prompt = `You MUST return ONLY valid JSON. Do NOT add explanations. Do NOT add text before or after the JSON. If you cannot comply, return an empty JSON object {}.

You are an expert career coach and IT placement advisor. Analyze the candidate's resume below and generate custom career guidance to help them achieve their career goal: "${careerGoal.trim()}".

Return ONLY a single valid JSON object in exactly this format:
{
  "roadmap": [
    {
      "step": "<step title, e.g., Master Spring Boot & APIs>",
      "description": "<short actionable instruction>",
      "technologies": ["<tech 1>", "<tech 2>", ...]
    },
    ...
  ],
  "skillGap": {
    "current": ["<skill 1 from resume>", "<skill 2 from resume>", ...],
    "missing": ["<missing skill 1 required for the goal>", "<missing skill 2>", ...]
  },
  "readiness": {
    "technical": <number 0-100 indicating tech skill readiness for goal>,
    "resume": <number 0-100 indicating resume strength/formatting readiness>,
    "interview": <number 0-100 indicating interview and communication readiness>,
    "overall": <number 0-100 indicating overall industry readiness>
  },
  "learningRecommendations": {
    "technologies": [
      { "name": "<tech name>", "reason": "<why they must learn this>" },
      ...
    ],
    "certifications": ["<industry certification 1>", "<industry certification 2>", ...],
    "projects": [
      {
        "title": "<portfolio project title>",
        "description": "<brief description of a project they can build>",
        "techStack": ["<tech 1>", "<tech 2>", ...]
      },
      ...
    ],
    "practiceAreas": ["<practice area, e.g., System Design, LeetCode Trees, Mock Interviews>", ...]
  }
}

Rules:
- Return ONLY the JSON object. No markdown, no code fences.
- Keep recommendations highly specific to the career goal and their current profile.
- Provide 5 to 7 sequential steps in the roadmap.
- Keep scores realistic, based on how well the resume matches the career goal.

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
      console.error("AI Career Guidance error:", aiErr.message);
      return res.status(500).json({
        success: false,
        message: "AI service failed to generate career guidance. Please try again.",
      });
    }

    // Save/update MongoDB
    const guidance = await CareerGuidance.findOneAndUpdate(
      {
        resumeId,
        userId,
        careerGoal: careerGoal.trim(),
      },
      {
        $set: {
          roadmap: parsedData.roadmap || [],
          skillGap: {
            current: parsedData.skillGap?.current || [],
            missing: parsedData.skillGap?.missing || [],
          },
          readiness: {
            technical: parsedData.readiness?.technical || 0,
            resume: parsedData.readiness?.resume || 0,
            interview: parsedData.readiness?.interview || 0,
            overall: parsedData.readiness?.overall || 0,
          },
          learningRecommendations: {
            technologies: parsedData.learningRecommendations?.technologies || [],
            certifications: parsedData.learningRecommendations?.certifications || [],
            projects: parsedData.learningRecommendations?.projects || [],
            practiceAreas: parsedData.learningRecommendations?.practiceAreas || [],
          },
        },
      },
      { returnDocument: 'after', upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Career guidance generated successfully",
      guidance,
      cached: false,
    });
  } catch (error) {
    console.error("Career Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during career guidance generation" });
  }
};

// @desc    Get saved career guidance for a resume
// @route   GET /api/career/guidance/:resumeId
// @access  Private
const getCareerGuidanceByResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user;

    const guidances = await CareerGuidance.find({ resumeId, userId }).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, guidances });
  } catch (error) {
    console.error("Get Career Guidance Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching career guidance" });
  }
};

module.exports = {
  generateCareerGuidance,
  getCareerGuidanceByResume,
};
