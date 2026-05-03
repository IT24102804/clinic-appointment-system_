const Appointment = require("../models/Appointment");
const { createCrudController } = require("../utils/crudController");

const SLOT_BLOCKING_STATUSES = ["booked", "pending", "confirmed", "rescheduled", "completed"];
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
