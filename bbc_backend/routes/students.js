const express = require("express");
const router = express.Router();
const studentController = require("../controllers/studentController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .post(
    protect,
    authorize("Admin", "Accountant"),
    studentController.createStudent
  )
  .get(
    protect,
    authorize("Admin", "Accountant"),
    studentController.getStudents
  );

router
  .route("/:id")
  .put(
    protect,
    authorize("Admin", "Accountant"),
    studentController.updateStudent
  )
  .delete(
    protect,
    authorize("Admin", "Accountant"),
    studentController.deleteStudent
  );

router.put(
  "/:id/deactivate",
  protect,
  authorize("Admin", "Accountant"),
  studentController.deactivateStudent
);

module.exports = router;
