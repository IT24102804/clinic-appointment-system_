const { body } = require("express-validator");

const DOSAGE_PATTERN = /^\d+(\.\d+)?\s?(mg|g|mcg|ml|l|tablet|tablets|capsule|capsules|drop|drops|puff|puffs|unit|units)$/i;
const DURATION_PATTERN = /^\d+\s?(day|days|week|weeks|month|months)$/i;

const createDoctorPrescriptionValidator = [
  body("diagnosis").trim().notEmpty().withMessage("diagnosis is required."),
  body("medicines").isArray({ min: 1 }).withMessage("At least one medicine is required."),
  body("medicines.*.name").trim().notEmpty().withMessage("Each medicine requires a name."),
  body("medicines.*.dosage")
    .trim()
    .matches(DOSAGE_PATTERN)
    .withMessage("Each medicine dosage must be like 5mg, 10 ml, 1 tablet, or 2 drops."),
  body("medicines.*.frequency").trim().notEmpty().withMessage("Each medicine requires a frequency."),
  body("medicines.*.duration")
    .trim()
    .matches(DURATION_PATTERN)
    .withMessage("Each medicine duration must be like 7 days, 2 weeks, or 1 month."),
  body("medicines.*.instructions").optional({ values: "falsy" }).isString().withMessage("Medicine instructions must be text."),
  body("notes").optional({ values: "falsy" }).isString().withMessage("notes must be text."),
];

module.exports = {
  createDoctorPrescriptionValidator,
};
