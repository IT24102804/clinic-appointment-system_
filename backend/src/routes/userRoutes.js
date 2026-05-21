const express = require("express");

const userController = require("../controllers/userController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");
const { createUserValidator, resetUserPasswordValidator, updateUserValidator } = require("../validators/authValidators");
const { idParamValidator } = require("../validators/sharedValidators");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin"));

router
  .route("/")
  .get(userController.listUsers)
  .post(createUserValidator, validateRequest, userController.createUser);

router.put("/:id/password", idParamValidator, resetUserPasswordValidator, validateRequest, userController.resetPassword);

router
  .route("/:id")
  .get(idParamValidator, validateRequest, userController.getUser)
  .put(idParamValidator, updateUserValidator, validateRequest, userController.updateUser)
  .delete(idParamValidator, validateRequest, userController.deactivateUser);

module.exports = router;
