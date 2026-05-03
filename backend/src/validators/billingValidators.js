const { body, query } = require("express-validator");

const PAYMENT_METHODS = ["cash", "card", "online", "insurance"];
const PAYMENT_STATUSES = ["pending", "paid", "cancelled"];

const createBillingValidator = [
  body("patientId").isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  body("appointmentId").isMongoId().withMessage("appointmentId must be a valid MongoDB ObjectId."),
  body("amount").isFloat({ min: 0 }).withMessage("amount must be a valid positive number."),
  body("billDate").isISO8601().withMessage("billDate must be a valid ISO date."),
  body("paymentMethod")
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage(`paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}.`),
  body("paymentStatus")
    .optional()
    .isIn(PAYMENT_STATUSES)
    .withMessage(`paymentStatus must be one of: ${PAYMENT_STATUSES.join(", ")}.`),
  body("notes").optional({ values: "null" }).isString().withMessage("notes must be text."),
];

const updateBillingValidator = [
  body("patientId").optional().isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  body("appointmentId").optional().isMongoId().withMessage("appointmentId must be a valid MongoDB ObjectId."),
  body("amount").optional().isFloat({ min: 0 }).withMessage("amount must be a valid positive number."),
  body("billDate").optional().isISO8601().withMessage("billDate must be a valid ISO date."),
  body("paymentMethod")
    .optional()
    .isIn(PAYMENT_METHODS)
    .withMessage(`paymentMethod must be one of: ${PAYMENT_METHODS.join(", ")}.`),
  body("paymentStatus")
    .optional()
    .isIn(PAYMENT_STATUSES)
    .withMessage(`paymentStatus must be one of: ${PAYMENT_STATUSES.join(", ")}.`),
  body("notes").optional({ values: "null" }).isString().withMessage("notes must be text."),
];

const billingQueryValidator = [
  query("patientId").optional().isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  query("appointmentId").optional().isMongoId().withMessage("appointmentId must be a valid MongoDB ObjectId."),
  query("paymentStatus")
    .optional()
    .isIn(PAYMENT_STATUSES)
    .withMessage(`paymentStatus must be one of: ${PAYMENT_STATUSES.join(", ")}.`),
];

module.exports = {
  billingQueryValidator,
  createBillingValidator,
  updateBillingValidator,
};
