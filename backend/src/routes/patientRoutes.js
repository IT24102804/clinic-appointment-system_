const express = require("express");

const patientController = require("../controllers/patientController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { handleCloudinaryUpload } = require("../multer/cloudinaryUpload");
const validateRequest = require("../middleware/validateRequest");
const {
  createPatientValidator,
  patientQueryValidator,
  updateMyPatientValidator,
  updatePatientValidator,
} = require("../validators/patientValidators");
const { idParamValidator } = require("../validators/sharedValidators");

const router = express.Router();

router.use(authenticate);

router
  .route("/me")
  .get(authorizeRoles("patient"), patientController.getMyProfile)
  .put(authorizeRoles("patient"), updateMyPatientValidator, validateRequest, patientController.updateMyProfile);

router.delete("/me/additional-addresses/:index", authorizeRoles("patient"), patientController.deleteMyAdditionalAddress);
router.delete("/me/emergency-contact", authorizeRoles("patient"), patientController.deleteMyEmergencyContact);

router
  .route("/")
  .get(authorizeRoles("admin", "receptionist"), patientQueryValidator, validateRequest, patientController.list)
  .post(authorizeRoles("admin", "receptionist"), createPatientValidator, validateRequest, patientController.create);

router
  .route("/:id")
  .get(authorizeRoles("admin", "receptionist"), idParamValidator, validateRequest, patientController.getById)
  .put(authorizeRoles("admin", "receptionist"), idParamValidator, updatePatientValidator, validateRequest, patientController.update)
  .delete(authorizeRoles("admin"), idParamValidator, validateRequest, patientController.remove);

router.post(
  "/:id/attachment",
  authorizeRoles("admin", "receptionist"),
  idParamValidator,
  validateRequest,
  handleCloudinaryUpload("patients"),
  patientController.uploadAttachment
);

router.delete("/:id/attachment", authorizeRoles("admin", "receptionist"), idParamValidator, validateRequest, patientController.deleteAttachment);

module.exports = router;
