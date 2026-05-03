const mongoose = require("mongoose");
const { addReferenceId } = require("../utils/referenceId");

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null, index: true },
    fullName: { type: String, required: true, trim: true },
    age: { type: Number, required: true, min: 0 },
    gender: { type: String, enum: ["male", "female", "other"], required: true },
    phone: { type: String, required: true, trim: true },
    nic: { type: String, trim: true, default: "" },
    dateOfBirth: { type: Date, default: null },
    email: { type: String, trim: true, lowercase: true, default: "" },
    address: { type: String, trim: true, default: "" },
    additionalAddresses: {
      type: [
        {
          label: { type: String, trim: true, default: "Other" },
          address: { type: String, trim: true, required: true },
        },
      ],
      default: [],
    },
    emergencyContact: {
      name: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      relationship: { type: String, trim: true, default: "" },
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    attachmentUrl: { type: String, default: "" },
    attachmentName: { type: String, default: "" },
    attachmentPublicId: { type: String, default: "" },
    attachmentResourceType: { type: String, default: "" },
  },
  { timestamps: true }
);

addReferenceId(patientSchema, "PAT");

module.exports = mongoose.model("Patient", patientSchema);
