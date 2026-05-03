const express = require("express");

const appointmentController = require("../controllers/appointmentController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const { handleCloudinaryUpload } = require("../multer/cloudinaryUpload");
const validateRequest = require("../middleware/validateRequest");
const {
  appointmentQueryValidator,
  createAppointmentValidator,
  updateAppointmentValidator,
} = require("../validators/appointmentValidators");
const { idParamValidator } = require("../validators/sharedValidators");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "receptionist", "doctor"));

router
  .route("/")
  .get(appointmentQueryValidator, validateRequest, appointmentController.list)
  .post(authorizeRoles("admin", "receptionist"), createAppointmentValidator, validateRequest, appointmentController.create);

router
  .route("/:id")
  .get(idParamValidator, validateRequest, appointmentController.getById)
  .put(authorizeRoles("admin", "receptionist"), idParamValidator, updateAppointmentValidator, validateRequest, appointmentController.update)
  .delete(authorizeRoles("admin", "receptionist"), idParamValidator, validateRequest, appointmentController.remove);

router.post(
  "/:id/attachment",
  authorizeRoles("admin", "receptionist"),
  idParamValidator,
  validateRequest,
  handleCloudinaryUpload("appointments"),
  appointmentController.uploadAttachment
);

router.delete("/:id/attachment", authorizeRoles("admin", "receptionist"), idParamValidator, validateRequest, appointmentController.deleteAttachment);

module.exports = router;
