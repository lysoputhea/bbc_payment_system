const { da } = require("@faker-js/faker");
const pool = require("../config/db");

exports.createStudent = async (req, res) => {
  try {
    const { branch_id, first_name, last_name, dob, gender } = req.body;

    // Input validation
    if (!branch_id || !first_name || !last_name || !dob || !gender) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message:
            "Required fields: first_name, last_name, dob, gender, branch_id",
        },
      });
    }
    if (!["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid gender: must be Male or Female",
        },
      });
    }
    const dobDate = new Date(dob);
    if (isNaN(dobDate) || dobDate > new Date()) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid or future date of birth",
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
          message: "Invalid branch_id",
        },
      });
    }

    const [result] = await pool.query(
      "INSERT INTO Students (branch_id, first_name, last_name, dob, gender) VALUES (?, ?, ?, ?, ?)",
      [branch_id, first_name, last_name, dob, gender]
    );
    res.status(201).json({
      status: "success",
      message: "Student created successfully",
      data: {
        student_id: result.insertId,
        branch_id,
        first_name,
        last_name,
        dob,
        gender,
        is_active: true,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: "Failed to create student",
      },
    });
  }
};

exports.getStudents = async (req, res) => {
  try {
    let branch_id =
      req.user.role === "Accountant"
        ? req.user.branch_id
        : parseInt(req.query.branch_id);
    if (
      req.user.role === "Accountant" &&
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

    // For Admins, allow fetching all students if branch_id is not provided
    if (req.user.role === "Admin" && !branch_id) {
      const [students] = await pool.query(
        "SELECT s.*, b.branch_name FROM Students s JOIN Branches b ON s.branch_id = b.branch_id"
      );
      return res.json({
        status: "success",
        data: students,
        message: students.length
          ? "All students retrieved successfully"
          : "No students found",
      });
    }

    // Validate branch_id
    if (!branch_id || !Number.isInteger(branch_id) || branch_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "branch_id must be a positive integer in query parameter",
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

    const [students] = await pool.query(
      "SELECT s.*, b.branch_name FROM Students s JOIN Branches b ON s.branch_id = b.branch_id WHERE s.branch_id = ?",
      [branch_id]
    );
    res.json({
      status: "success",
      data: students,
      message: students.length
        ? `Students for branch ${branch_id} retrieved successfully`
        : `No students found for branch ${branch_id}`,
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to fetch students: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};

exports.getStudent = async (req, res) => {
  try {
    const student_id = parseInt(req.params.id);
    const branch_id =
      req.user.role === "Accountant"
        ? req.user.branch_id
        : parseInt(req.query.branch_id);

    // Validate inputs
    if (!student_id || !Number.isInteger(student_id) || student_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "student_id must be a positive integer in URL parameter",
        },
      });
    }
    if (!branch_id || !Number.isInteger(branch_id) || branch_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "branch_id must be a positive integer in query parameter",
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
    if (req.user.role === "Accountant" && branch_id !== req.user.branch_id) {
      return res.status(403).json({
        status: "error",
        error: {
          code: 403,
          message:
            "Unauthorized: Accountants can only access their assigned branch",
        },
      });
    }

    const [students] = await pool.query(
      "SELECT s.*, b.branch_name FROM Students s JOIN Branches b ON s.branch_id = b.branch_id WHERE s.student_id = ? AND s.branch_id = ?",
      [student_id, branch_id]
    );
    if (!students.length) {
      return res.status(404).json({
        status: "error",
        error: {
          code: 404,
          message: "Student not found or unauthorized for this branch",
        },
      });
    }
    res.json({
      status: "success",
      data: { student: students[0] },
      message: "Student retrieved successfully",
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to fetch student: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};

exports.updateStudent = async (req, res) => {
  try {
    const { first_name, last_name, dob, gender } = req.body;

    // Input validation
    if (!first_name || !last_name || !dob || !gender) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Required fields: first_name, last_name, dob, gender",
        },
      });
    }
    if (!["Male", "Female"].includes(gender)) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid gender: must be Male or Female",
        },
      });
    }
    const dobDate = new Date(dob);
    if (isNaN(dobDate) || dobDate > new Date()) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid or future date of birth",
        },
      });
    }

    const branch_id =
      req.user.role === "accountant" ? req.user.branch_id : req.body.branch_id;
    if (!branch_id) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "branch_id is required",
        },
      });
    }

    const [result] = await pool.query(
      "UPDATE Students SET first_name = ?, last_name = ?, dob = ?, gender = ?, updated_at = CURRENT_TIMESTAMP WHERE student_id = ? AND branch_id = ? AND is_active = TRUE",
      [first_name, last_name, dob, gender, req.params.id, branch_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        error: {
          code: 404,
          message: "Student not found or unauthorized",
        },
      });
    }
    res.json({
      status: "success",
      message: "Student updated successfully",
      data: {
        student_id: req.params.id,
        branch_id,
        first_name,
        last_name,
        dob,
      },
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: "Failed to update student",
      },
    });
  }
};

exports.deactivateStudent = async (req, res) => {
  try {
    const branch_id =
      req.user.role === "accountant" ? req.user.branch_id : req.query.branch_id;
    if (!branch_id) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "branch_id is required",
        },
      });
    }

    const [result] = await pool.query(
      "UPDATE Students SET is_active = FALSE, updated_at = CURRENT_TIMESTAMP WHERE student_id = ? AND branch_id = ? AND is_active = TRUE",
      [req.params.id, branch_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        error: {
          code: 404,
          message: "Student not found or already inactive",
        },
      });
    }
    res.json({
      status: "success",
      message: "Student deactivated successfully",
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: "Failed to deactivate student",
      },
    });
  }
};

// exports.deleteStudent = async (req, res) => {
//   try {
//     const branch_id =
//       req.user.role === "accountant" ? req.user.branch_id : req.query.branch_id;
//     if (!branch_id) {
//       return res.status(400).json({
//         status: "error",
//         error: {
//           code: 400,
//           message: "branch_id is required",
//         },
//       });
//     }

//     const [result] = await pool.query(
//       "DELETE FROM Students WHERE student_id = ? AND branch_id = ? AND is_active = TRUE",
//       [req.params.id, branch_id]
//     );
//     if (result.affectedRows === 0) {
//       return res.status(404).json({
//         status: "error",
//         error: {
//           code: 404,
//           message: "Student not found or already inactive",
//         },
//       });
//     }
//     res.json({
//       status: "success",
//       message: "Student and related records deleted successfully",
//     });
//   } catch (error) {
//     console.error(error);
//     res.status(500).json({
//       status: "error",
//       error: {
//         code: 500,
//         message: "Failed to delete student",
//       },
//     });
//   }
// };

// This is the backend controller for deleting a student.
// DELETE /api/students/:student_id

exports.deleteStudent = async (req, res) => {
  const { student_id } = req.params;
  const connection = await pool.getConnection();

  try {
    // Start a transaction for safety, although it's a single operation here.
    await connection.beginTransaction();

    // NOTE: It's assumed your database is set up with 'ON DELETE CASCADE'
    // for the 'enrollment' table's foreign key. This will automatically
    // delete all enrollments associated with this student.

    // Delete the student from the 'students' table
    await connection.query("DELETE FROM students WHERE student_id = ?", [
      student_id,
    ]);

    // If the delete was successful, commit the transaction
    await connection.commit();

    res.status(200).json({
      status: "success",
      message: "Student and their enrollments deleted successfully.",
    });
  } catch (error) {
    // If an error occurs, roll back any changes
    await connection.rollback();
    console.error("Delete Student Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete student.",
    });
  } finally {
    // Always release the connection
    connection.release();
  }
};
