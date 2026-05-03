const cloudinary = require("cloudinary").v2;
const multer = require("multer");

const MAX_ATTACHMENT_SIZE = 5 * 1024 * 1024;
const ALLOWED_MIME_TYPES = ["application/pdf", "image/jpeg", "image/png", "image/webp"];

const cloudinaryConfigured = Boolean(
  process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
);

if (cloudinaryConfigured) {
  cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
  });
}

const upload = multer({
  storage: multer.memoryStorage(),
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

function uploadBufferToCloudinary(file, folder) {
  if (!cloudinaryConfigured) {
    const error = new Error("Cloudinary environment variables are required for file upload.");
    error.statusCode = 500;
    throw error;
  }

  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder: `clinic-app/${folder}`,
        resource_type: "auto",
      },
      (error, result) => {
        if (error) {
          reject(error);
          return;
        }

        resolve(result);
      }
    );

    stream.end(file.buffer);
  });
}

function handleCloudinaryUpload(folder) {
  return (req, res, next) => {
    upload.single("attachment")(req, res, async (error) => {
      if (error instanceof multer.MulterError && error.code === "LIMIT_FILE_SIZE") {
        return res.status(413).json({
          success: false,
          message: "Attachment exceeds the 5MB size limit.",
        });
      }

      if (error?.statusCode) {
        return res.status(error.statusCode).json({
          success: false,
          message: error.message,
        });
      }

      if (error) {
        return next(error);
      }

      if (!req.file) {
        return next();
      }

      try {
        const result = await uploadBufferToCloudinary(req.file, folder);
        req.uploadedFile = {
          url: result.secure_url,
          publicId: result.public_id,
          resourceType: result.resource_type,
          originalName: req.file.originalname,
        };
        return next();
      } catch (uploadError) {
        return next(uploadError);
      }
    });
  };
}

async function deleteCloudinaryFile(publicId, resourceType = "image") {
  if (!publicId || !cloudinaryConfigured) {
    return;
  }

  await cloudinary.uploader.destroy(publicId, {
    resource_type: resourceType || "image",
  });
}

module.exports = {
  deleteCloudinaryFile,
  handleCloudinaryUpload,
  MAX_ATTACHMENT_SIZE,
};
