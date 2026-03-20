"use client";

import Image from "next/image";
import { useState } from "react";
import { Check } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product, Size, ProductColor } from "@/lib/products";
import { useCart } from "@/lib/cart-context";
import SizeSelector from "@/components/SizeSelector";
import ColorSelector from "@/components/ColorSelector";

export default function ProductDetail({ product }: { product: Product }) {
  const { addItem } = useCart();
  const [selectedSize, setSelectedSize] = useState<Size | null>(null);
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    product.colors[0],
  );
  const [activeImage, setActiveImage] = useState(0);
  const [added, setAdded] = useState(false);

  function handleAdd() {
    if (!selectedSize) return;
    addItem({
      slug: product.slug,
      name: product.name,
      price: product.price,
      size: selectedSize,
      color: selectedColor.name,
      image: product.images[0],
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  }

  return (
    <div className="grid gap-12 lg:grid-cols-2">
      {/* Images */}
      <div className="space-y-3">
        <motion.div
          key={activeImage}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.3 }}
          className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted"
        >
          <Image
            src={product.images[activeImage]}
            alt={product.name}
            fill
            sizes="(max-width: 1024px) 100vw, 50vw"
            className="object-cover"
            priority
          />
        </motion.div>
        {product.images.length > 1 && (
          <div className="flex gap-2">
            {product.images.map((img, i) => (
              <button
                key={i}
                onClick={() => setActiveImage(i)}
                className={`relative h-20 w-16 overflow-hidden rounded-lg border-2 transition-all duration-200 ${
                  activeImage === i
                    ? "border-accent"
                    : "border-border hover:border-accent/40"
                }`}
              >
                <Image
                  src={img}
                  alt={`${product.name} view ${i + 1}`}
                  fill
                  sizes="64px"
                  className="object-cover"
                />
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Info */}
      <div className="flex flex-col justify-center">
        <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
          {product.category}
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-tighter text-foreground sm:text-5xl">
          {product.name}
        </h1>
        <p className="mt-1 text-sm tracking-wide text-muted-foreground">
          {product.tagline}
        </p>
        <p className="mt-3 text-2xl font-bold text-accent">
          ${product.price.toFixed(2)}
        </p>
        <p className="mt-6 text-sm leading-relaxed tracking-wide text-muted-foreground">
          {product.description}
        </p>

        <div className="mt-8 space-y-6">
          <div>
            <label className="text-sm font-medium text-foreground">
              Colour
            </label>
            <div className="mt-3">
              <ColorSelector
                colors={product.colors}
                selected={selectedColor}
                onChange={setSelectedColor}
              />
            </div>
          </div>

          <div>
            <label className="text-sm font-medium text-foreground">
              Size
            </label>
            <div className="mt-3">
              <SizeSelector
                sizes={product.sizes}
                selected={selectedSize}
                onChange={setSelectedSize}
              />
            </div>
            {selectedSize === null && (
              <p className="mt-2 text-xs text-muted-foreground">
                Please select a size
              </p>
            )}
          </div>
        </div>

        <button
          onClick={handleAdd}
          disabled={!selectedSize || added}
          className={`mt-8 flex h-14 w-full items-center justify-center gap-2 rounded-full text-sm font-bold uppercase tracking-wider transition-all duration-300 ${
            added
              ? "bg-success text-white"
              : selectedSize
                ? "bg-accent text-accent-foreground hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
                : "cursor-not-allowed bg-muted text-muted-foreground"
          }`}
        >
          <AnimatePresence mode="wait">
            {added ? (
              <motion.span
                key="added"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                className="flex items-center gap-2"
              >
                <Check className="h-4 w-4" /> Added to cart
              </motion.span>
            ) : (
              <motion.span
                key="add"
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
              >
                Add to Cart
              </motion.span>
            )}
          </AnimatePresence>
        </button>
      </div>
    </div>
  );
}
