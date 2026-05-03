const { body, param, query } = require("express-validator");

const DOCUMENT_STATUSES = ["submitted", "reviewed", "rejected", "linked_to_record"];
const DOCUMENT_TYPES = ["lab_report", "previous_prescription", "scan_report", "referral_letter", "other"];

const patientAppointmentValidator = [
  body("doctorId").isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  body("appointmentDate").isISO8601().withMessage("appointmentDate must be a valid ISO date."),
  body("timeSlot").trim().notEmpty().withMessage("timeSlot is required."),
  body("reason").trim().notEmpty().withMessage("reason is required."),
];

const doctorSlotValidator = [
  param("doctorId").isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  query("date").isISO8601().withMessage("date must be a valid ISO date."),
];

const patientDocumentValidator = [
  body("title").optional({ values: "falsy" }).trim(),
  body("description").optional({ values: "falsy" }).trim(),
  body("documentType").optional().isIn(DOCUMENT_TYPES).withMessage(`documentType must be one of: ${DOCUMENT_TYPES.join(", ")}.`),
];

const reviewPatientDocumentValidator = [
  body("status").isIn(DOCUMENT_STATUSES).withMessage(`status must be one of: ${DOCUMENT_STATUSES.join(", ")}.`),
  body("reviewNotes").optional({ values: "falsy" }).trim(),
];

module.exports = {
  doctorSlotValidator,
  patientAppointmentValidator,
  patientDocumentValidator,
  reviewPatientDocumentValidator,
};
