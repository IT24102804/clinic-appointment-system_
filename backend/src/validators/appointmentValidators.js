const { body, query } = require("express-validator");

const STATUSES = ["booked", "rescheduled", "pending", "confirmed", "rejected", "completed", "cancelled"];

const createAppointmentValidator = [
  body("patientId").isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  body("doctorId").isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  body("appointmentDate").isISO8601().withMessage("appointmentDate must be a valid ISO date."),
  body("timeSlot").trim().notEmpty().withMessage("timeSlot is required."),
  body("reason").trim().notEmpty().withMessage("reason is required."),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const updateAppointmentValidator = [
  body("patientId").optional().isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  body("doctorId").optional().isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  body("appointmentDate").optional().isISO8601().withMessage("appointmentDate must be a valid ISO date."),
  body("timeSlot").optional().trim().notEmpty().withMessage("timeSlot cannot be empty."),
  body("reason").optional().trim().notEmpty().withMessage("reason cannot be empty."),
  body("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

const appointmentQueryValidator = [
  query("patientId").optional().isMongoId().withMessage("patientId must be a valid MongoDB ObjectId."),
  query("doctorId").optional().isMongoId().withMessage("doctorId must be a valid MongoDB ObjectId."),
  query("status").optional().isIn(STATUSES).withMessage(`status must be one of: ${STATUSES.join(", ")}.`),
];

module.exports = {
  appointmentQueryValidator,
  createAppointmentValidator,
  updateAppointmentValidator,
};
