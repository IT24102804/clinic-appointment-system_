const { body, query } = require("express-validator");
const { isEndTimeAfterStartTime, PHONE_PATTERN, TIME_PATTERN } = require("../utils/validationPatterns");

const AVAILABILITY = ["available", "unavailable", "on_leave"];
const DAYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const STATUSES = ["active", "inactive"];

const availabilityValidators = [
  body("availability").optional().isArray().withMessage("availability must be an array."),
  body("availability.*.dayOfWeek").optional().isIn(DAYS).withMessage(`dayOfWeek must be one of: ${DAYS.join(", ")}.`),
  body("availability.*.startTime").optional().matches(TIME_PATTERN).withMessage("startTime must be a valid HH:mm time."),
  body("availability.*.endTime")
    .optional()
    .matches(TIME_PATTERN)
    .withMessage("endTime must be a valid HH:mm time.")
    .custom(isEndTimeAfterStartTime)
    .withMessage("endTime must be after startTime."),
];

const createDoctorValidator = [
  body("fullName").trim().notEmpty().withMessage("fullName is required."),
  body("specialization").trim().notEmpty().withMessage("specialization is required."),
  body("phone")
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("phone must be a valid Sri Lankan number, for example 0712345678 or +94712345678."),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("email must be valid."),
  body("room").optional({ values: "null" }).isString().withMessage("room must be text."),
  body("experienceYears").optional().isInt({ min: 0 }).withMessage("experienceYears must be a valid number."),
  body("sessionFee").optional().isFloat({ min: 0 }).withMessage("sessionFee must be a valid number."),
  ...availabilityValidators,
  body("availabilityStatus")
    .optional()
    .isIn(AVAILABILITY)
    .withMessage(`availabilityStatus must be one of: ${AVAILABILITY.join(", ")}.`),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const updateDoctorValidator = [
  body("fullName").optional().trim().notEmpty().withMessage("fullName cannot be empty."),
  body("specialization").optional().trim().notEmpty().withMessage("specialization cannot be empty."),
  body("phone")
    .optional()
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("phone must be a valid Sri Lankan number, for example 0712345678 or +94712345678."),
  body("email").optional({ values: "falsy" }).isEmail().withMessage("email must be valid."),
  body("room").optional({ values: "null" }).isString().withMessage("room must be text."),
  body("experienceYears").optional().isInt({ min: 0 }).withMessage("experienceYears must be a valid number."),
  body("sessionFee").optional().isFloat({ min: 0 }).withMessage("sessionFee must be a valid number."),
  ...availabilityValidators,
  body("availabilityStatus")
    .optional()
    .isIn(AVAILABILITY)
    .withMessage(`availabilityStatus must be one of: ${AVAILABILITY.join(", ")}.`),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const doctorQueryValidator = [
  query("availabilityStatus")
    .optional()
    .isIn(AVAILABILITY)
    .withMessage(`availabilityStatus must be one of: ${AVAILABILITY.join(", ")}.`),
  query("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
  query("specialization").optional().isString().withMessage("specialization must be text."),
];

module.exports = {
  createDoctorValidator,
  doctorQueryValidator,
  updateDoctorValidator,
};
