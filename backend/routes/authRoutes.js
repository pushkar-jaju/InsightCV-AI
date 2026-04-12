const express = require("express");
const router = express.Router();
const { register, login, refreshToken, logout, getMe, googleAuth } = require("../controllers/authController");
const authMiddleware = require("../middleware/authMiddleware");

// POST /api/auth/register
router.post("/register", register);

// POST /api/auth/login
router.post("/login", login);

// POST /api/auth/google  (Google OAuth — no middleware, public)
router.post("/google", googleAuth);

// POST /api/auth/refresh-token  (public — uses refresh token to issue new access token)
router.post("/refresh-token", refreshToken);

// POST /api/auth/logout  (private — revokes refresh token)
router.post("/logout", authMiddleware, logout);

// GET /api/auth/me
router.get("/me", authMiddleware, getMe);

module.exports = router;
