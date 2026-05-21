const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");

const Patient = require("../models/Patient");
const User = require("../models/User");
const { createCrudController } = require("../utils/crudController");
const { calculateAge } = require("../utils/validationPatterns");

function getPatientForUser(userId) {
  return Patient.findOne({ userId });
}

function buildPayload(body) {
  const dateOfBirth = body.dateOfBirth ? new Date(body.dateOfBirth) : undefined;
  const age = dateOfBirth ? calculateAge(dateOfBirth) : undefined;

  return {
    fullName: body.fullName?.trim(),
    age,
    gender: body.gender,
    phone: body.phone?.trim(),
    nic: body.nic?.trim(),
    dateOfBirth,
    email: body.email?.trim().toLowerCase(),
    address: body.address?.trim(),
    additionalAddresses: Array.isArray(body.additionalAddresses) ? body.additionalAddresses : undefined,
    emergencyContact: body.emergencyContact,
    status: body.status,
  };
}

const crudController = createCrudController({
  Model: Patient,
  resourceName: "Patient",
  buildPayload,
  queryFields: ["status", "gender"],
});

function escapeRegExp(value) {
  return String(value).replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function buildPatientListFilters(query) {
  const filters = {};

  if (query.status) {
    filters.status = query.status;
  }

  if (query.gender) {
    filters.gender = query.gender;
  }

  if (query.search) {
    const searchRegex = new RegExp(escapeRegExp(query.search.trim()), "i");
    filters.$or = [
      { fullName: searchRegex },
      { phone: searchRegex },
      { nic: searchRegex },
      { email: searchRegex },
      { referenceId: searchRegex },
    ];
  }

  return filters;
}

async function listPatients(req, res) {
  const filters = buildPatientListFilters(req.query);
  const query = Patient.find(filters).sort({ createdAt: -1 });
  const patients = await query.lean();

  return res.status(200).json({
    success: true,
    message: "Patient records retrieved successfully.",
    data: patients,
  });
}

async function getPatientById(req, res) {
  const filters = { _id: req.params.id };

  const patient = await Patient.findOne(filters).lean();

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Patient retrieved successfully.",
    data: patient,
  });
}

function buildDuplicatePatientQuery(payload, excludeId) {
  const duplicateFields = [];

  if (payload.phone) {
    duplicateFields.push({ phone: payload.phone });
  }

  if (payload.nic) {
    duplicateFields.push({ nic: payload.nic });
  }

  if (payload.email) {
    duplicateFields.push({ email: payload.email });
  }

  if (duplicateFields.length === 0) {
    return null;
  }

  const query = { $or: duplicateFields };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  return query;
}

async function ensureUniquePatient(payload, excludeId, res) {
  const query = buildDuplicatePatientQuery(payload, excludeId);

  if (!query) {
    return true;
  }

  const existingPatient = await Patient.findOne(query).lean();

  if (!existingPatient) {
    return true;
  }

  return res.status(409).json({
    success: false,
    message: "A patient with this phone number, NIC, or email already exists.",
  });
}

async function createPatient(req, res) {
  const payload = buildPayload(req.body);

  if (req.user.role !== "admin" && payload.status !== undefined) {
    return res.status(403).json({
      success: false,
      message: "Only admins can set patient status.",
    });
  }

  const unique = await ensureUniquePatient(payload, null, res);

  if (unique !== true) {
    return unique;
  }

  const existingUser = await User.findOne({ email: payload.email });

  if (existingUser) {
    return res.status(409).json({
      success: false,
      message: "A user with this email already exists.",
    });
  }

  const passwordHash = await bcrypt.hash(req.body.password, 12);
  const session = await mongoose.startSession();
  let createdPatientId;

  try {
    await session.withTransaction(async () => {
      const [user] = await User.create(
        [
          {
            name: payload.fullName,
            email: payload.email,
            passwordHash,
            role: "patient",
            status: payload.status || "active",
          },
        ],
        { session }
      );

      const [patient] = await Patient.create(
        [
          {
            ...payload,
            userId: user._id,
          },
        ],
        { session }
      );

      createdPatientId = patient._id;
    });
  } finally {
    await session.endSession();
  }

  const created = await Patient.findById(createdPatientId).lean();

  return res.status(201).json({
    success: true,
    message: "Patient created successfully.",
    data: created,
  });
}

async function updatePatient(req, res) {
  const payload = buildPayload(req.body);

  if (req.user.role !== "admin" && payload.status !== undefined) {
    return res.status(403).json({
      success: false,
      message: "Only admins can update patient status.",
    });
  }

  const unique = await ensureUniquePatient(payload, req.params.id, res);

  if (unique !== true) {
    return unique;
  }

  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient not found.",
    });
  }

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  if (payload.email) {
    const userQuery = { email: payload.email };

    if (patient.userId) {
      userQuery._id = { $ne: patient.userId };
    }

    const existingUser = await User.findOne(userQuery).lean();

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: "A user with this email already exists.",
      });
    }
  }

  Object.assign(patient, payload);
  await patient.save();

  if (patient.userId) {
    const userUpdates = {};

    if (payload.fullName) {
      userUpdates.name = payload.fullName;
    }

    if (payload.email) {
      userUpdates.email = payload.email;
    }

    if (payload.status) {
      userUpdates.status = patient.status;
    }

    if (Object.keys(userUpdates).length > 0) {
      await User.findByIdAndUpdate(patient.userId, userUpdates);
    }
  }

  const updated = await Patient.findById(patient._id).lean();

  return res.status(200).json({
    success: true,
    message: "Patient updated successfully.",
    data: updated,
  });
}

async function getMyProfile(req, res) {
  const patient = await getPatientForUser(req.user._id).lean();

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient profile not found for this account.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Patient profile retrieved successfully.",
    data: patient,
  });
}

async function updateMyProfile(req, res) {
  const patient = await getPatientForUser(req.user._id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient profile not found for this account.",
    });
  }

  const allowedFields = ["phone", "gender", "address", "dateOfBirth", "additionalAddresses", "emergencyContact"];

  if (req.body.phone) {
    const existingPhone = await Patient.findOne({
      phone: req.body.phone.trim(),
      _id: { $ne: patient._id },
    }).lean();

    if (existingPhone) {
      return res.status(409).json({
        success: false,
        message: "A patient with this phone number already exists.",
      });
    }
  }

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      patient[field] = field === "dateOfBirth" && req.body[field] ? new Date(req.body[field]) : req.body[field];
    }
  });

  if (req.body.dateOfBirth) {
    patient.age = calculateAge(req.body.dateOfBirth);
  }

  await patient.save();

  return res.status(200).json({
    success: true,
    message: "Patient profile updated successfully.",
    data: patient,
  });
}

async function deactivatePatient(req, res) {
  const patient = await Patient.findById(req.params.id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient not found.",
    });
  }

  patient.status = "inactive";
  await patient.save();

  if (patient.userId) {
    await User.findByIdAndUpdate(patient.userId, { status: "inactive" });
  }

  const updated = await Patient.findById(patient._id).lean();

  return res.status(200).json({
    success: true,
    message: "Patient deactivated successfully.",
    data: updated,
  });
}

async function deleteMyAdditionalAddress(req, res) {
  const patient = await getPatientForUser(req.user._id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient profile not found for this account.",
    });
  }

  const index = Number(req.params.index);

  if (!Number.isInteger(index) || index < 0 || index >= patient.additionalAddresses.length) {
    return res.status(404).json({
      success: false,
      message: "Additional address not found.",
    });
  }

  patient.additionalAddresses.splice(index, 1);
  await patient.save();

  return res.status(200).json({
    success: true,
    message: "Additional address deleted successfully.",
    data: patient,
  });
}

async function deleteMyEmergencyContact(req, res) {
  const patient = await getPatientForUser(req.user._id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient profile not found for this account.",
    });
  }

  patient.emergencyContact = { name: "", phone: "", relationship: "" };
  await patient.save();

  return res.status(200).json({
    success: true,
    message: "Emergency contact deleted successfully.",
    data: patient,
  });
}

module.exports = {
  ...crudController,
  create: createPatient,
  deleteMyAdditionalAddress,
  deleteMyEmergencyContact,
  getById: getPatientById,
  list: listPatients,
  remove: deactivatePatient,
  getMyProfile,
  update: updatePatient,
  updateMyProfile,
};
