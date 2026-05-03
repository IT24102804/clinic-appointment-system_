const { body, query } = require("express-validator");

const STATUSES = ["active", "archived"];

const createMedicalRecordValidator = [
  body("patientId").optional().isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  body("doctorId").optional().isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  body("appointmentId").isMongoId().withMessage("appointmentId must be a valid MongoDB ObjectId."),
  body("visitSummary").trim().notEmpty().withMessage("visitSummary is required."),
  body("diagnosis").trim().notEmpty().withMessage("diagnosis is required."),
  body("treatmentNotes").trim().notEmpty().withMessage("treatmentNotes is required."),
  body("recordDate").isISO8601().withMessage("recordDate must be a valid ISO date."),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const updateMedicalRecordValidator = [
  body("patientId").optional().isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  body("doctorId").optional().isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  body("appointmentId").optional().isMongoId().withMessage("appointmentId must be a valid MongoDB ObjectId."),
  body("visitSummary").optional().trim().notEmpty().withMessage("visitSummary cannot be empty."),
  body("diagnosis").optional().trim().notEmpty().withMessage("diagnosis cannot be empty."),
  body("treatmentNotes").optional().trim().notEmpty().withMessage("treatmentNotes cannot be empty."),
  body("recordDate").optional().isISO8601().withMessage("recordDate must be a valid ISO date."),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const medicalRecordQueryValidator = [
  query("patientId").optional().isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  query("doctorId").optional().isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  query("appointmentId").optional().isMongoId().withMessage("appointmentId must be a valid MongoDB ObjectId."),
  query("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

module.exports = {
  createMedicalRecordValidator,
  medicalRecordQueryValidator,
  updateMedicalRecordValidator,
};
