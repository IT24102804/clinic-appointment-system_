const bcrypt = require("bcryptjs");
const crypto = require("crypto");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Patient = require("../models/Patient");
const { calculateAge } = require("../utils/validationPatterns");

const ACCESS_TOKEN_EXPIRES_IN = "15m";
const REFRESH_TOKEN_DAYS = 7;

function serializeUser(user) {
  return {
    _id: user._id,
    referenceId: user.referenceId,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

function signAccessToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: ACCESS_TOKEN_EXPIRES_IN }
  );
}

function createRefreshToken() {
  return crypto.randomBytes(64).toString("hex");
}

function hashRefreshToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

async function issueSession(user) {
  const accessToken = signAccessToken(user);
  const refreshToken = createRefreshToken();
  const refreshTokenExpiresAt = new Date(Date.now() + REFRESH_TOKEN_DAYS * 24 * 60 * 60 * 1000);

  user.refreshTokenHash = hashRefreshToken(refreshToken);
  user.refreshTokenExpiresAt = refreshTokenExpiresAt;
  await user.save();

  return {
    user: serializeUser(user),
    token: accessToken,
    accessToken,
    refreshToken,
  };
}

async function register(req, res) {
  const adminExists = await User.exists({ role: "admin" });

  if (adminExists) {
    return res.status(403).json({
      success: false,
      message: "Public staff registration is disabled after initial setup. Ask an admin to create staff accounts.",
    });
  }

  const existingUser = await User.findOne({ email: req.body.email.toLowerCase().trim() });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "A user with this email already exists.",
    });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    name: req.body.name.trim(),
    email: req.body.email.trim().toLowerCase(),
    passwordHash,
    role: "admin",
    status: "active",
  });

  return res.status(201).json({
    success: true,
    message: "Initial admin account registered successfully.",
    data: await issueSession(user),
  });
}

async function registerPatient(req, res) {
  const email = req.body.email.toLowerCase().trim();
  const phone = req.body.phone.trim();
  const nic = req.body.nic.trim();
  const dateOfBirth = new Date(req.body.dateOfBirth);
  const age = calculateAge(dateOfBirth);

  const existingUser = await User.findOne({ email });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "A user with this email already exists.",
    });
  }

  const existingPatient = await Patient.findOne({
    $or: [{ phone }, { nic }],
  });

  if (existingPatient) {
    return res.status(409).json({
      success: false,
      message: "A patient with this phone number or NIC already exists.",
    });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const user = await User.create({
    name: req.body.fullName.trim(),
    email,
    passwordHash,
    role: "patient",
    status: "active",
  });

  await Patient.create({
    userId: user._id,
    fullName: req.body.fullName.trim(),
    age,
    gender: req.body.gender,
    phone,
    nic,
    dateOfBirth,
    email,
    address: req.body.address.trim(),
    emergencyContact: {
      name: req.body.emergencyContact?.name?.trim() || "",
      phone: req.body.emergencyContact?.phone?.trim() || "",
      relationship: req.body.emergencyContact?.relationship?.trim() || "",
    },
    status: "active",
  });

  return res.status(201).json({
    success: true,
    message: "Patient registered successfully.",
    data: await issueSession(user),
  });
}

async function login(req, res) {
  const user = await User.findOne({ email: req.body.email.toLowerCase().trim() });

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  if (user.status !== "active") {
    return res.status(403).json({
      success: false,
      message: "This user account is inactive.",
    });
  }

  const validPassword = await bcrypt.compare(req.body.password, user.passwordHash);

  if (!validPassword) {
    return res.status(401).json({
      success: false,
      message: "Invalid email or password.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Login successful.",
    data: await issueSession(user),
  });
}

async function refresh(req, res) {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(400).json({
      success: false,
      message: "refreshToken is required.",
    });
  }

  const user = await User.findOne({
    refreshTokenHash: hashRefreshToken(refreshToken),
    refreshTokenExpiresAt: { $gt: new Date() },
    status: "active",
  }).select("+refreshTokenHash +refreshTokenExpiresAt");

  if (!user) {
    return res.status(401).json({
      success: false,
      message: "Refresh token is invalid or expired.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Token refreshed successfully.",
    data: await issueSession(user),
  });
}

async function logout(req, res) {
  if (req.body.refreshToken) {
    await User.updateOne(
      { refreshTokenHash: hashRefreshToken(req.body.refreshToken) },
      { $set: { refreshTokenHash: "", refreshTokenExpiresAt: null } }
    );
  }

  return res.status(200).json({
    success: true,
    message: "Logged out successfully.",
    data: null,
  });
}

async function getMe(req, res) {
  return res.status(200).json({
    success: true,
    message: "Current user retrieved successfully.",
    data: req.user,
  });
}

module.exports = {
  getMe,
  login,
  logout,
  refresh,
  register,
  registerPatient,
};
