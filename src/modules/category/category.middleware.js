import mongoose from "mongoose";

function cleanString(value) {
  if (value === null || value === undefined) return undefined;
  const out = String(value).trim();
  return out.length ? out : undefined;
}

function cleanBoolean(value) {
  if (value === null || value === undefined || value === "") return undefined;
  if (typeof value === "boolean") return value;
  if (String(value).toLowerCase() === "true") return true;
  if (String(value).toLowerCase() === "false") return false;
  return undefined;
}

function slugify(value) {
  return String(value)
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-");
}

function isObjectId(value) {
  return mongoose.Types.ObjectId.isValid(value);
}

export function validateCreateCategory(req, res, next) {
  const name = cleanString(req.body?.name);
  const description = cleanString(req.body?.description);
  const isActive = cleanBoolean(req.body?.isActive);
  const slugInput = cleanString(req.body?.slug);

  if (!name) {
    res.status(400).json({ ok: false, error: "name is required." });
    return;
  }

  const slug = slugInput ? slugify(slugInput) : slugify(name);
  if (!slug) {
    res.status(400).json({ ok: false, error: "slug could not be generated." });
    return;
  }

  req.categoryPayload = {
    name,
    slug,
    ...(description !== undefined ? { description } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  next();
}

export function validateUpdateCategory(req, res, next) {
  const name = cleanString(req.body?.name);
  const description = cleanString(req.body?.description);
  const isActive = cleanBoolean(req.body?.isActive);
  const slugInput = cleanString(req.body?.slug);

  const payload = {
    ...(name !== undefined ? { name } : {}),
    ...(description !== undefined ? { description } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
    ...(slugInput !== undefined ? { slug: slugify(slugInput) } : {}),
  };

  if (!Object.keys(payload).length) {
    res.status(400).json({ ok: false, error: "At least one field is required." });
    return;
  }

  if (payload.slug !== undefined && !payload.slug) {
    res.status(400).json({ ok: false, error: "slug is invalid." });
    return;
  }

  req.categoryPayload = payload;
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

export function validateListCategoriesQuery(req, res, next) {
  const name = cleanString(req.query?.name);
  const isActive = cleanBoolean(req.query?.isActive);

  req.categoryFilters = {
    ...(name !== undefined ? { name } : {}),
    ...(isActive !== undefined ? { isActive } : {}),
  };

  next();
}

