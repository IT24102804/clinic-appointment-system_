const mongoose = require("mongoose");
const { addReferenceId } = require("../utils/referenceId");

const doctorSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
    fullName: { type: String, required: true, trim: true },
    specialization: { type: String, required: true, trim: true },
    phone: { type: String, required: true, trim: true },
    email: { type: String, trim: true, lowercase: true, default: "" },
    room: { type: String, trim: true, default: "" },
    experienceYears: { type: Number, min: 0, default: 0 },
    sessionFee: { type: Number, min: 0, default: 0 },
    availability: {
      type: [
        {
          dayOfWeek: {
            type: String,
            enum: ["sun", "mon", "tue", "wed", "thu", "fri", "sat"],
            required: true,
          },
          startTime: { type: String, required: true, trim: true },
          endTime: { type: String, required: true, trim: true },
        },
      ],
      default: [],
    },
    availabilityStatus: {
      type: String,
      enum: ["available", "unavailable", "on_leave"],
      default: "available",
    },
    status: { type: String, enum: ["active", "inactive"], default: "active" },
    profileImageUrl: { type: String, default: "" },
    profileImageName: { type: String, default: "" },
    profileImagePublicId: { type: String, default: "" },
    profileImageResourceType: { type: String, default: "" },
  },
  { timestamps: true }
);

addReferenceId(doctorSchema, "DOC");

module.exports = mongoose.model("Doctor", doctorSchema);
