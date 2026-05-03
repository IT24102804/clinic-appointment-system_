const Appointment = require("../models/Appointment");
const { createCrudController } = require("../utils/crudController");

function buildPayload(body) {
  return {
    patientId: body.patientId,
    doctorId: body.doctorId,
    appointmentDate: body.appointmentDate ? new Date(body.appointmentDate) : undefined,
    timeSlot: body.timeSlot?.trim(),
    reason: body.reason?.trim(),
    status: body.status,
  };
}

module.exports = createCrudController({
  Model: Appointment,
  resourceName: "Appointment",
  buildPayload,
  queryFields: ["patientId", "doctorId", "status"],
  populate: [
    { path: "patientId", select: "referenceId fullName phone email" },
    { path: "doctorId", select: "referenceId fullName specialization room sessionFee" },
  ],
});
