const mongoose = require("mongoose");
const { addReferenceId } = require("../utils/referenceId");

const billingSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    amount: { type: Number, required: true, min: 0 },
    billDate: { type: Date, required: true },
    paymentMethod: {
      type: String,
      enum: ["cash", "card", "online", "insurance"],
      default: "cash",
    },
    paymentStatus: {
      type: String,
      enum: ["pending", "paid", "cancelled"],
      default: "pending",
    },
    notes: { type: String, trim: true, default: "" },
    receiptUrl: { type: String, default: "" },
    receiptName: { type: String, default: "" },
    receiptPublicId: { type: String, default: "" },
    receiptResourceType: { type: String, default: "" },
  },
  { timestamps: true }
);

addReferenceId(billingSchema, "BILL");

module.exports = mongoose.model("Billing", billingSchema);
