const Resume = require("../models/Resume");
const InterviewPrep = require("../models/InterviewPrep");
const { generateAIContent } = require("../config/groq");

// @desc    Generate interview questions based on resume content
// @route   POST /api/interviews/generate
// @access  Private
const generateInterviewQuestions = async (req, res) => {
  try {
    const { resumeId, difficulty, forceReGenerate } = req.body;
    const userId = req.user;

    if (!resumeId || !difficulty) {
      return res.status(400).json({ success: false, message: "Resume ID and difficulty level are required" });
    }

    const validDifficulties = ["beginner", "intermediate", "advanced"];
    if (!validDifficulties.includes(difficulty.toLowerCase())) {
      return res.status(400).json({ success: false, message: "Invalid difficulty level" });
    }

    const resume = await Resume.findById(resumeId);
    if (!resume) {
      return res.status(404).json({ success: false, message: "Resume not found" });
    }

    if (resume.userId.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Unauthorized resume access" });
    }

    // Check for cached questions
    if (!forceReGenerate) {
      const cachedPrep = await InterviewPrep.findOne({
        resumeId,
        userId,
        difficulty: difficulty.toLowerCase(),
      });

      if (cachedPrep) {
        return res.status(200).json({
          success: true,
          message: "Interview questions loaded from cache",
          prep: cachedPrep,
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

You are an expert technical recruiter and interviewer. Analyze the resume below and generate exactly 10 to 15 personalized interview questions and their model sample answers at the following difficulty level: "${difficulty.toUpperCase()}".

Structure the questions into exactly 4 categories:
1. "technical": Questions based on technologies, programming languages, libraries, and coding practices detected on the resume (e.g., Java, React, Node.js, MongoDB, DSA, etc.).
2. "project": Questions specifically targeting the projects mentioned on the resume, testing execution details, architecture, and choices.
3. "hr": Behavioral and general HR questions (e.g., 'Tell me about yourself', 'Strengths and weaknesses', 'Why should we hire you?').
4. "scenario": System design, architectural, and real-world scenario questions (e.g., 'How would you optimize a slow API?', 'How would you scale an application?').

Return ONLY a single valid JSON object in exactly this format:
{
  "technical": [
    { "question": "<question string>", "answer": "<model answer string>" },
    ...
  ],
  "project": [
    { "question": "<question string>", "answer": "<model answer string>" },
    ...
  ],
  "hr": [
    { "question": "<question string>", "answer": "<model answer string>" },
    ...
  ],
  "scenario": [
    { "question": "<question string>", "answer": "<model answer string>" },
    ...
  ]
}

Rules:
- Return ONLY the JSON object. No markdown, no code fences.
- Generate exactly 10 to 15 questions per category.
- Tailor questions specifically to the candidate's actual projects, skills, and experience level from the resume text.

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
      console.error("AI Interview Questions error:", aiErr.message);
      return res.status(500).json({
        success: false,
        message: "AI service failed to generate questions. Please try again.",
      });
    }

    // Save/update MongoDB
    const prep = await InterviewPrep.findOneAndUpdate(
      { resumeId, userId, difficulty: difficulty.toLowerCase() },
      {
        $set: {
          categories: {
            technical: parsedData.technical || [],
            project: parsedData.project || [],
            hr: parsedData.hr || [],
            scenario: parsedData.scenario || [],
          },
        },
      },
      { returnDocument: 'after', upsert: true }
    );

    return res.status(200).json({
      success: true,
      message: "Interview questions generated successfully",
      prep,
      cached: false,
    });
  } catch (error) {
    console.error("Interview Controller Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during question generation" });
  }
};

// @desc    Get generated interview questions for a resume
// @route   GET /api/interviews/resume/:resumeId
// @access  Private
const getInterviewPrepByResume = async (req, res) => {
  try {
    const { resumeId } = req.params;
    const userId = req.user;

    const preps = await InterviewPrep.find({ resumeId, userId });
    return res.status(200).json({ success: true, preps });
  } catch (error) {
    console.error("Get Interview Prep Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching interview preps" });
  }
};

module.exports = {
  generateInterviewQuestions,
  getInterviewPrepByResume,
};
