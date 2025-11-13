const express = require("express");
const router = express.Router();
const courseController = require("../controllers/courseController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .post(
    protect,
    authorize("Admin", "Accountant"),
    courseController.createCourse
  )
  .get(protect, authorize("Admin", "Accountant"), courseController.getCourses);

router
  .route("/:id")
  .put(protect, authorize("Admin", "Accountant"), courseController.updateCourse)
  .delete(
    protect,
    authorize("Admin", "Accountant"),
    courseController.deleteCourse
  );

module.exports = router;
