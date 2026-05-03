const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Prescription = require("../models/Prescription");

async function getLoggedInDoctor(user) {
  const linkedDoctor = await Doctor.findOne({ userId: user._id });

  if (linkedDoctor) {
    return linkedDoctor;
  }

  if (!user.email) {
    return null;
  }

  return Doctor.findOne({ email: user.email.toLowerCase().trim() });
}

function populateAppointment(query) {
  return query
    .populate("patientId", "referenceId fullName phone email")
    .populate("doctorId", "referenceId fullName specialization room sessionFee");
}

function populatePrescription(query) {
  return query
    .populate("patientId", "referenceId fullName phone email")
    .populate("doctorId", "referenceId fullName specialization")
    .populate("appointmentId", "referenceId appointmentDate timeSlot status");
}

function normalizeMedicines(medicines) {
  return medicines.map((medicine) => ({
    name: medicine.name.trim(),
    dosage: medicine.dosage.trim(),
    frequency: medicine.frequency.trim(),
    duration: medicine.duration.trim(),
    instructions: medicine.instructions?.trim() || "",
  }));
}

async function listMyAppointments(req, res) {
  const doctor = await getLoggedInDoctor(req.user);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor profile is not linked to this account. Use the same email for the doctor record and doctor staff account.",
    });
  }

  const appointments = await populateAppointment(Appointment.find({ doctorId: doctor._id }).sort({ appointmentDate: -1 })).lean();

  return res.status(200).json({
    success: true,
    message: "Doctor appointments retrieved successfully.",
    data: appointments,
  });
}

async function getMyAppointment(req, res) {
  const doctor = await getLoggedInDoctor(req.user);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor profile is not linked to this account.",
    });
  }

  const appointment = await populateAppointment(Appointment.findOne({ _id: req.params.id, doctorId: doctor._id })).lean();

  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found." });
  }

  return res.status(200).json({
    success: true,
    message: "Doctor appointment retrieved successfully.",
    data: appointment,
  });
}

async function createPrescriptionForAppointment(req, res) {
  const doctor = await getLoggedInDoctor(req.user);

  if (!doctor) {
    return res.status(404).json({
      success: false,
      message: "Doctor profile is not linked to this account.",
    });
  }

  const appointment = await Appointment.findOne({ _id: req.params.id, doctorId: doctor._id });

  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found." });
  }

  const existingPrescription = await Prescription.findOne({ appointmentId: appointment._id }).lean();

  if (existingPrescription) {
    return res.status(409).json({
      success: false,
      message: "A prescription already exists for this appointment.",
    });
  }

  const created = await Prescription.create({
    appointmentId: appointment._id,
    patientId: appointment.patientId,
    doctorId: doctor._id,
    diagnosis: req.body.diagnosis.trim(),
    medicines: normalizeMedicines(req.body.medicines),
    notes: req.body.notes?.trim() || "",
    status: "issued",
    issuedAt: new Date(),
  });

  const prescription = await populatePrescription(Prescription.findById(created._id)).lean();

  return res.status(201).json({
    success: true,
    message: "Prescription created successfully.",
    data: prescription,
  });
}

module.exports = {
  createPrescriptionForAppointment,
  getMyAppointment,
  listMyAppointments,
};
