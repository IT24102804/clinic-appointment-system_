function requirePrescriptionReadAccess(req, res, next) {
  // Placeholder for future auth integration.
  // Swap this with patient/staff role checks once the auth module exists.
  next();
}

function requirePrescriptionWriteAccess(req, res, next) {
  // Placeholder for future auth integration.
  // Swap this with doctor/admin role checks once the auth module exists.
  next();
}

module.exports = {
  requirePrescriptionReadAccess,
  requirePrescriptionWriteAccess,
};
