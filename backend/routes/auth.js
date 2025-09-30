const express = require("express");
const bcrypt = require("bcryptjs");
const router = express.Router();
const { pool } = require("../db");


// ------------------ REGISTER ------------------
router.post("/register", async (req, res) => {
  const { fullName, email, password } = req.body;


  try {
    console.log("Register request body:", req.body);


    // Check if user exists
    const [existing] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (existing.length > 0) return res.status(400).json({ error: "User already exists" });


    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);


    // Insert user into DB
    await pool.query(
      "INSERT INTO users (full_name, email, password, role) VALUES (?, ?, ?, 'user')",
      [fullName, email, hashedPassword]
    );


    res.json({ message: "Registration successful" });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


// ------------------ LOGIN ------------------
router.post("/login", async (req, res) => {
  const { email, password } = req.body;


  try {
    // Find user by email
    const [users] = await pool.query("SELECT * FROM users WHERE email = ?", [email]);
    if (users.length === 0) return res.status(400).json({ error: "Invalid email or password" });


    const user = users[0];


    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ error: "Invalid email or password" });


    // Send user info back
    res.json({
      message: "Login successful",
      id: user.id,
      fullName: user.full_name, // map DB column
      email: user.email,
      role: user.role,
    });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Server error" });
  }
});


module.exports = router;
