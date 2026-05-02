const { body } = require('express-validator');

// Password policy: min 8 chars, at least one uppercase, one lowercase, one number, one special char.
const PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^A-Za-z0-9]).{8,}$/;
const PASSWORD_MESSAGE =
  'Password must be at least 8 characters and include uppercase, lowercase, number, and special character.';

const passwordValidator = (field = 'password') =>
  body(field)
    .isString()
    .withMessage(`${field} required`)
    .matches(PASSWORD_REGEX)
    .withMessage(PASSWORD_MESSAGE);

exports.PASSWORD_REGEX = PASSWORD_REGEX;
exports.PASSWORD_MESSAGE = PASSWORD_MESSAGE;

exports.validateRegister = [
  body('firstName').trim().notEmpty().withMessage('First name required'),
  body('lastName').trim().notEmpty().withMessage('Last name required'),
  body('email').isEmail().withMessage('Valid email required').normalizeEmail(),
  passwordValidator('password'),
  body('phone')
    .customSanitizer((v) => String(v || '').replace(/\D/g, ''))
    .matches(/^\d{10}$/)
    .withMessage('Phone must be exactly 10 digits'),
  body('NIC')
    .trim()
    .notEmpty()
    .withMessage('NIC required')
    .matches(/^(\d{9}[VvXx]|\d{12})$/)
    .withMessage('NIC must be 9 digits followed by V/X, or 12 digits'),
  body('dateOfBirth').isISO8601().withMessage('Valid date required (YYYY-MM-DD)'),
  body('gender').isIn(['Male', 'Female', 'Other']).withMessage('Gender must be Male, Female, or Other'),
  body('address').notEmpty().withMessage('Address required'),
];

exports.validateLogin = [
  body('email').isEmail().withMessage('Valid email required'),
  body('password').notEmpty().withMessage('Password required'),
];

exports.validateChangePassword = [
  body('currentPassword').isString().notEmpty().withMessage('Current password required'),
  passwordValidator('newPassword'),
];