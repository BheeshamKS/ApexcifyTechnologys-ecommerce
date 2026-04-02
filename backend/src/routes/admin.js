import { Router } from 'express';
import mongoose from 'mongoose';
import User from '../models/User.js';
import VendorProfile from '../models/VendorProfile.js';
import Product from '../models/Product.js';
import Order from '../models/Order.js';
import Review from '../models/Review.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();
router.use(authenticate, authorize('admin'));

// GET /api/admin/dashboard
router.get('/dashboard', asyncHandler(async (req, res) => {
  const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);

  const [
    totalUsers,
    totalVendors,
    totalProducts,
    totalOrders,
    recentOrders,
    pendingVendors,
    revenueAgg,
  ] = await Promise.all([
    User.countDocuments(),
    User.countDocuments({ role: 'vendor' }),
    Product.countDocuments({ is_active: true }),
    Order.countDocuments(),
    Order.find()
      .populate('customer_id', 'full_name email')
      .sort({ created_at: -1 })
      .limit(10)
      .lean(),
    VendorProfile.find({ is_approved: false })
      .populate('user_id', 'full_name email')
      .sort({ created_at: -1 })
      .lean(),
    Order.aggregate([
      { $match: { payment_status: 'paid', created_at: { $gte: thirtyDaysAgo } } },
      { $group: { _id: null, total: { $sum: '$total_amount' } } },
    ]),
  ]);

  const revenueThisMonth = revenueAgg[0]?.total || 0;

  res.json({
    success: true,
    data: {
      stats: { totalUsers, totalVendors, totalProducts, totalOrders, revenueThisMonth: parseFloat(revenueThisMonth.toFixed(2)) },
      recentOrders: recentOrders.map((o) => ({
        ...o,
        id: o._id.toString(),
        _id: undefined,
        __v: undefined,
        profiles: o.customer_id ? { full_name: o.customer_id.full_name, email: o.customer_id.email } : null,
        customer_id: o.customer_id?._id?.toString(),
      })),
      pendingVendorApprovals: pendingVendors.map((v) => ({
        ...v,
        id: v._id.toString(),
        _id: undefined,
        __v: undefined,
        profiles: v.user_id ? { full_name: v.user_id.full_name, email: v.user_id.email } : null,
        user_id: v.user_id?._id?.toString(),
      })),
    },
  });
}));

// GET /api/admin/users
router.get('/users', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, role, search, is_active } = req.query;
  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  const match = {};
  if (role)                        match.role      = role;
  if (is_active !== undefined)     match.is_active = is_active === 'true';
  if (search)                      match.email     = { $regex: search, $options: 'i' };

  const [users, total] = await Promise.all([
    User.find(match).sort({ created_at: -1 }).skip(offset).limit(limitInt).lean(),
    User.countDocuments(match),
  ]);

  const data = users.map((u) => ({
    ...u,
    id: u._id.toString(),
    _id: undefined,
    __v: undefined,
    password: undefined,
  }));

  res.json({
    success: true,
    data,
    pagination: { total, page: parseInt(page), limit: limitInt, totalPages: Math.ceil(total / limitInt) },
  });
}));

// PUT /api/admin/users/:id
router.put('/users/:id', asyncHandler(async (req, res) => {
  const { role, is_active, full_name } = req.body;
  const update = {};
  if (role && ['admin','vendor','customer'].includes(role)) update.role      = role;
  if (is_active !== undefined)                              update.is_active = Boolean(is_active);
  if (full_name)                                            update.full_name = full_name;

  const user = await User.findByIdAndUpdate(req.params.id, update, { new: true });
  if (!user) return res.status(404).json({ success: false, message: 'User not found' });
  res.json({ success: true, data: user.toJSON() });
}));

// DELETE /api/admin/users/:id (soft disable)
router.delete('/users/:id', asyncHandler(async (req, res) => {
  await User.findByIdAndUpdate(req.params.id, { is_active: false });
  res.json({ success: true, message: 'User account disabled' });
}));

// GET /api/admin/vendors
router.get('/vendors', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, is_approved } = req.query;
  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  const match = {};
  if (is_approved !== undefined) match.is_approved = is_approved === 'true';

  const [vendors, total] = await Promise.all([
    VendorProfile.find(match)
      .populate('user_id', 'full_name email is_active created_at')
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limitInt)
      .lean(),
    VendorProfile.countDocuments(match),
  ]);

  const data = vendors.map((v) => ({
    ...v,
    id: v._id.toString(),
    _id: undefined,
    __v: undefined,
    profiles: v.user_id ? {
      full_name:  v.user_id.full_name,
      email:      v.user_id.email,
      is_active:  v.user_id.is_active,
      created_at: v.user_id.created_at,
    } : null,
    user_id: v.user_id?._id?.toString(),
  }));

  res.json({
    success: true,
    data,
    pagination: { total, page: parseInt(page), limit: limitInt, totalPages: Math.ceil(total / limitInt) },
  });
}));

// PUT /api/admin/vendors/:id/approve
router.put('/vendors/:id/approve', asyncHandler(async (req, res) => {
  const { is_approved } = req.body;
  const vp = await VendorProfile.findByIdAndUpdate(
    req.params.id,
    { is_approved: Boolean(is_approved) },
    { new: true }
  ).populate('user_id', 'email full_name');

  if (!vp) return res.status(404).json({ success: false, message: 'Vendor not found' });

  res.json({
    success: true,
    data: {
      ...vp.toJSON(),
      profiles: vp.user_id ? { email: vp.user_id.email, full_name: vp.user_id.full_name } : null,
    },
  });
}));

// GET /api/admin/products
router.get('/products', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search, is_active, category_id } = req.query;
  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  const match = {};
  if (is_active !== undefined) match.is_active   = is_active === 'true';
  if (category_id)             match.category_id = new mongoose.Types.ObjectId(category_id);
  if (search)                  match.$text        = { $search: search };

  const [products, total] = await Promise.all([
    Product.find(match)
      .populate('category_id', 'name slug')
      .populate('vendor_id',   'full_name email')
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limitInt)
      .lean(),
    Product.countDocuments(match),
  ]);

  const vendorIds = [...new Set(products.map((p) => p.vendor_id?._id?.toString()))];
  const vps = await VendorProfile.find({ user_id: { $in: vendorIds } }).lean();
  const vpMap = Object.fromEntries(vps.map((v) => [v.user_id.toString(), v]));

  const data = products.map((p) => {
    const vp = vpMap[p.vendor_id?._id?.toString()];
    return {
      ...p,
      id: p._id.toString(),
      _id: undefined,
      __v: undefined,
      categories:      p.category_id ? { name: p.category_id.name, slug: p.category_id.slug } : null,
      vendor_profiles: vp ? { business_name: vp.business_name } : null,
      profiles:        p.vendor_id ? { full_name: p.vendor_id.full_name, email: p.vendor_id.email } : null,
    };
  });

  res.json({
    success: true,
    data,
    pagination: { total, page: parseInt(page), limit: limitInt, totalPages: Math.ceil(total / limitInt) },
  });
}));

// PUT /api/admin/products/:id/feature
router.put('/products/:id/feature', asyncHandler(async (req, res) => {
  const { is_featured } = req.body;
  const product = await Product.findByIdAndUpdate(
    req.params.id,
    { is_featured: Boolean(is_featured) },
    { new: true }
  );
  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });
  res.json({ success: true, data: product.toJSON() });
}));

// GET /api/admin/orders
router.get('/orders', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status, payment_status } = req.query;
  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  const match = {};
  if (status)         match.status         = status;
  if (payment_status) match.payment_status = payment_status;

  const [orders, total] = await Promise.all([
    Order.find(match)
      .populate('customer_id', 'full_name email')
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limitInt)
      .lean(),
    Order.countDocuments(match),
  ]);

  const data = orders.map((o) => ({
    ...o,
    id: o._id.toString(),
    _id: undefined,
    __v: undefined,
    profiles: o.customer_id ? { full_name: o.customer_id.full_name, email: o.customer_id.email } : null,
    customer_id: o.customer_id?._id?.toString(),
    order_items: (o.order_items || []).map((i) => ({
      ...i,
      id: i._id?.toString(),
      _id: undefined,
      vendor_profiles: null, // simplified for admin list
    })),
  }));

  res.json({
    success: true,
    data,
    pagination: { total, page: parseInt(page), limit: limitInt, totalPages: Math.ceil(total / limitInt) },
  });
}));

// GET /api/admin/reviews
router.get('/reviews', asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, is_approved } = req.query;
  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  const match = {};
  if (is_approved !== undefined) match.is_approved = is_approved === 'true';

  const [reviews, total] = await Promise.all([
    Review.find(match)
      .populate('product_id',  'name slug')
      .populate('customer_id', 'full_name email')
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limitInt)
      .lean(),
    Review.countDocuments(match),
  ]);

  const data = reviews.map((r) => ({
    ...r,
    id: r._id.toString(),
    _id: undefined,
    __v: undefined,
    products: r.product_id ? { name: r.product_id.name, slug: r.product_id.slug } : null,
    profiles: r.customer_id ? { full_name: r.customer_id.full_name, email: r.customer_id.email } : null,
    product_id:  r.product_id?._id?.toString(),
    customer_id: r.customer_id?._id?.toString(),
  }));

  res.json({
    success: true,
    data,
    pagination: { total, page: parseInt(page), limit: limitInt, totalPages: Math.ceil(total / limitInt) },
  });
}));

export default router;
