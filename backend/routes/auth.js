import express from 'express';
import bcrypt from 'bcryptjs';
import { pool } from '../db.js';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt.js';
import { authMiddleware } from '../middleware/auth.js';
import crypto from 'crypto';
import nodemailer from 'nodemailer';
const router = express.Router();

// Helper: Generate session token
const generateSessionToken = () => {
  return crypto.randomBytes(32).toString('hex');
};
// Configure nodemailer with better error handling
const transporter = nodemailer.createTransport({
  service: 'gmail',
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASSWORD
  },
  tls: {
    rejectUnauthorized: false,
    minVersion: 'TLSv1.2'
  },
  pool: true,
  maxConnections: 1,
  rateDelta: 20000,
  rateLimit: 5
});

// Verify connection on startup
transporter.verify(function(error, success) {
  if (error) {
    console.log('❌ Email service connection failed:', error.message);
    console.log('💡 Using email logging mode for development');
  } else {
    console.log('✅ Email service is ready to send messages');
  }
});
// Helper function to send email with fallback
const sendEmail = async (mailOptions) => {
  try {
    await transporter.sendMail(mailOptions);
    console.log('✅ Email sent successfully to:', mailOptions.to);
    return { success: true };
  } catch (error) {
    console.log('❌ Failed to send email:', error.message);
    
    // For development: Log the reset link to console
    if (process.env.NODE_ENV === 'development') {
      console.log('\n📧 ==================== EMAIL DETAILS ====================');
      console.log('📬 To:', mailOptions.to);
      console.log('📝 Subject:', mailOptions.subject);
      
      // Extract reset URL from HTML
      const urlMatch = mailOptions.html.match(/href="([^"]+reset-password[^"]+)"/);
      if (urlMatch) {
        console.log('🔗 Reset Link:', urlMatch[1]);
        console.log('\n⚠️  Copy this link and paste it in your browser to reset password');
      }
      console.log('========================================================\n');
      
      return { success: true, devMode: true };
    }
    
    return { success: false, error: error.message };
  }
};
// ==================== REGISTER ====================
router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;

  try {
    if (!fullName || !email || !password) {
      return res.status(400).json({ error: "All fields are required" });
    }

    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) {
      return res.status(400).json({ error: "User already exists with this email" });
    }

    const hashedPassword = await bcrypt.hash(password, 10);

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
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    if (!email || !password) {
      return res.status(400).json({ error: "Email and password are required" });
    }

    const [users] = await pool.query(
      "SELECT id, name, email, password_hash, role, profile_picture, is_verified FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password_hash);

    if (!isMatch) {
      return res.status(400).json({ error: "Invalid email or password" });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

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
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error during login" });
  }
});

// ==================== GOOGLE LOGIN ====================
router.post("/google-login", async (req, res) => {
  const { name, email, googleId, profilePicture } = req.body;

  try {
    let [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    let user;

    if (users.length === 0) {
      const [result] = await pool.query(
        `INSERT INTO users (name, email, password_hash, role, profile_picture, is_verified) 
         VALUES (?, ?, ?, 'user', ?, true)`,
        [name, email, googleId, profilePicture]
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

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    await pool.query("UPDATE users SET last_login = NOW() WHERE id = ?", [user.id]);

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

    await pool.query(
      "UPDATE user_sessions SET is_active = false WHERE user_id = ?",
      [userId]
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
    const [users] = await pool.query(
      "SELECT id, name, email, role, profile_picture, is_verified FROM users WHERE id = ?",
      [req.user.id]
    );

    if (users.length === 0) {
      return res.status(404).json({ error: "User not found" });
    }

    res.json({ success: true, user: users[0] });
  } catch (err) {
    console.error("Verify token error:", err);
    res.status(500).json({ error: "Server error" });
  }
});
router.post("/forgot-password", async (req, res) => {
  const { email } = req.body;

  try {
    // Validation
    if (!email) {
      return res.status(400).json({ error: "Email is required" });
    }

    // Check if user exists
    const [users] = await pool.query(
      "SELECT id, name, email FROM users WHERE email = ?",
      [email]
    );

    if (users.length === 0) {
      // For security, don't reveal if email exists or not
      return res.json({
        success: true,
        message: "If the email exists, a password reset link has been sent."
      });
    }

    const user = users[0];

    // Generate reset token
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetTokenExpires = new Date(Date.now() + 3600000); // 1 hour from now

    // Save token to database
    await pool.query(
      "UPDATE users SET reset_password_token = ?, reset_password_expires = ? WHERE id = ?",
      [resetToken, resetTokenExpires, user.id]
    );

    // Create reset URL
    const resetUrl = `${process.env.CLIENT_URL}/reset-password/${resetToken}`;

    // Email content
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Reset Request - JourneyHub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .button { display: inline-block; padding: 12px 30px; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; text-decoration: none; border-radius: 5px; font-weight: bold; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>🔐 Password Reset Request</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>We received a request to reset your password for your JourneyHub account.</p>
              <p>Click the button below to reset your password:</p>
              <center>
                <a href="${resetUrl}" class="button">Reset Password</a>
              </center>
              <p>Or copy and paste this link into your browser:</p>
              <p style="word-break: break-all; color: #667eea;">${resetUrl}</p>
              <p><strong>⏰ This link will expire in 1 hour.</strong></p>
              <p>If you didn't request this password reset, please ignore this email. Your password will remain unchanged.</p>
              <p>Best regards,<br><strong>The JourneyHub Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 JourneyHub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    // Send email
    const emailResult = await sendEmail(mailOptions);

if (!emailResult.success && !emailResult.devMode) {
  return res.status(500).json({ 
    error: "Failed to send reset email. Please try again later." 
  });
}

    res.json({
      success: true,
      message: "If the email exists, a password reset link has been sent."
    });

  } catch (err) {
    console.error("Forgot password error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});

// ==================== RESET PASSWORD ====================
router.post("/reset-password", async (req, res) => {
  const { token, newPassword } = req.body;

  try {
    // Validation
    if (!token || !newPassword) {
      return res.status(400).json({ error: "Token and new password are required" });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({ error: "Password must be at least 6 characters" });
    }

    // Find user with valid token
    const [users] = await pool.query(
      "SELECT id, email, name FROM users WHERE reset_password_token = ? AND reset_password_expires > NOW()",
      [token]
    );

    if (users.length === 0) {
      return res.status(400).json({ error: "Invalid or expired reset token" });
    }

    const user = users[0];

    // Hash new password
    const hashedPassword = await bcrypt.hash(newPassword, 10);

    // Update password and clear reset token
    await pool.query(
      "UPDATE users SET password_hash = ?, reset_password_token = NULL, reset_password_expires = NULL WHERE id = ?",
      [hashedPassword, user.id]
    );

    // Send confirmation email
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to: user.email,
      subject: 'Password Successfully Reset - JourneyHub',
      html: `
        <!DOCTYPE html>
        <html>
        <head>
          <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background: linear-gradient(135deg, #10b981 0%, #059669 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
            .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
          </style>
        </head>
        <body>
          <div class="container">
            <div class="header">
              <h1>✅ Password Reset Successful</h1>
            </div>
            <div class="content">
              <p>Hi <strong>${user.name}</strong>,</p>
              <p>Your password has been successfully reset.</p>
              <p>You can now log in to your account using your new password.</p>
              <p>If you didn't make this change, please contact our support team immediately.</p>
              <p>Best regards,<br><strong>The JourneyHub Team</strong></p>
            </div>
            <div class="footer">
              <p>© 2025 JourneyHub. All rights reserved.</p>
            </div>
          </div>
        </body>
        </html>
      `
    };

    await sendEmail(mailOptions);

    res.json({
      success: true,
      message: "Password reset successful. You can now login with your new password."
    });

  } catch (err) {
    console.error("Reset password error:", err);
    res.status(500).json({ error: "Server error. Please try again later." });
  }
});
export default router;