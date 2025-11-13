// controllers/paymentReportController.js
const pool = require("../config/db");

// controllers/paymentReportController.js
exports.getMonthlyStudentPayments = async (req, res) => {
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
        message:
          "Unauthorized: Accountants can only access their assigned branch",
      });
    }

    let query = `
      SELECT 
        s.student_id,
        s.first_name,
        s.last_name,
        DATE_FORMAT(p.issue_date, '%Y-%m') AS month,
        SUM(p.amount) AS total_amount
      FROM Payments p
      JOIN Students s ON p.student_id = s.student_id
      WHERE 1=1
    `;

    const params = [];

    // ✅ Branch filter
    if (branch_id) {
      query += " AND p.branch_id = ?";
      params.push(branch_id);
    }

    // ✅ Date range filter (optional)
    if (req.query.start_date && req.query.end_date) {
      query += " AND p.issue_date BETWEEN ? AND ?";
      params.push(req.query.start_date, req.query.end_date);
    }

    query += `
      GROUP BY s.student_id, month
      ORDER BY month DESC, s.student_id
    `;

    const [rows] = await pool.query(query, params);

    res.json({
      status: "success",
      data: rows,
      message: rows.length
        ? "Monthly student payments retrieved successfully"
        : "No payments found",
    });
  } catch (error) {
    console.error("Get monthly payments error:", error);
    res.status(500).json({
      status: "error",
      message: `Failed to fetch report: ${error.message || "Database error"}`,
    });
  }
};

// controllers/paymentReportController.js
exports.getMonthlyBranchPayments = async (req, res) => {
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
        message:
          "Unauthorized: Accountants can only access their assigned branch",
      });
    }

    let query = `
      SELECT 
        b.branch_id,
        b.branch_name,
        DATE_FORMAT(p.issue_date, '%Y-%m') AS month,
        SUM(p.amount) AS total_amount
      FROM Payments p
      JOIN Branches b ON p.branch_id = b.branch_id
      WHERE 1=1
    `;

    const params = [];

    // ✅ Branch filter (optional for admins, fixed for accountants)
    if (branch_id) {
      query += " AND p.branch_id = ?";
      params.push(branch_id);
    }

    // ✅ Date range filter (optional)
    if (req.query.start_date && req.query.end_date) {
      query += " AND p.issue_date BETWEEN ? AND ?";
      params.push(req.query.start_date, req.query.end_date);
    }

    query += `
      GROUP BY b.branch_id, month
      ORDER BY month DESC, b.branch_id
    `;

    const [rows] = await pool.query(query, params);

    res.json({
      status: "success",
      data: rows,
      message: rows.length
        ? "Monthly branch payments retrieved successfully"
        : "No payments found",
    });
  } catch (error) {
    console.error("Get monthly branch payments error:", error);
    res.status(500).json({
      status: "error",
      message: `Failed to fetch report: ${error.message || "Database error"}`,
    });
  }
};

// controllers/paymentReportController.js
exports.getMonthlyStudentPayments = async (req, res) => {
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
        message:
          "Unauthorized: Accountants can only access their assigned branch",
      });
    }

    let query = `
      SELECT 
        s.student_id,
        b.branch_name,
        s.first_name,
        s.last_name,
        s.gender,
        ANY_VALUE(c.book) as book,
        ANY_VALUE(c.room_number) as room_number,
        DATE_FORMAT(p.payment_date, '%Y-%m') AS month,
         ANY_VALUE(p.payment_date) AS payment_date,
        ANY_VALUE(p.issue_date) AS issue_date,
        ANY_VALUE(p.due_date) AS due_date,
        SUM(p.amount) AS total_amount
      FROM Payments p
      JOIN Branches b ON p.branch_id = b.branch_id
      JOIN Students s ON p.student_id = s.student_id
      LEFT JOIN Classes c ON c.class_id = p.class_id
      WHERE 1=1
    `;

    const params = [];

    // ✅ Branch filter
    if (branch_id) {
      query += " AND p.branch_id = ?";
      params.push(branch_id);
    }

    // ✅ Date range filter (optional)
    if (req.query.start_date && req.query.end_date) {
      // query += " AND p.issue_date BETWEEN ? AND ?";
      query += " AND p.payment_date BETWEEN ? AND ?";
      params.push(req.query.start_date, req.query.end_date);
    }

    query += `
      GROUP BY s.student_id, b.branch_id, month 
      ORDER BY month DESC, s.student_id
    `;

    const [rows] = await pool.query(query, params);

    res.json({
      status: "success",
      data: rows,
      message: rows.length
        ? "Monthly student payments retrieved successfully"
        : "No payments found",
    });
  } catch (error) {
    console.error("Get monthly payments error:", error);
    res.status(500).json({
      status: "error",
      message: `Failed to fetch report: ${error.message || "Database error"}`,
    });
  }
};
