import {
  createProduct,
  deleteProduct,
  getProductById,
  listBestSellers,
  listProducts,
  listProductsByCategory,
  listProductsByCategorySlug,
  updateProduct,
} from "./products.service.js";

export async function getProducts(req, res) {
  try {
    const products = await listProducts(req.productFilters ?? {});
    res.json({ ok: true, products });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

/**
 * Featured collection: active products with featured === true.
 * Optional query: limit (1–100), e.g. /api/products/featured?limit=8
 */
export async function getFeaturedProducts(req, res) {
  try {
    const raw = req.query?.limit;
    let limit;
    if (raw !== undefined && raw !== "") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 1) {
        res.status(400).json({ ok: false, error: "limit must be a positive number." });
        return;
      }
      limit = Math.min(100, Math.floor(n));
    }

    const products = await listProducts({
      featured: true,
      isActive: true,
      ...(limit ? { limit } : {}),
    });
    res.json({ ok: true, products });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

/**
 * Best seller collection: active products with badge === "best-seller".
 * Optional query: limit (default 3, max 10).
 */
export async function getBestSellerProducts(req, res) {
  try {
    const raw = req.query?.limit;
    let limit;
    if (raw !== undefined && raw !== "") {
      const n = Number(raw);
      if (!Number.isFinite(n) || n < 1) {
        res.status(400).json({ ok: false, error: "limit must be a positive number." });
        return;
      }
      limit = Math.floor(n);
    }

    const products = await listBestSellers(
      limit !== undefined ? { limit } : undefined,
    );
    res.json({ ok: true, products });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function getProductsByCategory(req, res) {
  try {
    const products = await listProductsByCategory(req.params.categoryId);
    res.json({ ok: true, products });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

/**
 * Shop by category: URL-friendly slug (e.g. /api/products/by-category/basics).
 * Query: includeInactive=1|true to include inactive products and/or inactive category (admin-style).
 */
export async function getProductsByCategorySlug(req, res) {
  try {
    const q = String(req.query?.includeInactive ?? "").toLowerCase();
    const includeInactive = q === "true" || q === "1";

    const result = await listProductsByCategorySlug(req.params.categorySlug, {
      onlyActiveProducts: !includeInactive,
      onlyActiveCategory: !includeInactive,
    });

    if (!result) {
      res.status(404).json({ ok: false, error: "Category not found." });
      return;
    }

    res.json({
      ok: true,
      category: result.category,
      products: result.products,
    });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function getProduct(req, res) {
  try {
    const product = await getProductById(req.params.productId);
    if (!product) {
      res.status(404).json({ ok: false, error: "Product not found." });
      return;
    }
    res.json({ ok: true, product });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function postProduct(req, res) {
  try {
    const product = await createProduct(req.productPayload);
    res.status(201).json({ ok: true, product });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function putProduct(req, res) {
  try {
    const product = await updateProduct(req.params.productId, req.productPayload);
    if (!product) {
      res.status(404).json({ ok: false, error: "Product not found." });
      return;
    }
    res.json({ ok: true, product });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}

export async function removeProduct(req, res) {
  try {
    const deleted = await deleteProduct(req.params.productId);
    if (!deleted) {
      res.status(404).json({ ok: false, error: "Product not found." });
      return;
    }
    res.json({ ok: true, product: deleted });
  } catch (err) {
    res.status(400).json({ ok: false, error: err?.message ?? "Bad request" });
  }
}
