const Patient = require("../models/Patient");
const { createCrudController } = require("../utils/crudController");

function getPatientForUser(userId) {
  return Patient.findOne({ userId });
}

function buildPayload(body) {
  return {
    fullName: body.fullName?.trim(),
    age: body.age === undefined || body.age === "" ? undefined : Number(body.age),
    gender: body.gender,
    phone: body.phone?.trim(),
    nic: body.nic?.trim(),
    dateOfBirth: body.dateOfBirth ? new Date(body.dateOfBirth) : undefined,
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
  const unique = await ensureUniquePatient(payload, null, res);

  if (unique !== true) {
    return unique;
  }

  req.body = payload;
  return crudController.create(req, res);
}

async function updatePatient(req, res) {
  const payload = buildPayload(req.body);
  const unique = await ensureUniquePatient(payload, req.params.id, res);

  if (unique !== true) {
    return unique;
  }

  req.body = payload;
  return crudController.update(req, res);
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

  allowedFields.forEach((field) => {
    if (req.body[field] !== undefined) {
      patient[field] = field === "dateOfBirth" && req.body[field] ? new Date(req.body[field]) : req.body[field];
    }
  });

  await patient.save();

  return res.status(200).json({
    success: true,
    message: "Patient profile updated successfully.",
    data: patient,
  });
}

module.exports = {
  ...crudController,
  create: createPatient,
  getMyProfile,
  update: updatePatient,
  updateMyProfile,
};
