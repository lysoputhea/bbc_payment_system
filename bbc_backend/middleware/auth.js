const passport = require("passport");

// --- Unified response helper ---
const sendError = (res, code, message) => {
  return res.status(code).json({
    success: false,
    status: "error",
    error: { code, message },
  });
};

// --- Protect middleware (JWT validation) ---
const protect = (req, res, next) => {
  passport.authenticate("jwt", { session: false }, (err, user) => {
    if (err) {
      console.error("JWT authentication error:", err);
      return sendError(res, 401, "Unauthorized: Invalid or missing token");
    }

    if (!user) {
      return sendError(res, 401, "Unauthorized: Invalid or missing token");
    }

    req.user = user;
    next();
  })(req, res, next);
};

// --- Helper for branch restriction ---
const checkBranchRestriction = (req) => {
  if (req.user.role !== "accountant") return null;

  const branch_id =
    req.body.branch_id || req.query.branch_id || req.params.branch_id;

  if (!branch_id) return null;

  // Compare safely (handle number or string)
  if (String(req.user.branch_id) !== String(branch_id)) {
    return "Unauthorized: Access restricted to your assigned branch";
  }

  return null;
};

// --- Role-based authorization middleware ---
const authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return sendError(res, 401, "Unauthorized: Invalid or missing token");
    }

    // Check allowed roles
    if (!roles.includes(req.user.role)) {
      return sendError(
        res,
        403,
        `Access denied: ${req.user.role} role not authorized`
      );
    }

    // Branch restriction for accountants
    const branchError = checkBranchRestriction(req);
    if (branchError) {
      return sendError(res, 403, branchError);
    }

    next();
  };
};

module.exports = { protect, authorize };
