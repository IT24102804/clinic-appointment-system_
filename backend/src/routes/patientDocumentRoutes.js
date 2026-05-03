const express = require("express");

const patientPortalController = require("../controllers/patientPortalController");
const { authenticate, authorizeRoles } = require("../middleware/auth");
const validateRequest = require("../middleware/validateRequest");
const { reviewPatientDocumentValidator } = require("../validators/patientPortalValidators");
const { idParamValidator } = require("../validators/sharedValidators");

const router = express.Router();

router.use(authenticate, authorizeRoles("admin", "doctor", "receptionist"));

router.get("/", patientPortalController.listAllPatientDocuments);
router.put("/:id/review", idParamValidator, reviewPatientDocumentValidator, validateRequest, patientPortalController.reviewPatientDocument);

module.exports = router;
