const bcrypt = require("bcrypt");
const pool = require("../config/db");

// ✅ Get all users
exports.getAllUsers = async (req, res) => {
  try {
    const [users] = await pool.query(
      "SELECT u.user_id, u.username, u.role, u.branch_id, b.branch_name, u.created_at FROM Users u LEFT JOIN Branches b ON u.branch_id = b.branch_id ORDER BY u.user_id DESC"
    );
    res.json({ status: "success", data: users });
  } catch (error) {
    console.error("Error fetching users:", error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to fetch users" },
    });
  }
};

// ✅ Get user by ID
exports.getUserById = async (req, res) => {
  try {
    const { id } = req.params;
    const [rows] = await pool.query(
      "SELECT user_id, username, role, branch_id, branch_name, created_at FROM Users WHERE user_id = ?",
      [id]
    );
    if (!rows.length)
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "User not found" },
      });

    res.json({ status: "success", data: rows[0] });
  } catch (error) {
    console.error("Error fetching user:", error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to fetch user" },
    });
  }
};

// ✅ Create new user (Admin only)
exports.createUser = async (req, res) => {
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

    // Validate role
    if (!["Admin", "Accountant"].includes(role)) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid role: must be Admin or Accountant",
        },
      });
    }

    // Validate branch for Accountant
    if (role === "Accountant" && !branch_id) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "Branch ID required for Accountant" },
      });
    }

    // Check if username exists
    const [existing] = await pool.query(
      "SELECT user_id FROM Users WHERE username = ?",
      [username]
    );
    if (existing.length) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "Username already exists" },
      });
    }

    // Insert user
    const hashedPassword = await bcrypt.hash(password, 10);
    const [result] = await pool.query(
      "INSERT INTO Users (username, password, role, branch_id) VALUES (?, ?, ?, ?)",
      [username, hashedPassword, role, role === "Accountant" ? branch_id : null]
    );

    res.status(201).json({
      status: "success",
      message: "User created successfully",
      data: { user_id: result.insertId, username, role, branch_id },
    });
  } catch (error) {
    console.error("Create user error:", error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to create user" },
    });
  }
};

// ✅ Update user info
exports.updateUser = async (req, res) => {
  try {
    const { id } = req.params;
    const { username, role, branch_id } = req.body;

    const [userCheck] = await pool.query(
      "SELECT * FROM Users WHERE user_id = ?",
      [id]
    );
    if (!userCheck.length) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "User not found" },
      });
    }

    // Update user
    await pool.query(
      "UPDATE Users SET username = ?, role = ?, branch_id = ? WHERE user_id = ?",
      [username, role, branch_id || null, id]
    );

    const [updatedUser] = await pool.query(
      "SELECT user_id, username, role, branch_id FROM Users WHERE user_id = ?",
      [id]
    );

    res.json({
      status: "success",
      message: "User updated successfully",
      data: updatedUser[0],
    });
  } catch (error) {
    console.error("Update user error:", error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to update user" },
    });
  }
};

// ✅ Delete user
exports.deleteUser = async (req, res) => {
  try {
    const { id } = req.params;
    const [result] = await pool.query("DELETE FROM Users WHERE user_id = ?", [
      id,
    ]);

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "User not found" },
      });
    }

    res.json({ status: "success", message: "User deleted successfully" });
  } catch (error) {
    console.error("Delete user error:", error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to delete user" },
    });
  }
};

// ✅ Change user password
exports.changePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (!newPassword) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "New password required" },
      });
    }

    const [users] = await pool.query("SELECT * FROM Users WHERE user_id = ?", [
      id,
    ]);
    if (!users.length) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "User not found" },
      });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    await pool.query("UPDATE Users SET password = ? WHERE user_id = ?", [
      hashedPassword,
      id,
    ]);

    res.json({ status: "success", message: "Password updated successfully" });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to change password" },
    });
  }
};

// Not yet implemented
// ✅ Change own password
// exports.changeOwnPassword = async (req, res) => {
//   try {
//     const userId = req.user.user_id;
//     const { currentPassword, newPassword } = req.body;

//     if (!currentPassword || !newPassword) {
//       return res.status(400).json({
//         status: "error",
//         error: {
//           code: 400,
//           message: "Current password and new password are required",
//         },
//       });
//     }

//     const [users] = await pool.query("SELECT * FROM Users WHERE user_id = ?", [
//       userId,
//     ]);
//     if (!users.length) {
//       return res.status(404).json({
//         status: "error",
//         error: { code: 404, message: "User not found" },
//       });
//     }

//     const user = users[0];
//     const isMatch = await bcrypt.compare(currentPassword, user.password);
//     if (!isMatch) {
//       return res.status(400).json({
//         status: "error",
//         error: { code: 400, message: "Current password is incorrect" },
//       });
//     }

//     const hashedPassword = await bcrypt.hash(newPassword, 10);
//     await pool.query("UPDATE Users SET password = ? WHERE user_id = ?", [
//       hashedPassword,
//       userId,
//     ]);

//     res.json({ status: "success", message: "Password updated successfully" });
//   } catch (error) {
//     console.error("Change own password error:", error);
//     res.status(500).json({
//       status: "error",
//       error: { code: 500, message: "Failed to change password" },
//     });
//   }
// };
