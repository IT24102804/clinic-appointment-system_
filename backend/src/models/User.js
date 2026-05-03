const mongoose = require("mongoose");
const { addReferenceId } = require("../utils/referenceId");

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },
    passwordHash: {
      type: String,
      required: true,
    },
    role: {
      type: String,
      enum: ["admin", "doctor", "receptionist", "patient"],
      default: "receptionist",
    },
    status: {
      type: String,
      enum: ["active", "inactive"],
      default: "active",
    },
  },
  { timestamps: true }
);

addReferenceId(userSchema, "STF");

module.exports = mongoose.model("User", userSchema);
