const express = require("express");

const medicalRecordController = require("../controllers/medicalRecordController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { handleCloudinaryUpload } = require("../multer/cloudinaryUpload");
const validateRequest = require("../middleware/validateRequest");
const {
  createMedicalRecordValidator,
  medicalRecordQueryValidator,
  updateMedicalRecordValidator,
} = require("../validators/medicalRecordValidators");
const { idParamValidator } = require("../validators/sharedValidators");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "doctor", "receptionist"));

router
  .route("/")
  .get(medicalRecordQueryValidator, validateRequest, medicalRecordController.list)
  .post(authorizeRoles("admin", "doctor"), createMedicalRecordValidator, validateRequest, medicalRecordController.create);

router
  .route("/:id")
  .get(idParamValidator, validateRequest, medicalRecordController.getById)
  .put(authorizeRoles("admin", "doctor"), idParamValidator, updateMedicalRecordValidator, validateRequest, medicalRecordController.update)
  .delete(authorizeRoles("admin"), idParamValidator, validateRequest, medicalRecordController.remove);

router.post(
  "/:id/attachment",
  authorizeRoles("admin", "doctor"),
  idParamValidator,
  validateRequest,
  handleCloudinaryUpload("medical-records"),
  medicalRecordController.uploadAttachment
);

router.delete("/:id/attachment", authorizeRoles("admin", "doctor"), idParamValidator, validateRequest, medicalRecordController.deleteAttachment);

module.exports = router;
