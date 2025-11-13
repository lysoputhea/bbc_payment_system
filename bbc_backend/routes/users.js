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

router.put("/:id/change-password", protect, userController.changePassword);

// PUT /users/:id/change-password - Change user password (Admin only)
router.put(
  "/:id/change-password",
  protect,
  authorize("Admin"),
  userController.changePassword
);

// PUT /users/change-password - Change own password
router.put("/change-password", protect, userController.changeOwnPassword);

module.exports = router;

// // routes/users.js
// const express = require("express");
// const router = express.Router();
// const userController = require("../controllers/userController");
// const { authenticateToken, authorizeRole } = require("../middleware/auth"); // Assume these exist

// // GET /users - List all users (Admin only)
// router.get(
//   "/",
//   authenticateToken,
//   authorizeRole("Admin"),
//   userController.getUsers
// );

// // POST /users - Create new user (Admin only)
// router.post(
//   "/",
//   authenticateToken,
//   authorizeRole("Admin"),
//   userController.createUser
// );

// // PUT /users/:id - Update user (Admin only)
// router.put(
//   "/:id",
//   authenticateToken,
//   authorizeRole("Admin"),
//   userController.updateUser
// );

// // DELETE /users/:id - Delete user (Admin only)
// router.delete(
//   "/:id",
//   authenticateToken,
//   authorizeRole("Admin"),
//   userController.deleteUser
// );

// // PUT /users/:id/change-password - Change user password (Admin only)
// router.put(
//   "/:id/change-password",
//   authenticateToken,
//   authorizeRole("Admin"),
//   userController.changePassword
// );

// // PUT /users/change-password - Change own password
// router.put(
//   "/change-password",
//   authenticateToken,
//   userController.changeOwnPassword
// );

// module.exports = router;
