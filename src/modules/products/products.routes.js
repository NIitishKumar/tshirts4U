import { Router } from "express";
import {
  getFeaturedProducts,
  getBestSellerProducts,
  getProduct,
  getProducts,
  getProductsByCategory,
  getProductsByCategorySlug,
  postProduct,
  putProduct,
  removeProduct,
} from "./products.controller.js";
import {
  validateCategoryIdParam,
  validateCategorySlugParam,
  validateCreateProduct,
  validateListProductsQuery,
  validateProductIdParam,
  validateUpdateProduct,
} from "./products.middleware.js";

const router = Router();

router.get("/", validateListProductsQuery, getProducts);
router.get("/featured", getFeaturedProducts);
router.get("/best-sellers", getBestSellerProducts);
router.get(
  "/by-category/:categorySlug",
  validateCategorySlugParam,
  getProductsByCategorySlug,
);
router.get("/category/:categoryId", validateCategoryIdParam, getProductsByCategory);
router.get("/:productId", validateProductIdParam, getProduct);
router.post("/", validateCreateProduct, postProduct);
router.put("/:productId", validateProductIdParam, validateUpdateProduct, putProduct);
router.delete("/:productId", validateProductIdParam, removeProduct);

export default router;
