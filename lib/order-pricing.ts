import { getProductBySlug } from "@/lib/products";
import type { CreateOrderPayload, OrderItem } from "@/lib/order-types";

export const SHIPPING_THRESHOLD = 75;
export const SHIPPING_FEE = 5.99;

function round2(value: number): number {
  return Math.round(value * 100) / 100;
}

export function calculateShipping(subtotal: number): number {
  return subtotal >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
}

export function validateAndBuildOrderItems(payload: CreateOrderPayload): {
  items: OrderItem[];
  subtotal: number;
  shipping: number;
  total: number;
} {
  if (!Array.isArray(payload.items) || payload.items.length === 0) {
    throw new Error("Cart is empty.");
  }

  const builtItems: OrderItem[] = payload.items.map((item) => {
    const product = getProductBySlug(item.slug);
    if (!product) {
      throw new Error(`Product not found: ${item.slug}`);
    }
    if (!product.sizes.includes(item.size as never)) {
      throw new Error(`Invalid size '${item.size}' for ${product.name}`);
    }
    const color = product.colors.find((c) => c.name === item.color);
    if (!color) {
      throw new Error(`Invalid color '${item.color}' for ${product.name}`);
    }
    if (!Number.isInteger(item.quantity) || item.quantity < 1 || item.quantity > 20) {
      throw new Error(`Invalid quantity for ${product.name}`);
    }

    const unitPrice = product.price;
    return {
      slug: product.slug,
      name: product.name,
      size: item.size,
      color: item.color,
      image: product.images[0] ?? "",
      quantity: item.quantity,
      unitPrice,
      lineTotal: round2(unitPrice * item.quantity),
    };
  });

  const subtotal = round2(builtItems.reduce((sum, item) => sum + item.lineTotal, 0));
  const shipping = calculateShipping(subtotal);
  const total = round2(subtotal + shipping);

  return { items: builtItems, subtotal, shipping, total };
}
