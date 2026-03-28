import {
  createCategory,
  deleteCategory,
  getCategoryById,
  getCategoryBySlug,
  listCategories,
  updateCategory,
} from "./category.service.js";

export async function getCategories(req, res) {
  try {
    const categories = await listCategories(req.categoryFilters ?? {});
    res.json({ ok: true, categories });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function getCategory(req, res) {
  try {
    const category = await getCategoryById(req.params.categoryId);
    if (!category) {
      res.status(404).json({ ok: false, error: "Category not found." });
      return;
    }
    res.json({ ok: true, category });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function postCategory(req, res) {
  try {
    const slugExists = await getCategoryBySlug(req.categoryPayload.slug);
    if (slugExists) {
      res.status(400).json({ ok: false, error: "Category slug already exists." });
      return;
    }

    const category = await createCategory(req.categoryPayload);
    res.status(201).json({ ok: true, category });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function putCategory(req, res) {
  try {
    if (req.categoryPayload.slug) {
      const existing = await getCategoryBySlug(req.categoryPayload.slug);
      if (existing && String(existing._id) !== String(req.params.categoryId)) {
        res.status(400).json({ ok: false, error: "Category slug already exists." });
        return;
      }
    }

    const category = await updateCategory(req.params.categoryId, req.categoryPayload);
    if (!category) {
      res.status(404).json({ ok: false, error: "Category not found." });
      return;
    }
    res.json({ ok: true, category });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function removeCategory(req, res) {
  try {
    const deleted = await deleteCategory(req.params.categoryId);
    if (!deleted) {
      res.status(404).json({ ok: false, error: "Category not found." });
      return;
    }
    res.json({ ok: true, category: deleted });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

