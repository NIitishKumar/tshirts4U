import mongoose from "mongoose";

const ProductSchema = new mongoose.Schema(
    {
      slug: { type: String, trim: true, unique: true, sparse: true },
      name: { type: String, required: true, trim: true },
      tagline: { type: String, default: "", trim: true },
      description: { type: String, default: "", trim: true },
      price: { type: Number, required: true, min: 0 },
      salePrice: { type: Number, min: 0, default: null },
      sku: { type: String, trim: true, default: "" },
      stock: { type: Number, min: 0, default: 0 },
      categoryId: { type: mongoose.Schema.Types.ObjectId, ref: "Category", default: null },
      brandId: { type: mongoose.Schema.Types.ObjectId, ref: "Brand", default: null },
      imageUrls: { type: [String], default: [] },
      images: { type: [String], default: [] },
      sizes: { type: [String], default: [] },
      colors: {
        type: [
          {
            name: { type: String, trim: true },
            hex: { type: String, trim: true },
          },
        ],
        default: [],
      },
      tryOnImage: { type: String, trim: true, default: "" },
      tryOnByColor: { type: Map, of: String, default: {} },
      featured: { type: Boolean, default: false },
      badge: { type: String, trim: true, default: null },
      isActive: { type: Boolean, default: true },
      createdBy: { type: mongoose.Schema.Types.ObjectId, ref: "User", default: null },
    },
    { timestamps: true },
  );
  
  ProductSchema.index({ sku: 1 }, { unique: true, sparse: true });
  ProductSchema.index({ categoryId: 1 });
  ProductSchema.index({ brandId: 1 });
  ProductSchema.index({ isActive: 1 });
  ProductSchema.index({ name: 1 });
  
  export default mongoose.model("Product", ProductSchema);
  