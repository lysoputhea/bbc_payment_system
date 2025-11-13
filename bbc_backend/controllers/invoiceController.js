const pool = require("../config/db");
const PDFDocument = require("pdfkit");

exports.createInvoice = async (req, res) => {
  try {
    const {
      student_id,
      payment_id,
      branch_id,
      issue_date,
      due_date,
      total_amount,
      discount_amount = 0.0,
      status,
    } = req.body;

    // Input validation
    if (
      !student_id ||
      !payment_id ||
      !branch_id ||
      !issue_date ||
      !due_date ||
      !total_amount ||
      !status
    ) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message:
            "Required fields: student_id, payment_id, branch_id, issue_date, due_date, total_amount, status",
        },
      });
    }
    if (!Number.isInteger(student_id) || student_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "student_id must be a positive integer" },
      });
    }
    if (!Number.isInteger(payment_id) || payment_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "payment_id must be a positive integer" },
      });
    }
    if (!Number.isInteger(branch_id) || branch_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "branch_id must be a positive integer" },
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(issue_date)) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "issue_date must be in YYYY-MM-DD format",
        },
      });
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "due_date must be in YYYY-MM-DD format" },
      });
    }
    if (new Date(issue_date) > new Date(due_date)) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "due_date must be after issue_date" },
      });
    }
    if (typeof total_amount !== "number" || total_amount <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "total_amount must be a number greater than 0",
        },
      });
    }
    if (typeof discount_amount !== "number" || discount_amount < 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "discount_amount must be a non-negative number",
        },
      });
    }
    if (!["Pending", "Paid", "Overdue"].includes(status)) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: 'status must be "Pending", "Paid", or "Overdue"',
        },
      });
    }

    // Validate branch, student, and payment
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
      "SELECT student_id, first_name, last_name, gender FROM Students WHERE student_id = ? AND branch_id = ?",
      [student_id, branch_id]
    );
    if (!students.length) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "Invalid student_id: Student does not exist in this branch",
        },
      });
    }
    const [payments] = await pool.query(
      "SELECT p.payment_id, p.student_id, p.course_id, p.amount, p.payment_period_type, p.description " +
        "FROM Payments p WHERE p.payment_id = ? AND p.branch_id = ? AND p.student_id = ?",
      [payment_id, branch_id, student_id]
    );
    if (!payments.length) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message:
            "Invalid payment_id: Payment does not exist for this student and branch",
        },
      });
    }
    const payment = payments[0];

    // Validate enrollment if payment is tied to a course
    if (payment.course_id) {
      const [enrollments] = await pool.query(
        "SELECT enrollment_id FROM Enrollments WHERE student_id = ? AND course_id = ?",
        [student_id, payment.course_id]
      );
      if (!enrollments.length) {
        return res.status(400).json({
          status: "error",
          error: {
            code: 400,
            message:
              "Invalid enrollment: Student is not enrolled in the course associated with this payment",
          },
        });
      }
      const [courses] = await pool.query(
        "SELECT course_id, price FROM Courses WHERE course_id = ? AND branch_id = ?",
        [payment.course_id, branch_id]
      );
      if (!courses.length) {
        return res.status(400).json({
          status: "error",
          error: {
            code: 400,
            message: "Invalid course_id: Course does not exist in this branch",
          },
        });
      }
      if (total_amount > courses[0].price) {
        return res.status(400).json({
          status: "error",
          error: {
            code: 400,
            message: "total_amount cannot exceed course price",
          },
        });
      }
    }
    if (req.user.role === "Accountant" && branch_id !== req.user.branch_id) {
      return res.status(403).json({
        status: "error",
        error: {
          code: 403,
          message:
            "Unauthorized: Accountants can only create invoices in their assigned branch",
        },
      });
    }
    if (total_amount - discount_amount <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "total_amount minus discount_amount must be greater than 0",
        },
      });
    }

    const [result] = await pool.query(
      "INSERT INTO Invoices (student_id, payment_id, branch_id, issue_date, due_date, total_amount, discount_amount, status) VALUES (?, ?, ?, ?, ?, ?, ?, ?)",
      [
        student_id,
        payment_id,
        branch_id,
        issue_date,
        due_date,
        total_amount,
        discount_amount,
        status,
      ]
    );

    res.status(201).json({
      status: "success",
      data: {
        invoice_id: result.insertId,
        student_id,
        payment_id,
        branch_id,
        issue_date,
        due_date,
        total_amount,
        discount_amount,
        status,
      },
      message: "Invoice created successfully",
    });
  } catch (error) {
    console.error("Create invoice error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to create invoice: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};

exports.getInvoices = async (req, res) => {
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

    // For Admins, allow fetching all invoices if branch_id is not provided
    if (req.user.role === "Admin" && !branch_id) {
      const [invoices] = await pool.query(
        "SELECT i.*, s.first_name, s.last_name, p.course_id, p.payment_period_type, p.description AS payment_description, c.course_name, b.branch_name " +
          "FROM Invoices i " +
          "JOIN Students s ON i.student_id = s.student_id " +
          "JOIN Payments p ON i.payment_id = p.payment_id " +
          "LEFT JOIN Courses c ON p.course_id = c.course_id " +
          "JOIN Branches b ON i.branch_id = b.branch_id"
      );
      return res.json({
        status: "success",
        data: invoices,
        message: invoices.length
          ? "All invoices retrieved successfully"
          : "No invoices found",
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

    const [invoices] = await pool.query(
      "SELECT i.*, s.first_name, s.last_name, p.course_id, p.payment_period_type, p.description AS payment_description, c.course_name, b.branch_name " +
        "FROM Invoices i " +
        "JOIN Students s ON i.student_id = s.student_id " +
        "JOIN Payments p ON i.payment_id = p.payment_id " +
        "LEFT JOIN Courses c ON p.course_id = c.course_id " +
        "JOIN Branches b ON i.branch_id = b.branch_id " +
        "WHERE i.branch_id = ?",
      [branch_id]
    );
    res.json({
      status: "success",
      data: invoices,
      message: invoices.length
        ? `Invoices for branch ${branch_id} retrieved successfully`
        : `No invoices found for branch ${branch_id}`,
    });
  } catch (error) {
    console.error("Get invoices error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to fetch invoices: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};

exports.getInvoice = async (req, res) => {
  try {
    const invoice_id = parseInt(req.params.id);
    const branch_id =
      req.user.role === "Accountant"
        ? req.user.branch_id
        : parseInt(req.query.branch_id);

    // Validate inputs
    if (!invoice_id || !Number.isInteger(invoice_id) || invoice_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "invoice_id must be a positive integer in URL parameter",
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

    const [invoices] = await pool.query(
      "SELECT i.*, s.first_name, s.last_name, s.gender, p.course_id, p.payment_period_type, p.description AS payment_description, c.course_name, b.branch_name " +
        "FROM Invoices i " +
        "JOIN Students s ON i.student_id = s.student_id " +
        "JOIN Payments p ON i.payment_id = p.payment_id " +
        "LEFT JOIN Courses c ON p.course_id = c.course_id " +
        "JOIN Branches b ON i.branch_id = b.branch_id " +
        "WHERE i.invoice_id = ? AND i.branch_id = ?",
      [invoice_id, branch_id]
    );
    if (!invoices.length) {
      return res.status(404).json({
        status: "error",
        error: {
          code: 404,
          message: "Invoice not found or unauthorized for this branch",
        },
      });
    }
    res.json({
      status: "success",
      data: invoices[0],
      message: "Invoice retrieved successfully",
    });
  } catch (error) {
    console.error("Get invoice error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to fetch invoice: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};

exports.updateInvoice = async (req, res) => {
  try {
    const invoice_id = parseInt(req.params.id);
    const { issue_date, due_date, total_amount, discount_amount, status } =
      req.body;
    const branch_id =
      req.user.role === "Accountant"
        ? req.user.branch_id
        : parseInt(req.query.branch_id);

    // Validate inputs
    if (!invoice_id || !Number.isInteger(invoice_id) || invoice_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "invoice_id must be a positive integer in URL parameter",
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
    if (issue_date && !/^\d{4}-\d{2}-\d{2}$/.test(issue_date)) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "issue_date must be in YYYY-MM-DD format",
        },
      });
    }
    if (due_date && !/^\d{4}-\d{2}-\d{2}$/.test(due_date)) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "due_date must be in YYYY-MM-DD format" },
      });
    }
    if (issue_date && due_date && new Date(issue_date) > new Date(due_date)) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "due_date must be after issue_date" },
      });
    }
    if (
      total_amount !== undefined &&
      (typeof total_amount !== "number" || total_amount <= 0)
    ) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "total_amount must be a number greater than 0",
        },
      });
    }
    if (
      discount_amount !== undefined &&
      (typeof discount_amount !== "number" || discount_amount < 0)
    ) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "discount_amount must be a non-negative number",
        },
      });
    }
    if (status && !["Pending", "Paid", "Overdue"].includes(status)) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: 'status must be "Pending", "Paid", or "Overdue"',
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
            "Unauthorized: Accountants can only update invoices in their assigned branch",
        },
      });
    }

    // Check if invoice exists
    const [invoices] = await pool.query(
      "SELECT i.*, p.course_id, p.student_id AS payment_student_id " +
        "FROM Invoices i JOIN Payments p ON i.payment_id = p.payment_id " +
        "WHERE i.invoice_id = ? AND i.branch_id = ?",
      [invoice_id, branch_id]
    );
    if (!invoices.length) {
      return res.status(404).json({
        status: "error",
        error: {
          code: 404,
          message: "Invoice not found or unauthorized for this branch",
        },
      });
    }
    const existingInvoice = invoices[0];

    // Validate payment and enrollment if payment is tied to a course
    if (existingInvoice.course_id) {
      const [enrollments] = await pool.query(
        "SELECT enrollment_id FROM Enrollments WHERE student_id = ? AND course_id = ?",
        [existingInvoice.payment_student_id, existingInvoice.course_id]
      );
      if (!enrollments.length) {
        return res.status(400).json({
          status: "error",
          error: {
            code: 400,
            message:
              "Invalid enrollment: Student is not enrolled in the course associated with this payment",
          },
        });
      }
      const [courses] = await pool.query(
        "SELECT course_id, price FROM Courses WHERE course_id = ? AND branch_id = ?",
        [existingInvoice.course_id, branch_id]
      );
      if (!courses.length) {
        return res.status(400).json({
          status: "error",
          error: {
            code: 400,
            message: "Invalid course_id: Course does not exist in this branch",
          },
        });
      }
      if (total_amount !== undefined && total_amount > courses[0].price) {
        return res.status(400).json({
          status: "error",
          error: {
            code: 400,
            message: "total_amount cannot exceed course price",
          },
        });
      }
    }
    const newTotalAmount =
      total_amount !== undefined ? total_amount : existingInvoice.total_amount;
    const newDiscountAmount =
      discount_amount !== undefined
        ? discount_amount
        : existingInvoice.discount_amount;
    if (newTotalAmount - newDiscountAmount <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "total_amount minus discount_amount must be greater than 0",
        },
      });
    }

    // Build update query dynamically
    const updates = {};
    if (issue_date) updates.issue_date = issue_date;
    if (due_date) updates.due_date = due_date;
    if (total_amount !== undefined) updates.total_amount = total_amount;
    if (discount_amount !== undefined)
      updates.discount_amount = discount_amount;
    if (status) updates.status = status;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "No valid fields provided for update" },
      });
    }

    const updateFields = Object.keys(updates)
      .map((key) => `${key} = ?`)
      .join(", ");
    const updateValues = Object.values(updates).concat([invoice_id, branch_id]);

    const [result] = await pool.query(
      `UPDATE Invoices SET ${updateFields} WHERE invoice_id = ? AND branch_id = ?`,
      updateValues
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        error: {
          code: 404,
          message: "Invoice not found or unauthorized for this branch",
        },
      });
    }

    // Fetch updated invoice
    const [updatedInvoices] = await pool.query(
      "SELECT i.*, s.first_name, s.last_name, p.course_id, p.payment_period_type, p.description AS payment_description, c.course_name, b.branch_name " +
        "FROM Invoices i " +
        "JOIN Students s ON i.student_id = s.student_id " +
        "JOIN Payments p ON i.payment_id = p.payment_id " +
        "LEFT JOIN Courses c ON p.course_id = c.course_id " +
        "JOIN Branches b ON i.branch_id = b.branch_id " +
        "WHERE i.invoice_id = ? AND i.branch_id = ?",
      [invoice_id, branch_id]
    );

    res.json({
      status: "success",
      data: updatedInvoices[0],
      message: "Invoice updated successfully",
    });
  } catch (error) {
    console.error("Update invoice error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to update invoice: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};

exports.downloadInvoice = async (req, res) => {
  try {
    const invoice_id = parseInt(req.params.id);
    const branch_id =
      req.user.role === "Accountant"
        ? req.user.branch_id
        : parseInt(req.query.branch_id);

    // Validate inputs
    if (!invoice_id || !Number.isInteger(invoice_id) || invoice_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "invoice_id must be a positive integer in URL parameter",
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

    const [invoices] = await pool.query(
      "SELECT i.*, s.first_name, s.last_name, p.course_id, p.payment_period_type, p.description AS payment_description, c.course_name, b.branch_name " +
        "FROM Invoices i " +
        "JOIN Students s ON i.student_id = s.student_id " +
        "JOIN Payments p ON i.payment_id = p.payment_id " +
        "LEFT JOIN Courses c ON p.course_id = c.course_id " +
        "JOIN Branches b ON i.branch_id = b.branch_id " +
        "WHERE i.invoice_id = ? AND i.branch_id = ?",
      [invoice_id, branch_id]
    );
    if (!invoices.length) {
      return res.status(404).json({
        status: "error",
        error: {
          code: 404,
          message: "Invoice not found or unauthorized for this branch",
        },
      });
    }

    const invoice = invoices[0];
    const doc = new PDFDocument();
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename=invoice_${invoice_id}.pdf`
    );

    doc.pipe(res);
    doc.fontSize(20).text("Invoice", { align: "center" });
    doc.moveDown();
    doc.fontSize(14).text(`Invoice ID: ${invoice.invoice_id}`);
    doc.text(`Student: ${invoice.first_name} ${invoice.last_name}`);
    doc.text(`Email: ${invoice.email}`);
    if (invoice.course_name) doc.text(`Course: ${invoice.course_name}`);
    doc.text(`Branch: ${invoice.branch_name}`);
    doc.text(`Payment Period: ${invoice.payment_period_type}`);
    if (invoice.payment_description)
      doc.text(`Payment Description: ${invoice.payment_description}`);
    doc.text(`Issue Date: ${invoice.issue_date}`);
    doc.text(`Due Date: ${invoice.due_date}`);
    doc.text(`Total Amount: $${invoice.total_amount}`);
    doc.text(`Discount Amount: $${invoice.discount_amount}`);
    doc.text(
      `Final Amount: $${(
        invoice.total_amount - invoice.discount_amount
      ).toFixed(2)}`
    );
    doc.text(`Status: ${invoice.status}`);
    doc.end();
  } catch (error) {
    console.error("Download invoice error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to download invoice: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};
