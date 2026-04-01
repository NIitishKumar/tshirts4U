import mongoose from "mongoose";
import Cart from "./cart.model.js";
import User from "../user/user.model.js";
import Product from "../products/product.schema.js";
import Category from "../category/category.model.js";

function isValidUserId(userId) {
  return typeof userId === "string" && mongoose.Types.ObjectId.isValid(userId);
}

function isValidProductId(productId) {
  return typeof productId === "string" && mongoose.Types.ObjectId.isValid(productId);
}

function normalizeVariant(value) {
  if (value === null || value === undefined) return "";
  return String(value).trim();
}

function unitPrice(product) {
  if (!product) return 0;
  const sale = product.salePrice;
  if (sale != null && Number.isFinite(sale)) return sale;
  return Number(product.price) || 0;
}

function computeTotals(items, populatedById) {
  let itemCount = 0;
  let subtotal = 0;
  for (const line of items) {
    const qty = line.quantity;
    itemCount += qty;
    const p = populatedById.get(String(line.productId?._id ?? line.productId));
    if (p) subtotal += unitPrice(p) * qty;
  }
  return { itemCount, subtotal };
}

function validateSizeAndColor(product, sizeNorm, colorNorm) {
  const sizes = product.sizes;
  if (Array.isArray(sizes) && sizes.length > 0) {
    if (!sizeNorm) {
      throw new Error("size is required for this product.");
    }
    const ok = sizes.some(
      (s) => String(s).trim().toLowerCase() === sizeNorm.toLowerCase(),
    );
    if (!ok) {
      throw new Error("Invalid size for this product.");
    }
  }

  const colors = product.colors;
  if (Array.isArray(colors) && colors.length > 0) {
    if (!colorNorm) {
      throw new Error("color is required for this product.");
    }
    const ok = colors.some(
      (c) =>
        String(c?.name ?? "")
          .trim()
          .toLowerCase() === colorNorm.toLowerCase(),
    );
    if (!ok) {
      throw new Error("Invalid color for this product.");
    }
  }
}

function lineMatches(line, productId, sizeNorm, colorNorm) {
  return (
    String(line.productId) === String(productId) &&
    normalizeVariant(line.size) === sizeNorm &&
    normalizeVariant(line.color) === colorNorm
  );
}

const populateItems = {
  path: "items.productId",
  populate: { path: "categoryId", model: Category },
};

export async function getOrCreateCart(userId) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  let cart = await Cart.findOne({ userId });
  if (!cart) {
    cart = await Cart.create({ userId, items: [] });
  }
  return cart;
}

export async function getCartWithItems(userId) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  const user = await User.findById(userId);
  if (!user) return null;

  let cart = await Cart.findOne({ userId }).populate(populateItems).lean();
  if (!cart) {
    await Cart.create({ userId, items: [] });
    cart = await Cart.findOne({ userId }).populate(populateItems).lean();
  }

  const map = new Map();
  for (const line of cart.items ?? []) {
    const p = line.productId;
    if (p && p._id) map.set(String(p._id), p);
  }
  const { itemCount, subtotal } = computeTotals(cart.items ?? [], map);
  return { cart, itemCount, subtotal };
}

export async function addOrIncrementItem(userId, input) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  const user = await User.findById(userId);
  if (!user) return null;

  const productId = input?.productId;
  if (!isValidProductId(productId)) throw new Error("Invalid productId");

  let addQty = Number(input?.quantity);
  if (!Number.isFinite(addQty) || addQty < 1) addQty = 1;
  addQty = Math.floor(addQty);

  const sizeNorm = normalizeVariant(input?.size);
  const colorNorm = normalizeVariant(input?.color);

  const product = await Product.findById(productId);
  if (!product) throw new Error("Product not found.");
  if (!product.isActive) throw new Error("Product is not available.");

  validateSizeAndColor(product, sizeNorm, colorNorm);

  const stock = Number(product.stock);
  if (!Number.isFinite(stock) || stock < 0) {
    throw new Error("Invalid product stock.");
  }

  const cart = await getOrCreateCart(userId);
  const idx = cart.items.findIndex((line) =>
    lineMatches(line, productId, sizeNorm, colorNorm),
  );

  if (idx >= 0) {
    const nextQty = cart.items[idx].quantity + addQty;
    if (nextQty > stock) {
      throw new Error("Not enough stock for this product.");
    }
    cart.items[idx].quantity = nextQty;
  } else {
    if (addQty > stock) {
      throw new Error("Not enough stock for this product.");
    }
    cart.items.push({
      productId,
      quantity: addQty,
      size: sizeNorm,
      color: colorNorm,
    });
  }

  await cart.save();
  return getCartWithItems(userId);
}

export async function setLineQuantity(userId, lineItemId, quantity) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  if (!mongoose.Types.ObjectId.isValid(lineItemId)) {
    throw new Error("Invalid lineItemId");
  }

  const user = await User.findById(userId);
  if (!user) return null;

  let qty = Number(quantity);
  if (!Number.isFinite(qty) || qty < 1) {
    throw new Error("quantity must be a positive integer.");
  }
  qty = Math.floor(qty);

  const cart = await Cart.findOne({ userId });
  if (!cart) return null;

  const line = cart.items.id(lineItemId);
  if (!line) return null;

  const product = await Product.findById(line.productId);
  if (!product) throw new Error("Product not found.");

  if (!product.isActive) {
    throw new Error("Product is not available; cannot change quantity.");
  }

  if (qty > product.stock) {
    throw new Error("Not enough stock for this product.");
  }

  line.quantity = qty;
  await cart.save();
  return getCartWithItems(userId);
}

export async function removeLineItem(userId, lineItemId) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  if (!mongoose.Types.ObjectId.isValid(lineItemId)) {
    throw new Error("Invalid lineItemId");
  }

  const user = await User.findById(userId);
  if (!user) return null;

  const cart = await Cart.findOne({ userId });
  if (!cart) return null;

  const line = cart.items.id(lineItemId);
  if (!line) return null;

  line.deleteOne();
  await cart.save();
  return getCartWithItems(userId);
}

export async function clearCart(userId) {
  if (!isValidUserId(userId)) throw new Error("Invalid userId");
  const user = await User.findById(userId);
  if (!user) return null;

  const cart = await Cart.findOne({ userId });
  if (!cart) {
    await getOrCreateCart(userId);
    return getCartWithItems(userId);
  }

  cart.items = [];
  await cart.save();
  return getCartWithItems(userId);
}
