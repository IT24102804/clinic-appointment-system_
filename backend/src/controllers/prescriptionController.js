const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Prescription = require("../models/Prescription");
const { deleteCloudinaryFile } = require("../multer/cloudinaryUpload");

const PRESCRIPTION_ALLOWED_APPOINTMENT_STATUSES = ["confirmed", "completed"];

function normalizePrescriptionPayload(body) {
  const payload = {
    appointmentId: body.appointmentId,
    patientId: body.patientId,
    doctorId: body.doctorId,
    diagnosis: body.diagnosis?.trim(),
    medicines: Array.isArray(body.medicines)
      ? body.medicines.map((medicine) => ({
          name: medicine.name?.trim(),
          dosage: medicine.dosage?.trim(),
          frequency: medicine.frequency?.trim(),
          duration: medicine.duration?.trim(),
          instructions: medicine.instructions?.trim() || "",
        }))
      : undefined,
    notes: typeof body.notes === "string" ? body.notes.trim() : body.notes,
    status: body.status,
    issuedAt: body.issuedAt ? new Date(body.issuedAt) : body.issuedAt,
  };

  Object.keys(payload).forEach((key) => {
    if (payload[key] === undefined) {
      delete payload[key];
    }
  });

  if (payload.status === "issued" && !payload.issuedAt) {
    payload.issuedAt = new Date();
  }

  return payload;
}

function applyPrescriptionPopulate(query) {
  return query
    .populate("patientId", "referenceId fullName phone email")
    .populate("doctorId", "referenceId fullName specialization")
    .populate("appointmentId", "referenceId appointmentDate timeSlot status");
}

async function getLoggedInDoctor(user) {
  if (user.role !== "doctor") {
    return null;
  }

  const linkedDoctor = await Doctor.findOne({ userId: user._id });

  if (linkedDoctor) {
    return linkedDoctor;
  }

  if (!user.email) {
    return null;
  }

  return Doctor.findOne({ email: user.email.toLowerCase().trim() });
}

async function validateDoctorPrescriptionAccess(req, doctorId, res) {
  if (req.user.role !== "doctor") {
    return true;
  }

  const doctor = await getLoggedInDoctor(req.user);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor profile is not linked to this account.",
    });
  }

  if (String(doctor._id) !== String(doctorId)) {
    return res.status(403).json({
      success: false,
      message: "Doctors can only manage prescriptions assigned to their own doctor profile.",
    });
  }

  return true;
}

function applyUserScope(req, filters) {
  if (req.user.role !== "doctor") {
    return filters;
  }

  return {
    ...filters,
    doctorId: req.doctorProfile._id,
  };
}

async function attachDoctorProfileForScope(req, res) {
  if (req.user.role !== "doctor") {
    return true;
  }

  const doctor = await getLoggedInDoctor(req.user);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor profile is not linked to this account.",
    });
  }

  req.doctorProfile = doctor;
  return true;
}

async function validatePrescriptionRelationship(payload, res, options = {}) {
  if (!payload.appointmentId || !payload.patientId || !payload.doctorId) {
    return true;
  }

  const appointment = await Appointment.findById(payload.appointmentId).lean();

  if (!appointment) {
    return res.status(404).json({
      success: false,
      message: "Linked appointment not found.",
    });
  }

  if (
    options.requireAllowedAppointmentStatus &&
    !PRESCRIPTION_ALLOWED_APPOINTMENT_STATUSES.includes(appointment.status)
  ) {
    return res.status(400).json({
      success: false,
      message: "Prescription can only be created for confirmed or completed appointments.",
    });
  }

  if (
    String(appointment.patientId) !== String(payload.patientId) ||
    String(appointment.doctorId) !== String(payload.doctorId)
  ) {
    return res.status(400).json({
      success: false,
      message: "Prescription patient and doctor must match the selected appointment.",
    });
  }

  return true;
}

async function buildTrustedPrescriptionPayload(body, fallbackAppointmentId, res, options = {}) {
  const payload = normalizePrescriptionPayload(body);
  const appointmentId = payload.appointmentId || fallbackAppointmentId;

  if (!appointmentId) {
    return payload;
  }

  const appointment = await Appointment.findById(appointmentId).select("patientId doctorId status").lean();

  if (!appointment) {
    res.status(404).json({
      success: false,
      message: "Linked appointment not found.",
    });
    return null;
  }

  if (
    options.requireAllowedAppointmentStatus &&
    !PRESCRIPTION_ALLOWED_APPOINTMENT_STATUSES.includes(appointment.status)
  ) {
    res.status(400).json({
      success: false,
      message: "Prescription can only be created for confirmed or completed appointments.",
    });
    return null;
  }

  return {
    ...payload,
    appointmentId,
    patientId: appointment.patientId,
    doctorId: appointment.doctorId,
  };
}

async function validateUniqueAppointmentPrescription(appointmentId, excludeId, res) {
  if (!appointmentId) {
    return true;
  }

  const query = { appointmentId };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingPrescription = await Prescription.findOne(query).lean();

  if (!existingPrescription) {
    return true;
  }

  return res.status(409).json({
    success: false,
    message: "A prescription already exists for this appointment.",
  });
}

async function listPrescriptions(req, res) {
  const scoped = await attachDoctorProfileForScope(req, res);

  if (scoped !== true) {
    return scoped;
  }

  const filters = {};
  const { patientId, doctorId, appointmentId, status } = req.query;

  if (patientId) {
    filters.patientId = patientId;
  }

  if (doctorId) {
    filters.doctorId = doctorId;
  }

  if (appointmentId) {
    filters.appointmentId = appointmentId;
  }

  if (status) {
    filters.status = status;
  }

  const prescriptions = await applyPrescriptionPopulate(Prescription.find(applyUserScope(req, filters)).sort({ createdAt: -1 })).lean();

  return res.status(200).json({
    success: true,
    message: "Prescriptions retrieved successfully.",
    data: prescriptions,
  });
}

async function getPrescription(req, res) {
  const scoped = await attachDoctorProfileForScope(req, res);

  if (scoped !== true) {
    return scoped;
  }

  const filters = applyUserScope(req, { _id: req.params.id });
  const prescription = await applyPrescriptionPopulate(Prescription.findOne(filters)).lean();

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: "Prescription not found.",
    });
  }

  return res.status(200).json({
    success: true,
    message: "Prescription retrieved successfully.",
    data: prescription,
  });
}

async function createPrescription(req, res) {
  const payload = await buildTrustedPrescriptionPayload(req.body, null, res, {
    requireAllowedAppointmentStatus: true,
  });

  if (!payload) {
    return undefined;
  }

  const validDoctorAccess = await validateDoctorPrescriptionAccess(req, payload.doctorId, res);

  if (validDoctorAccess !== true) {
    return validDoctorAccess;
  }

  const validRelationship = await validatePrescriptionRelationship(payload, res);

  if (validRelationship !== true) {
    return validRelationship;
  }

  const uniqueAppointmentPrescription = await validateUniqueAppointmentPrescription(payload.appointmentId, null, res);

  if (uniqueAppointmentPrescription !== true) {
    return uniqueAppointmentPrescription;
  }

  const created = await Prescription.create(payload);
  const prescription = await applyPrescriptionPopulate(Prescription.findById(created._id)).lean();

  return res.status(201).json({
    success: true,
    message: "Prescription created successfully.",
    data: prescription,
  });
}

async function updatePrescription(req, res) {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: "Prescription not found.",
    });
  }

  const payload = await buildTrustedPrescriptionPayload(req.body, prescription.appointmentId, res, {
    requireAllowedAppointmentStatus: true,
  });

  if (!payload) {
    return undefined;
  }

  const mergedPayload = {
    appointmentId: payload.appointmentId,
    patientId: payload.patientId,
    doctorId: payload.doctorId,
  };

  const validDoctorAccess = await validateDoctorPrescriptionAccess(req, mergedPayload.doctorId, res);

  if (validDoctorAccess !== true) {
    return validDoctorAccess;
  }

  const validRelationship = await validatePrescriptionRelationship(mergedPayload, res);

  if (validRelationship !== true) {
    return validRelationship;
  }

  const uniqueAppointmentPrescription = await validateUniqueAppointmentPrescription(mergedPayload.appointmentId, prescription._id, res);

  if (uniqueAppointmentPrescription !== true) {
    return uniqueAppointmentPrescription;
  }

  if (prescription.status === "issued" && payload.status === "draft") {
    return res.status(400).json({
      success: false,
      message: "Issued prescriptions cannot be changed back to draft.",
    });
  }

  if (payload.status === "issued" && !payload.issuedAt && !prescription.issuedAt) {
    payload.issuedAt = new Date();
  }

  Object.assign(prescription, payload);
  await prescription.save();
  const updated = await applyPrescriptionPopulate(Prescription.findById(prescription._id)).lean();

  return res.status(200).json({
    success: true,
    message: "Prescription updated successfully.",
    data: updated,
  });
}

async function deletePrescription(req, res) {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: "Prescription not found.",
    });
  }

  const validDoctorAccess = await validateDoctorPrescriptionAccess(req, prescription.doctorId, res);

  if (validDoctorAccess !== true) {
    return validDoctorAccess;
  }

  if (prescription.status !== "draft") {
    return res.status(400).json({
      success: false,
      message: "Only draft prescriptions can be deleted. Issued prescriptions must be preserved for clinical history.",
    });
  }

  if (prescription.attachmentPublicId) {
    await deleteCloudinaryFile(prescription.attachmentPublicId, prescription.attachmentResourceType);
  }

  await prescription.deleteOne();

  return res.status(200).json({
    success: true,
    message: "Prescription deleted successfully.",
    data: { id: req.params.id },
  });
}

async function uploadPrescriptionAttachment(req, res) {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: "Prescription not found.",
    });
  }

  const validDoctorAccess = await validateDoctorPrescriptionAccess(req, prescription.doctorId, res);

  if (validDoctorAccess !== true) {
    return validDoctorAccess;
  }

  if (!req.uploadedFile) {
    return res.status(400).json({
      success: false,
      message: "An attachment file is required.",
    });
  }

  if (prescription.attachmentPublicId) {
    await deleteCloudinaryFile(prescription.attachmentPublicId, prescription.attachmentResourceType);
  }

  prescription.attachmentUrl = req.uploadedFile.url;
  prescription.attachmentName = req.uploadedFile.originalName;
  prescription.attachmentPublicId = req.uploadedFile.publicId;
  prescription.attachmentResourceType = req.uploadedFile.resourceType;
  await prescription.save();
  const updated = await applyPrescriptionPopulate(Prescription.findById(prescription._id)).lean();

  return res.status(200).json({
    success: true,
    message: "Prescription attachment uploaded successfully.",
    data: updated,
  });
}

async function deletePrescriptionAttachment(req, res) {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    return res.status(404).json({
      success: false,
      message: "Prescription not found.",
    });
  }

  const validDoctorAccess = await validateDoctorPrescriptionAccess(req, prescription.doctorId, res);

  if (validDoctorAccess !== true) {
    return validDoctorAccess;
  }

  if (!prescription.attachmentUrl) {
    return res.status(404).json({
      success: false,
      message: "Prescription attachment not found.",
    });
  }

  await deleteCloudinaryFile(prescription.attachmentPublicId, prescription.attachmentResourceType);

  prescription.attachmentUrl = "";
  prescription.attachmentName = "";
  prescription.attachmentPublicId = "";
  prescription.attachmentResourceType = "";
  await prescription.save();
  const updated = await applyPrescriptionPopulate(Prescription.findById(prescription._id)).lean();

  return res.status(200).json({
    success: true,
    message: "Prescription attachment removed successfully.",
    data: updated,
  });
}

module.exports = {
  createPrescription,
  deletePrescription,
  deletePrescriptionAttachment,
  getPrescription,
  listPrescriptions,
  updatePrescription,
  uploadPrescriptionAttachment,
};
