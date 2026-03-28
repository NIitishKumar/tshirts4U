import mongoose from "mongoose";
import Category from "../category/category.model.js";

function cleanString(value) {
  if (value === null || value === undefined) return undefined;
  const out = String(value).trim();
  return out.length ? out : undefined;
}

function cleanNumber(value) {
  if (value === null || value === undefined || value === "") return undefined;
  const n = Number(value);
  return Number.isFinite(n) ? n : undefined;
}

function cleanBoolean(value) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return undefined;
}

function cleanStringArray(value) {
  if (!Array.isArray(value)) return undefined;
  const out = value
    .map((item) => cleanString(item))
    .filter((item) => item !== undefined);
  return [...new Set(out)];
}

function cleanColors(value) {
  if (!Array.isArray(value)) return undefined;
  const out = value
    .map((item) => {
      if (!item || typeof item !== "object") return null;
      const name = cleanString(item.name);
      const hex = cleanString(item.hex);
      if (!name || !hex) return null;
      return { name, hex };
    })
    .filter(Boolean);
  return out;
}

function cleanStringMap(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return undefined;
  const entries = Object.entries(value)
    .map(([key, val]) => [cleanString(key), cleanString(val)])
    .filter(([key, val]) => key && val);
  return Object.fromEntries(entries);
}

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

async function validateCategoryReference(categoryId) {
  if (!categoryId) return null;
  const category = await Category.findById(categoryId);
  if (!category) return "categoryId does not reference an existing category.";
  if (!category.isActive) return "categoryId references an inactive category.";
  return null;
}

function parseProductPayload(body, { requireNameAndPrice }) {
  const payload = {
    slug: cleanString(body?.slug),
    name: cleanString(body?.name),
    tagline: cleanString(body?.tagline),
    description: cleanString(body?.description),
    price: cleanNumber(body?.price),
    salePrice: cleanNumber(body?.salePrice),
    sku: cleanString(body?.sku),
    stock: cleanNumber(body?.stock),
    categoryId: cleanString(body?.categoryId),
    brandId: cleanString(body?.brandId),
    imageUrls: cleanStringArray(body?.imageUrls),
    images: cleanStringArray(body?.images),
    sizes: cleanStringArray(body?.sizes),
    colors: cleanColors(body?.colors),
    tryOnImage: cleanString(body?.tryOnImage),
    tryOnByColor: cleanStringMap(body?.tryOnByColor),
    featured: cleanBoolean(body?.featured),
    badge: cleanString(body?.badge),
    isActive: cleanBoolean(body?.isActive),
    createdBy: cleanString(body?.createdBy),
  };

  const errors = [];

  if (requireNameAndPrice) {
    if (!payload.name) errors.push("name is required.");
    if (payload.price === undefined) errors.push("price is required.");
  }

  if (payload.price !== undefined && payload.price < 0) {
    errors.push("price must be >= 0.");
  }
  if (payload.salePrice !== undefined && payload.salePrice < 0) {
    errors.push("salePrice must be >= 0.");
  }
  if (payload.stock !== undefined && payload.stock < 0) {
    errors.push("stock must be >= 0.");
  }

  if (
    payload.salePrice !== undefined &&
    payload.price !== undefined &&
    payload.salePrice > payload.price
  ) {
    errors.push("salePrice cannot be greater than price.");
  }

  if (payload.categoryId && !isObjectId(payload.categoryId)) {
    errors.push("categoryId must be a valid ObjectId.");
  }
  if (payload.brandId && !isObjectId(payload.brandId)) {
    errors.push("brandId must be a valid ObjectId.");
  }
  if (payload.createdBy && !isObjectId(payload.createdBy)) {
    errors.push("createdBy must be a valid ObjectId.");
  }
  if (payload.slug && !/^[a-z0-9-]+$/.test(payload.slug)) {
    errors.push("slug must contain only lowercase letters, numbers, and hyphens.");
  }

  const normalized = Object.entries(payload).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {});

  return { errors, normalized };
}

export async function validateCreateProduct(req, res, next) {
  const { errors, normalized } = parseProductPayload(req.body, {
    requireNameAndPrice: true,
  });

  if (errors.length) {
    res.status(400).json({ ok: false, error: errors.join(" ") });
    return;
  }

  const categoryError = await validateCategoryReference(normalized.categoryId);
  if (categoryError) {
    res.status(400).json({ ok: false, error: categoryError });
    return;
  }

  req.productPayload = normalized;
  next();
}

export async function validateUpdateProduct(req, res, next) {
  const { errors, normalized } = parseProductPayload(req.body, {
    requireNameAndPrice: false,
  });

  if (errors.length) {
    res.status(400).json({ ok: false, error: errors.join(" ") });
    return;
  }

  if (!Object.keys(normalized).length) {
    res.status(400).json({ ok: false, error: "At least one field is required." });
    return;
  }

  const categoryError = await validateCategoryReference(normalized.categoryId);
  if (categoryError) {
    res.status(400).json({ ok: false, error: categoryError });
    return;
  }

  req.productPayload = normalized;
  next();
}

export function validateProductIdParam(req, res, next) {
  const { productId } = req.params;
  if (!isObjectId(productId)) {
    res.status(400).json({ ok: false, error: "Invalid productId." });
    return;
  }
  next();
}

export function validateCategoryIdParam(req, res, next) {
  const { categoryId } = req.params;
  if (!isObjectId(categoryId)) {
    res.status(400).json({ ok: false, error: "Invalid categoryId." });
    return;
  }
  next();
}

const CATEGORY_SLUG_RE = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;

export function validateCategorySlugParam(req, res, next) {
  const { categorySlug } = req.params;
  const slug = cleanString(categorySlug)?.toLowerCase();
  if (!slug || !CATEGORY_SLUG_RE.test(slug)) {
    res.status(400).json({ ok: false, error: "Invalid category slug." });
    return;
  }
  req.params.categorySlug = slug;
  next();
}

export function validateListProductsQuery(req, res, next) {
  const filters = {
    name: cleanString(req.query?.name),
    slug: cleanString(req.query?.slug),
    categoryId: cleanString(req.query?.categoryId),
    brandId: cleanString(req.query?.brandId),
    isActive: cleanBoolean(req.query?.isActive),
    featured: cleanBoolean(req.query?.featured),
  };

  if (filters.categoryId && !isObjectId(filters.categoryId)) {
    res.status(400).json({ ok: false, error: "Invalid categoryId." });
    return;
  }

  if (filters.brandId && !isObjectId(filters.brandId)) {
    res.status(400).json({ ok: false, error: "Invalid brandId." });
    return;
  }

  req.productFilters = Object.entries(filters).reduce((acc, [key, value]) => {
    if (value !== undefined) acc[key] = value;
    return acc;
  }, {});

  next();
}
