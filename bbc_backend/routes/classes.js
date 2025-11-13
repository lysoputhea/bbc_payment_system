// This file defines the API routes for the Classes module.

const express = require("express");
const router = express.Router();
const classController = require("../controllers/classController"); // Adjust the path if needed
const { protect, authorize } = require("../middleware/auth");

// --- Class Routes ---

// Route to get all classes (with optional branch filter) and create a new class.
// Both Admins and Accountants can get classes, but only Admins can create them.
router
  .route("/")
  .get(protect, authorize("Admin", "Accountant"), classController.getAllClasses)
  .post(protect, authorize("Admin", "Accountant"), classController.createClass);

// Route to update or delete a specific class by its ID.
// Only Admins can update or delete classes.
router
  .route("/:id")
  .put(protect, authorize("Admin", "Accountant"), classController.updateClass)
  .delete(
    protect,
    authorize("Admin", "Accountant"),
    classController.deleteClass
  );

module.exports = router;
