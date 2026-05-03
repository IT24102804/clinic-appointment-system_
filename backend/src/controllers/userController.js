const bcrypt = require("bcryptjs");

const User = require("../models/User");

function serializeUser(user) {
  return {
    _id: user._id,
    name: user.name,
    email: user.email,
    role: user.role,
    status: user.status,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
  };
}

async function listUsers(req, res) {
  const users = await User.find().sort({ createdAt: -1 }).select("-passwordHash").lean();

  return res.status(200).json({
    success: true,
    message: "Users retrieved successfully.",
    data: users,
  });
}

async function createUser(req, res) {
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
    status: req.body.status || "active",
  });

  return res.status(201).json({
    success: true,
    message: "User created successfully.",
    data: serializeUser(user),
  });
}

async function getUser(req, res) {
  const user = await User.findById(req.params.id).select("-passwordHash").lean();

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "User retrieved successfully.",
    data: user,
  });
}

async function updateUser(req, res) {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  if (req.body.email && req.body.email.toLowerCase().trim() !== user.email) {
    const existingUser = await User.findOne({ email: req.body.email.toLowerCase().trim() });

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }
  }

  if (req.body.name !== undefined) {
    user.name = req.body.name.trim();
  }

  if (req.body.email !== undefined) {
    user.email = req.body.email.trim().toLowerCase();
  }

  if (req.body.role !== undefined) {
    user.role = req.body.role;
  }

  if (req.body.status !== undefined) {
    user.status = req.body.status;
  }

  if (req.body.password) {
    user.passwordHash = await bcrypt.hash(req.body.password, 12);
  }

  await user.save();

  return res.status(200).json({
    success: true,
    message: "User updated successfully.",
    data: serializeUser(user),
  });
}

async function deactivateUser(req, res) {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(404).json({
      success: false,
      message: "User not found.",
    });
  }

  user.status = "inactive";
  await user.save();

  return res.status(200).json({
    success: true,
    message: "User deactivated successfully.",
    data: serializeUser(user),
  });
}

module.exports = {
  createUser,
  deactivateUser,
  getUser,
  listUsers,
  updateUser,
};
