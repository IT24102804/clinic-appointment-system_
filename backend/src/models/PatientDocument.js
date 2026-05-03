const mongoose = require("mongoose");
const { addReferenceId } = require("../utils/referenceId");

const patientDocumentSchema = new mongoose.Schema(
  {
    patientId: { type: mongoose.Schema.Types.ObjectId, ref: "Patient", required: true },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, trim: true, default: "" },
    documentType: {
      type: String,
      enum: ["lab_report", "previous_prescription", "scan_report", "referral_letter", "other"],
      default: "other",
    },
    fileUrl: { type: String, required: true },
    fileName: { type: String, required: true },
    filePublicId: { type: String, required: true },
    fileResourceType: { type: String, default: "image" },
    status: {
      type: String,
      enum: ["submitted", "reviewed", "rejected", "linked_to_record"],
      default: "submitted",
    },
    reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    reviewNotes: { type: String, trim: true, default: "" },
  },
  { timestamps: true }
);

addReferenceId(patientDocumentSchema, "PDOC");

module.exports = mongoose.model("PatientDocument", patientDocumentSchema);
