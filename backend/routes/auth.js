const express = require("express");
const router = express.Router();
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const db = require("../db");

const SECRET = "process_scheduler_secret_key_2024";

// POST /api/auth/register
router.post("/register", (req, res) => {
  const { username, email, password } = req.body;

  if (!username || !email || !password) {
    return res.status(400).json({ error: "All fields are required!" });
  }

  if (password.length < 6) {
    return res.status(400).json({ error: "Password must be at least 6 characters!" });
  }

  db.query("SELECT * FROM users WHERE email = ? OR username = ?", [email, username], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length > 0) {
      return res.status(400).json({ error: "Email or Username already exists!" });
    }

    const hashedPassword = bcrypt.hashSync(password, 10);

    db.query(
      "INSERT INTO users (username, email, password) VALUES (?, ?, ?)",
      [username, email, hashedPassword],
      (err, result) => {
        if (err) return res.status(500).json({ error: err.message });

        const token = jwt.sign(
          { id: result.insertId, username, email },
          SECRET,
          { expiresIn: "7d" }
        );

        res.json({
          success: true,
          message: "Account created successfully!",
          token,
          user: { id: result.insertId, username, email }
        });
      }
    );
  });
});

// POST /api/auth/login
router.post("/login", (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ error: "Email and Password are required!" });
  }

  db.query("SELECT * FROM users WHERE email = ?", [email], (err, rows) => {
    if (err) return res.status(500).json({ error: err.message });
    if (rows.length === 0) {
      return res.status(400).json({ error: "Email not found!" });
    }

    const user = rows[0];
    const isMatch = bcrypt.compareSync(password, user.password);

    if (!isMatch) {
      return res.status(400).json({ error: "Incorrect password!" });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, email: user.email },
      SECRET,
      { expiresIn: "7d" }
    );

    res.json({
      success: true,
      message: "Login successful!",
      token,
      user: { id: user.id, username: user.username, email: user.email }
    });
  });
});

// GET /api/auth/me
router.get("/me", (req, res) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ error: "No token found!" });

  try {
    const decoded = jwt.verify(token, SECRET);
    res.json({ success: true, user: decoded });
  } catch {
    res.status(401).json({ error: "Invalid token!" });
  }
});

module.exports = router;