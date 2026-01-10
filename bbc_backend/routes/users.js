const express = require("express");
const router = express.Router();
const userController = require("../controllers/userController");
const { protect, authorize } = require("../middleware/auth");

router
  .route("/")
  .post(protect, authorize("Admin"), userController.createUser)
  .get(protect, authorize("Admin", "Accountant"), userController.getAllUsers);

router
  .route("/:id")
  .get(protect, authorize("Admin", "Accountant"), userController.getUserById)
  .put(protect, authorize("Admin"), userController.updateUser)
  .delete(protect, authorize("Admin"), userController.deleteUser);

// PUT /users/:id/change-password - Change user password (Admin only)
router.put(
  "/:id/change-password",
  protect,
  authorize("Admin", "Accountant"),
  userController.changePassword
);

// PUT /users/change-password - Change own password
// router.put(
//   "/change-own-password",
//   protect,
//   authorize("Admin", "Accountant"),
//   userController.changeOwnPassword
// );

module.exports = router;
