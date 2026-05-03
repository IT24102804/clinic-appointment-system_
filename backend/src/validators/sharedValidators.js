const { param } = require("express-validator");

const objectIdMessage = "Must be a valid MongoDB ObjectId.";

const idParamValidator = [param("id").isMongoId().withMessage(objectIdMessage)];

module.exports = {
  idParamValidator,
  objectIdMessage,
};
