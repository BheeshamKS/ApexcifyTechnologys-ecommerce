import mongoose from 'mongoose';

const { Schema } = mongoose;

const vendorProfileSchema = new Schema(
  {
    user_id:              { type: Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    business_name:        { type: String, required: true, trim: true },
    business_description: { type: String, default: null },
    business_logo:        { type: String, default: null },
    business_address:     { type: String, default: null },
    business_email:       { type: String, default: null },
    business_phone:       { type: String, default: null },
    is_approved:          { type: Boolean, default: false },
    avg_rating:           { type: Number, default: 0, min: 0, max: 5 },
    total_sales:          { type: Number, default: 0 },
    total_revenue:        { type: Number, default: 0 },
  },
  { timestamps: { createdAt: 'created_at', updatedAt: 'updated_at' } }
);

vendorProfileSchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('VendorProfile', vendorProfileSchema);
