const express = require("express");

const doctorPortalController = require("../controllers/doctorPortalController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");
const { createDoctorPrescriptionValidator } = require("../validators/doctorPortalValidators");
const { idParamValidator } = require("../validators/sharedValidators");

const router = express.Router();

router.use(authenticate, authorizeRoles("doctor"));

router.get("/appointments", doctorPortalController.listMyAppointments);
router.get("/appointments/:id", idParamValidator, validateRequest, doctorPortalController.getMyAppointment);
router.post(
  "/appointments/:id/prescriptions",
  idParamValidator,
  createDoctorPrescriptionValidator,
  validateRequest,
  doctorPortalController.createPrescriptionForAppointment
);

module.exports = router;
