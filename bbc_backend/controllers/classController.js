// This is the backend controller for managing classes.
// It includes functions for creating, retrieving, updating, and deleting classes.

const pool = require("../config/db"); // Make sure to import your database connection pool

// --- CREATE a new class ---
// Handles POST /api/classes
exports.createClass = async (req, res) => {
  const { book, room_number, price, branch_id } = req.body;
  const connection = await pool.getConnection();

  try {
    // Input validation
    if (!book || !price || !branch_id) {
      return res.status(400).json({
        status: "error",
        message: "Class name, price, and branch are required.",
      });
    }

    await connection.beginTransaction();

    const [result] = await connection.query(
      "INSERT INTO Classes (book, room_number, price, branch_id, created_at) VALUES (?, ?, ?, ?, ?)",
      [book, room_number, price, branch_id, new Date()]
    );

    await connection.commit();

    res.status(201).json({
      status: "success",
      message: "Class created successfully.",
      data: {
        class_id: result.insertId,
        book,
        room_number,
        price,
        branch_id,
      },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Create Class Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create class.",
    });
  } finally {
    connection.release();
  }
};

// --- GET all classes (with optional branch filter) ---
// Handles GET /api/classes and GET /api/classes?branch_id=...
exports.getAllClasses = async (req, res) => {
  const { branch_id } = req.query;
  let query =
    "SELECT c.*, b.branch_name FROM Classes c JOIN Branches b ON c.branch_id = b.branch_id";
  const params = [];

  if (branch_id) {
    query += " WHERE c.branch_id = ?";
    params.push(branch_id);
  }

  try {
    const [classes] = await pool.query(query, params);
    res.status(200).json({
      status: "success",
      message: "Classes retrieved successfully.",
      data: { classes },
    });
  } catch (error) {
    console.error("Get All Classes Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve classes.",
    });
  }
};

// --- UPDATE a class ---
// Handles PUT /api/classes/:id
exports.updateClass = async (req, res) => {
  const { id } = req.params;
  const { book, room_number, price } = req.body;
  const connection = await pool.getConnection();

  try {
    // Input validation
    if (!book || !price) {
      return res.status(400).json({
        status: "error",
        message: "Class name and price are required.",
      });
    }

    await connection.beginTransaction();

    await connection.query(
      "UPDATE Classes SET book = ?, room_number = ?, price = ?, updated_at = ? WHERE class_id = ?",
      [book, room_number, price, new Date(), id]
    );

    await connection.commit();

    res.status(200).json({
      status: "success",
      message: "Class updated successfully.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Class Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update class.",
    });
  } finally {
    connection.release();
  }
};

// --- DELETE a class ---
// Handles DELETE /api/classes/:id
exports.deleteClass = async (req, res) => {
  const { id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    // Check if the class is associated with any enrollments before deleting
    const [enrollments] = await connection.query(
      "SELECT * FROM enrollment WHERE course_id = ?",
      [id]
    );

    if (enrollments.length > 0) {
      return res.status(400).json({
        status: "error",
        message:
          "Cannot delete this class because it is currently assigned to one or more students.",
      });
    }

    await connection.query("DELETE FROM Classes WHERE class_id = ?", [id]);

    await connection.commit();

    res.status(200).json({
      status: "success",
      message: "Class deleted successfully.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Class Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete class.",
    });
  } finally {
    connection.release();
  }
};
