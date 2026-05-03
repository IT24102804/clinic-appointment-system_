const Appointment = require("../models/Appointment");
const Billing = require("../models/Billing");
const { createCrudController } = require("../utils/crudController");

const populate = [
  { path: "patientId", select: "referenceId fullName phone email" },
  { path: "appointmentId", select: "referenceId appointmentDate timeSlot status" },
];
const BILLABLE_APPOINTMENT_STATUSES = ["confirmed", "completed"];

function buildPayload(body) {
  return {
    patientId: body.patientId,
    appointmentId: body.appointmentId,
    amount: body.amount === undefined || body.amount === "" ? undefined : Number(body.amount),
    billDate: body.billDate ? new Date(body.billDate) : undefined,
    paymentMethod: body.paymentMethod,
    paymentStatus: body.paymentStatus,
    notes: body.notes?.trim(),
  };
}

async function buildTrustedPayload(body, fallbackAppointmentId, res) {
  const payload = buildPayload(body);
  const appointmentId = payload.appointmentId || fallbackAppointmentId;

  if (!appointmentId) {
    return payload;
  }

  const appointment = await Appointment.findById(appointmentId).select("patientId status").lean();

  if (!appointment) {
    res.status(404).json({
      success: false,
      message: "Appointment not found for this bill.",
    });
    return null;
  }

  if (!BILLABLE_APPOINTMENT_STATUSES.includes(appointment.status)) {
    res.status(400).json({
      success: false,
      message: "Billing can only be created for confirmed or completed appointments.",
    });
    return null;
  }

  return {
    ...payload,
    appointmentId,
    patientId: appointment.patientId,
  };
}

async function ensureUniqueBill(appointmentId, excludeId, res) {
  if (!appointmentId) {
    return true;
  }

  const query = { appointmentId };

  if (excludeId) {
    query._id = { $ne: excludeId };
  }

  const existingBill = await Billing.findOne(query).lean();

  if (!existingBill) {
    return true;
  }

  return res.status(409).json({
    success: false,
    message: "A bill already exists for this appointment.",
  });
}

const crudController = createCrudController({
  Model: Billing,
  resourceName: "Billing",
  buildPayload,
  queryFields: ["patientId", "appointmentId", "paymentStatus"],
  populate,
  attachment: {
    urlField: "receiptUrl",
    nameField: "receiptName",
    publicIdField: "receiptPublicId",
    resourceTypeField: "receiptResourceType",
  },
});

async function createBill(req, res) {
  const payload = await buildTrustedPayload(req.body, null, res);

  if (!payload) {
    return undefined;
  }

  if (payload.appointmentId) {
    const unique = await ensureUniqueBill(payload.appointmentId, null, res);

    if (unique !== true) {
      return unique;
    }
  }

  req.body = payload;
  return crudController.create(req, res);
}

async function updateBill(req, res) {
  const existingBill = await Billing.findById(req.params.id).lean();

  if (!existingBill) {
    return res.status(404).json({
      success: false,
      message: "Billing not found.",
    });
  }

  const payload = await buildTrustedPayload(req.body, existingBill.appointmentId, res);

  if (!payload) {
    return undefined;
  }

  const appointmentId = payload.appointmentId || existingBill.appointmentId;
  const unique = await ensureUniqueBill(appointmentId, req.params.id, res);

  if (unique !== true) {
    return unique;
  }

  req.body = {
    ...payload,
    patientId: payload.patientId || existingBill.patientId,
  };
  return crudController.update(req, res);
}

module.exports = {
  ...crudController,
  create: createBill,
  update: updateBill,
};
