const express = require("express");

const controller = require("../controllers/TODO_CONTROLLER_FILE");
const validateRequest = require("../middleware/validateRequest");
const {
  createValidator,
  idParamValidator,
  updateValidator,
} = require("../validators/TODO_VALIDATOR_FILE");

const router = express.Router();

router.route("/").get(controller.listEntities).post(createValidator, validateRequest, controller.createEntity);

router
  .route("/:id")
  .get(idParamValidator, validateRequest, controller.getEntity)
  .put(idParamValidator, updateValidator, validateRequest, controller.updateEntity)
  .delete(idParamValidator, validateRequest, controller.deleteEntity);

module.exports = router;
