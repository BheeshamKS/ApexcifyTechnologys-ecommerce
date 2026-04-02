import { Router } from 'express';
import mongoose from 'mongoose';
import Joi from 'joi';
import Product from '../models/Product.js';
import VendorProfile from '../models/VendorProfile.js';
import Review from '../models/Review.js';
import { authenticate, optionalAuth } from '../middleware/auth.js';
import { authorize } from '../middleware/rbac.js';
import { asyncHandler } from '../middleware/errorHandler.js';

const router = Router();

const productSchema = Joi.object({
  name:          Joi.string().min(2).max(200).required(),
  slug:          Joi.string().lowercase().pattern(/^[a-z0-9-]+$/).required(),
  description:   Joi.string().allow('', null),
  price:         Joi.number().positive().precision(2).required(),
  compare_price: Joi.number().positive().precision(2).allow(null),
  stock:         Joi.number().integer().min(0).required(),
  sku:           Joi.string().max(100).allow('', null),
  category_id:   Joi.string().allow(null),
  images:        Joi.array().items(Joi.string().uri()).default([]),
  tags:          Joi.array().items(Joi.string()).default([]),
  is_active:     Joi.boolean().default(true),
  is_featured:   Joi.boolean().default(false),
});

/** Attach vendor_profiles and categories to an array of plain product docs */
async function enrichProducts(products) {
  if (!products.length) return [];

  const vendorIds = [...new Set(products.map((p) => p.vendor_id?.toString()))];
  const catIds    = [...new Set(products.map((p) => p.category_id?.toString()).filter(Boolean))];

  const [vendorProfiles, categories] = await Promise.all([
    VendorProfile.find({ user_id: { $in: vendorIds } }).lean(),
    catIds.length
      ? mongoose.model('Category').find({ _id: { $in: catIds } }).lean()
      : Promise.resolve([]),
  ]);

  const vpMap  = Object.fromEntries(vendorProfiles.map((v) => [v.user_id.toString(), v]));
  const catMap = Object.fromEntries(categories.map((c) => [c._id.toString(), c]));

  return products.map((p) => {
    const vp  = vpMap[p.vendor_id?.toString()];
    const cat = catMap[p.category_id?.toString()];
    return {
      ...p,
      id: p._id.toString(),
      _id: undefined,
      __v: undefined,
      vendor_profiles: vp ? {
        business_name: vp.business_name,
        business_logo: vp.business_logo,
        is_approved:   vp.is_approved,
        avg_rating:    vp.avg_rating,
      } : null,
      categories: cat ? {
        id:   cat._id.toString(),
        name: cat.name,
        slug: cat.slug,
      } : null,
    };
  });
}

// GET /api/products – public, paginated + filtered
router.get('/', optionalAuth, asyncHandler(async (req, res) => {
  const {
    page = 1, limit = 20, category, minPrice, maxPrice,
    search, vendorId, sort = 'newest', is_featured, tag,
  } = req.query;

  const match = {};
  if (!req.user || req.user.role !== 'admin') match.is_active = true;
  if (category)             match.category_id = new mongoose.Types.ObjectId(category);
  if (vendorId)             match.vendor_id   = new mongoose.Types.ObjectId(vendorId);
  if (is_featured === 'true') match.is_featured = true;
  if (minPrice || maxPrice) {
    match.price = {};
    if (minPrice) match.price.$gte = parseFloat(minPrice);
    if (maxPrice) match.price.$lte = parseFloat(maxPrice);
  }
  if (tag)    match.tags   = tag;
  if (search) match.$text  = { $search: search };

  const sortMap = {
    price_asc:  { price: 1 },
    price_desc: { price: -1 },
    rating:     { avg_rating: -1 },
    popular:    { review_count: -1 },
    newest:     { created_at: -1 },
  };
  const sortQuery = sortMap[sort] || { created_at: -1 };

  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  const [products, total] = await Promise.all([
    Product.find(match).sort(sortQuery).skip(offset).limit(limitInt).lean(),
    Product.countDocuments(match),
  ]);

  const data = await enrichProducts(products);

  res.json({
    success: true,
    data,
    pagination: {
      total, page: parseInt(page), limit: limitInt,
      totalPages: Math.ceil(total / limitInt),
    },
  });
}));

// GET /api/products/vendor/mine – vendor sees own products
router.get('/vendor/mine', authenticate, authorize('vendor', 'admin'), asyncHandler(async (req, res) => {
  const { page = 1, limit = 20, search } = req.query;
  const offset   = (parseInt(page) - 1) * parseInt(limit);
  const limitInt = parseInt(limit);

  const match = { vendor_id: new mongoose.Types.ObjectId(req.user.id) };
  if (search) match.$text = { $search: search };

  const [products, total] = await Promise.all([
    Product.find(match)
      .populate('category_id', 'name slug')
      .sort({ created_at: -1 })
      .skip(offset)
      .limit(limitInt)
      .lean(),
    Product.countDocuments(match),
  ]);

  const data = products.map((p) => ({
    ...p,
    id: p._id.toString(),
    _id: undefined,
    __v: undefined,
    categories: p.category_id ? {
      id:   p.category_id._id?.toString() || p.category_id.toString(),
      name: p.category_id.name,
      slug: p.category_id.slug,
    } : null,
  }));

  res.json({
    success: true,
    data,
    pagination: { total, page: parseInt(page), limit: limitInt, totalPages: Math.ceil(total / limitInt) },
  });
}));

// GET /api/products/:slug – public, product detail
router.get('/:slug', optionalAuth, asyncHandler(async (req, res) => {
  const product = await Product.findOne({ slug: req.params.slug })
    .populate('category_id', 'id name slug')
    .populate('vendor_id',   'full_name avatar_url')
    .lean();

  if (!product) return res.status(404).json({ success: false, message: 'Product not found' });

  if (!product.is_active
      && req.user?.id !== product.vendor_id?._id?.toString()
      && req.user?.role !== 'admin') {
    return res.status(404).json({ success: false, message: 'Product not found' });
  }

  const vendorProfile = await VendorProfile.findOne({ user_id: product.vendor_id?._id }).lean();

  const recentReviews = await Review.find({ product_id: product._id, is_approved: true })
    .populate('customer_id', 'full_name avatar_url')
    .sort({ created_at: -1 })
    .limit(5)
    .lean();

  const shapedReviews = recentReviews.map((r) => ({
    ...r,
    id: r._id.toString(),
    _id: undefined,
    __v: undefined,
    profiles: r.customer_id ? {
      full_name:  r.customer_id.full_name,
      avatar_url: r.customer_id.avatar_url,
    } : null,
    customer_id: undefined,
  }));

  const data = {
    ...product,
    id: product._id.toString(),
    _id: undefined,
    __v: undefined,
    categories: product.category_id ? {
      id:   product.category_id._id?.toString(),
      name: product.category_id.name,
      slug: product.category_id.slug,
    } : null,
    profiles: product.vendor_id ? {
      id:         product.vendor_id._id?.toString(),
      full_name:  product.vendor_id.full_name,
      avatar_url: product.vendor_id.avatar_url,
    } : null,
    vendor_profiles: vendorProfile ? {
      business_name:        vendorProfile.business_name,
      business_logo:        vendorProfile.business_logo,
      business_description: vendorProfile.business_description,
      is_approved:          vendorProfile.is_approved,
      avg_rating:           vendorProfile.avg_rating,
    } : null,
    vendor_id: product.vendor_id?._id?.toString(),
    category_id: product.category_id?._id?.toString(),
    recent_reviews: shapedReviews,
  };

  res.json({ success: true, data });
}));

// POST /api/products – vendor or admin
router.post('/', authenticate, authorize('vendor', 'admin'), asyncHandler(async (req, res) => {
  const { error, value } = productSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  if (req.user.role === 'vendor') value.is_featured = false;

  try {
    const product = await Product.create({ ...value, vendor_id: req.user.id });
    res.status(201).json({ success: true, data: product.toJSON() });
  } catch (err) {
    if (err.code === 11000) {
      return res.status(409).json({ success: false, message: 'A product with this slug already exists' });
    }
    throw err;
  }
}));

// PUT /api/products/:id – vendor (own) or admin
router.put('/:id', authenticate, authorize('vendor', 'admin'), asyncHandler(async (req, res) => {
  const existing = await Product.findById(req.params.id).lean();
  if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

  if (req.user.role === 'vendor' && existing.vendor_id.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only edit your own products' });
  }

  const updateSchema = productSchema.fork(['name', 'slug', 'price', 'stock'], (f) => f.optional());
  const { error, value } = updateSchema.validate(req.body);
  if (error) return res.status(400).json({ success: false, message: error.details[0].message });

  if (req.user.role === 'vendor') delete value.is_featured;

  const product = await Product.findByIdAndUpdate(req.params.id, value, { new: true });
  res.json({ success: true, data: product.toJSON() });
}));

// DELETE /api/products/:id – vendor (own) or admin (soft delete)
router.delete('/:id', authenticate, authorize('vendor', 'admin'), asyncHandler(async (req, res) => {
  const existing = await Product.findById(req.params.id).lean();
  if (!existing) return res.status(404).json({ success: false, message: 'Product not found' });

  if (req.user.role === 'vendor' && existing.vendor_id.toString() !== req.user.id) {
    return res.status(403).json({ success: false, message: 'You can only delete your own products' });
  }

  await Product.findByIdAndUpdate(req.params.id, { is_active: false });
  res.json({ success: true, message: 'Product removed' });
}));

export default router;
