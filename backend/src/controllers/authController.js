const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const User = require("../models/User");
const Patient = require("../models/Patient");

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

function signToken(user) {
  return jwt.sign(
    {
      id: user._id,
      role: user.role,
    },
    process.env.JWT_SECRET,
    { expiresIn: "7d" }
  );
}

async function register(req, res) {
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
    role: req.body.role || "receptionist",
    status: "active",
  });

  return res.status(201).json({
    success: true,
    message: "User registered successfully.",
    data: {
      user: serializeUser(user),
      token: signToken(user),
    },
  });
}

async function registerPatient(req, res) {
  const email = req.body.email.toLowerCase().trim();
  const phone = req.body.phone.trim();
  const nic = req.body.nic.trim();

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
    age: Number(req.body.age),
    gender: req.body.gender,
    phone,
    nic,
    dateOfBirth: req.body.dateOfBirth ? new Date(req.body.dateOfBirth) : null,
    email,
    address: req.body.address?.trim() || "",
    status: "active",
  });

  return res.status(201).json({
    success: true,
    message: "Patient registered successfully.",
    data: {
      user: serializeUser(user),
      token: signToken(user),
    },
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
    data: {
      user: serializeUser(user),
      token: signToken(user),
    },
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
  register,
  registerPatient,
};
