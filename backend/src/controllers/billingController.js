const Billing = require("../models/Billing");
const { createCrudController } = require("../utils/crudController");

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

module.exports = createCrudController({
  Model: Billing,
  resourceName: "Billing",
  buildPayload,
  queryFields: ["patientId", "appointmentId", "paymentStatus"],
  populate: [
    { path: "patientId", select: "referenceId fullName phone email" },
    { path: "appointmentId", select: "referenceId appointmentDate timeSlot status" },
  ],
  attachment: {
    urlField: "receiptUrl",
    nameField: "receiptName",
    publicIdField: "receiptPublicId",
    resourceTypeField: "receiptResourceType",
  },
});
