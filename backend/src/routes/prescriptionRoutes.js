const express = require("express");

const prescriptionController = require("../controllers/prescriptionController");
const {
  requirePrescriptionReadAccess,
  requirePrescriptionWriteAccess,
} = require("../middleware/prescriptionAccess");
const { handlePrescriptionUpload } = require("../middleware/prescriptionUpload");
const validateRequest = require("../middleware/validateRequest");
const {
  createPrescriptionValidator,
  prescriptionIdParamValidator,
  prescriptionQueryValidator,
  updatePrescriptionValidator,
} = require("../validators/prescriptionValidators");

const router = express.Router();

router
  .route("/")
  .get(
    requirePrescriptionReadAccess,
    prescriptionQueryValidator,
    validateRequest,
    prescriptionController.listPrescriptions
  )
  .post(
    requirePrescriptionWriteAccess,
    createPrescriptionValidator,
    validateRequest,
    prescriptionController.createPrescription
  );

router
  .route("/:id")
  .get(
    requirePrescriptionReadAccess,
    prescriptionIdParamValidator,
    validateRequest,
    prescriptionController.getPrescription
  )
  .put(
    requirePrescriptionWriteAccess,
    prescriptionIdParamValidator,
    updatePrescriptionValidator,
    validateRequest,
    prescriptionController.updatePrescription
  )
  .delete(
    requirePrescriptionWriteAccess,
    prescriptionIdParamValidator,
    validateRequest,
    prescriptionController.deletePrescription
  );

router.post(
  "/:id/attachment",
  requirePrescriptionWriteAccess,
  prescriptionIdParamValidator,
  validateRequest,
  handlePrescriptionUpload,
  prescriptionController.uploadPrescriptionAttachment
);

router.delete(
  "/:id/attachment",
  requirePrescriptionWriteAccess,
  prescriptionIdParamValidator,
  validateRequest,
  prescriptionController.deletePrescriptionAttachment
);

module.exports = router;
