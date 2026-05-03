const Appointment = require("../models/Appointment");
const Billing = require("../models/Billing");
const Doctor = require("../models/Doctor");
const MedicalRecord = require("../models/MedicalRecord");
const Patient = require("../models/Patient");
const PatientDocument = require("../models/PatientDocument");
const Prescription = require("../models/Prescription");
const { deleteCloudinaryFile } = require("../multer/cloudinaryUpload");

const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const BOOKED_STATUSES = ["booked", "pending", "confirmed", "rescheduled", "completed"];

function minutesFromTime(value) {
  const [hours, minutes] = String(value).split(":").map(Number);
  return hours * 60 + minutes;
}

function formatSlot(totalMinutes) {
  const hours24 = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const meridiem = hours24 >= 12 ? "PM" : "AM";
  const hours12 = hours24 % 12 || 12;

  return `${String(hours12).padStart(2, "0")}:${String(minutes).padStart(2, "0")} ${meridiem}`;
}

function formatSlotRange(startMinutes, endMinutes) {
  return `${formatSlot(startMinutes)} - ${formatSlot(endMinutes)}`;
}

function getDateRange(dateValue) {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

async function getLoggedInPatient(userId) {
  return Patient.findOne({ userId });
}

async function listDoctors(req, res) {
  const doctors = await Doctor.find({ status: "active", availabilityStatus: { $ne: "unavailable" } })
    .sort({ fullName: 1 })
    .lean();

  return res.status(200).json({
    success: true,
    message: "Doctors retrieved successfully.",
    data: doctors,
  });
}

async function getDoctorSlots(req, res) {
  const { doctorId } = req.params;
  const { date } = req.query;

  if (!date) {
    return res.status(400).json({
      success: false,
      message: "date query parameter is required.",
    });
  }

  const selectedDate = new Date(date);

  if (Number.isNaN(selectedDate.getTime())) {
    return res.status(400).json({
      success: false,
      message: "date must be a valid date.",
    });
  }

  const doctor = await Doctor.findById(doctorId).lean();

  if (!doctor || doctor.status !== "active" || doctor.availabilityStatus === "unavailable") {
    return res.status(404).json({
      success: false,
      message: "Doctor is not available for booking.",
    });
  }

  const dayKey = DAY_KEYS[selectedDate.getDay()];
  const availabilityBlocks = (doctor.availability || []).filter((item) => item.dayOfWeek === dayKey);
  const generatedSlots = availabilityBlocks.flatMap((block) => {
    const startMinutes = minutesFromTime(block.startTime);
    const endMinutes = minutesFromTime(block.endTime);
    const slots = [];

    for (let current = startMinutes; current + 30 <= endMinutes; current += 30) {
      slots.push({
        label: formatSlotRange(current, current + 30),
        startLabel: formatSlot(current),
      });
    }

    return slots;
  });

  const { start, end } = getDateRange(selectedDate);
  const bookedAppointments = await Appointment.find({
    doctorId,
    appointmentDate: { $gte: start, $lt: end },
    status: { $in: BOOKED_STATUSES },
  })
    .select("timeSlot")
    .lean();
  const bookedSlots = new Set(bookedAppointments.map((appointment) => appointment.timeSlot));
  const availableSlots = generatedSlots
    .filter((slot) => !bookedSlots.has(slot.label) && !bookedSlots.has(slot.startLabel))
    .map((slot) => slot.label);

  return res.status(200).json({
    success: true,
    message: "Available slots retrieved successfully.",
    data: availableSlots,
  });
}

async function createPatientAppointment(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({
      success: false,
      message: "Patient profile not found for this account.",
    });
  }

  const appointmentDate = new Date(req.body.appointmentDate);
  const { start, end } = getDateRange(appointmentDate);
  const existingAppointment = await Appointment.findOne({
    doctorId: req.body.doctorId,
    appointmentDate: { $gte: start, $lt: end },
    timeSlot: req.body.timeSlot,
    status: { $in: BOOKED_STATUSES },
  });

  if (existingAppointment) {
    return res.status(409).json({
      success: false,
      message: "This time slot is no longer available.",
    });
  }

  const appointment = await Appointment.create({
    patientId: patient._id,
    doctorId: req.body.doctorId,
    appointmentDate,
    timeSlot: req.body.timeSlot.trim(),
    reason: req.body.reason.trim(),
    status: "pending",
  });
  const savedAppointment = await Appointment.findById(appointment._id)
    .populate("patientId", "referenceId fullName phone email")
    .populate("doctorId", "referenceId fullName specialization room")
    .lean();

  return res.status(201).json({
    success: true,
    message: "Appointment request submitted successfully.",
    data: savedAppointment,
  });
}

async function listMyAppointments(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  const appointments = await Appointment.find({ patientId: patient._id })
    .sort({ appointmentDate: -1 })
    .populate("doctorId", "referenceId fullName specialization room sessionFee")
    .lean();

  return res.status(200).json({
    success: true,
    message: "Appointments retrieved successfully.",
    data: appointments,
  });
}

async function getMyAppointment(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  const appointment = await Appointment.findOne({ _id: req.params.id, patientId: patient._id })
    .populate("doctorId", "referenceId fullName specialization room sessionFee")
    .lean();

  if (!appointment) {
    return res.status(404).json({ success: false, message: "Appointment not found." });
  }

  return res.status(200).json({ success: true, message: "Appointment retrieved successfully.", data: appointment });
}

async function listMyPrescriptions(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  const prescriptions = await Prescription.find({ patientId: patient._id })
    .sort({ createdAt: -1 })
    .populate("doctorId", "referenceId fullName specialization")
    .populate("appointmentId", "referenceId appointmentDate timeSlot status")
    .lean();

  return res.status(200).json({ success: true, message: "Prescriptions retrieved successfully.", data: prescriptions });
}

async function getMyPrescription(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  const prescription = await Prescription.findOne({ _id: req.params.id, patientId: patient._id })
    .populate("doctorId", "referenceId fullName specialization")
    .populate("appointmentId", "referenceId appointmentDate timeSlot status")
    .lean();

  if (!prescription) {
    return res.status(404).json({ success: false, message: "Prescription not found." });
  }

  return res.status(200).json({ success: true, message: "Prescription retrieved successfully.", data: prescription });
}

async function listMyBills(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  const bills = await Billing.find({ patientId: patient._id })
    .sort({ billDate: -1 })
    .populate("appointmentId", "referenceId appointmentDate timeSlot status")
    .lean();

  return res.status(200).json({ success: true, message: "Bills retrieved successfully.", data: bills });
}

async function getMyBill(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  const bill = await Billing.findOne({ _id: req.params.id, patientId: patient._id })
    .populate("appointmentId", "referenceId appointmentDate timeSlot status")
    .lean();

  if (!bill) {
    return res.status(404).json({ success: false, message: "Bill not found." });
  }

  return res.status(200).json({ success: true, message: "Bill retrieved successfully.", data: bill });
}

async function listMyMedicalRecords(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  const records = await MedicalRecord.find({ patientId: patient._id })
    .sort({ recordDate: -1 })
    .populate("doctorId", "referenceId fullName specialization")
    .populate("appointmentId", "referenceId appointmentDate timeSlot status")
    .lean();

  return res.status(200).json({ success: true, message: "Medical records retrieved successfully.", data: records });
}

async function getMyMedicalRecord(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  const record = await MedicalRecord.findOne({ _id: req.params.id, patientId: patient._id })
    .populate("doctorId", "referenceId fullName specialization")
    .populate("appointmentId", "referenceId appointmentDate timeSlot status")
    .lean();

  if (!record) {
    return res.status(404).json({ success: false, message: "Medical record not found." });
  }

  return res.status(200).json({ success: true, message: "Medical record retrieved successfully.", data: record });
}

async function listMyDocuments(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  const documents = await PatientDocument.find({ patientId: patient._id }).sort({ createdAt: -1 }).lean();

  return res.status(200).json({ success: true, message: "Patient documents retrieved successfully.", data: documents });
}

async function uploadMyDocument(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  if (!req.uploadedFile) {
    return res.status(400).json({ success: false, message: "A document file is required." });
  }

  const document = await PatientDocument.create({
    patientId: patient._id,
    uploadedBy: req.user._id,
    title: req.body.title?.trim() || req.uploadedFile.originalName,
    description: req.body.description?.trim() || "",
    documentType: req.body.documentType || "other",
    fileUrl: req.uploadedFile.url,
    fileName: req.uploadedFile.originalName,
    filePublicId: req.uploadedFile.publicId,
    fileResourceType: req.uploadedFile.resourceType,
  });

  return res.status(201).json({ success: true, message: "Document uploaded successfully.", data: document });
}

async function deleteMyDocument(req, res) {
  const patient = await getLoggedInPatient(req.user._id);

  if (!patient) {
    return res.status(404).json({ success: false, message: "Patient profile not found for this account." });
  }

  const document = await PatientDocument.findOne({ _id: req.params.id, patientId: patient._id });

  if (!document) {
    return res.status(404).json({ success: false, message: "Document not found." });
  }

  if (document.status !== "submitted") {
    return res.status(400).json({ success: false, message: "Reviewed documents cannot be deleted by patient." });
  }

  await deleteCloudinaryFile(document.filePublicId, document.fileResourceType);
  await document.deleteOne();

  return res.status(200).json({ success: true, message: "Document deleted successfully.", data: { id: req.params.id } });
}

async function listAllPatientDocuments(req, res) {
  const documents = await PatientDocument.find()
    .sort({ createdAt: -1 })
    .populate("patientId", "referenceId fullName phone email")
    .populate("reviewedBy", "referenceId name role")
    .lean();

  return res.status(200).json({ success: true, message: "Patient documents retrieved successfully.", data: documents });
}

async function reviewPatientDocument(req, res) {
  const document = await PatientDocument.findById(req.params.id);

  if (!document) {
    return res.status(404).json({ success: false, message: "Document not found." });
  }

  document.status = req.body.status || document.status;
  document.reviewNotes = req.body.reviewNotes?.trim() || document.reviewNotes;
  document.reviewedBy = req.user._id;
  await document.save();

  const updated = await PatientDocument.findById(document._id)
    .populate("patientId", "referenceId fullName phone email")
    .populate("reviewedBy", "referenceId name role")
    .lean();

  return res.status(200).json({ success: true, message: "Patient document reviewed successfully.", data: updated });
}

module.exports = {
  createPatientAppointment,
  deleteMyDocument,
  getDoctorSlots,
  getMyAppointment,
  getMyBill,
  getMyMedicalRecord,
  getMyPrescription,
  listAllPatientDocuments,
  listDoctors,
  listMyAppointments,
  listMyBills,
  listMyDocuments,
  listMyMedicalRecords,
  listMyPrescriptions,
  reviewPatientDocument,
  uploadMyDocument,
};
