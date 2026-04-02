import mongoose from 'mongoose';

const { Schema } = mongoose;

const categorySchema = new Schema(
  {
    name:       { type: String, required: true, trim: true },
    slug:       { type: String, required: true, unique: true, lowercase: true, trim: true },
    description:{ type: String, default: null },
    image_url:  { type: String, default: null },
    parent_id:  { type: Schema.Types.ObjectId, ref: 'Category', default: null },
    sort_order: { type: Number, default: 0 },
    is_active:  { type: Boolean, default: true },
  },
  { timestamps: { createdAt: 'created_at' } }
);

categorySchema.set('toJSON', {
  virtuals: true,
  transform: (_, ret) => {
    ret.id = ret._id.toString();
    delete ret._id;
    delete ret.__v;
    return ret;
  },
});

export default mongoose.model('Category', categorySchema);
