const ChatSession = require("../models/ChatSession");
const ChatMessage = require("../models/ChatMessage");
const Resume = require("../models/Resume");
const AnalysisReport = require("../models/AnalysisReport");
const { generateAIChatResponse } = require("../config/groq");

// @desc    Get all chat sessions for the user
// @route   GET /api/chats/sessions
// @access  Private
const getChatSessions = async (req, res) => {
  try {
    const userId = req.user;
    const sessions = await ChatSession.find({ userId }).sort({ updatedAt: -1 });
    return res.status(200).json({ success: true, sessions });
  } catch (error) {
    console.error("Get Chat Sessions Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching sessions" });
  }
};

// @desc    Create a new chat session
// @route   POST /api/chats/sessions
// @access  Private
const createChatSession = async (req, res) => {
  try {
    const userId = req.user;
    const { title, resumeId } = req.body;

    const session = await ChatSession.create({
      userId,
      title: title || "New Conversation",
      resumeId: resumeId || null,
    });

    return res.status(201).json({ success: true, session });
  } catch (error) {
    console.error("Create Chat Session Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error creating session" });
  }
};

// @desc    Get messages for a session
// @route   GET /api/chats/sessions/:sessionId/messages
// @access  Private
const getChatMessages = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user;

    // Verify session belongs to user
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    const messages = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 });
    return res.status(200).json({ success: true, messages });
  } catch (error) {
    console.error("Get Chat Messages Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error fetching messages" });
  }
};

// @desc    Send a message and get AI response
// @route   POST /api/chats/sessions/:sessionId/messages
// @access  Private
const sendMessage = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { text } = req.body;
    const userId = req.user;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Message text is required" });
    }

    // Verify session
    const session = await ChatSession.findOne({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    // Save user message
    const userMsg = await ChatMessage.create({
      sessionId,
      sender: "user",
      text: text.trim(),
    });

    // Fetch message history for context
    const history = await ChatMessage.find({ sessionId }).sort({ createdAt: 1 }).limit(15);

    // Context aggregation
    let resumeDetails = "";
    if (session.resumeId) {
      const resume = await Resume.findById(session.resumeId);
      const report = await AnalysisReport.findOne({ resumeId: session.resumeId, userId });

      if (resume) {
        resumeDetails += `Candidate Resume Name: "${resume.originalFileName}". `;
        if (report) {
          resumeDetails += `ATS Score: ${report.atsScore || "N/A"}/100. `;
          resumeDetails += `Detected Skills: ${report.detectedSkills?.join(", ") || "None"}. `;
          resumeDetails += `Missing Keywords: ${report.missingKeywords?.join(", ") || "None"}. `;
          resumeDetails += `Detected Experience Level: ${report.experienceLevelDetected || "N/A"}. `;
        }
      }
    }

    // Prepare messages array for Groq AI
    const systemPrompt = `You are a professional AI Career Coach and Mentor. Your goal is to guide the student or professional on placements, skill upgrades, resume optimization, and interview preparation.
Keep your responses friendly, encouraging, structured (use bullet points/markdown where appropriate), and highly actionable. Avoid long paragraphs; instead, use bullet points, bold text, and numbered lists to make advice easy to read.

${resumeDetails ? `Here is the candidate's resume context to personalize your advice:\n${resumeDetails}\n` : ""}
If the user asks suggestions like "Improve my resume", "Prepare me for Java interviews", "Suggest projects for MCA students", or "How can I get placed at Amazon?", tailor your response using the resume context (if available).`;

    const apiMessages = [
      { role: "system", content: systemPrompt },
      ...history.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        content: m.text,
      })),
    ];

    let aiReply;
    try {
      aiReply = await generateAIChatResponse(apiMessages);
    } catch (aiErr) {
      console.error("Chat AI error:", aiErr.message);
      aiReply = "I am having trouble connecting to my AI core right now. Please try again in a moment.";
    }

    // Save assistant message
    const assistantMsg = await ChatMessage.create({
      sessionId,
      sender: "assistant",
      text: aiReply,
    });

    // Update session timestamp so it floats to the top of list
    await ChatSession.findByIdAndUpdate(sessionId, { updatedAt: new Date() });

    return res.status(201).json({
      success: true,
      userMessage: userMsg,
      assistantMessage: assistantMsg,
    });
  } catch (error) {
    console.error("Send Message Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during chat transmission" });
  }
};

// @desc    Delete a chat session
// @route   DELETE /api/chats/sessions/:sessionId
// @access  Private
const deleteChatSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const userId = req.user;

    const session = await ChatSession.findOneAndDelete({ _id: sessionId, userId });
    if (!session) {
      return res.status(404).json({ success: false, message: "Chat session not found" });
    }

    // Delete associated messages
    await ChatMessage.deleteMany({ sessionId });

    return res.status(200).json({ success: true, message: "Chat session deleted successfully" });
  } catch (error) {
    console.error("Delete Chat Session Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error deleting chat session" });
  }
};

module.exports = {
  getChatSessions,
  createChatSession,
  getChatMessages,
  sendMessage,
  deleteChatSession,
};
