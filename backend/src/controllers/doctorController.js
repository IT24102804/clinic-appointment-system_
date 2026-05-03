const Doctor = require("../models/Doctor");
const User = require("../models/User");
const { createCrudController } = require("../utils/crudController");

function parseAvailabilityText(value) {
  if (!value || typeof value !== "string") {
    return undefined;
  }

  return value
    .split(",")
    .map((item) => item.trim().toLowerCase())
    .filter(Boolean)
    .map((item) => {
      const match = item.match(/^(sun|mon|tue|wed|thu|fri|sat)\s+(\d{2}:\d{2})-(\d{2}:\d{2})$/);

      if (!match) {
        return null;
      }

      return {
        dayOfWeek: match[1],
        startTime: match[2],
        endTime: match[3],
      };
    })
    .filter(Boolean);
}

function buildPayload(body) {
  return {
    fullName: body.fullName?.trim(),
    specialization: body.specialization?.trim(),
    phone: body.phone?.trim(),
    email: body.email?.trim().toLowerCase(),
    room: body.room?.trim(),
    experienceYears: body.experienceYears === undefined || body.experienceYears === "" ? undefined : Number(body.experienceYears),
    sessionFee: body.sessionFee === undefined || body.sessionFee === "" ? undefined : Number(body.sessionFee),
    availability: Array.isArray(body.availability) ? body.availability : parseAvailabilityText(body.availabilityText),
    availabilityStatus: body.availabilityStatus,
    status: body.status,
  };
}

const crudController = createCrudController({
  Model: Doctor,
  resourceName: "Doctor",
  buildPayload,
  queryFields: ["status", "availabilityStatus", "specialization"],
  attachment: {
    urlField: "profileImageUrl",
    nameField: "profileImageName",
    publicIdField: "profileImagePublicId",
    resourceTypeField: "profileImageResourceType",
  },
});

function buildDuplicateDoctorQuery(payload, excludeId) {
  const duplicateFields = [];

  if (payload.phone) {
    duplicateFields.push({ phone: payload.phone });
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

async function ensureUniqueDoctor(payload, excludeId, res) {
  const query = buildDuplicateDoctorQuery(payload, excludeId);

  if (!query) {
    return true;
  }

  const existingDoctor = await Doctor.findOne(query).lean();

  if (!existingDoctor) {
    return true;
  }

  return res.status(409).json({
    success: false,
    message: "A doctor with this phone number or email already exists.",
  });
}

async function createDoctor(req, res) {
  const payload = buildPayload(req.body);
  const unique = await ensureUniqueDoctor(payload, null, res);

  if (unique !== true) {
    return unique;
  }

  req.body = payload;
  return crudController.create(req, res);
}

async function updateDoctor(req, res) {
  const payload = buildPayload(req.body);
  const unique = await ensureUniqueDoctor(payload, req.params.id, res);

  if (unique !== true) {
    return unique;
  }

  req.body = payload;
  return crudController.update(req, res);
}

async function deactivateDoctor(req, res) {
  const doctor = await Doctor.findById(req.params.id);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor not found.",
    });
  }

  doctor.status = "inactive";
  doctor.availabilityStatus = "unavailable";
  await doctor.save();

  if (doctor.userId) {
    await User.findByIdAndUpdate(doctor.userId, { status: "inactive" });
  }

  const updated = await Doctor.findById(doctor._id).lean();

  return res.status(200).json({
    success: true,
    message: "Doctor deactivated successfully.",
    data: updated,
  });
}

module.exports = {
  ...crudController,
  create: createDoctor,
  remove: deactivateDoctor,
  update: updateDoctor,
};
