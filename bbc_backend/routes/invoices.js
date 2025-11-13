const express = require("express");
const router = express.Router();
const invoiceController = require("../controllers/invoiceController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .post(
    protect,
    authorize("Admin", "Accountant"),
    invoiceController.createInvoice
  )
  .get(
    protect,
    authorize("Admin", "Accountant"),
    invoiceController.getInvoices
  );

router
  .route("/:id")
  .get(protect, authorize("Admin", "Accountant"), invoiceController.getInvoice)
  .put(
    protect,
    authorize("Admin", "Accountant"),
    invoiceController.updateInvoice
  );

router
  .route("/:id/download")
  .get(
    protect,
    authorize("Admin", "Accountant"),
    invoiceController.downloadInvoice
  );

module.exports = router;
