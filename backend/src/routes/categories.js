import { Router } from 'express';
import Joi from 'joi';
import Category from '../models/Category.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/categories – public
router.get('/', asyncHandler(async (req, res) => {
  const data = await Category.find({ is_active: true }).sort({ sort_order: 1 }).lean();
  res.json({ success: true, data: data.map(toJSON) });
}));

// GET /api/categories/:id – public
router.get('/:id', asyncHandler(async (req, res) => {
  const data = await Category.findById(req.params.id).lean();
  if (!data) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, data: toJSON(data) });
}));

// POST /api/categories – admin only
router.post('/', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const schema = Joi.object({
    name:        Joi.string().min(2).max(80).required(),
    slug:        Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).required(),
    description: Joi.string().allow('', null),
    image_url:   Joi.string().uri().allow('', null),
    parent_id:   Joi.string().allow(null),
    sort_order:  Joi.number().integer().min(0).default(0),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  try {
    const cat = await Category.create(value);
    res.status(201).json({ success: true, data: cat.toJSON() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A category with this slug already exists' });
    }
    throw err;
  }
}));

// PUT /api/categories/:id – admin only
router.put('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const schema = Joi.object({
    name:        Joi.string().min(2).max(80),
    slug:        Joi.string().lowercase().pattern(/^[a-z0-9-]+$/),
    description: Joi.string().allow('', null),
    image_url:   Joi.string().uri().allow('', null),
    parent_id:   Joi.string().allow(null),
    sort_order:  Joi.number().integer().min(0),
    is_active:   Joi.boolean(),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const data = await Category.findByIdAndUpdate(req.params.id, value, { new: true });
  if (!data) return res.status(404).json({ success: false, message: 'Category not found' });
  res.json({ success: true, data: data.toJSON() });
}));

// DELETE /api/categories/:id – admin only (soft delete)
router.delete('/:id', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  await Category.findByIdAndUpdate(req.params.id, { is_active: false });
  res.json({ success: true, message: 'Category deactivated' });
}));

function toJSON(doc) {
  const o = { ...doc };
  o.id = o._id.toString();
  delete o._id;
  delete o.__v;
  return o;
}

export default router;
