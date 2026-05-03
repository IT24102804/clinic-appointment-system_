const Appointment = require("../models/Appointment");
const Doctor = require("../models/Doctor");
const Patient = require("../models/Patient");
const { createCrudController } = require("../utils/crudController");

const SLOT_BLOCKING_STATUSES = ["booked", "pending", "confirmed", "rescheduled", "completed"];
const DAY_KEYS = ["sun", "mon", "tue", "wed", "thu", "fri", "sat"];
const populate = [
  { path: "patientId", select: "referenceId fullName phone email" },
  { path: "doctorId", select: "referenceId fullName specialization room sessionFee" },
];

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

function mergeDefined(base, updates) {
  return Object.entries(updates).reduce(
    (values, [key, value]) => {
      if (value !== undefined) {
        values[key] = value;
      }

      return values;
    },
    { ...base }
  );
}

function getDateRange(dateValue) {
  const start = new Date(dateValue);
  start.setHours(0, 0, 0, 0);
  const end = new Date(start);
  end.setDate(end.getDate() + 1);
  return { start, end };
}

function isSlotBlocking(status) {
  return SLOT_BLOCKING_STATUSES.includes(status || "booked");
}

function minutesFrom24HourTime(value) {
  const match = String(value).match(/^([01][0-9]|2[0-3]):([0-5][0-9])$/);

  if (!match) {
    return null;
  }

  return Number(match[1]) * 60 + Number(match[2]);
}

function minutesFromAppointmentSlot(value) {
  const startValue = String(value).split("-")[0].trim();
  const twelveHourMatch = startValue.match(/^(\d{1,2}):(\d{2})\s?(AM|PM)$/i);

  if (twelveHourMatch) {
    let hours = Number(twelveHourMatch[1]);
    const minutes = Number(twelveHourMatch[2]);
    const meridiem = twelveHourMatch[3].toUpperCase();

    if (meridiem === "PM" && hours < 12) {
      hours += 12;
    }

    if (meridiem === "AM" && hours === 12) {
      hours = 0;
    }

    return hours * 60 + minutes;
  }

  return minutesFrom24HourTime(startValue);
}

function isInsideDoctorAvailability(doctor, appointmentDate, timeSlot) {
  const date = new Date(appointmentDate);
  const slotMinutes = minutesFromAppointmentSlot(timeSlot);

  if (Number.isNaN(date.getTime()) || slotMinutes === null) {
    return false;
  }

  const dayKey = DAY_KEYS[date.getDay()];

  return (doctor.availability || []).some((item) => {
    if (item.dayOfWeek !== dayKey) {
      return false;
    }

    const startMinutes = minutesFrom24HourTime(item.startTime);
    const endMinutes = minutesFrom24HourTime(item.endTime);

    return startMinutes !== null && endMinutes !== null && slotMinutes >= startMinutes && slotMinutes < endMinutes;
  });
}

async function ensureActiveParticipantsAndAvailability(payload, res) {
  if (!payload.patientId || !payload.doctorId || !payload.appointmentDate || !payload.timeSlot) {
    return true;
  }

  const [patient, doctor] = await Promise.all([
    Patient.findById(payload.patientId).select("status").lean(),
    Doctor.findById(payload.doctorId).select("status availabilityStatus availability").lean(),
  ]);

  if (!patient || patient.status !== "active") {
    return res.status(400).json({
      success: false,
      message: "Appointment can only be created for an active patient.",
    });
  }

  if (!doctor || doctor.status !== "active" || doctor.availabilityStatus !== "available") {
    return res.status(400).json({
      success: false,
      message: "Appointment can only be created for an active and available doctor.",
    });
  }

  if (!isInsideDoctorAvailability(doctor, payload.appointmentDate, payload.timeSlot)) {
    return res.status(400).json({
      success: false,
      message: "Selected appointment time is outside the doctor's availability.",
    });
  }

  return true;
}

async function ensureAvailableSlot(payload, excludeId, res) {
  if (!payload.doctorId || !payload.appointmentDate || !payload.timeSlot || !isSlotBlocking(payload.status)) {
    return true;
  }

  const { start, end } = getDateRange(payload.appointmentDate);
  const query = {
    doctorId: payload.doctorId,
    appointmentDate: { $gte: start, $lt: end },
    timeSlot: payload.timeSlot,
    status: { $in: SLOT_BLOCKING_STATUSES },
  };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingAppointment = await Appointment.findOne(query).lean();

  if (!existingAppointment) {
    return true;
  }

  return res.status(409).json({
    success: false,
    message: "This doctor already has an appointment for the selected date and time slot.",
  });
}

const crudController = createCrudController({
  Model: Appointment,
  resourceName: "Appointment",
  buildPayload,
  queryFields: ["patientId", "doctorId", "status"],
  populate,
});

async function createAppointment(req, res) {
  const payload = buildPayload(req.body);
  const validWorkflow = await ensureActiveParticipantsAndAvailability(payload, res);

  if (validWorkflow !== true) {
    return validWorkflow;
  }

  const available = await ensureAvailableSlot(payload, null, res);

  if (available !== true) {
    return available;
  }

  req.body = payload;
  return crudController.create(req, res);
}

async function updateAppointment(req, res) {
  const existingAppointment = await Appointment.findById(req.params.id).lean();

  if (!existingAppointment) {
    return res.status(404).json({
      success: false,
      message: "Appointment not found.",
    });
  }

  const payload = mergeDefined(existingAppointment, buildPayload(req.body));
  const scheduleChanged = ["patientId", "doctorId", "appointmentDate", "timeSlot"].some((field) => req.body[field] !== undefined);
  const validWorkflow = scheduleChanged ? await ensureActiveParticipantsAndAvailability(payload, res) : true;

  if (validWorkflow !== true) {
    return validWorkflow;
  }

  const available = await ensureAvailableSlot(payload, req.params.id, res);

  if (available !== true) {
    return available;
  }

  req.body = buildPayload(req.body);
  return crudController.update(req, res);
}

module.exports = {
  ...crudController,
  create: createAppointment,
  update: updateAppointment,
};
