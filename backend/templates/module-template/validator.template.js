const { body, param } = require("express-validator");

const idParamValidator = [param("id").isMongoId().withMessage("Must be a valid MongoDB ObjectId.")];

const createValidator = [
  body("name").trim().notEmpty().withMessage("name is required."),
  body("description").optional({ values: "null" }).isString().withMessage("description must be text."),
  body("status").optional().isIn(["active", "inactive"]).withMessage("status must be active or inactive."),
];

const updateValidator = [
  body("name").optional().trim().notEmpty().withMessage("name cannot be empty when provided."),
  body("description").optional({ values: "null" }).isString().withMessage("description must be text."),
  body("status").optional().isIn(["active", "inactive"]).withMessage("status must be active or inactive."),
];

module.exports = {
  idParamValidator,
  createValidator,
  updateValidator,
};
