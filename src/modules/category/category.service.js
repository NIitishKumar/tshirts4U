import Category from "./category.model.js";

export async function createCategory(data) {
  return Category.create(data);
}

export async function listCategories(filters = {}) {
  const query = {};

  if (typeof filters.isActive === "boolean") {
    query.isActive = filters.isActive;
  }

  if (filters.name) {
    query.name = { $regex: filters.name, $options: "i" };
  }

  return Category.find(query).sort({ createdAt: -1 });
}

export async function getCategoryById(categoryId) {
  return Category.findById(categoryId);
}

export async function getCategoryBySlug(slug) {
  return Category.findOne({ slug });
}

export async function updateCategory(categoryId, patch) {
  return Category.findByIdAndUpdate(categoryId, { $set: patch }, { new: true });
}

export async function deleteCategory(categoryId) {
  return Category.findByIdAndDelete(categoryId);
}

