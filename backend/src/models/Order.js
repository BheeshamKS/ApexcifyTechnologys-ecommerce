import mongoose from 'mongoose';

const { Schema } = mongoose;

const orderItemSchema = new Schema(
  {
    product_id:    { type: Schema.Types.ObjectId, ref: 'Product', default: null },
    vendor_id:     { type: Schema.Types.ObjectId, ref: 'User', default: null },
    product_name:  { type: String, required: true },
    product_image: { type: String, default: null },
    quantity:      { type: Number, required: true, min: 1 },
    unit_price:    { type: Number, required: true, min: 0 },
    total_price:   { type: Number, required: true, min: 0 },
    vendor_status: {
      type: String,
      enum: ['pending', 'processing', 'shipped', 'delivered', 'cancelled'],
      default: 'pending',
    },
  },
  { _id: true }
);

orderItemSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    return ret;
  },
});

const orderSchema = new Schema(
  {
    customer_id:      { type: Schema.Types.ObjectId, ref: 'User', default: null },
    order_items:      [orderItemSchema],
    status: {
      type: String,
      enum: ['pending', 'confirmed', 'processing', 'shipped', 'delivered', 'cancelled', 'refunded'],
      default: 'pending',
    },
    total_amount:     { type: Number, required: true, min: 0 },
    subtotal:         { type: Number, required: true, min: 0 },
    tax_amount:       { type: Number, default: 0 },
    shipping_amount:  { type: Number, default: 0 },
    discount_amount:  { type: Number, default: 0 },
    shipping_address: { type: Schema.Types.Mixed, required: true },
    billing_address:  { type: Schema.Types.Mixed, default: null },
    payment_status: {
      type: String,
      enum: ['pending', 'paid', 'failed', 'refunded'],
      default: 'pending',
    },
    payment_method:    { type: String, default: 'cash_on_delivery' },
    tracking_number:   { type: String, default: null },
    notes:             { type: String, default: null },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

orderSchema.index({ customer_id: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ 'order_items.vendor_id': 1 });
orderSchema.index({ created_at: -1 });

orderSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Order', orderSchema);
