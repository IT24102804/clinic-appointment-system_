const jwt = require("jsonwebtoken");

// ------------------ Protect: Verify JWT token ------------------
function protect(req, res, next) {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return res.status(401).json({
        success: false,
        message: "Authorization token required.",
      });
    }

    const token = authHeader.slice("Bearer ".length).trim();

    if (!process.env.JWT_ACCESS_SECRET) {
      return res.status(500).json({
        success: false,
        message: "JWT_ACCESS_SECRET is not configured.",
      });
    }

    const payload = jwt.verify(token, process.env.JWT_ACCESS_SECRET);

    req.user = {
      id: payload.id,
      role: payload.role,
    };

    return next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token.",
    });
  }
}

// ------------------ Authorize: Check user role ------------------
function authorize(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        message: "Not authenticated.",
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: ${req.user.role} role does not have access to this resource.`,
        requiredRoles: allowedRoles,
      });
    }

    next();
  };
}

module.exports = {
  protect,
  authorize,
};