const express = require("express");
const router = express.Router();
const branchController = require("../controllers/branchController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .post(protect, authorize("Admin"), branchController.createBranch)
  .get(protect, authorize("Admin", "Accountant"), branchController.getBranches);

router
  .route("/:id")
  .put(protect, authorize("Admin"), branchController.updateBranch)
  .delete(protect, authorize("Admin"), branchController.deleteBranch);

module.exports = router;
