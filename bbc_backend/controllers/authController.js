const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const pool = require("../config/db");
require("dotenv").config();

exports.register = async (req, res) => {
  try {
    const { username, password, role, branch_id } = req.body;
    if (!username || !password || !role) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Username, password, and role are required",
        },
      });
    }
    if (!["Admin", "Accountant"].includes(role)) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid role: must be Admin or Accountant",
        },
      });
    }
    if (role === "Accountant" && !branch_id) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "Branch ID required for Accountant" },
      });
    }
    if (role === "Accountant") {
      const [branches] = await pool.query(
        "SELECT branch_id FROM Branches WHERE branch_id = ?",
        [branch_id]
      );
      if (!branches.length) {
        return res.status(400).json({
          status: "error",
          error: { code: 400, message: "Invalid branch_id" },
        });
      }
    }
    const [existingUsers] = await pool.query(
      "SELECT user_id FROM Users WHERE username = ?",
      [username]
    );
    if (existingUsers.length) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "Username already exists" },
      });
    }
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO Users (username, password, role, branch_id) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, role, role === "Accountant" ? branch_id : null]
    );
    res.status(201).json({
      status: "success",
      message: "User registered successfully",
      data: {
        user_id: result.insertId,
        username,
        role,
        branch_id: role === "Accountant" ? branch_id : null,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to register user" },
    });
  }
};

exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;
    if (!username || !password) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "Username and password are required" },
      });
    }
    const [users] = await pool.query("SELECT * FROM Users WHERE username = ?", [
      username,
    ]);
    if (!users.length) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, message: "No user found with that username" },
      });
    }
    const user = users[0];
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        status: "error",
        error: { code: 401, message: "Incorrect password" },
      });
    }
    const token = jwt.sign(
      {
        user_id: user.user_id,
        username: user.username,
        role: user.role,
        branch_id: user.branch_id,
      },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRES_IN }
    );
    res.json({
      status: "success",
      data: {
        token,
        user: {
          user_id: user.user_id,
          username: user.username,
          role: user.role,
          branch_id: user.branch_id,
        },
      },
      message: "Login successful",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to login" },
    });
  }
};

exports.logout = (req, res) => {
  res.json({
    status: "success",
    data: null,
    message:
      "Logged out successfully (JWT is stateless, client should discard token)",
  });
};

exports.getCurrentUser = (req, res) => {
  if (!req.user) {
    return res.status(401).json({
      status: "error",
      error: { code: 401, message: "Not authenticated" },
    });
  }
  res.json({
    status: "success",
    data: {
      user: {
        user_id: req.user.user_id,
        username: req.user.username,
        role: req.user.role,
        branch_id: req.user.branch_id,
      },
    },
    message: "User data retrieved successfully",
  });
};
