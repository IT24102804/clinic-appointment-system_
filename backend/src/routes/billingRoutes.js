const express = require("express");

const billingController = require("../controllers/billingController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { handleCloudinaryUpload } = require("../multer/cloudinaryUpload");
const validateRequest = require("../middleware/validateRequest");
const { billingQueryValidator, createBillingValidator, updateBillingValidator } = require("../validators/billingValidators");
const { idParamValidator } = require("../validators/sharedValidators");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "receptionist"));

router
  .route("/")
  .get(billingQueryValidator, validateRequest, billingController.list)
  .post(createBillingValidator, validateRequest, billingController.create);

router
  .route("/:id")
  .get(idParamValidator, validateRequest, billingController.getById)
  .put(idParamValidator, updateBillingValidator, validateRequest, billingController.update)
  .delete(idParamValidator, validateRequest, billingController.remove);

router.post(
  "/:id/attachment",
  idParamValidator,
  validateRequest,
  handleCloudinaryUpload("billing"),
  billingController.uploadAttachment
);

router.delete("/:id/attachment", idParamValidator, validateRequest, billingController.deleteAttachment);

module.exports = router;
