const express = require("express");
const router = express.Router();
const studentCourseController = require("../controllers/enrollmentController.js");
const { protect, authorize } = require("../middleware/auth.js");

router
  .route("/")
  .post(
    protect,
    authorize("Admin", "Accountant"),
    studentCourseController.createStudentAndEnroll
  )
  .get(
    protect,
    authorize("Admin", "Accountant"),
    studentCourseController.getEnrollments
  );

router.put(
  "/:enrollment_id",
  protect,
  authorize("Admin", "Accountant"),
  studentCourseController.updateEnrollment
);

router.delete(
  "/:enrollment_id",
  protect,
  authorize("Admin", "Accountant"),
  studentCourseController.deleteEnrollment
);

module.exports = router;
