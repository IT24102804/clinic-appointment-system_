const mongoose = require("mongoose");
const { addReferenceId } = require("../utils/referenceId");

const appointmentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointmentDate: { type: Date, required: true },
    timeSlot: { type: String, required: true, trim: true },
    reason: { type: String, required: true, trim: true },
    status: {
      type: String,
      enum: ["booked", "rescheduled", "pending", "confirmed", "rejected", "completed", "cancelled"],
      default: "booked",
    },
    attachmentUrl: { type: String, default: "" },
    attachmentName: { type: String, default: "" },
    attachmentPublicId: { type: String, default: "" },
    attachmentResourceType: { type: String, default: "" },
  },
  { timestamps: true }
);

addReferenceId(appointmentSchema, "APT");

module.exports = mongoose.model("Appointment", appointmentSchema);
