const pool = require("../config/db");

// ===========================================
// CREATE STUDENT AND ENROLL
// POST /api/enrollments
// ===========================================
exports.createStudentAndEnroll = async (req, res) => {
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const { first_name, last_name, dob, gender, branch_id, class_id } =
      req.body;

    if (!first_name || !last_name || !dob || !gender || !branch_id) {
      return res.status(400).json({
        status: "error",
        message: "Missing required student fields.",
      });
    }

    const studentData = { first_name, last_name, dob, gender, branch_id };

    // Insert new student
    const [studentResult] = await connection.query(
      "INSERT INTO Students SET ?",
      [studentData]
    );
    const newStudentId = studentResult.insertId;

    // Enroll the student (optional)
    if (class_id) {
      await connection.query(
        `INSERT INTO Enrollments (student_id, class_id, enrollment_date)
         VALUES (?, ?, ?)`,
        [newStudentId, class_id, new Date()]
      );
    }

    await connection.commit();

    res.status(201).json({
      status: "success",
      message: "Student and enrollment created successfully.",
      data: { student_id: newStudentId },
    });
  } catch (error) {
    await connection.rollback();
    console.error("Enrollment Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to create student and enrollment.",
    });
  } finally {
    connection.release();
  }
};

// ===========================================
// UPDATE ENROLLMENT
// PUT /api/enrollments/:enrollment_id
// ===========================================
exports.updateEnrollment = async (req, res) => {
  const { enrollment_id } = req.params;
  const { student_id, first_name, last_name, dob, gender, class_id } = req.body;

  const connection = await pool.getConnection();

  try {
    if (
      !student_id ||
      !first_name ||
      !last_name ||
      !dob ||
      !gender ||
      !class_id
    ) {
      return res.status(400).json({
        status: "error",
        message: "All fields are required.",
      });
    }

    await connection.beginTransaction();

    // Update student
    await connection.query(
      `UPDATE Students
       SET first_name = ?, last_name = ?, dob = ?, gender = ?
       WHERE student_id = ?`,
      [first_name, last_name, dob, gender, student_id]
    );

    // Update enrollment
    await connection.query(
      `UPDATE Enrollments
       SET class_id = ?
       WHERE enrollment_id = ?`,
      [class_id, enrollment_id]
    );

    await connection.commit();

    res.status(200).json({
      status: "success",
      message: "Enrollment updated successfully.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Update Enrollment Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to update enrollment.",
    });
  } finally {
    connection.release();
  }
};

// ===========================================
// DELETE ENROLLMENT
// DELETE /api/enrollments/:enrollment_id
// ===========================================
exports.deleteEnrollment = async (req, res) => {
  const { enrollment_id } = req.params;
  const connection = await pool.getConnection();

  try {
    await connection.beginTransaction();

    const [existing] = await connection.query(
      `SELECT * FROM Enrollments WHERE enrollment_id = ?`,
      [enrollment_id]
    );

    if (existing.length === 0) {
      await connection.rollback();
      return res.status(404).json({
        status: "error",
        message: "Enrollment not found.",
      });
    }

    const studentId = existing[0].student_id;

    // Delete enrollment first
    await connection.query(`DELETE FROM Enrollments WHERE enrollment_id = ?`, [
      enrollment_id,
    ]);

    // Optionally delete student record
    await connection.query(`DELETE FROM Students WHERE student_id = ?`, [
      studentId,
    ]);

    await connection.commit();

    res.status(200).json({
      status: "success",
      message: "Enrollment and associated student deleted successfully.",
    });
  } catch (error) {
    await connection.rollback();
    console.error("Delete Enrollment Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to delete enrollment.",
    });
  } finally {
    connection.release();
  }
};

// ===========================================
// GET ENROLLMENTS WITH FILTERS + PAGINATION
// GET /api/enrollments
// ===========================================
exports.getEnrollments = async (req, res) => {
  const {
    branch_id,
    class_id,
    student_name,
    room_number,
    page = 1,
    limit = 10,
  } = req.query;

  const offset = (page - 1) * limit;
  const whereClauses = [];
  const params = [];

  try {
    // Base query
    let dataQuery = `
      SELECT
        e.enrollment_id,
        s.student_id,
        s.first_name,
        s.last_name,
        s.gender,
        s.dob,
        s.is_active,
        c.class_id,
        c.book,
        c.room_number,
        c.price,
        b.branch_id,
        b.branch_name,
        e.enrollment_date
      FROM Enrollments e
      INNER JOIN Students s ON e.student_id = s.student_id
      INNER JOIN Classes c ON e.class_id = c.class_id
      INNER JOIN Branches b ON s.branch_id = b.branch_id
    `;

    // Apply filters
    if (branch_id) {
      whereClauses.push("s.branch_id = ?");
      params.push(branch_id);
    }
    if (class_id) {
      whereClauses.push("e.class_id = ?");
      params.push(class_id);
    }
    if (student_name) {
      whereClauses.push("(s.first_name LIKE ? OR s.last_name LIKE ?)");
      params.push(`%${student_name}%`, `%${student_name}%`);
    }
    if (room_number) {
      whereClauses.push("c.room_number LIKE ?");
      params.push(`%${room_number}%`);
    }

    // Add WHERE if there are filters
    if (whereClauses.length > 0) {
      dataQuery += " WHERE " + whereClauses.join(" AND ");
    }

    // Add pagination
    dataQuery += " ORDER BY e.enrollment_date DESC LIMIT ? OFFSET ?";
    const dataParams = [...params, Number(limit), Number(offset)];

    // Count query for pagination
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM Enrollments e
      INNER JOIN Students s ON e.student_id = s.student_id
      INNER JOIN Classes c ON e.class_id = c.class_id
    `;
    if (whereClauses.length > 0) {
      countQuery += " WHERE " + whereClauses.join(" AND ");
    }

    const countParams = [...params]; // only filter params

    // --- DEBUG LOGS ---
    // console.log("Data Query:", dataQuery);
    // console.log("Data Params:", dataParams);
    // console.log("Count Query:", countQuery);
    // console.log("Count Params:", countParams);

    // Execute queries
    const [enrollments] = await pool.query(dataQuery, dataParams);
    const [countResult] = await pool.query(countQuery, countParams);

    const totalRecords = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    // Response
    res.status(200).json({
      status: "success",
      message: "Enrollments retrieved successfully.",
      data: enrollments,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalRecords,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Get Enrollments Error:", error);
    res.status(500).json({
      status: "error",
      message: "Failed to retrieve enrollments.",
      error: error.message, // <-- helps debugging
    });
  }
};
