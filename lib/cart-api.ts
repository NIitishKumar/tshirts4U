/**
 * Types and mappers for GET/POST/PATCH/DELETE `/api/users/:userId/cart` responses.
 */

export type PopulatedCartProduct = {
  _id?: string;
  slug?: string;
  name?: string;
  price?: number;
  salePrice?: number;
  images?: string[];
};

export type CartLineApi = {
  _id: string | { toString(): string };
  productId?: PopulatedCartProduct | string;
  quantity: number;
  size?: string;
  color?: string;
};

export type CartApiCart = {
  _id?: string;
  userId?: string;
  items: CartLineApi[];
};

export type CartApiSuccess = {
  ok: true;
  cart: CartApiCart;
  itemCount: number;
  subtotal: number;
};

export type CartApiFailure = {
  ok: false;
  error: string;
};

export function lineItemIdString(line: CartLineApi): string {
  const raw = line._id;
  if (raw == null) return "";
  if (typeof raw === "string") return raw;
  if (typeof raw === "object" && typeof raw.toString === "function") {
    return String(raw.toString());
  }
  return String(raw);
}

export function unitPriceFromProduct(p: PopulatedCartProduct | null): number {
  if (!p) return 0;
  const sale = p.salePrice;
  if (typeof sale === "number" && Number.isFinite(sale)) return sale;
  const price = p.price;
  if (typeof price === "number" && Number.isFinite(price)) return price;
  return 0;
}

const FALLBACK_IMAGE = "/try-on/flat-tee.svg";

/** UI row shape (aligned with CartItem in cart-context). */
export type MappedCartLine = {
  lineItemId: string;
  productId?: string;
  slug: string;
  name: string;
  price: number;
  size: string;
  color: string;
  image: string;
  quantity: number;
};

export function mapCartLinesToUiItems(items: CartLineApi[]): MappedCartLine[] {
  return items.map((line) => {
    const lineItemId = lineItemIdString(line);
    const pid = line.productId;
    const product =
      pid && typeof pid === "object" ? (pid as PopulatedCartProduct) : null;
    const rawPid = product?._id ?? (typeof pid === "string" ? pid : undefined);
    const productIdStr =
      rawPid != null && String(rawPid).length > 0 ? String(rawPid) : undefined;

    const slug =
      (product?.slug && String(product.slug).trim()) ||
      (productIdStr ? `item-${productIdStr.slice(-8)}` : "item");

    const name =
      (product?.name && String(product.name).trim()) || "Product unavailable";

    const image =
      product?.images &&
      Array.isArray(product.images) &&
      typeof product.images[0] === "string" &&
      product.images[0].length > 0
        ? product.images[0]
        : FALLBACK_IMAGE;

    const qty = Number(line.quantity);
    const quantity = Number.isFinite(qty) ? Math.max(1, Math.floor(qty)) : 1;

    return {
      lineItemId,
      productId: productIdStr,
      slug,
      name,
      price: unitPriceFromProduct(product),
      size: typeof line.size === "string" ? line.size.trim() : "",
      color: typeof line.color === "string" ? line.color.trim() : "",
      image,
      quantity,
    };
  });
}

export function isCartApiSuccess(
  data: unknown,
): data is CartApiSuccess {
  return (
    typeof data === "object" &&
    data !== null &&
    (data as CartApiSuccess).ok === true &&
    typeof (data as CartApiSuccess).cart === "object" &&
    (data as CartApiSuccess).cart !== null &&
    Array.isArray((data as CartApiSuccess).cart.items)
  );
}
