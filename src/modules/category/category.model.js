import mongoose from "mongoose";

const { Schema } = mongoose;

const CategorySchema = new Schema(
  {
    name: { type: String, required: true, trim: true },
    slug: { type: String, required: true, trim: true, unique: true },
    description: { type: String, default: "", trim: true },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true },
);

CategorySchema.index({ name: 1 });
CategorySchema.index({ isActive: 1 });

const Category =
  mongoose.models.Category || mongoose.model("Category", CategorySchema);

export default Category;
