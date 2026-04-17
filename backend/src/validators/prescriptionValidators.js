const { body, param, query } = require("express-validator");

const STATUSES = ["draft", "issued", "cancelled"];
const objectIdMessage = "Must be a valid MongoDB ObjectId.";

const prescriptionIdParamValidator = [
  param("id").isMongoId().withMessage(objectIdMessage),
];

const prescriptionQueryValidator = [
  query("patientId").optional().isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  query("doctorId").optional().isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  query("appointmentId")
    .optional()
    .isMongoId()
    .withMessage("appointmentId must be a valid MongoDB ObjectId."),
  query("status")
    .optional()
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const createPrescriptionValidator = [
  body("appointmentId").isMongoId().withMessage("appointmentId must be a valid MongoDB ObjectId."),
  body("patientId").isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  body("doctorId").isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  body("diagnosis").trim().notEmpty().withMessage("diagnosis is required."),
  body("medicines")
    .isArray({ min: 1 })
    .withMessage("medicines must contain at least one medicine entry."),
  body("medicines.*.name").trim().notEmpty().withMessage("Each medicine requires a name."),
  body("medicines.*.dosage").trim().notEmpty().withMessage("Each medicine requires a dosage."),
  body("medicines.*.frequency").trim().notEmpty().withMessage("Each medicine requires a frequency."),
  body("medicines.*.duration").trim().notEmpty().withMessage("Each medicine requires a duration."),
  body("medicines.*.instructions")
    .optional({ values: "null" })
    .isString()
    .withMessage("Medicine instructions must be text."),
  body("notes").optional({ values: "null" }).isString().withMessage("notes must be text."),
  body("status")
    .optional()
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
  body("issuedAt")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("issuedAt must be a valid ISO date."),
];

const updatePrescriptionValidator = [
  body("appointmentId")
    .optional()
    .isMongoId()
    .withMessage("appointmentId must be a valid MongoDB ObjectId."),
  body("patientId").optional().isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  body("doctorId").optional().isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  body("diagnosis")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("diagnosis cannot be empty when provided."),
  body("medicines")
    .optional()
    .isArray({ min: 1 })
    .withMessage("medicines must contain at least one medicine entry."),
  body("medicines.*.name")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each medicine requires a name."),
  body("medicines.*.dosage")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each medicine requires a dosage."),
  body("medicines.*.frequency")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each medicine requires a frequency."),
  body("medicines.*.duration")
    .optional()
    .trim()
    .notEmpty()
    .withMessage("Each medicine requires a duration."),
  body("medicines.*.instructions")
    .optional({ values: "null" })
    .isString()
    .withMessage("Medicine instructions must be text."),
  body("notes").optional({ values: "null" }).isString().withMessage("notes must be text."),
  body("status")
    .optional()
    .isIn(STATUSES)
    .withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
  body("issuedAt")
    .optional({ values: "falsy" })
    .isISO8601()
    .withMessage("issuedAt must be a valid ISO date."),
];

module.exports = {
  STATUSES,
  createPrescriptionValidator,
  prescriptionIdParamValidator,
  prescriptionQueryValidator,
  updatePrescriptionValidator,
};
