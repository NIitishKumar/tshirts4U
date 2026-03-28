import "../config/env.js";
import mongoose from "mongoose";
import { connectDatabase } from "../config/database.js";
import Category from "../modules/category/category.model.js";
import Product from "../modules/products/product.schema.js";

const DEFAULT_TRY_ON_OVERLAY = "https://example.com/try-on/default-overlay.png";
const ALL_SIZES = ["XS", "S", "M", "L", "XL"];

function imageUrl(photoId) {
  return `https://images.unsplash.com/${photoId}?auto=format&fit=crop&w=600&h=750&q=80`;
}

const categories = [
  { name: "Basics", slug: "basics", description: "Everyday wardrobe essentials." },
  { name: "Graphic", slug: "graphic", description: "Printed and illustrated tees." },
  { name: "Oversized", slug: "oversized", description: "Relaxed boxy silhouettes." },
  { name: "Premium", slug: "premium", description: "Luxury-quality fabrics and finishes." },
];

const products = [
  {
    slug: "classic-white-tee",
    sku: "T4U-CW-001",
    name: "Classic White Tee",
    tagline: "The one you'll reach for every day",
    price: 42.0,
    description:
      "The foundation of every streetwear wardrobe. This premium white t-shirt is cut from 200gsm heavyweight cotton with a relaxed fit that drapes beautifully. Pre-shrunk and garment-dyed for a lived-in softness from day one - the essential unisex tee for any outfit.",
    category: "basics",
    sizes: ALL_SIZES,
    colors: [
      { name: "White", hex: "#F8F6F2" },
      { name: "Cream", hex: "#F0E6D3" },
    ],
    images: [
      imageUrl("photo-1620799139507-2a76f79a2f4d"),
      imageUrl("photo-1521572163474-6864f9cf17ab"),
    ],
    tryOnImage: DEFAULT_TRY_ON_OVERLAY,
    featured: true,
    badge: "best-seller",
  },
  {
    slug: "soft-charcoal",
    sku: "T4U-SC-002",
    name: "Soft Charcoal Tee",
    tagline: "Effortlessly understated",
    price: 45.0,
    description:
      "A muted charcoal streetwear t-shirt that pairs with everything. This essential cotton tee holds its color beautifully wash after wash, with a reinforced collar that keeps its shape. The perfect everyday basic for men and women.",
    category: "basics",
    sizes: ALL_SIZES,
    colors: [
      { name: "Charcoal", hex: "#4A4540" },
      { name: "Slate", hex: "#6B6560" },
    ],
    images: [
      imageUrl("photo-1499971442178-8c10fdf5f6ac"),
      imageUrl("photo-1583743814966-8936f5b7be1a"),
    ],
    featured: true,
    badge: null,
  },
  {
    slug: "sunset-graphic",
    sku: "T4U-SG-003",
    name: "Sunset Graphic Tee",
    tagline: "Golden hour, all day",
    price: 52.0,
    description:
      "A hand-illustrated sunset graphic tee on soft-washed premium cotton. The vintage-inspired streetwear artwork uses water-based inks that fade gracefully over time, making each graphic t-shirt uniquely yours.",
    category: "graphic",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Sand", hex: "#D4C5A9" },
      { name: "Dusty Rose", hex: "#C9A9A6" },
    ],
    images: [
      imageUrl("photo-1603113730470-780cbb2f32ca"),
      imageUrl("photo-1716951884284-4d138f2c42b2"),
    ],
    tryOnByColor: {
      Sand: DEFAULT_TRY_ON_OVERLAY,
      "Dusty Rose": DEFAULT_TRY_ON_OVERLAY,
    },
    featured: true,
    badge: "trending",
  },
  {
    slug: "oversized-cloud",
    sku: "T4U-OC-004",
    name: "Oversized Cloud Tee",
    tagline: "Comfort without compromise",
    price: 56.0,
    description:
      "An oversized streetwear t-shirt with dropped shoulders, extended length, and a relaxed boxy silhouette. Made from a cotton-modal blend that feels impossibly soft against your skin - the ultimate oversized tee for comfort-first style.",
    category: "oversized",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Cloud", hex: "#EDE8E0" },
      { name: "Sage", hex: "#B5C4B1" },
      { name: "Blush", hex: "#DDB8A9" },
    ],
    images: [
      imageUrl("photo-1521572163474-6864f9cf17ab"),
      imageUrl("photo-1620799139507-2a76f79a2f4d"),
    ],
    featured: true,
    badge: "new",
  },
  {
    slug: "botanical-print",
    sku: "T4U-BP-005",
    name: "Botanical Print Tee",
    tagline: "Nature, beautifully captured",
    price: 48.0,
    description:
      "Delicate botanical line art printed with eco-friendly inks on organic cotton. This breathable graphic t-shirt is perfect for warmer days - a gentle nod to the natural world in premium streetwear fashion.",
    category: "graphic",
    sizes: ALL_SIZES,
    colors: [
      { name: "Natural", hex: "#EDE8DF" },
      { name: "Sage", hex: "#B5C4B1" },
    ],
    images: [
      imageUrl("photo-1560800125-e06c763fdc2c"),
      imageUrl("photo-1713952852616-1827a2f0cf51"),
    ],
    featured: false,
    badge: "new",
  },
  {
    slug: "pima-luxe",
    sku: "T4U-PL-006",
    name: "Pima Luxe Tee",
    tagline: "Feel the difference",
    price: 68.0,
    description:
      "Crafted from 100% Peruvian Pima cotton - the finest premium t-shirt fabric in the world. Unmatched softness with a subtle sheen that elevates any streetwear outfit. A luxury tee for those who appreciate quality.",
    category: "premium",
    sizes: ALL_SIZES,
    colors: [
      { name: "Ivory", hex: "#FAF5ED" },
      { name: "Dusty Blue", hex: "#A8B8C8" },
      { name: "Heather", hex: "#B0A8A0" },
    ],
    images: [
      imageUrl("photo-1620799139507-2a76f79a2f4d"),
      imageUrl("photo-1618354691438-25bc04584c23"),
    ],
    featured: false,
    badge: null,
  },
  {
    slug: "vintage-stripe",
    sku: "T4U-VS-007",
    name: "Vintage Stripe Tee",
    tagline: "A timeless classic, reimagined",
    price: 46.0,
    description:
      "Vintage-inspired horizontal stripes in muted, earthy tones. This graphic stripe t-shirt features a relaxed regular fit with ribbed collar detail - a timeless streetwear classic that pairs with anything.",
    category: "graphic",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Cream/Navy", hex: "#F0E6D3" },
      { name: "Sand/Olive", hex: "#D4C5A9" },
    ],
    images: [
      imageUrl("photo-1716951884284-4d138f2c42b2"),
      imageUrl("photo-1603113730470-780cbb2f32ca"),
    ],
    featured: false,
    badge: null,
  },
  {
    slug: "relaxed-oat",
    sku: "T4U-RO-008",
    name: "Relaxed Oat Tee",
    tagline: "Sunday morning, everyday",
    price: 44.0,
    description:
      "A warm oat-toned oversized t-shirt with a raw-edge hem and dropped shoulders. This relaxed streetwear tee is the piece you reach for when comfort comes first - premium cotton, effortless style.",
    category: "oversized",
    sizes: ["S", "M", "L", "XL"],
    colors: [
      { name: "Oat", hex: "#E8DDD0" },
      { name: "Warm Stone", hex: "#C4B8A8" },
    ],
    images: [
      imageUrl("photo-1560800125-e06c763fdc2c"),
      imageUrl("photo-1713952852616-1827a2f0cf51"),
    ],
    featured: false,
    badge: "trending",
  },
  {
    slug: "essential-black",
    sku: "T4U-EB-009",
    name: "Essential Black Tee",
    tagline: "Every wardrobe needs one",
    price: 42.0,
    description:
      "The perfect black t-shirt, redefined. Double-dyed heavyweight cotton for richness that won't fade. A tailored streetwear fit that flatters without being tight - the essential black tee every wardrobe needs.",
    category: "basics",
    sizes: ALL_SIZES,
    colors: [{ name: "Black", hex: "#1A1816" }],
    images: [
      imageUrl("photo-1583743814966-8936f5b7be1a"),
      imageUrl("photo-1499971442178-8c10fdf5f6ac"),
    ],
    featured: false,
    badge: "best-seller",
  },
  {
    slug: "heritage-heavy",
    sku: "T4U-HH-010",
    name: "Heritage Heavyweight",
    tagline: "Built to age beautifully",
    price: 62.0,
    description:
      "A 280gsm organic cotton heavyweight t-shirt in a boxy heritage cut inspired by vintage workwear. This premium streetwear tee gets softer with every wash while holding its shape - built to age beautifully.",
    category: "premium",
    sizes: ["S", "M", "L", "XL", "XXL"],
    colors: [
      { name: "Ecru", hex: "#F0EBE0" },
      { name: "Washed Ink", hex: "#3A3530" },
    ],
    images: [
      imageUrl("photo-1618354691438-25bc04584c23"),
      imageUrl("photo-1716951884284-4d138f2c42b2"),
    ],
    featured: false,
    badge: null,
  },
];

async function run() {
  await connectDatabase();

  const categoryIdBySlug = {};
  for (const category of categories) {
    const doc = await Category.findOneAndUpdate(
      { slug: category.slug },
      { $set: category },
      { upsert: true, returnDocument: "after" },
    );
    categoryIdBySlug[category.slug] = doc._id;
  }

  for (const product of products) {
    const categoryId = categoryIdBySlug[product.category];
    const payload = {
      slug: product.slug,
      sku: product.sku,
      name: product.name,
      tagline: product.tagline,
      price: product.price,
      description: product.description,
      sizes: product.sizes,
      colors: product.colors,
      images: product.images,
      imageUrls: product.images,
      tryOnImage: product.tryOnImage ?? "",
      tryOnByColor: product.tryOnByColor ?? {},
      featured: Boolean(product.featured),
      badge: product.badge ?? null,
      categoryId,
      isActive: true,
      stock: 100,
    };

    await Product.findOneAndUpdate(
      { slug: product.slug },
      { $set: payload },
      { upsert: true, returnDocument: "after" },
    );
  }

  const categoryCount = await Category.countDocuments();
  const productCount = await Product.countDocuments();
  console.log(`Seed completed: ${categoryCount} categories, ${productCount} products.`);
}

run()
  .catch((err) => {
    console.error("Seed failed:", err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await mongoose.connection.close();
  });
