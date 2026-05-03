const { handleCloudinaryUpload, MAX_ATTACHMENT_SIZE } = require("../multer/cloudinaryUpload");

module.exports = {
  handlePrescriptionUpload: handleCloudinaryUpload("prescriptions"),
  MAX_ATTACHMENT_SIZE,
};
