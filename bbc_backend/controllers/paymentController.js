const pool = require("../config/db");

exports.createPayment = async (req, res) => {
  try {
    const {
      student_id,
      class_id,
      branch_id,
      original_amount,
      discount_amount = 0.0,
      discount_percentage = 0,
      payment_period_type,
      issue_date,
      due_date,
      payment_date,
      description,
      status,
    } = req.body;

    // Input validation
    if (
      !student_id ||
      !branch_id ||
      !original_amount ||
      !discount_percentage ||
      !payment_period_type ||
      !payment_date ||
      !issue_date ||
      !due_date ||
      !status
    ) {
      return res.status(400).json({
        status: "error",
        message:
          "Required fields: student_id, branch_id, original_amount, discount_amount, discount_percentage, payment_period_type, payment_date, issue_date, due_date, status",
      });
    }

    const amount = parseFloat(original_amount) - parseFloat(discount_amount);
    if (amount <= 0) {
      return res.status(400).json({
        status: "error",
        message: "Final amount must be greater than 0",
      });
    }

    // Validate class and get the price
    const [classes] = await pool.query(
      "SELECT price FROM Classes WHERE class_id = ? AND branch_id = ?",
      [class_id, branch_id],
    );
    if (!classes.length) {
      return res.status(400).json({
        status: "error",
        message: "Invalid class_id: Class does not exist in this branch",
      });
    }

    // if (parseFloat(original_amount) > parseFloat(classes[0].price)) {
    //   return res.status(400).json({
    //     status: "error",
    //     message: "Original amount cannot exceed the class price.",
    //   });
    // }

    // Role-based branch access
    if (req.user.role === "Accountant" && branch_id !== req.user.branch_id) {
      return res.status(403).json({
        status: "error",
        message:
          "Unauthorized: Accountants can only create payments in their assigned branch",
      });
    }

    const [result] = await pool.query(
      "INSERT INTO Payments (student_id, class_id, branch_id, original_amount, discount_amount, discount_percentage,  amount, payment_period_type, payment_date, issue_date, due_date, description, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
      [
        student_id,
        class_id || null,
        branch_id,
        original_amount,
        discount_amount,
        discount_percentage,
        amount,
        payment_period_type,
        payment_date,
        issue_date,
        due_date,
        description || null,
        status,
      ],
    );
    res.status(201).json({
      status: "success",
      data: { payment_id: result.insertId },
      message: "Payment created successfully",
    });
  } catch (error) {
    console.error("Create payment error:", error);
    res.status(500).json({
      status: "error",
      message: `Failed to create payment: ${error.message || "Database error"}`,
    });
  }
};

// exports.getPayments = async (req, res) => {
//   try {
//     let branch_id =
//       req.user.role === "Accountant"
//         ? req.user.branch_id
//         : parseInt(req.query.branch_id);

//     if (
//       req.user.role === "Accountant" &&
//       req.query.branch_id &&
//       parseInt(req.query.branch_id) !== req.user.branch_id
//     ) {
//       return res.status(403).json({
//         status: "error",
//         message:
//           "Unauthorized: Accountants can only access their assigned branch",
//       });
//     }

//     let query =
//       "SELECT p.*, s.first_name, s.last_name, c.*, b.branch_name " +
//       "FROM Payments p " +
//       "JOIN Students s ON p.student_id = s.student_id " +
//       "LEFT JOIN Classes c ON p.class_id = c.class_id " +
//       "JOIN Branches b ON p.branch_id = b.branch_id " +
//       "WHERE 1=1";

//     const params = [];

//     // ✅ Branch filter
//     if (branch_id) {
//       query += " AND p.branch_id = ?";
//       params.push(branch_id);
//     }

//     // ✅ Status filter
//     // if (req.query.status) {
//     //   query += " AND p.status = ?";
//     //   params.push(req.query.status);
//     // }

//     // ✅ Class filter
//     if (req.query.class_id) {
//       query += " AND p.class_id = ?";
//       params.push(parseInt(req.query.class_id));
//     }

//     // ✅ Student name filter (partial match)
//     if (req.query.student_name) {
//       query += " AND (s.first_name LIKE ? OR s.last_name LIKE ?)";
//       params.push(`%${req.query.student_name}%`, `%${req.query.student_name}%`);
//     }

//     // ✅ Date range filter
//     // if (req.query.issue_date && req.query.due_date) {
//     //   query += " AND p.issue_date >= ? AND p.due_date <= ?";
//     //   params.push(req.query.issue_date, req.query.due_date);
//     // } else if (req.query.issue_date) {
//     //   query += " AND p.issue_date >= ?";
//     //   params.push(req.query.issue_date);
//     // } else if (req.query.due_date) {
//     //   query += " AND p.due_date <= ?";
//     //   params.push(req.query.due_date);
//     // }

//     // ✅ Sort option
//     if (req.query.sort_by === "amount") {
//       query += " ORDER BY p.amount DESC";
//     } else {
//       query += " ORDER BY p.payment_date DESC";
//     }

//     const [payments] = await pool.query(query, params);

//     res.json({
//       status: "success",
//       data: payments,
//       message: payments.length
//         ? "Payments retrieved successfully"
//         : "No payments found",
//     });
//   } catch (error) {
//     console.error("Get payments error:", error);
//     res.status(500).json({
//       status: "error",
//       message: `Failed to fetch payments: ${error.message || "Database error"}`,
//     });
//   }
// };

exports.getPaymentById = async (req, res) => {
  try {
    const payment_id = parseInt(req.params.id);
    const [payments] = await pool.query(
      "SELECT p.*, s.first_name, s.last_name, c.*, b.branch_name " +
        "FROM Payments p " +
        "JOIN Students s ON p.student_id = s.student_id " +
        "LEFT JOIN Classes c ON p.class_id = c.class_id " +
        "JOIN Branches b ON p.branch_id = b.branch_id " +
        "WHERE p.payment_id = ?",
      [payment_id],
    );
    if (!payments.length) {
      return res.status(404).json({
        status: "error",
        message: "Payment not found",
      });
    }
    res.json({
      status: "success",
      data: payments[0],
      message: "Payment retrieved successfully",
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      status: "error",
      message: `Failed to fetch payment: ${error.message || "Database error"}`,
    });
  }
};

exports.updatePayment = async (req, res) => {
  try {
    const payment_id = parseInt(req.params.id);
    const {
      original_amount,
      discount_amount,
      discount_percentage,
      payment_period_type,
      payment_date,
      issue_date,
      due_date,
      description,
      status,
    } = req.body;

    const amount = parseFloat(original_amount) - parseFloat(discount_amount);

    const [result] = await pool.query(
      "UPDATE Payments SET original_amount = ?, discount_amount = ?, discount_percentage = ?, amount = ?, payment_period_type = ?, payment_date = ?, issue_date = ?, due_date = ?, description = ?, status = ? WHERE payment_id = ?",
      [
        original_amount,
        discount_amount,
        discount_percentage,
        amount,
        payment_period_type,
        payment_date,
        issue_date,
        due_date,
        description,
        status,
        payment_id,
      ],
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Payment not found",
      });
    }

    res.json({
      status: "success",
      message: "Payment updated successfully",
    });
  } catch (error) {
    console.error("Update payment error:", error);
    res.status(500).json({
      status: "error",
      message: `Failed to update payment: ${error.message || "Database error"}`,
    });
  }
};

exports.deletePayment = async (req, res) => {
  try {
    const payment_id = parseInt(req.params.id);
    const [result] = await pool.query(
      "DELETE FROM Payments WHERE payment_id = ?",
      [payment_id],
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        message: "Payment not found",
      });
    }
    res.json({
      status: "success",
      message: "Payment deleted successfully",
    });
  } catch (error) {
    console.error("Delete payment error:", error);
    res.status(500).json({
      status: "error",
      message: `Failed to delete payment: ${error.message || "Database error"}`,
    });
  }
};

exports.getPayments = async (req, res) => {
  try {
    const { page = 1, limit = 10, class_id, student_name, sort_by } = req.query;

    const offset = (page - 1) * limit;

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

    const whereClauses = [];
    const params = [];

    // Base SELECT query
    let dataQuery = `
      SELECT 
        p.*,
        s.first_name,
        s.last_name,
        c.*,
        b.branch_name
      FROM Payments p
      JOIN Students s ON p.student_id = s.student_id
      LEFT JOIN Classes c ON p.class_id = c.class_id
      JOIN Branches b ON p.branch_id = b.branch_id
    `;

    // Base COUNT query
    let countQuery = `
      SELECT COUNT(*) AS total
      FROM Payments p
      JOIN Students s ON p.student_id = s.student_id
      LEFT JOIN Classes c ON p.class_id = c.class_id
      JOIN Branches b ON p.branch_id = b.branch_id
    `;

    // ✅ Branch filter
    if (branch_id) {
      whereClauses.push("p.branch_id = ?");
      params.push(branch_id);
    }

    // ✅ Class filter
    if (class_id) {
      whereClauses.push("p.class_id = ?");
      params.push(parseInt(class_id));
    }

    // ✅ Student name filter
    if (student_name) {
      whereClauses.push("(s.first_name LIKE ? OR s.last_name LIKE ?)");
      params.push(`%${student_name}%`, `%${student_name}%`);
    }

    // Apply WHERE clause
    if (whereClauses.length > 0) {
      const whereSQL = " WHERE " + whereClauses.join(" AND ");
      dataQuery += whereSQL;
      countQuery += whereSQL;
    }

    // ✅ Sorting
    if (sort_by === "amount") {
      dataQuery += " ORDER BY p.amount DESC";
    } else {
      dataQuery += " ORDER BY p.payment_date DESC";
    }

    // ✅ Pagination
    dataQuery += " LIMIT ? OFFSET ?";
    const dataParams = [...params, Number(limit), Number(offset)];

    // Execute queries
    const [payments] = await pool.query(dataQuery, dataParams);
    const [countResult] = await pool.query(countQuery, params);

    const totalRecords = countResult[0]?.total || 0;
    const totalPages = Math.ceil(totalRecords / limit);

    res.status(200).json({
      status: "success",
      message: "Payments retrieved successfully",
      data: payments,
      pagination: {
        currentPage: Number(page),
        totalPages,
        totalRecords,
        limit: Number(limit),
      },
    });
  } catch (error) {
    console.error("Get payments error:", error);
    res.status(500).json({
      status: "error",
      message: `Failed to fetch payments`,
      error: error.message,
    });
  }
};
