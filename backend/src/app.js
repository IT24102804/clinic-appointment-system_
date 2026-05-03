const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const authRoutes = require("./routes/authRoutes");
const userRoutes = require("./routes/userRoutes");
const patientRoutes = require("./routes/patientRoutes");
const patientPortalRoutes = require("./routes/patientPortalRoutes");
const patientDocumentRoutes = require("./routes/patientDocumentRoutes");
const doctorRoutes = require("./routes/doctorRoutes");
const doctorPortalRoutes = require("./routes/doctorPortalRoutes");
const appointmentRoutes = require("./routes/appointmentRoutes");
const prescriptionRoutes = require("./routes/prescriptionRoutes");
const billingRoutes = require("./routes/billingRoutes");
const medicalRecordRoutes = require("./routes/medicalRecordRoutes");

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "Clinic App API is running",
  });
});

app.get("/api/health", (req, res) => {
  res.status(200).json({
    success: true,
    message: "API health check passed",
  });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/patients", patientRoutes);
app.use("/api/patient", patientPortalRoutes);
app.use("/api/patient-documents", patientDocumentRoutes);
app.use("/api/doctors", doctorRoutes);
app.use("/api/doctor", doctorPortalRoutes);
app.use("/api/appointments", appointmentRoutes);
app.use("/api/prescriptions", prescriptionRoutes);
app.use("/api/billing", billingRoutes);
app.use("/api/medical-records", medicalRecordRoutes);

app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

app.use((error, req, res, next) => {
  const isCastError = error.name === "CastError";
  const statusCode = error.statusCode || (isCastError ? 400 : 500);

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: isCastError
      ? `Invalid ${error.path || "identifier"} value. Clean old records that contain non-MongoDB IDs.`
      : error.message || "Internal server error.",
    errors: error.errors,
  });
});

module.exports = app;
