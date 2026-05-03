const MedicalRecord = require("../models/MedicalRecord");
const { createCrudController } = require("../utils/crudController");

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

module.exports = createCrudController({
  Model: MedicalRecord,
  resourceName: "Medical record",
  buildPayload,
  queryFields: ["patientId", "doctorId", "appointmentId", "status"],
  populate: [
    { path: "patientId", select: "referenceId fullName phone email" },
    { path: "doctorId", select: "referenceId fullName specialization" },
    { path: "appointmentId", select: "referenceId appointmentDate timeSlot status" },
  ],
});
