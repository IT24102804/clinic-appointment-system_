const Appointment = require("../models/Appointment");
const MedicalRecord = require("../models/MedicalRecord");
const { createCrudController } = require("../utils/crudController");

const populate = [
  { path: "patientId", select: "referenceId fullName phone email" },
  { path: "doctorId", select: "referenceId fullName specialization" },
  { path: "appointmentId", select: "referenceId appointmentDate timeSlot status" },
];

function buildPayload(body) {
  return {
    patientId: body.patientId,
    doctorId: body.doctorId,
    appointmentId: body.appointmentId,
    visitSummary: body.visitSummary?.trim(),
    diagnosis: body.diagnosis?.trim(),
    treatmentNotes: body.treatmentNotes?.trim(),
    recordDate: body.recordDate ? new Date(body.recordDate) : undefined,
    status: body.status,
  };
}

async function buildTrustedPayload(body, fallbackAppointmentId, res) {
  const payload = buildPayload(body);
  const appointmentId = payload.appointmentId || fallbackAppointmentId;

  if (!appointmentId) {
    return payload;
  }

  const appointment = await Appointment.findById(appointmentId).select("patientId doctorId").lean();

  if (!appointment) {
    res.status(404).json({
      success: false,
      message: "Appointment not found for this medical record.",
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

const crudController = createCrudController({
  Model: MedicalRecord,
  resourceName: "Medical record",
  buildPayload,
  queryFields: ["patientId", "doctorId", "appointmentId", "status"],
  populate,
});

async function createMedicalRecord(req, res) {
  const payload = await buildTrustedPayload(req.body, null, res);

  if (!payload) {
    return undefined;
  }

  req.body = payload;
  return crudController.create(req, res);
}

async function updateMedicalRecord(req, res) {
  const existingRecord = await MedicalRecord.findById(req.params.id).lean();

  if (!existingRecord) {
    return res.status(404).json({
      success: false,
      message: "Medical record not found.",
    });
  }

  const payload = await buildTrustedPayload(req.body, existingRecord.appointmentId, res);

  if (!payload) {
    return undefined;
  }

  req.body = payload;
  return crudController.update(req, res);
}

module.exports = {
  ...crudController,
  create: createMedicalRecord,
  update: updateMedicalRecord,
};
