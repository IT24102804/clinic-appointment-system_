const { authenticate } = require("./auth");

module.exports = {
  requirePrescriptionReadAccess: authenticate,
  requirePrescriptionWriteAccess: authenticate,
};
