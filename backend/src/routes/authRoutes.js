const router = require('express').Router();
const authController = require('../controllers/authController');
const { validateRegister, validateLogin, validateChangePassword } = require('../validators/authValidator');
const validateRequest = require('../middleware/validateRequest');
const { protect } = require('../middleware/auth');

router.post('/register', validateRegister, validateRequest, authController.register);
router.post('/login', validateLogin, validateRequest, authController.login);
router.post('/refresh', authController.refresh);
router.post('/logout', protect, authController.logout);
router.post('/change-password', protect, validateChangePassword, validateRequest, authController.changePassword);

module.exports = router;