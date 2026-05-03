const express = require("express");

const patientPortalController = require("../controllers/patientPortalController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { handleCloudinaryUpload } = require("../multer/cloudinaryUpload");
const validateRequest = require("../middleware/validateRequest");
const {
  doctorSlotValidator,
  patientAppointmentValidator,
  patientDocumentValidator,
} = require("../validators/patientPortalValidators");
const { idParamValidator } = require("../validators/sharedValidators");

const router = express.Router();

router.use(authenticate, authorizeRoles("patient"));

router.get("/doctors", patientPortalController.listDoctors);
router.get("/doctors/:doctorId/slots", doctorSlotValidator, validateRequest, patientPortalController.getDoctorSlots);
router
  .route("/appointments")
  .get(patientPortalController.listMyAppointments)
  .post(patientAppointmentValidator, validateRequest, patientPortalController.createPatientAppointment);
router.get("/appointments/:id", idParamValidator, validateRequest, patientPortalController.getMyAppointment);
router.get("/prescriptions", patientPortalController.listMyPrescriptions);
router.get("/prescriptions/:id", idParamValidator, validateRequest, patientPortalController.getMyPrescription);
router.get("/billing", patientPortalController.listMyBills);
router.get("/billing/:id", idParamValidator, validateRequest, patientPortalController.getMyBill);
router.get("/medical-records", patientPortalController.listMyMedicalRecords);
router.get("/medical-records/:id", idParamValidator, validateRequest, patientPortalController.getMyMedicalRecord);
router
  .route("/documents")
  .get(patientPortalController.listMyDocuments)
  .post(
    patientDocumentValidator,
    validateRequest,
    handleCloudinaryUpload("patient-documents"),
    patientPortalController.uploadMyDocument
  );
router.delete("/documents/:id", idParamValidator, validateRequest, patientPortalController.deleteMyDocument);

module.exports = router;
