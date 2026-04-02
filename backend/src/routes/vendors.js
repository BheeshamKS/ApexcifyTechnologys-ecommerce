import { Router } from 'express';
import Joi from 'joi';
import mongoose from 'mongoose';
import VendorProfile from '../models/VendorProfile.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

// GET /api/vendors/dashboard
router.get('/dashboard', authenticate, authorize('vendor'), asyncHandler(async (req, res) => {
  const vendorId = new mongoose.Types.ObjectId(req.user.id);

  const [profile, products, recentItems, revenueAgg, topProductsAgg] = await Promise.all([
    VendorProfile.findOne({ user_id: vendorId }).lean(),

    Product.find({ vendor_id: vendorId }).lean(),

    Order.find({ 'order_items.vendor_id': vendorId })
      .populate('customer_id', 'full_name email')
      .sort({ created_at: -1 })
      .limit(10)
      .lean(),

    // Revenue by month (last 6 months)
    Order.aggregate([
      { $match: { 'order_items.vendor_id': vendorId } },
      { $unwind: '$order_items' },
      { $match: { 'order_items.vendor_id': vendorId } },
      {
        $group: {
          _id: { year: { $year: '$created_at' }, month: { $month: '$created_at' } },
          revenue: { $sum: '$order_items.total_price' },
          orders:  { $sum: 1 },
        },
      },
      { $sort: { '_id.year': -1, '_id.month': -1 } },
      { $limit: 6 },
    ]),

    // Top 5 selling products by revenue
    Order.aggregate([
      { $match: { 'order_items.vendor_id': vendorId } },
      { $unwind: '$order_items' },
      { $match: { 'order_items.vendor_id': vendorId } },
      {
        $group: {
          _id:          '$order_items.product_id',
          product_name:  { $first: '$order_items.product_name' },
          product_image: { $first: '$order_items.product_image' },
          quantity:      { $sum: '$order_items.quantity' },
          total_price:   { $sum: '$order_items.total_price' },
        },
      },
      { $sort: { total_price: -1 } },
      { $limit: 5 },
    ]),
  ]);

  const totalRevenue    = revenueAgg.reduce((s, r) => s + r.revenue, 0);
  const totalOrders     = recentItems.length;
  const totalProducts   = products.length;
  const activeProducts  = products.filter((p) => p.is_active).length;
  const lowStockProducts= products.filter((p) => p.is_active && p.stock <= 5).length;

  // Flatten recent order items for vendor
  const recentOrders = recentItems.flatMap((o) =>
    o.order_items
      .filter((i) => i.vendor_id?.toString() === req.user.id)
      .map((i) => ({
        ...i,
        id: i._id?.toString(),
        _id: undefined,
        orders: {
          id:              o._id.toString(),
          status:          o.status,
          created_at:      o.created_at,
          shipping_address:o.shipping_address,
          profiles:        o.customer_id ? {
            full_name: o.customer_id.full_name,
            email:     o.customer_id.email,
          } : null,
        },
      }))
  );

  res.json({
    success: true,
    data: {
      profile: profile ? { ...profile, id: profile._id.toString(), _id: undefined, __v: undefined } : null,
      stats: { totalProducts, activeProducts, lowStockProducts, totalRevenue: parseFloat(totalRevenue.toFixed(2)), totalOrders },
      recentOrders,
      revenueByMonth: revenueAgg,
      topProducts: topProductsAgg.map((p) => ({
        product_id:    p._id?.toString(),
        product_name:  p.product_name,
        product_image: p.product_image,
        quantity:      p.quantity,
        total_price:   p.total_price,
      })),
    },
  });
}));

// GET /api/vendors/orders
router.get('/orders', authenticate, authorize('vendor'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);
  const vendorId = new mongoose.Types.ObjectId(req.user.id);

  const match = { 'order_items.vendor_id': vendorId };

  const [orders, total] = await Promise.all([
    Order.find(match)
      .populate('customer_id', 'full_name email')
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limitInt)
      .lean(),
    Order.countDocuments(match),
  ]);

  const data = orders.flatMap((o) =>
    o.order_items
      .filter((i) => i.vendor_id?.toString() === req.user.id)
      .filter((i) => !status || i.vendor_status === status)
      .map((i) => ({
        ...i,
        id: i._id?.toString(),
        _id: undefined,
        orders: {
          id:               o._id.toString(),
          status:           o.status,
          payment_status:   o.payment_status,
          created_at:       o.created_at,
          shipping_address: o.shipping_address,
          profiles: o.customer_id ? {
            full_name: o.customer_id.full_name,
            email:     o.customer_id.email,
          } : null,
        },
      }))
  );

  res.json({
    success: true,
    data,
    pagination: { total, page: parseInt(page), limit: limitInt, totalPages: Math.ceil(total / limitInt) },
  });
}));

// GET /api/vendors/profile
router.get('/profile', authenticate, authorize('vendor'), asyncHandler(async (req, res) => {
  const vp = await VendorProfile.findOne({ user_id: req.user.id });
  if (!vp) return res.status(404).json({ success: false, message: 'Vendor profile not found' });
  res.json({ success: true, data: vp.toJSON() });
}));

// PUT /api/vendors/profile
router.put('/profile', authenticate, authorize('vendor'), asyncHandler(async (req, res) => {
  const schema = Joi.object({
    business_name:        Joi.string().min(2).max(100),
    business_description: Joi.string().max(1000).allow('', null),
    business_logo:        Joi.string().uri().allow('', null),
    business_address:     Joi.string().max(300).allow('', null),
    business_email:       Joi.string().email().allow('', null),
    business_phone:       Joi.string().max(30).allow('', null),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const vp = await VendorProfile.findOneAndUpdate({ user_id: req.user.id }, value, { new: true });
  res.json({ success: true, data: vp.toJSON() });
}));

// GET /api/vendors/:id – public storefront
router.get('/:id', asyncHandler(async (req, res) => {
  const profile = await VendorProfile.findOne({ user_id: req.params.id, is_approved: true })
    .populate('user_id', 'full_name avatar_url created_at')
    .lean();

  if (!profile) return res.status(404).json({ success: false, message: 'Vendor not found' });

  const products = await Product.find({ vendor_id: req.params.id, is_active: true })
    .sort({ created_at: -1 })
    .limit(20)
    .lean();

  res.json({
    success: true,
    data: {
      ...profile,
      id: profile._id.toString(),
      _id: undefined,
      __v: undefined,
      profiles: profile.user_id ? {
        full_name:  profile.user_id.full_name,
        avatar_url: profile.user_id.avatar_url,
        created_at: profile.user_id.created_at,
      } : null,
      user_id: profile.user_id?._id?.toString() || profile.user_id?.toString(),
      products: products.map((p) => ({
        ...p,
        id: p._id.toString(),
        _id: undefined,
        __v: undefined,
      })),
    },
  });
}));

export default router;
