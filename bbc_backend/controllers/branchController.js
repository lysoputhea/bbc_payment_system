const pool = require("../config/db");

exports.createBranch = async (req, res) => {
  try {
    const { branch_name, address, phone } = req.body;

    // Input validation
    if (!branch_name) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "Required field: branch_name" },
      });
    }
    if (typeof branch_name !== "string" || branch_name.trim() === "") {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "branch_name must be a non-empty string" },
      });
    }

    const [result] = await pool.query(
      "INSERT INTO Branches (branch_name, phone, address) VALUES (?, ?, ?)",
      [
        branch_name.trim(),
        phone ? phone.trim() : null,
        address ? address.trim() : null,
      ]
    );
    res.status(201).json({
      status: "success",
      data: {
        branch_id: result.insertId,
        branch_name: branch_name.trim(),
        phone: phone ? phone.trim() : null,
        address: address ? address.trim() : null,
      },
      message: "Branch created successfully",
    });
  } catch (error) {
    console.error("Create branch error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to create branch: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};

exports.getBranches = async (req, res) => {
  try {
    const [branches] = await pool.query("SELECT * FROM Branches");
    res.json({
      status: "success",
      data: { branches },
      message: branches.length
        ? "Branches retrieved successfully"
        : "No branches found",
    });
  } catch (error) {
    console.error("Get branches error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to fetch branches: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};

exports.getBranch = async (req, res) => {
  try {
    const branch_id = parseInt(req.params.id);
    if (!branch_id || !Number.isInteger(branch_id) || branch_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "branch_id must be a positive integer in URL parameter",
        },
      });
    }

    const [branches] = await pool.query(
      "SELECT * FROM Branches WHERE branch_id = ?",
      [branch_id]
    );
    if (!branches.length) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "Branch not found" },
      });
    }
    res.json({
      status: "success",
      data: { branch: branches[0] },
      message: "Branch retrieved successfully",
    });
  } catch (error) {
    console.error("Get branch error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to fetch branch: ${error.message || "Database error"}`,
      },
    });
  }
};

exports.updateBranch = async (req, res) => {
  try {
    const { branch_name, phone, address } = req.body;
    const branch_id = parseInt(req.params.id);

    // Input validation
    if (!branch_id || !Number.isInteger(branch_id) || branch_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "branch_id must be a positive integer in URL parameter",
        },
      });
    }
    if (!branch_name) {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "Required field: branch_name" },
      });
    }
    if (typeof branch_name !== "string" || branch_name.trim() === "") {
      return res.status(400).json({
        status: "error",
        error: { code: 400, message: "branch_name must be a non-empty string" },
      });
    }

    const [result] = await pool.query(
      "UPDATE Branches SET branch_name = ?, phone = ?, address = ?, updated_at = CURRENT_TIMESTAMP WHERE branch_id = ?",
      [
        branch_name.trim(),
        phone ? phone.trim() : null,
        address ? address.trim() : null,
        branch_id,
      ]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "Branch not found" },
      });
    }
    res.json({
      status: "success",
      data: result,
      message: "Branch updated successfully",
    });
  } catch (error) {
    console.error("Update branch error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to update branch: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};

exports.deleteBranch = async (req, res) => {
  try {
    const branch_id = parseInt(req.params.id);
    if (!branch_id || !Number.isInteger(branch_id) || branch_id <= 0) {
      return res.status(400).json({
        status: "error",
        error: {
          code: 400,
          message: "branch_id must be a positive integer in URL parameter",
        },
      });
    }

    const [result] = await pool.query(
      "DELETE FROM Branches WHERE branch_id = ?",
      [branch_id]
    );
    if (result.affectedRows === 0) {
      return res.status(404).json({
        status: "error",
        error: { code: 404, message: "Branch not found" },
      });
    }
    res.json({
      status: "success",
      data: null,
      message: "Branch deleted successfully",
    });
  } catch (error) {
    console.error("Delete branch error:", error);
    res.status(500).json({
      status: "error",
      error: {
        code: 500,
        message: `Failed to delete branch: ${
          error.message || "Database error"
        }`,
      },
    });
  }
};
