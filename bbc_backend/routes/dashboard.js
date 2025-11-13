// routes/dashboard.js
const express = require("express");
const router = express.Router();
const getDashboard = require("../controllers/dashboardController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .get(protect, authorize("Admin", "Accountant"), getDashboard.getDashboard);

module.exports = router;
