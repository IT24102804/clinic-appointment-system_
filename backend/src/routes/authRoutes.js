const express = require("express");

const authController = require("../controllers/authController");
const { authenticate } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");
const { loginValidator, patientRegisterValidator, registerValidator } = require("../validators/authValidators");

const router = express.Router();

router.post("/register", registerValidator, validateRequest, authController.register);
router.post("/register-patient", patientRegisterValidator, validateRequest, authController.registerPatient);
router.post("/login", loginValidator, validateRequest, authController.login);
router.post("/refresh", authController.refresh);
router.post("/logout", authController.logout);
router.get("/me", authenticate, authController.getMe);

module.exports = router;
