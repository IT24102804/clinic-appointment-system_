const fs = require("fs/promises");
const path = require("path");

const Prescription = require("../models/Prescription");

const uploadsRoot = path.join(__dirname, "..", "uploads");

function serializeAttachmentUrl(filePath) {
  const relativePath = path.relative(uploadsRoot, filePath).split(path.sep).join("/");
  return `/uploads/${relativePath}`;
}

function resolveAttachmentPath(attachmentUrl) {
  if (!attachmentUrl) {
    return null;
  }

  const cleanedPath = attachmentUrl.replace(/^\/uploads\//, "");
  return path.join(uploadsRoot, cleanedPath);
}

async function removeFile(filePath) {
  if (!filePath) {
    return;
  }

  try {
    await fs.unlink(filePath);
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
}

async function removePrescriptionUploadDirectory(prescriptionId) {
  const prescriptionDirectory = path.join(uploadsRoot, "prescriptions", prescriptionId);
  await fs.rm(prescriptionDirectory, { recursive: true, force: true });
}

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

  const prescriptions = await Prescription.find(filters).sort({ createdAt: -1 }).lean();

  return res.status(200).json({
    success: true,
    message: "Prescriptions retrieved successfully.",
    data: prescriptions,
  });
}

async function getPrescription(req, res) {
  const prescription = await Prescription.findById(req.params.id).lean();

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
  const prescription = await Prescription.create(payload);

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

  if (payload.status === "issued" && !payload.issuedAt && !prescription.issuedAt) {
    payload.issuedAt = new Date();
  }

  Object.assign(prescription, payload);
  await prescription.save();

  return res.status(200).json({
    success: true,
    message: "Prescription updated successfully.",
    data: prescription,
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

  await prescription.deleteOne();
  await removePrescriptionUploadDirectory(req.params.id);

  return res.status(200).json({
    success: true,
    message: "Prescription deleted successfully.",
    data: { id: req.params.id },
  });
}

async function uploadPrescriptionAttachment(req, res) {
  const prescription = await Prescription.findById(req.params.id);

  if (!prescription) {
    if (req.file?.path) {
      await removeFile(req.file.path);
    }

    return res.status(404).json({
      success: false,
      message: "Prescription not found.",
    });
  }

  if (!req.file) {
    return res.status(400).json({
      success: false,
      message: "An attachment file is required.",
    });
  }

  await removeFile(resolveAttachmentPath(prescription.attachmentUrl));

  prescription.attachmentUrl = serializeAttachmentUrl(req.file.path);
  prescription.attachmentName = req.file.originalname;
  await prescription.save();

  return res.status(200).json({
    success: true,
    message: "Prescription attachment uploaded successfully.",
    data: prescription,
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

  await removeFile(resolveAttachmentPath(prescription.attachmentUrl));

  prescription.attachmentUrl = "";
  prescription.attachmentName = "";
  await prescription.save();

  return res.status(200).json({
    success: true,
    message: "Prescription attachment removed successfully.",
    data: prescription,
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
