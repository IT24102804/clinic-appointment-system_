const Appointment = require("../models/Appointment");
const Prescription = require("../models/Prescription");
const { deleteCloudinaryFile } = require("../multer/cloudinaryUpload");

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

async function validatePrescriptionRelationship(payload, res) {
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

  const prescriptions = await applyPrescriptionPopulate(Prescription.find(filters).sort({ createdAt: -1 })).lean();

  return res.status(200).json({
    success: true,
    message: "Prescriptions retrieved successfully.",
    data: prescriptions,
  });
}

async function getPrescription(req, res) {
  const prescription = await applyPrescriptionPopulate(Prescription.findById(req.params.id)).lean();

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
  const payload = normalizePrescriptionPayload(req.body);
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

  const payload = normalizePrescriptionPayload(req.body);
  const mergedPayload = {
    appointmentId: payload.appointmentId || prescription.appointmentId,
    patientId: payload.patientId || prescription.patientId,
    doctorId: payload.doctorId || prescription.doctorId,
  };

  const validRelationship = await validatePrescriptionRelationship(mergedPayload, res);

  if (validRelationship !== true) {
    return validRelationship;
  }

  const uniqueAppointmentPrescription = await validateUniqueAppointmentPrescription(mergedPayload.appointmentId, prescription._id, res);

  if (uniqueAppointmentPrescription !== true) {
    return uniqueAppointmentPrescription;
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
