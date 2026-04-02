import jwt from 'jsonwebtoken';
import User from '../models/User.js';

/**
 * Verifies the Bearer JWT. Attaches req.user = lean User document (no password).
 */
export const authenticate = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) {
      return res.status(401).json({ success: false, message: 'No token provided' });
    }

    const token = authHeader.split(' ')[1];
    let decoded;
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET);
    } catch {
      return res.status(401).json({ success: false, message: 'Invalid or expired token' });
    }

    const user = await User.findById(decoded.id).lean();
    if (!user) return res.status(401).json({ success: false, message: 'User not found' });
    if (!user.is_active) return res.status(403).json({ success: false, message: 'Account is disabled' });

    // Normalise _id → id
    user.id = user._id.toString();
    delete user._id;
    delete user.password;
    delete user.__v;

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
};

/**
 * Optional auth — attaches user if valid token present, continues either way.
 */
export const optionalAuth = async (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith('Bearer ')) return next();

    const token = authHeader.split(' ')[1];
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).lean();

    if (user && user.is_active) {
      user.id = user._id.toString();
      delete user._id;
      delete user.password;
      delete user.__v;
      req.user = user;
    }
    next();
  } catch {
    next();
  }
};

/** Generate a signed JWT for a user id */
export function signToken(userId) {
  return jwt.sign({ id: userId.toString() }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRES_IN || '7d',
  });
}
