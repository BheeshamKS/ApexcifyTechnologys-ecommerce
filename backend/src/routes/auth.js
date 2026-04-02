import { Router } from 'express';
import jwt from 'jsonwebtoken';
import Joi from 'joi';
import User from '../models/User.js';
import VendorProfile from '../models/VendorProfile.js';
import { authenticate, signToken } from '../middleware/auth.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendPasswordReset } from '../services/email.js';

const router = Router();

const registerSchema = Joi.object({
  email:         Joi.string().email().required(),
  password:      Joi.string().min(8).required(),
  full_name:     Joi.string().min(2).max(100).required(),
  role:          Joi.string().valid('customer', 'vendor').default('customer'),
  business_name: Joi.string().max(100).when('role', { is: 'vendor', then: Joi.required() }),
});

const loginSchema = Joi.object({
  email:    Joi.string().email().required(),
  password: Joi.string().required(),
});

function buildSession(userId) {
  return { access_token: signToken(userId), token_type: 'Bearer', expires_in: 604800 };
}

// POST /api/auth/register
router.post('/register', asyncHandler(async (req, res) => {
  const { error, value } = registerSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { email, password, full_name, role, business_name } = value;

  if (await User.findOne({ email })) {
    return res.status(400).json({ success: false, message: 'An account with this email already exists' });
  }

  const user = await User.create({ email, password, full_name, role });

  if (role === 'vendor' && business_name) {
    await VendorProfile.create({ user_id: user._id, business_name, is_approved: false });
  }

  res.status(201).json({
    success: true,
    message: 'Account created successfully',
    data: { session: buildSession(user._id), user: user.toJSON() },
  });
}));

// POST /api/auth/login
router.post('/login', asyncHandler(async (req, res) => {
  const { error, value } = loginSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { email, password } = value;
  const user = await User.findOne({ email });

  if (!user || !(await user.comparePassword(password))) {
    return res.status(401).json({ success: false, message: 'Invalid email or password' });
  }
  if (!user.is_active) {
    return res.status(403).json({ success: false, message: 'Account is disabled' });
  }

  res.json({ success: true, data: { session: buildSession(user._id), user: user.toJSON() } });
}));

// POST /api/auth/logout — JWT is stateless; client just drops the token
router.post('/logout', authenticate, asyncHandler(async (req, res) => {
  res.json({ success: true, message: 'Logged out successfully' });
}));

// GET /api/auth/me
router.get('/me', authenticate, asyncHandler(async (req, res) => {
  let vendorProfile = null;
  if (req.user.role === 'vendor') {
    const vp = await VendorProfile.findOne({ user_id: req.user.id });
    if (vp) vendorProfile = vp.toJSON();
  }
  res.json({ success: true, data: { user: req.user, vendor_profile: vendorProfile } });
}));

// PUT /api/auth/me
router.put('/me', authenticate, asyncHandler(async (req, res) => {
  const schema = Joi.object({
    full_name:  Joi.string().min(2).max(100),
    phone:      Joi.string().allow('', null),
    avatar_url: Joi.string().uri().allow('', null),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const user = await User.findByIdAndUpdate(req.user.id, value, { new: true });
  res.json({ success: true, data: { user: user.toJSON() } });
}));

// POST /api/auth/forgot-password
router.post('/forgot-password', asyncHandler(async (req, res) => {
  const { email } = req.body;
  if (!email) return res.status(400).json({ success: false, message: 'Email is required' });

  const user = await User.findOne({ email });
  if (user) {
    const resetToken = jwt.sign(
      { id: user._id.toString(), purpose: 'reset' },
      process.env.JWT_SECRET,
      { expiresIn: '1h' }
    );
    const link = `${process.env.FRONTEND_URL}/auth/reset-password?token=${resetToken}`;
    await sendPasswordReset(email, link).catch(console.error);
  }

  res.json({ success: true, message: 'If that email exists, a reset link has been sent.' });
}));

// PUT /api/auth/reset-password
router.put('/reset-password', asyncHandler(async (req, res) => {
  const { token, password } = req.body;
  if (!token || !password || password.length < 8) {
    return res.status(400).json({ success: false, message: 'token and password (min 8 chars) required' });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    return res.status(400).json({ success: false, message: 'Invalid or expired reset link' });
  }

  if (decoded.purpose !== 'reset') {
    return res.status(400).json({ success: false, message: 'Invalid reset token' });
  }

  const user = await User.findById(decoded.id);
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });

  user.password = password; // pre-save hook hashes it
  await user.save();
  res.json({ success: true, message: 'Password updated successfully' });
}));

export default router;
