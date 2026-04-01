export type Size = "XS" | "S" | "M" | "L" | "XL" | "XXL";

export interface ProductColor {
  name: string;
  hex: string;
}

export type Category = {
  _id: string;
  name: string;
};

export type Badge = "best-seller" | "trending" | "new" | null;

export interface Product {
  _id: string;
  categoryId: Category;
  slug: string;
  sku: string;
  name: string;
  tagline: string;
  price: number;
  description: string;
  category: Category;
  sizes: Size[];
  colors: ProductColor[];
  images: string[];
  featured: boolean;
  badge: Badge;
  /** Flat-lay / cut-out used for try-on when no per-colour URL matches */
  tryOnImage?: string;
  /** Per-colour overlay URLs (e.g. different graphics per variant) */
  tryOnByColor?: Partial<Record<string, string>>;
}

export const DEFAULT_TRY_ON_OVERLAY = "/try-on/flat-tee.svg";

export function resolveTryOnOverlay(
  product: Product,
  colorName: string,
): string {
  return (
    product.tryOnByColor?.[colorName] ??
    product.tryOnImage ??
    DEFAULT_TRY_ON_OVERLAY
  );
}

/**
 * URL sent to the try-on API: use an HTTPS per-colour flat-lay when defined,
 * otherwise the catalog image the shopper is viewing (`galleryIndex`).
 */
export function resolveGarmentImageForTryOn(
  product: Product,
  colorName: string,
  galleryIndex: number,
): string | null {
  const overlay = resolveTryOnOverlay(product, colorName);
  if (overlay.startsWith("https://")) {
    return overlay;
  }
  const idx =
    Number.isInteger(galleryIndex) &&
    galleryIndex >= 0 &&
    galleryIndex < product.images.length
      ? galleryIndex
      : 0;
  const url = product.images[idx];
  return url?.startsWith("https://") ? url : null;
}

const ALL_SIZES: Size[] = ["XS", "S", "M", "L", "XL", "XXL"];

function unsplash(
  photoId: string,
  w = 600,
  h = 750,
  crop: string = "center",
): string {
  return `https://images.unsplash.com/${photoId}?w=${w}&h=${h}&fit=crop&crop=${crop}&auto=format&q=80`;
}

const categoryIdByValue: Record<string, Category> = {
  basics: { _id: "cat-basics", name: "Basics" },
  graphic: { _id: "cat-graphic", name: "Graphic" },
  oversized: { _id: "cat-oversized", name: "Oversized" },
  premium: { _id: "cat-premium", name: "Premium" },
};

export const products: Product[] = [
  {
    _id: "local-classic-white-tee",
    categoryId: categoryIdByValue.basics,
    slug: "classic-white-tee",
    sku: "T4U-CW-001",
    name: "Classic White Tee",
    tagline: "The one you'll reach for every day",
    price: 42.0,
    description:
      "The foundation of every streetwear wardrobe. This premium white t-shirt is cut from 200gsm heavyweight cotton with a relaxed fit that drapes beautifully. Pre-shrunk and garment-dyed for a lived-in softness from day one — the essential unisex tee for any outfit.",
    category: categoryIdByValue.basics,
    sizes: ALL_SIZES,
    colors: [
      { name: "White", hex: "#F8F6F2" },
      { name: "Cream", hex: "#F0E6D3" },
    ],
    images: [
      unsplash("photo-1620799139507-2a76f79a2f4d", 600, 750, "center"),
      unsplash("photo-1521572163474-6864f9cf17ab", 600, 750, "top"),
    ],
    tryOnImage: DEFAULT_TRY_ON_OVERLAY,
    featured: true,
    badge: "best-seller",
  },
  {
    _id: "local-soft-charcoal",
    categoryId: categoryIdByValue.basics,
    slug: "soft-charcoal",
    sku: "T4U-SC-002",
    name: "Soft Charcoal Tee",
    tagline: "Effortlessly understated",
    price: 45.0,
    description:
      "A muted charcoal streetwear t-shirt that pairs with everything. This essential cotton tee holds its color beautifully wash after wash, with a reinforced collar that keeps its shape. The perfect everyday basic for men and women.",
    category: categoryIdByValue.basics,
    sizes: ALL_SIZES,
    colors: [
      { name: "Charcoal", hex: "#4A4540" },
      { name: "Slate", hex: "#6B6560" },
    ],
    images: [
      unsplash("photo-1499971442178-8c10fdf5f6ac", 600, 750, "center"),
      unsplash("photo-1583743814966-8936f5b7be1a", 600, 750, "center"),
    ],
    featured: true,
    badge: null,
  },
  {
    _id: "local-sunset-graphic",
    categoryId: categoryIdByValue.graphic,
    slug: "sunset-graphic",
    sku: "T4U-SG-003",
    name: "Sunset Graphic Tee",
    tagline: "Golden hour, all day",
    price: 52.0,
    description:
      "A hand-illustrated sunset graphic tee on soft-washed premium cotton. The vintage-inspired streetwear artwork uses water-based inks that fade gracefully over time, making each graphic t-shirt uniquely yours.",
    category: categoryIdByValue.graphic,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Sand", hex: "#D4C5A9" },
      { name: "Dusty Rose", hex: "#C9A9A6" },
    ],
    images: [
      unsplash("photo-1603113730470-780cbb2f32ca", 600, 750, "center"),
      unsplash("photo-1716951884284-4d138f2c42b2", 600, 750, "center"),
    ],
    tryOnByColor: {
      Sand: DEFAULT_TRY_ON_OVERLAY,
      "Dusty Rose": DEFAULT_TRY_ON_OVERLAY,
    },
    featured: true,
    badge: "trending",
  },
  {
    _id: "local-oversized-cloud",
    categoryId: categoryIdByValue.oversized,
    slug: "oversized-cloud",
    sku: "T4U-OC-004",
    name: "Oversized Cloud Tee",
    tagline: "Comfort without compromise",
    price: 56.0,
    description:
      "An oversized streetwear t-shirt with dropped shoulders, extended length, and a relaxed boxy silhouette. Made from a cotton-modal blend that feels impossibly soft against your skin — the ultimate oversized tee for comfort-first style.",
    category: categoryIdByValue.oversized,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Cloud", hex: "#EDE8E0" },
      { name: "Sage", hex: "#B5C4B1" },
      { name: "Blush", hex: "#DDB8A9" },
    ],
    images: [
      unsplash("photo-1521572163474-6864f9cf17ab", 600, 750, "faces"),
      unsplash("photo-1620799139507-2a76f79a2f4d", 600, 750, "entropy"),
    ],
    featured: true,
    badge: "new",
  },
  {
    _id: "local-botanical-print",
    categoryId: categoryIdByValue.graphic,
    slug: "botanical-print",
    sku: "T4U-BP-005",
    name: "Botanical Print Tee",
    tagline: "Nature, beautifully captured",
    price: 48.0,
    description:
      "Delicate botanical line art printed with eco-friendly inks on organic cotton. This breathable graphic t-shirt is perfect for warmer days — a gentle nod to the natural world in premium streetwear fashion.",
    category: categoryIdByValue.graphic,
    sizes: ALL_SIZES,
    colors: [
      { name: "Natural", hex: "#EDE8DF" },
      { name: "Sage", hex: "#B5C4B1" },
    ],
    images: [
      unsplash("photo-1560800125-e06c763fdc2c", 600, 750, "top"),
      unsplash("photo-1713952852616-1827a2f0cf51", 600, 750, "center"),
    ],
    featured: false,
    badge: "new",
  },
  {
    _id: "local-pima-luxe",
    categoryId: categoryIdByValue.premium,
    slug: "pima-luxe",
    sku: "T4U-PL-006",
    name: "Pima Luxe Tee",
    tagline: "Feel the difference",
    price: 68.0,
    description:
      "Crafted from 100% Peruvian Pima cotton — the finest premium t-shirt fabric in the world. Unmatched softness with a subtle sheen that elevates any streetwear outfit. A luxury tee for those who appreciate quality.",
    category: categoryIdByValue.premium,
    sizes: ALL_SIZES,
    colors: [
      { name: "Ivory", hex: "#FAF5ED" },
      { name: "Dusty Blue", hex: "#A8B8C8" },
      { name: "Heather", hex: "#B0A8A0" },
    ],
    images: [
      unsplash("photo-1620799139507-2a76f79a2f4d", 600, 750, "top"),
      unsplash("photo-1618354691438-25bc04584c23", 600, 750, "center"),
    ],
    featured: false,
    badge: null,
  },
  {
    _id: "local-vintage-stripe",
    categoryId: categoryIdByValue.graphic,
    slug: "vintage-stripe",
    sku: "T4U-VS-007",
    name: "Vintage Stripe Tee",
    tagline: "A timeless classic, reimagined",
    price: 46.0,
    description:
      "Vintage-inspired horizontal stripes in muted, earthy tones. This graphic stripe t-shirt features a relaxed regular fit with ribbed collar detail — a timeless streetwear classic that pairs with anything.",
    category: categoryIdByValue.graphic,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Cream/Navy", hex: "#F0E6D3" },
      { name: "Sand/Olive", hex: "#D4C5A9" },
    ],
    images: [
      unsplash("photo-1716951884284-4d138f2c42b2", 600, 750, "entropy"),
      unsplash("photo-1603113730470-780cbb2f32ca", 600, 750, "top"),
    ],
    featured: false,
    badge: null,
  },
  {
    _id: "local-relaxed-oat",
    categoryId: categoryIdByValue.oversized,
    slug: "relaxed-oat",
    sku: "T4U-RO-008",
    name: "Relaxed Oat Tee",
    tagline: "Sunday morning, everyday",
    price: 44.0,
    description:
      "A warm oat-toned oversized t-shirt with a raw-edge hem and dropped shoulders. This relaxed streetwear tee is the piece you reach for when comfort comes first — premium cotton, effortless style.",
    category: categoryIdByValue.oversized,
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Oat", hex: "#E8DDD0" },
      { name: "Warm Stone", hex: "#C4B8A8" },
    ],
    images: [
      unsplash("photo-1560800125-e06c763fdc2c", 600, 750, "center"),
      unsplash("photo-1713952852616-1827a2f0cf51", 600, 750, "top"),
    ],
    featured: false,
    badge: "trending",
  },
  {
    _id: "local-essential-black",
    categoryId: categoryIdByValue.basics,
    slug: "essential-black",
    sku: "T4U-EB-009",
    name: "Essential Black Tee",
    tagline: "Every wardrobe needs one",
    price: 42.0,
    description:
      "The perfect black t-shirt, redefined. Double-dyed heavyweight cotton for richness that won't fade. A tailored streetwear fit that flatters without being tight — the essential black tee every wardrobe needs.",
    category: categoryIdByValue.basics,
    sizes: ALL_SIZES,
    colors: [{ name: "Black", hex: "#1A1816" }],
    images: [
      unsplash("photo-1583743814966-8936f5b7be1a", 600, 750, "top"),
      unsplash("photo-1499971442178-8c10fdf5f6ac", 600, 750, "entropy"),
    ],
    featured: false,
    badge: "best-seller",
  },
  {
    _id: "local-heritage-heavy",
    categoryId: categoryIdByValue.premium,
    slug: "heritage-heavy",
    sku: "T4U-HH-010",
    name: "Heritage Heavyweight",
    tagline: "Built to age beautifully",
    price: 62.0,
    description:
      "A 280gsm organic cotton heavyweight t-shirt in a boxy heritage cut inspired by vintage workwear. This premium streetwear tee gets softer with every wash while holding its shape — built to age beautifully.",
    category: categoryIdByValue.premium,
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Ecru", hex: "#F0EBE0" },
      { name: "Washed Ink", hex: "#3A3530" },
    ],
    images: [
      unsplash("photo-1618354691438-25bc04584c23", 600, 750, "top"),
      unsplash("photo-1716951884284-4d138f2c42b2", 600, 750, "top"),
    ],
    featured: false,
    badge: null,
  },
];

export const categories: { _id: string; name: string }[] = [
  { _id: categoryIdByValue.basics._id, name: categoryIdByValue.basics.name },
  { _id: categoryIdByValue.graphic._id, name: categoryIdByValue.graphic.name },
  { _id: categoryIdByValue.oversized._id, name: categoryIdByValue.oversized.name },
  { _id: categoryIdByValue.premium._id, name: categoryIdByValue.premium.name },
];

export function getProductBySlug(slug: string): Product | undefined {
  return products.find((p) => p.slug === slug);
}

function isProductShape(x: unknown): x is Product {
  if (!x || typeof x !== "object") return false;
  const o = x as Record<string, unknown>;
  return (
    typeof o._id === "string" &&
    typeof o.slug === "string" &&
    typeof o.name === "string"
  );
}

/** Normalize common API envelope shapes into a single Product. */
export function parseProductFromApiResponse(payload: unknown): Product | null {
  if (payload == null) return null;
  if (typeof payload === "string") return null;
  if (typeof payload !== "object") return null;
  const o = payload as Record<string, unknown>;
  if (isProductShape(o)) return o;
  if (o.product != null) {
    const p = parseProductFromApiResponse(o.product);
    if (p) return p;
  }
  if (Array.isArray(o.products) && o.products[0]) {
    const p = parseProductFromApiResponse(o.products[0]);
    if (p) return p;
  }
  if (o.data != null) {
    const p = parseProductFromApiResponse(o.data);
    if (p) return p;
  }
  if (o.success === true && o.data != null) {
    return parseProductFromApiResponse(o.data);
  }
  return null;
}

export function getProductsByCategory(category: Category): Product[] {
  return products.filter((p) => p.category === category);
}

export function getFeaturedProducts(): Product[] {
  return products.filter((p) => p.featured);
}
