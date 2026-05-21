const { body } = require("express-validator");
const { isAtLeastAge, NIC_PATTERN, PHONE_PATTERN, STRONG_PASSWORD_PATTERN } = require("../utils/validationPatterns");

const ROLES = ["admin", "doctor", "receptionist", "patient"];
const STATUSES = ["active", "inactive"];

const registerValidator = [
  body("name").trim().notEmpty().withMessage("name is required."),
  body("email").isEmail().withMessage("A valid email is required."),
  body("password")
    .matches(STRONG_PASSWORD_PATTERN)
    .withMessage("password must be at least 8 characters and include uppercase, lowercase, number, and special character."),
  body("role").optional().equals("admin").withMessage("Public setup registration can only create the initial admin account."),
];

const patientRegisterValidator = [
  body("fullName").trim().notEmpty().withMessage("fullName is required."),
  body("email").isEmail().withMessage("A valid email is required."),
  body("password")
    .matches(STRONG_PASSWORD_PATTERN)
    .withMessage("password must be at least 8 characters and include uppercase, lowercase, number, and special character."),
  body("gender").isIn(["male", "female", "other"]).withMessage("gender must be male, female, or other."),
  body("phone")
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("phone must be a valid Sri Lankan number, for example 0712345678 or +94712345678."),
  body("nic")
    .trim()
    .matches(NIC_PATTERN)
    .withMessage("nic must be a valid Sri Lankan NIC, for example 961234567V or 199612345678."),
  body("dateOfBirth")
    .isISO8601()
    .withMessage("dateOfBirth must be a valid ISO date.")
    .bail()
    .custom(isAtLeastAge(16))
    .withMessage("patient must be 16 years old or above."),
  body("address").trim().notEmpty().withMessage("address is required."),
  body("emergencyContact").optional().isObject().withMessage("emergencyContact must be an object."),
  body("emergencyContact.name").optional({ values: "falsy" }).trim(),
  body("emergencyContact.phone")
    .optional({ values: "falsy" })
    .trim()
    .matches(PHONE_PATTERN)
    .withMessage("emergency contact phone must be a valid Sri Lankan number."),
  body("emergencyContact.relationship").optional({ values: "falsy" }).trim(),
];

const loginValidator = [
  body("email").isEmail().withMessage("A valid email is required."),
  body("password").notEmpty().withMessage("password is required."),
];

const createUserValidator = [
  body("name").trim().notEmpty().withMessage("name is required."),
  body("email").isEmail().withMessage("A valid email is required."),
  body("password")
    .matches(STRONG_PASSWORD_PATTERN)
    .withMessage("password must be at least 8 characters and include uppercase, lowercase, number, and special character."),
  body("role").isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(", ")}.`),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const updateUserValidator = [
  body("name").optional().trim().notEmpty().withMessage("name cannot be empty when provided."),
  body("email").optional().isEmail().withMessage("A valid email is required."),
  body("password")
    .optional()
    .matches(STRONG_PASSWORD_PATTERN)
    .withMessage("password must be at least 8 characters and include uppercase, lowercase, number, and special character."),
  body("role").optional().isIn(ROLES).withMessage(`role must be one of: ${ROLES.join(", ")}.`),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const resetUserPasswordValidator = [
  body("password")
    .matches(STRONG_PASSWORD_PATTERN)
    .withMessage("password must be at least 8 characters and include uppercase, lowercase, number, and special character."),
];

module.exports = {
  ROLES,
  createUserValidator,
  loginValidator,
  patientRegisterValidator,
  registerValidator,
  resetUserPasswordValidator,
  updateUserValidator,
};
