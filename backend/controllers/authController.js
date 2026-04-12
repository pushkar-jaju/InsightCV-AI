const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const { OAuth2Client } = require("google-auth-library");
const User = require("../models/User");

const googleClient = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ─────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────

/** Validate password strength — returns an error string or null */
const validatePassword = (password) => {
  if (!password || password.length < 8)
    return "Password must be at least 8 characters";
  if (!/[A-Z]/.test(password))
    return "Password must contain at least one uppercase letter";
  if (!/[a-z]/.test(password))
    return "Password must contain at least one lowercase letter";
  if (!/[0-9]/.test(password))
    return "Password must contain at least one number";
  if (!/[^A-Za-z0-9]/.test(password))
    return "Password must contain at least one special character";
  return null;
};

/** Sign a short-lived access token (15 minutes) */
const signAccessToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_SECRET, { expiresIn: "15m" });

/** Sign a long-lived refresh token (7 days) */
const signRefreshToken = (userId) =>
  jwt.sign({ id: userId }, process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh", {
    expiresIn: "7d",
  });

// ─────────────────────────────────────────
// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
// ─────────────────────────────────────────
const register = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide name, email, and password",
      });
    }

    // Validate password strength
    const pwError = validatePassword(password);
    if (pwError) {
      return res.status(400).json({ success: false, message: pwError });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "An account with this email already exists",
      });
    }

    // Hash password (salt rounds = 12)
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create new user
    await User.create({ name, email, password: hashedPassword });

    return res.status(201).json({
      success: true,
      message: "Account created successfully. Please sign in.",
    });
  } catch (error) {
    console.error("Register Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during registration",
    });
  }
};

// ─────────────────────────────────────────
// @desc    Login user — returns access + refresh token
// @route   POST /api/auth/login
// @access  Public
// ─────────────────────────────────────────
const login = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Guard: user registered via Google — they have no password
    if (user.provider === "google" || !user.password) {
      return res.status(401).json({
        success: false,
        message: "This account was created with Google. Please sign in with Google.",
      });
    }

    const isPasswordMatch = await bcrypt.compare(password, user.password);
    if (!isPasswordMatch) {
      return res.status(401).json({
        success: false,
        message: "Invalid email or password",
      });
    }

    // Generate tokens
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    // Persist refresh token on user document
    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      token: accessToken,        // kept as "token" for backward compat with existing frontend
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Login Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// ─────────────────────────────────────────
// @desc    Refresh access token using refresh token
// @route   POST /api/auth/refresh-token
// @access  Public
// ─────────────────────────────────────────
const refreshToken = async (req, res) => {
  try {
    const { refreshToken: token } = req.body;

    if (!token) {
      return res.status(401).json({ success: false, message: "Refresh token required" });
    }

    // Verify token signature
    let decoded;
    try {
      decoded = jwt.verify(
        token,
        process.env.JWT_REFRESH_SECRET || process.env.JWT_SECRET + "_refresh"
      );
    } catch {
      return res.status(401).json({ success: false, message: "Invalid or expired refresh token" });
    }

    // Ensure token matches what's stored on the user (rotation check)
    const user = await User.findById(decoded.id);
    if (!user || user.refreshToken !== token) {
      return res.status(401).json({ success: false, message: "Refresh token has been revoked" });
    }

    // Issue new token pair (rotation)
    const newAccessToken = signAccessToken(user._id);
    const newRefreshToken = signRefreshToken(user._id);

    user.refreshToken = newRefreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      token: newAccessToken,
      accessToken: newAccessToken,
      refreshToken: newRefreshToken,
    });
  } catch (error) {
    console.error("RefreshToken Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during token refresh" });
  }
};

// ─────────────────────────────────────────
// @desc    Logout — revoke refresh token
// @route   POST /api/auth/logout
// @access  Private
// ─────────────────────────────────────────
const logout = async (req, res) => {
  try {
    const user = await User.findById(req.user);
    if (user) {
      user.refreshToken = null;
      await user.save();
    }
    return res.status(200).json({ success: true, message: "Logged out successfully" });
  } catch (error) {
    return res.status(500).json({ success: false, message: "Server error during logout" });
  }
};

// ─────────────────────────────────────────
// @desc    Get logged-in user profile
// @route   GET /api/auth/me
// @access  Private
// ─────────────────────────────────────────
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user).select("-password -refreshToken").lean();
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    return res.status(200).json({
      success: true,
      user: { name: user.name, email: user.email, createdAt: user.createdAt },
    });
  } catch (error) {
    console.error("GetMe Error:", error.message);
    return res.status(500).json({
      success: false,
      message: "Server error while fetching profile",
    });
  }
};

// ─────────────────────────────────────────
// @desc    Google OAuth login / register
// @route   POST /api/auth/google
// @access  Public
// ─────────────────────────────────────────
const googleAuth = async (req, res) => {
  try {
    const { credential, accessToken: googleAccessToken } = req.body;

    if (!credential && !googleAccessToken) {
      return res.status(400).json({ success: false, message: "Google credential or access token is required" });
    }

    // ── Verify token with Google (never trust frontend-decoded data) ──
    let payload;
    
    if (credential) {
      try {
        const ticket = await googleClient.verifyIdToken({
          idToken: credential,
          audience: process.env.GOOGLE_CLIENT_ID,
        });
        payload = ticket.getPayload();
      } catch {
        return res.status(401).json({ success: false, message: "Invalid or expired Google token" });
      }
    } else if (googleAccessToken) {
      try {
        const axios = require("axios");
        const response = await axios.get("https://www.googleapis.com/oauth2/v3/userinfo", {
          headers: { Authorization: `Bearer ${googleAccessToken}` }
        });
        payload = response.data;
      } catch (err) {
        return res.status(401).json({ success: false, message: "Invalid or expired Google access token" });
      }
    }

    const { name, email, picture: avatar } = payload;

    if (!email) {
      return res.status(400).json({ success: false, message: "Google account has no email" });
    }

    // ── Find existing user or create a new one ──
    let user = await User.findOne({ email });

    if (!user) {
      // New user — registered via Google
      user = await User.create({
        name,
        email,
        avatar: avatar || null,
        provider: "google",
        // password intentionally omitted
      });
    } else if (user.provider === "local") {
      // Existing local-auth user signing in with Google
      // Merge: update avatar if missing, keep everything else intact
      if (!user.avatar && avatar) {
        user.avatar = avatar;
        await user.save();
      }
    }

    // ── Issue JWT pair (same helpers used by local login) ──
    const accessToken = signAccessToken(user._id);
    const refreshToken = signRefreshToken(user._id);

    user.refreshToken = refreshToken;
    await user.save();

    return res.status(200).json({
      success: true,
      token: accessToken,       // backward-compat alias
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        avatar: user.avatar,
        provider: user.provider,
      },
    });
  } catch (error) {
    console.error("GoogleAuth Error:", error.message);
    return res.status(500).json({ success: false, message: "Server error during Google authentication" });
  }
};

module.exports = { register, login, refreshToken, logout, getMe, googleAuth };
