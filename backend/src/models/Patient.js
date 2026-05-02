const mongoose = require("mongoose");

const patientSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    NIC: {
      type: String,
      required: true,
      unique: true,
      index: true,
      immutable: true,
      trim: true,
    },
    phone: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    dateOfBirth: {
      type: Date,
      required: true,
    },
    gender: {
      type: String,
      enum: ["Male", "Female", "Other"],
      required: true,
    },
    // Required main address
    address: {
      type: String,
      required: true,
      trim: true,
    },
    // Optional additional addresses (deletable sub‑documents)
    additionalAddresses: [
      {
        label: {
          type: String,
          enum: ["home", "work", "other"],
          default: "other",
        },
        line: {
          type: String,
          required: true,
          trim: true,
        },
      },
    ],
    // Optional emergency contact – can be set to null to "delete"
    emergencyContact: {
      name: { type: String },
      phone: { type: String },
      relationship: { type: String },
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Patient", patientSchema);