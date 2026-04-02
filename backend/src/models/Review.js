import mongoose from 'mongoose';
import Product from './Product.js';

const { Schema } = mongoose;

const reviewSchema = new Schema(
  {
    product_id:           { type: Schema.Types.ObjectId, ref: 'Product', required: true },
    customer_id:          { type: Schema.Types.ObjectId, ref: 'User', required: true },
    order_id:             { type: Schema.Types.ObjectId, ref: 'Order', default: null },
    rating:               { type: Number, required: true, min: 1, max: 5 },
    title:                { type: String, default: null },
    comment:              { type: String, default: null },
    is_verified_purchase: { type: Boolean, default: false },
    is_approved:          { type: Boolean, default: true },
    helpful_count:        { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

// One review per (product + customer + order) combination
reviewSchema.index({ product_id: 1, customer_id: 1, order_id: 1 }, { unique: true });
reviewSchema.index({ product_id: 1 });
reviewSchema.index({ customer_id: 1 });

// Recalculate product rating after any review write/delete
async function recalcAfterChange(doc) {
  if (doc?.product_id) {
    await Product.recalcRating(doc.product_id);
  }
}

reviewSchema.post('save', recalcAfterChange);
reviewSchema.post('findOneAndUpdate', async function () {
  const doc = await this.model.findOne(this.getQuery());
  if (doc) await Product.recalcRating(doc.product_id);
});
reviewSchema.post('findOneAndDelete', recalcAfterChange);

reviewSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Review', reviewSchema);
