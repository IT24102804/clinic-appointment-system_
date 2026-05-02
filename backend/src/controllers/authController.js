const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const User = require('../models/User');
const Patient = require('../models/Patient');  
// ------------------ Helper functions ------------------
const hashPassword = async (password) => bcrypt.hash(password, 10);
const comparePassword = async (plain, hashed) => bcrypt.compare(plain, hashed);

const generateAccessToken = (user) => {
  if (!process.env.JWT_ACCESS_SECRET) {
    const error = new Error("JWT_ACCESS_SECRET is not configured.");
    error.statusCode = 500;
    throw error;
  }

  return jwt.sign(
    { id: user._id, role: user.role },
    process.env.JWT_ACCESS_SECRET,
    { expiresIn: process.env.ACCESS_TOKEN_EXPIRY || '15m' }
  );
};

const generateRefreshToken = () => crypto.randomBytes(40).toString('hex');

const saveRefreshToken = async (userId, refreshToken) => {
  const expiry = new Date();
  expiry.setDate(expiry.getDate() + 7);
  await User.findByIdAndUpdate(userId, {
    refreshToken,
    refreshTokenExpiry: expiry
  });
};

const clearRefreshToken = async (userId) => {
  await User.findByIdAndUpdate(userId, {
    refreshToken: null,
    refreshTokenExpiry: null
  });
};

// ------------------ Register ------------------
exports.register = async (req, res) => {
  try {
    const { firstName, lastName, email, password, phone, NIC, dateOfBirth, gender, address } = req.body;
    const normalizedEmail = String(email || '').trim().toLowerCase();
    const normalizedNIC = String(NIC || '').trim().toUpperCase();
    const normalizedPhone = String(phone || '').trim();

    // 1. Check if email already exists
    const existingEmail = await User.findOne({ email: normalizedEmail });
    if (existingEmail) {
      return res.status(409).json({ success: false, message: 'Email already registered' });
    }

    // 2. Check if NIC already exists in Patient collection
    const existingNIC = await Patient.findOne({ NIC: normalizedNIC });
    if (existingNIC) {
      return res.status(409).json({ success: false, message: 'NIC already registered' });
    }

    // 3. Check if phone already exists in Patient collection
    const existingPhone = await Patient.findOne({ phone: normalizedPhone });
    if (existingPhone) {
      return res.status(409).json({ success: false, message: 'Phone already registered' });
    }

    // 4. Hash password
    const hashedPassword = await hashPassword(password);

    // 5. Create User document
    const user = new User({
      firstName,
      lastName,
      email: normalizedEmail,
      password: hashedPassword,
      role: 'patient',
      status: 'active'
    });
    await user.save();

    let createdPatient = null;
    try {
      // 6. Create Patient profile linked to this user
      const patient = new Patient({
        userId: user._id,
        NIC: normalizedNIC,
        phone: normalizedPhone,
        dateOfBirth,
        gender,
        address,                  // main address string
        additionalAddresses: [],  // start empty
        emergencyContact: null
      });
      await patient.save();
      createdPatient = patient;

      // 7. Link profileId in User
      user.profileId = patient._id;
      await user.save();
    } catch (err) {
      if (createdPatient?._id) {
        try {
          await Patient.findByIdAndDelete(createdPatient._id);
        } catch (cleanupError) {
          // ignore cleanup error
        }
      }
      await User.findByIdAndDelete(user._id);
      throw err;
    }

    // 8. Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user._id, refreshToken);

    // 9. Send response
    res.status(201).json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    if (error && (error.code === 11000 || error.code === 11001)) {
      const key = Object.keys(error.keyPattern || error.keyValue || {})[0] || 'field';
      return res.status(409).json({ success: false, message: `${key} already registered` });
    }

    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Login ------------------
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    const isMatch = await comparePassword(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid credentials' });
    }

    if (user.status !== 'active') {
      return res.status(401).json({ success: false, message: 'Account deactivated' });
    }

    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken();
    await saveRefreshToken(user._id, refreshToken);

    res.json({
      success: true,
      accessToken,
      refreshToken,
      user: {
        id: user._id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Refresh ------------------
exports.refresh = async (req, res) => {
  try {
    const { refreshToken } = req.body;
    if (!refreshToken) {
      return res.status(400).json({ success: false, message: 'Refresh token required' });
    }

    const user = await User.findOne({
      refreshToken,
      refreshTokenExpiry: { $gt: new Date() }
    });
    if (!user) {
      return res.status(403).json({ success: false, message: 'Invalid or expired refresh token' });
    }

    const newAccessToken = generateAccessToken(user);
    const newRefreshToken = generateRefreshToken();
    await saveRefreshToken(user._id, newRefreshToken);
    res.json({ success: true, accessToken: newAccessToken, refreshToken: newRefreshToken });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Change password (authenticated) ------------------
exports.changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    const isMatch = await comparePassword(currentPassword, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Current password is incorrect' });
    }

    if (currentPassword === newPassword) {
      return res.status(400).json({ success: false, message: 'New password must differ from current password' });
    }

    user.password = await hashPassword(newPassword);
    user.refreshToken = null;
    user.refreshTokenExpiry = null;
    await user.save();

    res.json({ success: true, message: 'Password updated successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ------------------ Logout ------------------
exports.logout = async (req, res) => {
  try {
    await clearRefreshToken(req.user.id);
    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};