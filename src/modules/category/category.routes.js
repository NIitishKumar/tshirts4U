import { Router } from "express";
import {
  getCategories,
  getCategory,
  postCategory,
  putCategory,
  removeCategory,
} from "./category.controller.js";
import {
  validateCategoryIdParam,
  validateCreateCategory,
  validateListCategoriesQuery,
  validateUpdateCategory,
} from "./category.middleware.js";

const router = Router();

router.get("/", validateListCategoriesQuery, getCategories);
router.get("/:categoryId", validateCategoryIdParam, getCategory);
router.post("/", validateCreateCategory, postCategory);
router.put("/:categoryId", validateCategoryIdParam, validateUpdateCategory, putCategory);
router.delete("/:categoryId", validateCategoryIdParam, removeCategory);

export default router;

