import { Router } from "express";
import {
  deleteCart,
  deleteCartItem,
  getCart,
  patchCartItem,
  postCartItem,
} from "./cart.controller.js";

const router = Router();

router.get("/:userId/cart", getCart);
router.delete("/:userId/cart", deleteCart);
router.post("/:userId/cart/items", postCartItem);
router.patch("/:userId/cart/items/:lineItemId", patchCartItem);
router.delete("/:userId/cart/items/:lineItemId", deleteCartItem);

export default router;
