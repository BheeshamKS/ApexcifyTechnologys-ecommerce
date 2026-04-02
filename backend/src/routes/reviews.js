import { Router } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import Review from '../models/Review.js';
import Order from '../models/Order.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/reviews?product_id=...
router.get('/', asyncHandler(async (req, res) => {
  const { product_id, page = 1, limit = 10, sort = 'newest' } = req.query;
  if (!product_id) return res.status(400).json({ success: false, message: 'product_id is required' });

  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  const sortMap = {
    helpful: { helpful_count: -1 },
    highest: { rating: -1 },
    lowest:  { rating: 1 },
    newest:  { created_at: -1 },
  };

  const [reviews, total] = await Promise.all([
    Review.find({ product_id: new mongoose.Types.ObjectId(product_id), is_approved: true })
      .populate('customer_id', 'full_name avatar_url')
      .sort(sortMap[sort] || { created_at: -1 })
      .skip(offset)
      .limit(limitInt)
      .lean(),
    Review.countDocuments({ product_id: new mongoose.Types.ObjectId(product_id), is_approved: true }),
  ]);

  const data = reviews.map(shapeReview);

  res.json({
    success: true,
    data,
    pagination: { total, page: parseInt(page), limit: limitInt, totalPages: Math.ceil(total / limitInt) },
  });
}));

// POST /api/reviews
router.post('/', authenticate, authorize('customer', 'admin'), asyncHandler(async (req, res) => {
  const schema = Joi.object({
    product_id: Joi.string().required(),
    order_id:   Joi.string().allow(null),
    rating:     Joi.number().integer().min(1).max(5).required(),
    title:      Joi.string().max(150).allow('', null),
    comment:    Joi.string().max(2000).allow('', null),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  // Verify purchase if order_id provided
  if (value.order_id) {
    const order = await Order.findOne({
      _id: new mongoose.Types.ObjectId(value.order_id),
      customer_id: new mongoose.Types.ObjectId(req.user.id),
      'order_items.product_id': new mongoose.Types.ObjectId(value.product_id),
    });
    if (order) value.is_verified_purchase = true;
  }

  try {
    const review = await Review.create({ ...value, customer_id: req.user.id });
    await review.populate('customer_id', 'full_name avatar_url');
    res.status(201).json({ success: true, data: shapeReview(review.toJSON()) });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'You have already reviewed this product for this order' });
    }
    throw err;
  }
}));

// PUT /api/reviews/:id
router.put('/:id', authenticate, asyncHandler(async (req, res) => {
  const schema = Joi.object({
    rating:  Joi.number().integer().min(1).max(5),
    title:   Joi.string().max(150).allow('', null),
    comment: Joi.string().max(2000).allow('', null),
  });
  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const filter = req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id, customer_id: new mongoose.Types.ObjectId(req.user.id) };

  const review = await Review.findOneAndUpdate(filter, value, { new: true })
    .populate('customer_id', 'full_name avatar_url');
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  res.json({ success: true, data: shapeReview(review.toJSON()) });
}));

// DELETE /api/reviews/:id
router.delete('/:id', authenticate, asyncHandler(async (req, res) => {
  const filter = req.user.role === 'admin'
    ? { _id: req.params.id }
    : { _id: req.params.id, customer_id: new mongoose.Types.ObjectId(req.user.id) };

  const review = await Review.findOneAndDelete(filter);
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });

  res.json({ success: true, message: 'Review deleted' });
}));

// POST /api/reviews/:id/helpful
router.post('/:id/helpful', authenticate, asyncHandler(async (req, res) => {
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { $inc: { helpful_count: 1 } },
    { new: true }
  );
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  res.json({ success: true, data: review.toJSON() });
}));

// PUT /api/reviews/:id/approve – admin moderation
router.put('/:id/approve', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const { is_approved } = req.body;
  const review = await Review.findByIdAndUpdate(
    req.params.id,
    { is_approved: Boolean(is_approved) },
    { new: true }
  );
  if (!review) return res.status(404).json({ success: false, message: 'Review not found' });
  res.json({ success: true, data: review.toJSON() });
}));

function shapeReview(r) {
  const cust = r.customer_id;
  return {
    ...r,
    id: r._id?.toString() || r.id,
    _id: undefined,
    __v: undefined,
    customer_id: cust?._id?.toString() || cust?.id || cust?.toString(),
    profiles: cust && typeof cust === 'object' ? {
      full_name:  cust.full_name,
      avatar_url: cust.avatar_url,
    } : null,
  };
}

export default router;
