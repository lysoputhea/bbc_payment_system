const pool = require("../config/db");

exports.createCourse = async (req, res) => {
  try {
    const { course_name, branch_id, price } = req.body;

    // Input validation
    if (!course_name || !branch_id || !price) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Required fields: course_name, branch_id, price",
        },
      });
    }
    if (price <= 0) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "Price must be greater than 0" },
      });
    }
    const [branches] = await pool.query(
      "SELECT branch_id FROM Branches WHERE branch_id = ?",
      [branch_id]
    );
    if (!branches.length) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid branch_id: Branch does not exist",
        },
      });
    }

    const [result] = await pool.query(
      "INSERT INTO Courses (course_name, branch_id, price) VALUES (?, ?, ?)",
      [course_name, branch_id, price]
    );
    res.status(201).json({
      status: "success",
      data: {
        course_id: result.insertId,
        course_name,
        branch_id,
        price,
      },
      message: "Course created successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to create course" },
    });
  }
};

exports.getCourses = async (req, res) => {
  try {
    let branch_id = req.query.branch_id;

    // For Accountants, enforce their assigned branch_id
    if (req.user.role === "Accountant") {
      branch_id = req.user.branch_id;
      if (
        req.query.branch_id &&
        parseInt(req.query.branch_id) !== req.user.branch_id
      ) {
        return res.status(403).json({
          status: "error",
          error: {
            code: 403,
            message:
              "Unauthorized: Accountants can only access their assigned branch",
          },
        });
      }
    }

    // For Admins, allow fetching all courses if branch_id is not provided
    if (req.user.role === "Admin" && !branch_id) {
      const [courses] = await pool.query(
        "SELECT c.*, b.branch_name FROM Courses c JOIN Branches b ON c.branch_id = b.branch_id"
      );
      return res.json({
        status: "success",
        data: courses,
        message: courses.length
          ? "All courses retrieved successfully"
          : "No courses found",
      });
    }

    // Validate branch_id
    if (!branch_id) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "branch_id is required in query parameter",
        },
      });
    }
    const [branches] = await pool.query(
      "SELECT branch_id FROM Branches WHERE branch_id = ?",
      [branch_id]
    );
    if (!branches.length) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid branch_id: Branch does not exist",
        },
      });
    }

    const [courses] = await pool.query(
      "SELECT c.*, b.branch_name FROM Courses c JOIN Branches b ON c.branch_id = b.branch_id WHERE c.branch_id = ?",
      [branch_id]
    );
    res.json({
      status: "success",
      data: courses,
      message: courses.length
        ? `Courses for branch ${branch_id} retrieved successfully`
        : `No courses found for branch ${branch_id}`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to fetch courses" },
    });
  }
};

exports.getCourse = async (req, res) => {
  try {
    const branch_id =
      req.user.role === "Accountant" ? req.user.branch_id : req.query.branch_id;
    if (!branch_id) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "branch_id is required in query parameter",
        },
      });
    }
    const [branches] = await pool.query(
      "SELECT branch_id FROM Branches WHERE branch_id = ?",
      [branch_id]
    );
    if (!branches.length) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid branch_id: Branch does not exist",
        },
      });
    }
    if (
      req.user.role === "Accountant" &&
      parseInt(branch_id) !== req.user.branch_id
    ) {
      return res.status(403).json({
        status: "error",
        error: {
          code: 403,
          message:
            "Unauthorized: Accountants can only access their assigned branch",
        },
      });
    }
    const [courses] = await pool.query(
      "SELECT c.*, b.branch_name FROM Courses c JOIN Branches b ON c.branch_id = b.branch_id WHERE c.course_id = ? AND c.branch_id = ?",
      [req.params.id, branch_id]
    );
    if (!courses.length) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "Course not found or unauthorized" },
      });
    }
    res.json({
      status: "success",
      data: courses[0],
      message: "Course retrieved successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to fetch course" },
    });
  }
};

exports.updateCourse = async (req, res) => {
  try {
    const { course_name, branch_id, price } = req.body;

    // Input validation
    if (!course_name || !branch_id || !price) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Required fields: course_name, branch_id, price",
        },
      });
    }
    if (price <= 0) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "Price must be greater than 0" },
      });
    }
    const [branches] = await pool.query(
      "SELECT branch_id FROM Branches WHERE branch_id = ?",
      [branch_id]
    );
    if (!branches.length) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid branch_id: Branch does not exist",
        },
      });
    }
    if (
      req.user.role === "Accountant" &&
      parseInt(branch_id) !== req.user.branch_id
    ) {
      return res.status(403).json({
        status: "error",
        error: {
          code: 403,
          message:
            "Unauthorized: Accountants can only update courses in their assigned branch",
        },
      });
    }

    const [result] = await pool.query(
      "UPDATE Courses SET course_name = ?, branch_id = ?, price = ?, updated_at = CURRENT_TIMESTAMP WHERE course_id = ? AND branch_id = ?",
      [course_name, branch_id, price, req.params.id, branch_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "Course not found or unauthorized" },
      });
    }
    res.json({
      status: "success",
      message: "Course updated successfully",
      data: {
        course_id: req.params.id,
        course_name,
        branch_id,
        price,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to update course" },
    });
  }
};

exports.deleteCourse = async (req, res) => {
  try {
    const branch_id =
      req.user.role === "Accountant" ? req.user.branch_id : req.query.branch_id;
    if (!branch_id) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "branch_id is required in query parameter",
        },
      });
    }
    const [branches] = await pool.query(
      "SELECT branch_id FROM Branches WHERE branch_id = ?",
      [branch_id]
    );
    if (!branches.length) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid branch_id: Branch does not exist",
        },
      });
    }
    if (
      req.user.role === "Accountant" &&
      parseInt(branch_id) !== req.user.branch_id
    ) {
      return res.status(403).json({
        status: "error",
        error: {
          code: 403,
          message:
            "Unauthorized: Accountants can only delete courses in their assigned branch",
        },
      });
    }
    const [result] = await pool.query(
      "DELETE FROM Courses WHERE course_id = ? AND branch_id = ?",
      [req.params.id, branch_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "Course not found or unauthorized" },
      });
    }
    res.json({
      status: "success",
      data: null,
      message: "Course deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: "Failed to delete course" },
    });
  }
};
