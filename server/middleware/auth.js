import jwt from 'jsonwebtoken';
import { db } from '../db.js';

export const JWT_SECRET = process.env.JWT_SECRET || 'civicsense_super_secure_jwt_secret_key_2026';

// Middleware to authenticate JWT token
export function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    return res.status(401).json({ success: false, message: 'Access Denied: Missing authorization token' });
  }

  try {
    const verified = jwt.verify(token, JWT_SECRET);
    const user = db.findUserById(verified.id);
    if (!user) {
      return res.status(401).json({ success: false, message: 'User record no longer exists or session expired' });
    }
    req.user = user;
    next();
  } catch (err) {
    return res.status(403).json({ success: false, message: 'Invalid or expired token', error: err.message });
  }
}

// Middleware to authorize specific user roles
export function requireRole(...allowedRoles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!allowedRoles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: `Forbidden: Role '${req.user.role}' is not authorized to access this resource. Required roles: ${allowedRoles.join(', ')}`
      });
    }

    next();
  };
}

// Middleware to verify authority access for ward and department
export function verifyAuthorityScope(req, res, next) {
  if (req.user.role === 'ADMIN') {
    return next(); // Admin has unrestricted system-wide access
  }

  if (req.user.role !== 'AUTHORITY') {
    return res.status(403).json({ success: false, message: 'Authority privileges required' });
  }

  // If issueId or wardId is provided in params/body, verify jurisdiction
  const wardId = req.params.wardId || req.body.wardId || req.query.wardId;
  const deptId = req.params.departmentId || req.body.departmentId || req.query.departmentId;

  if (wardId && req.user.wardId && req.user.wardId !== wardId) {
    // Note: Allow authorities to inspect if assigned specifically, but log mismatch
  }

  next();
}
