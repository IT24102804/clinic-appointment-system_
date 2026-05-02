const router = require('express').Router();
const patientController = require('../controllers/paitientController');
const { protect, authorize } = require('../middleware/auth');

// All routes require authentication
router.use(protect);

// ---------- Patient self-service routes (role: patient) ----------
router.get('/me', authorize('patient'), patientController.getMyProfile);
router.patch('/me', authorize('patient'), patientController.updateMyProfile);
router.delete('/me/additional-addresses/:id', authorize('patient'), patientController.deleteMyAdditionalAddress);
router.delete('/me/emergency-contact', authorize('patient'), patientController.deleteMyEmergencyContact);

// ---------- Admin routes (role: admin) ----------
router.get('/', authorize('admin'), patientController.listAllPatients);
router.get('/:id', authorize('admin'), patientController.getPatientById);

module.exports = router;