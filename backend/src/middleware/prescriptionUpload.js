const fs = require("fs");
const multer = require("multer");
const path = require("path");

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const storage = multer.diskStorage({
  destination(req, file, callback) {
    const destination = path.join(__dirname, "..", "uploads", "prescriptions", req.params.id);
    fs.mkdirSync(destination, { recursive: true });
    callback(null, destination);
  },
  filename(req, file, callback) {
    const extension = path.extname(file.originalname) || "";
    const baseName = path
      .basename(file.originalname, extension)
      .replace(/[^a-zA-Z0-9-_]/g, "-")
      .replace(/-+/g, "-")
      .replace(/^-|-$/g, "")
      .toLowerCase();

    callback(null, `${Date.now()}-${baseName || "attachment"}${extension.toLowerCase()}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_ATTACHMENT_SIZE,
  },
  fileFilter(req, file, callback) {
    if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
      const error = new Error("Only PDF, JPG, PNG, and WEBP attachments are allowed.");
      error.statusCode = 400;
      return callback(error);
    }

    return callback(null, true);
  },
});

function handlePrescriptionUpload(req, res, next) {
  upload.single("attachment")(req, res, (error) => {
    if (!error) {
      return next();
    }

    if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
      return res.status(413).json({
        success: false,
        message: "Attachment exceeds the 5MB size limit.",
      });
    }

    if (error.statusCode) {
      return res.status(error.statusCode).json({
        success: false,
        message: error.message,
      });
    }

    return next(error);
  });
}

module.exports = {
  handlePrescriptionUpload,
  MAX_ATTACHMENT_SIZE,
};
