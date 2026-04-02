import mongoose from 'mongoose';

const { Schema } = mongoose;

const productSchema = new Schema(
  {
    vendor_id:     { type: Schema.Types.ObjectId, ref: 'User', required: true },
    category_id:   { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    name:          { type: String, required: true, trim: true },
    slug:          { type: String, required: true, unique: true, lowercase: true, trim: true },
    description:   { type: String, default: null },
    price:         { type: Number, required: true, min: 0 },
    compare_price: { type: Number, default: null, min: 0 },
    stock:         { type: Number, required: true, default: 0, min: 0 },
    sku:           { type: String, default: null, sparse: true },
    images:        { type: [String], default: [] },
    tags:          { type: [String], default: [] },
    is_active:     { type: Boolean, default: true },
    is_featured:   { type: Boolean, default: false },
    avg_rating:    { type: Number, default: 0, min: 0, max: 5 },
    review_count:  { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// Full-text search index
productSchema.index({ name: 'text', description: 'text', tags: 'text' });
productSchema.index({ vendor_id: 1 });
productSchema.index({ category_id: 1 });
productSchema.index({ is_active: 1, is_featured: 1 });
productSchema.index({ price: 1 });
productSchema.index({ avg_rating: -1 });

// Recompute avg_rating + review_count (called from Review model hooks)
productSchema.statics.recalcRating = async function (productId) {
  const Review = mongoose.model('Review');
  const result = await Review.aggregate([
    { $match: { product_id: new mongoose.Types.ObjectId(productId), is_approved: true } },
    { $group: { _id: null, avg: { $avg: '$rating' }, count: { $sum: 1 } } },
  ]);
  const { avg = 0, count = 0 } = result[0] || {};
  await this.findByIdAndUpdate(productId, {
    avg_rating: Math.round(avg * 100) / 100,
    review_count: count,
  });
};

productSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Product', productSchema);
