const express = require("express");
const router = express.Router();
const authMiddleware = require("../middleware/authMiddleware");
const {
  getChatSessions,
  createChatSession,
  getChatMessages,
  sendMessage,
  deleteChatSession,
} = require("../controllers/chatController");

router.get("/sessions", authMiddleware, getChatSessions);
router.post("/sessions", authMiddleware, createChatSession);
router.get("/sessions/:sessionId/messages", authMiddleware, getChatMessages);
router.post("/sessions/:sessionId/messages", authMiddleware, sendMessage);
router.delete("/sessions/:sessionId", authMiddleware, deleteChatSession);

module.exports = router;
