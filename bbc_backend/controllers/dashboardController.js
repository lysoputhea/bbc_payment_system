const pool = require("../config/db");

exports.getDashboard = async (req, res) => {
  try {
    const { branch_id } = req.query;

    const branchCondition = branch_id
      ? `WHERE branch_id = ${pool.escape(branch_id)}`
      : "";

    // 1️⃣ Total Students
    const [studentsResult] = await pool.query(
      `SELECT COUNT(*) AS count FROM Students ${branchCondition}`
    );

    // 2️⃣ Total Revenue (current month)
    const [revenueResult] = await pool.query(`
      SELECT SUM(amount) AS total 
      FROM Payments 
      ${
        branch_id ? `WHERE branch_id = ${pool.escape(branch_id)} AND` : "WHERE"
      } 
      MONTH(payment_date) = MONTH(CURDATE()) 
      AND YEAR(payment_date) = YEAR(CURDATE())
    `);
    const totalRevenue = revenueResult[0].total || 0;

    // 3️⃣ Active Classes
    const [activeClassesResult] = await pool.query(
      `SELECT COUNT(*) AS count FROM Classes ${branchCondition}`
    );

    // 4️⃣ Recent Payments (last 5)
    const [recentPaymentsResult] = await pool.query(`
      SELECT p.payment_id, p.amount, p.payment_date, s.first_name AS firstName, s.last_name AS lastName, s.student_id
      FROM Payments p
      LEFT JOIN Students s ON p.student_id = s.student_id
      ${branch_id ? `WHERE s.branch_id = ${pool.escape(branch_id)}` : ""}
      ORDER BY p.created_at DESC
      LIMIT 5
    `);

    res.status(200).json({
      status: "success",
      data: {
        totalStudents: studentsResult[0].count,
        totalRevenue,
        activeClasses: activeClassesResult[0].count,
        recentPayments: recentPaymentsResult,
      },
    });
  } catch (error) {
    console.error("Dashboard error:", error.message);
    res.status(500).json({
      status: "error",
      error: { code: 500, message: error.message },
    });
  }
};
