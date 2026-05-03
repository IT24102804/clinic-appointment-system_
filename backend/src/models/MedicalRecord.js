const mongoose = require("mongoose");
const { addReferenceId } = require("../utils/referenceId");

const medicalRecordSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    doctorId: { type: mongoose.Schema.Types.ObjectId, ref: "Doctor", required: true },
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: "Appointment", required: true },
    visitSummary: { type: String, required: true, trim: true },
    diagnosis: { type: String, required: true, trim: true },
    treatmentNotes: { type: String, required: true, trim: true },
    recordDate: { type: Date, required: true },
    status: { type: String, enum: ["active", "archived"], default: "active" },
    attachmentUrl: { type: String, default: "" },
    attachmentName: { type: String, default: "" },
    attachmentPublicId: { type: String, default: "" },
    attachmentResourceType: { type: String, default: "" },
  },
  { timestamps: true }
);

addReferenceId(medicalRecordSchema, "MR");

module.exports = mongoose.model("MedicalRecord", medicalRecordSchema);
