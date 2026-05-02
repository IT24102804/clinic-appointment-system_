const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const path = require("path");

const prescriptionRoutes = require("./routes/prescriptionRoutes");
const authRoutes = require('./routes/authRoutes');
const patientRoutes = require('./routes/paitentRoute');  // ✅ already imported

const app = express();

// ========== Basic middleware (always first) ==========
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(morgan("dev"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ========== Health check routes ==========
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

// ========== API routes ==========
app.use("/api/auth", authRoutes);
app.use("/api/patients", patientRoutes);        // ✅ ADD THIS LINE
app.use("/api/prescriptions", prescriptionRoutes);

// ========== 404 handler ==========
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: "Route not found.",
  });
});

// ========== Global error handler ==========
app.use((error, req, res, next) => {
  const statusCode = error.statusCode || 500;

  if (statusCode >= 500) {
    console.error(error);
  }

  res.status(statusCode).json({
    success: false,
    message: error.message || "Internal server error.",
  });
});

module.exports = app;