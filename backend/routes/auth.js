const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { pool } = require("../db");
const { generateAccessToken, generateRefreshToken } = require("../utils/jwt");
const { authMiddleware, adminMiddleware } = require('../middleware/auth');

// Helper: Generate session token
const generateSessionToken = () => {
  return require('crypto').randomBytes(32).toString('hex');
};

// ==================== REGISTER ====================
router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    // Validation
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    // Check if user exists
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert user into DB (using correct column names: name, password_hash)
    const [result] = await pool.query(
      "INSERT INTO users (name, email, password_hash, role, is_verified) VALUES (?, ?, ?, 'user', false)",
      [fullName, email, hashedPassword]
    );

    res.status(201).json({ 
      success: true,
      message: "Registration successful! Please login." 
    });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error during registration" });
  }
});

// ==================== LOGIN ====================
// ------------------ LOGIN ------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    console.log("Login attempt for:", email); // DEBUG

    // Validation
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    // Find user by email (using correct column names)
    const [users] = await pool.query(
      "SELECT id, name, email, password_hash, role, profile_picture, is_verified FROM users WHERE email = ?",
      [email]
    );

    console.log("User found:", users.length > 0); // DEBUG

    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    console.log("User role:", user.role); // DEBUG

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    console.log("Password match:", isMatch); // DEBUG

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last_login
    await pool.query(
      "UPDATE users SET last_login = NOW() WHERE id = ?",
      [user.id]
    );

    // Send response with tokens and user data
    res.json({
      success: true,
      message: "Login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profile_picture,
        isVerified: user.is_verified
      }
    });

  } catch (err) {
    console.error("Login error:", err); // DEBUG - LOOK HERE FOR ERROR
    res.status(500).json({ error: "Server error during login" });
  }
});

// ==================== GOOGLE LOGIN ====================
router.post("/google-login", async (req, res) => {
  const { name, email, googleId, profilePicture } = req.body;

  try {
    // Check if user exists
    let [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    
    let user;
    
    if (users.length === 0) {
      // Create new user for Google login
      const [result] = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, profile_picture, is_verified) 
         VALUES (?, ?, ?, 'user', ?, true)`,
        [name, email, googleId, profilePicture] // Use googleId as password_hash placeholder
      );
      
      user = {
        id: result.insertId,
        name,
        email,
        role: 'user',
        profile_picture: profilePicture,
        is_verified: true
      };
    } else {
      user = users[0];
    }

    // Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // Update last_login
    await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

    // Log activity
    await pool.query(
      `INSERT INTO user_activity_logs (user_id, activity_type, activity_data) 
       VALUES (?, 'login', ?)`,
      [user.id, JSON.stringify({ method: 'google' })]
    );

    res.json({
      success: true,
      message: "Google login successful",
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        profilePicture: user.profile_picture,
        isVerified: user.is_verified
      }
    });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(500).json({ error: "Server error during Google login" });
  }
});

// ==================== LOGOUT ====================
router.post("/logout", authMiddleware, async (req, res) => {
  try {
    const userId = req.user.id;
    
    // Deactivate all user sessions
    await pool.query(
      "UPDATE user_sessions SET is_active = false WHERE user_id = ?",
      [userId]
    );

    // Log activity
    await pool.query(
      `INSERT INTO user_activity_logs (user_id, activity_type, activity_data) 
       VALUES (?, 'logout', ?)`,
      [userId, JSON.stringify({ timestamp: new Date() })]
    );

    res.json({ success: true, message: "Logout successful" });
  } catch (err) {
    console.error("Logout error:", err);
    res.status(500).json({ error: "Server error during logout" });
  }
});

// ==================== VERIFY TOKEN ====================
router.get("/verify", authMiddleware, async (req, res) => {
  try {
    // Get fresh user data from DB
    const [users] = await pool.query(
      "SELECT id, name, email, role, profile_picture, is_verified FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({
      success: true,
      user: users[0]
    });
  } catch (err) {
    console.error("Verify token error:", err);
    res.status(500).json({ error: "Server error" });
  }
});

module.exports = router;