const express = require("express");

const doctorController = require("../controllers/doctorController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { handleCloudinaryUpload } = require("../multer/cloudinaryUpload");
const validateRequest = require("../middleware/validateRequest");
const { createDoctorValidator, doctorQueryValidator, updateDoctorValidator } = require("../validators/doctorValidators");
const { idParamValidator } = require("../validators/sharedValidators");

const router = express.Router();

router.use(authenticate);

router
  .route("/")
  .get(authorizeRoles("admin", "receptionist", "doctor"), doctorQueryValidator, validateRequest, doctorController.list)
  .post(authorizeRoles("admin", "receptionist"), createDoctorValidator, validateRequest, doctorController.create);

router
  .route("/:id")
  .get(authorizeRoles("admin", "receptionist", "doctor"), idParamValidator, validateRequest, doctorController.getById)
  .put(authorizeRoles("admin", "receptionist"), idParamValidator, updateDoctorValidator, validateRequest, doctorController.update)
  .delete(authorizeRoles("admin"), idParamValidator, validateRequest, doctorController.remove);

router.post(
  "/:id/attachment",
  authorizeRoles("admin", "receptionist"),
  idParamValidator,
  validateRequest,
  handleCloudinaryUpload("doctors"),
  doctorController.uploadAttachment
);

router.delete("/:id/attachment", authorizeRoles("admin", "receptionist"), idParamValidator, validateRequest, doctorController.deleteAttachment);

module.exports = router;
