const express = require("express");
const router = express.Router();
const paymentController = require("../controllers/paymentController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .post(
    protect,
    authorize("Admin", "Accountant"),
    paymentController.createPayment
  )
  .get(
    protect,
    authorize("Admin", "Accountant"),
    paymentController.getPayments
  );

router
  .route("/:id")
  .get(
    protect,
    authorize("Admin", "Accountant"),
    paymentController.getPaymentById
  )
  .put(
    protect,
    authorize("Admin", "Accountant"),
    paymentController.updatePayment
  )
  .delete(
    protect,
    authorize("Admin", "Accountant"),
    paymentController.deletePayment
  );

module.exports = router;
