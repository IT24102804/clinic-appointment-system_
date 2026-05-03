const { authenticate, authorizeRoles } = require("./auth");

module.exports = {
  requirePrescriptionReadAccess: [authenticate, authorizeRoles("admin", "receptionist", "doctor")],
  requirePrescriptionWriteAccess: [authenticate, authorizeRoles("admin", "doctor")],
};
