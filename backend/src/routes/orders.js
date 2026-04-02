import { Router } from 'express';
import mongoose from 'mongoose';
import Joi from 'joi';
import Order from '../models/Order.js';
import Product from '../models/Product.js';
import User from '../models/User.js';
import { authenticate } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';
import { sendOrderConfirmation, sendOrderStatusUpdate, sendVendorNewOrder } from '../services/email.js';

const router = Router();

const TAX_RATE              = 0.08;
const FREE_SHIPPING_THRESHOLD = 50;
const SHIPPING_COST         = 5;

// POST /api/orders – customer creates order
router.post('/', authenticate, authorize('customer', 'admin'), asyncHandler(async (req, res) => {
  const schema = Joi.object({
    items: Joi.array().items(Joi.object({
      product_id: Joi.string().required(),
      quantity:   Joi.number().integer().min(1).required(),
    })).min(1).required(),
    shipping_address: Joi.object({
      full_name:    Joi.string().required(),
      email:        Joi.string().email().required(),
      phone:        Joi.string().allow('', null),
      address_line1:Joi.string().required(),
      address_line2:Joi.string().allow('', null),
      city:         Joi.string().required(),
      state:        Joi.string().required(),
      zip:          Joi.string().required(),
      country:      Joi.string().required(),
    }).required(),
    billing_address: Joi.object().allow(null),
    payment_method:  Joi.string().default('cash_on_delivery'),
    notes:           Joi.string().allow('', null),
  });

  const { error, value } = schema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  const { items, shipping_address, billing_address, payment_method, notes } = value;

  // Fetch products
  const productIds = items.map((i) => new mongoose.Types.ObjectId(i.product_id));
  const products   = await Product.find({ _id: { $in: productIds }, is_active: true }).lean();
  const productMap = new Map(products.map((p) => [p._id.toString(), p]));

  for (const item of items) {
    const product = productMap.get(item.product_id);
    if (!product) {
      return res.status(400).json({ success: false, message: `Product ${item.product_id} not found or unavailable` });
    }
    if (product.stock < item.quantity) {
      return res.status(400).json({
        success: false,
        message: `Insufficient stock for "${product.name}". Available: ${product.stock}`,
      });
    }
  }

  // Calculate totals
  const subtotal       = items.reduce((s, i) => s + productMap.get(i.product_id).price * i.quantity, 0);
  const tax_amount     = parseFloat((subtotal * TAX_RATE).toFixed(2));
  const shipping_amount= subtotal >= FREE_SHIPPING_THRESHOLD ? 0 : SHIPPING_COST;
  const total_amount   = parseFloat((subtotal + tax_amount + shipping_amount).toFixed(2));

  // Build order items
  const order_items = items.map((item) => {
    const p = productMap.get(item.product_id);
    return {
      product_id:    p._id,
      vendor_id:     p.vendor_id,
      product_name:  p.name,
      product_image: p.images?.[0] || null,
      quantity:      item.quantity,
      unit_price:    p.price,
      total_price:   parseFloat((p.price * item.quantity).toFixed(2)),
    };
  });

  const order = await Order.create({
    customer_id: req.user.id,
    order_items,
    subtotal:        parseFloat(subtotal.toFixed(2)),
    tax_amount,
    shipping_amount,
    total_amount,
    shipping_address,
    billing_address: billing_address || shipping_address,
    payment_method,
    notes,
  });

  // Decrement stock (best-effort)
  await Promise.all(
    items.map((item) =>
      Product.findByIdAndUpdate(item.product_id, { $inc: { stock: -item.quantity } })
    )
  );

  // Email notifications (non-blocking)
  sendOrderConfirmation(req.user.email, order.toJSON()).catch(console.error);

  // Notify each unique vendor
  const vendorGroups = {};
  for (const oi of order_items) {
    const key = oi.vendor_id.toString();
    if (!vendorGroups[key]) vendorGroups[key] = [];
    vendorGroups[key].push(oi);
  }
  for (const [vendorId, vendorItems] of Object.entries(vendorGroups)) {
    const vendor = await User.findById(vendorId).lean();
    if (vendor?.email) {
      sendVendorNewOrder(vendor.email, order.toJSON(), vendorItems).catch(console.error);
    }
  }

  res.status(201).json({ success: true, data: order.toJSON() });
}));

// GET /api/orders – customer own / vendor items / admin all
router.get('/', authenticate, asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, status } = req.query;
  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  let match = {};
  if (req.user.role === 'customer') {
    match.customer_id = new mongoose.Types.ObjectId(req.user.id);
  } else if (req.user.role === 'vendor') {
    match['order_items.vendor_id'] = new mongoose.Types.ObjectId(req.user.id);
  }
  if (status) match.status = status;

  const [orders, total] = await Promise.all([
    Order.find(match)
      .populate('customer_id', 'full_name email avatar_url')
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limitInt)
      .lean(),
    Order.countDocuments(match),
  ]);

  const data = orders.map(shapeOrder);

  res.json({
    success: true,
    data,
    pagination: { total, page: parseInt(page), limit: limitInt, totalPages: Math.ceil(total / limitInt) },
  });
}));

// GET /api/orders/:id
router.get('/:id', authenticate, asyncHandler(async (req, res) => {
  const order = await Order.findById(req.params.id)
    .populate('customer_id', 'full_name email phone avatar_url')
    .lean();

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  // Access control
  if (req.user.role === 'customer' && order.customer_id?._id?.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'Access denied' });
  }
  if (req.user.role === 'vendor') {
    const hasItems = order.order_items?.some((i) => i.vendor_id?.toString() === req.user.id);
    if (!hasItems) return res.status(403).json({ success: false, message: 'Access denied' });
  }

  res.json({ success: true, data: shapeOrder(order) });
}));

// PUT /api/orders/:id/status – admin updates overall status
router.put('/:id/status', authenticate, authorize('admin'), asyncHandler(async (req, res) => {
  const VALID = ['pending','confirmed','processing','shipped','delivered','cancelled','refunded'];
  const { status, tracking_number } = req.body;
  if (!VALID.includes(status)) {
    return res.status(400).json({ success: false, message: 'Invalid status' });
  }

  const update = { status };
  if (tracking_number) update.tracking_number = tracking_number;
  if (status === 'delivered') update.payment_status = 'paid';

  const order = await Order.findByIdAndUpdate(req.params.id, update, { new: true })
    .populate('customer_id', 'email full_name')
    .lean();

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

  if (order.customer_id?.email) {
    sendOrderStatusUpdate(order.customer_id.email, shapeOrder(order)).catch(console.error);
  }

  res.json({ success: true, data: shapeOrder(order) });
}));

// PUT /api/orders/:id/vendor-status – vendor updates their items
router.put('/:id/vendor-status', authenticate, authorize('vendor'), asyncHandler(async (req, res) => {
  const VALID = ['pending','processing','shipped','delivered','cancelled'];
  const { vendor_status } = req.body;
  if (!VALID.includes(vendor_status)) {
    return res.status(400).json({ success: false, message: 'Invalid vendor status' });
  }

  const order = await Order.findOneAndUpdate(
    { _id: req.params.id, 'order_items.vendor_id': new mongoose.Types.ObjectId(req.user.id) },
    { $set: { 'order_items.$[el].vendor_status': vendor_status } },
    { arrayFilters: [{ 'el.vendor_id': new mongoose.Types.ObjectId(req.user.id) }], new: true }
  );

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  res.json({ success: true, data: order.toJSON() });
}));

// POST /api/orders/:id/cancel – customer cancels pending order
router.post('/:id/cancel', authenticate, authorize('customer'), asyncHandler(async (req, res) => {
  const order = await Order.findOne({
    _id: req.params.id,
    customer_id: new mongoose.Types.ObjectId(req.user.id),
  });

  if (!order) return res.status(404).json({ success: false, message: 'Order not found' });
  if (!['pending', 'confirmed'].includes(order.status)) {
    return res.status(400).json({ success: false, message: 'Order cannot be cancelled at this stage' });
  }

  // Restore stock
  await Promise.all(
    order.order_items.map((item) =>
      Product.findByIdAndUpdate(item.product_id, { $inc: { stock: item.quantity } })
    )
  );

  order.status = 'cancelled';
  await order.save();
  res.json({ success: true, data: order.toJSON() });
}));

// Shape a raw lean order into the format the frontend expects
function shapeOrder(o) {
  const cust = o.customer_id;
  return {
    ...o,
    id: o._id?.toString(),
    _id: undefined,
    __v: undefined,
    customer_id: cust?._id?.toString() || cust?.toString(),
    profiles: cust && typeof cust === 'object' ? {
      full_name:  cust.full_name,
      email:      cust.email,
      phone:      cust.phone,
      avatar_url: cust.avatar_url,
    } : null,
    order_items: (o.order_items || []).map((i) => ({
      ...i,
      id: i._id?.toString(),
      _id: undefined,
      product_id: i.product_id?.toString(),
      vendor_id:  i.vendor_id?.toString(),
    })),
  };
}

export default router;
