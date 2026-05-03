const { body, query } = require("express-validator");
const { NIC_PATTERN, PHONE_PATTERN } = require("../utils/validationPatterns");

const GENDERS = ["male", "female", "other"];
const STATUSES = ["active", "inactive"];

const createPatientValidator = [
  body("fullName").trim().notEmpty().withMessage("fullName is required."),
  body("age").isInt({ min: 16 }).withMessage("age must be 16 or above."),
  body("gender").isIn(GENDERS).withMessage(`gender must be one of: ${GENDERS.join(", ")}.`),
  body("phone")
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("phone must be a valid Sri Lankan number, for example 0712345678 or +94712345678."),
  body("nic")
    .optional({ values: "falsy" })
    .trim()
    .matches(NIC_PATTERN)
    .withMessage("nic must be a valid Sri Lankan NIC, for example 961234567V or 199612345678."),
  body("dateOfBirth").isISO8601().withMessage("dateOfBirth must be a valid ISO date."),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("email must be valid."),
  body("address").optional({ values: "null" }).isString().withMessage("address must be text."),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const updatePatientValidator = [
  body("fullName").optional().trim().notEmpty().withMessage("fullName cannot be empty."),
  body("age").optional().isInt({ min: 16 }).withMessage("age must be 16 or above."),
  body("gender").optional().isIn(GENDERS).withMessage(`gender must be one of: ${GENDERS.join(", ")}.`),
  body("phone")
    .optional()
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("phone must be a valid Sri Lankan number, for example 0712345678 or +94712345678."),
  body("nic")
    .optional({ values: "falsy" })
    .trim()
    .matches(NIC_PATTERN)
    .withMessage("nic must be a valid Sri Lankan NIC, for example 961234567V or 199612345678."),
  body("dateOfBirth").optional({ values: "falsy" }).isISO8601().withMessage("dateOfBirth must be a valid ISO date."),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("email must be valid."),
  body("address").optional({ values: "null" }).isString().withMessage("address must be text."),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const updateMyPatientValidator = [
  body("phone")
    .optional()
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("phone must be a valid Sri Lankan number, for example 0712345678 or +94712345678."),
  body("gender").optional().isIn(GENDERS).withMessage(`gender must be one of: ${GENDERS.join(", ")}.`),
  body("address").optional({ values: "null" }).isString().withMessage("address must be text."),
  body("dateOfBirth").optional({ values: "falsy" }).isISO8601().withMessage("dateOfBirth must be a valid ISO date."),
  body("additionalAddresses").optional().isArray().withMessage("additionalAddresses must be an array."),
  body("additionalAddresses.*.label").optional({ values: "falsy" }).trim(),
  body("additionalAddresses.*.address").optional().trim().notEmpty().withMessage("additional address cannot be empty."),
  body("emergencyContact").optional().isObject().withMessage("emergencyContact must be an object."),
  body("emergencyContact.name").optional({ values: "falsy" }).trim(),
  body("emergencyContact.phone")
    .optional({ values: "falsy" })
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("emergency contact phone must be a valid Sri Lankan number."),
  body("emergencyContact.relationship").optional({ values: "falsy" }).trim(),
];

const patientQueryValidator = [
  query("gender").optional().isIn(GENDERS).withMessage(`gender must be one of: ${GENDERS.join(", ")}.`),
  query("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

module.exports = {
  createPatientValidator,
  patientQueryValidator,
  updateMyPatientValidator,
  updatePatientValidator,
};
