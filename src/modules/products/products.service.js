import mongoose from "mongoose";
import ProductSchema from "./product.schema.js";
import Category from "../category/category.model.js";

function buildPopulateQuery(query) {
  return query.populate({ path: "categoryId", model: Category });
}

export async function createProduct(data) {
  const product = await ProductSchema.create(data);
  return buildPopulateQuery(ProductSchema.findById(product._id));
}

export async function listProducts(filters = {}) {
  const query = {};

  if (typeof filters.isActive === "boolean") {
    query.isActive = filters.isActive;
  }

  if (filters.categoryId) {
    query.categoryId = filters.categoryId;
  }

  if (filters.brandId) {
    query.brandId = filters.brandId;
  }

  if (filters.name) {
    query.name = { $regex: filters.name, $options: "i" };
  }
  if (filters.slug) {
    query.slug = filters.slug;
  }

  if (typeof filters.featured === "boolean") {
    query.featured = filters.featured;
  }

  let cursor = ProductSchema.find(query).sort({ createdAt: -1 });

  if (typeof filters.limit === "number" && filters.limit > 0) {
    cursor = cursor.limit(Math.min(filters.limit, 100));
  }

  return buildPopulateQuery(cursor);
}

export async function listProductsByCategory(categoryId) {
  return buildPopulateQuery(ProductSchema.find({ categoryId: categoryId }).sort({ createdAt: -1 }));
}

/**
 * Shop by category slug (e.g. "basics", "graphic").
 * Returns null if category is missing, inactive (when onlyActiveCategory), or slug invalid upstream.
 */
export async function listProductsByCategorySlug(
  categorySlug,
  { onlyActiveProducts = true, onlyActiveCategory = true } = {},
) {

  if (categorySlug === 'undefined' || !categorySlug) {
    try {
      const products = await ProductSchema.find({});
      return { category: null, products };
    } catch (error) {
      console.error("Error listing products:", error);
      return null;
    }
  }

  const category = await Category.findOne({ _id: categorySlug });

  if (!category) return null;
  if (onlyActiveCategory && !category.isActive) return null;

  const query = { categoryId: category._id };
  if (onlyActiveProducts) query.isActive = true;

  const products = await buildPopulateQuery(
    ProductSchema.find(query).sort({ createdAt: -1 }),
  );
  return { category, products };
}

export async function getProductById(productId) {
  return buildPopulateQuery(ProductSchema.findById(productId));
}

export async function updateProduct(productId, patch) {
  return buildPopulateQuery(
    ProductSchema.findByIdAndUpdate(productId, { $set: patch }, { new: true }),
  );
}

export async function deleteProduct(productId) {
  return ProductSchema.findByIdAndDelete(productId);
}

export async function listBestSellers({ limit = 3 } = {}) {
  const safeLimit =
    typeof limit === "number" && limit > 0
      ? Math.min(Math.floor(limit), 10)
      : 3;

  const query = ProductSchema.find({
    badge: "best-seller",
    isActive: true,
  })
    .sort({ createdAt: -1 })
    .limit(safeLimit);

  return buildPopulateQuery(query);
}
