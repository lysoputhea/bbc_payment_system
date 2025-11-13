// routes/paymentReportRoutes.js
const express = require("express");
const router = express.Router();
const { protect, authorize } = require("../middleware/auth.js");

const reportController = require("../controllers/reportController.js");

// router.get(
//   "/monthly",
//   protect,
//   authorize("Accountant", "Admin"),
//   reportController.getMonthlyStudentPayments
// );

router.get(
  "/monthly/branch",
  protect,
  authorize("Accountant", "Admin"),
  reportController.getMonthlyBranchPayments
);

router.get(
  "/monthly-branch-payments",
  protect,
  authorize("Accountant", "Admin"),
  reportController.getMonthlyBranchPayments
);

router.get(
  "/monthly-student-payments",
  protect,
  authorize("Accountant", "Admin"),
  reportController.getMonthlyStudentPayments
);

module.exports = router;
