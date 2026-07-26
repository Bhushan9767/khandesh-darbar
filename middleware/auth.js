const jwt = require("jsonwebtoken");
const Admin = require("../models/Admin");

/**
 * Protects admin-panel routes (menu/gallery/reviews/offers/bookings
 * CRUD writes). Public GET endpoints used by the public website do
 * NOT use this middleware - only the create/update/delete admin
 * endpoints do.
 */
async function requireAuth(req, res, next) {
  try {
    const header = req.headers.authorization || "";
    let token = null;
    
    if (header.startsWith("Bearer ")) {
      token = header.slice(7);
    } else {
      token = header;
    }

    if (!token) {
      return res.status(401).json({ message: "Not authorized, no token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || "khandesh_darbar_secret_key_12345");
    const admin = await Admin.findById(decoded.id);

    if (!admin) {
      return res.status(401).json({ message: "Not authorized, admin no longer exists." });
    }

    req.admin = admin;
    next();
  } catch (err) {
    return res.status(401).json({ message: "Not authorized, invalid or expired token." });
  }
}

function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.admin || !roles.includes(req.admin.role)) {
      return res.status(403).json({ message: "You don't have permission to perform this action." });
    }
    next();
  };
}

module.exports = { requireAuth, requireRole };
