"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Eye } from "lucide-react";
import type { Product, Badge } from "@/lib/products";

const badgeConfig: Record<Exclude<Badge, null>, { label: string; className: string }> = {
  "best-seller": {
    label: "Best Seller",
    className: "bg-foreground text-background",
  },
  trending: {
    label: "Trending",
    className: "bg-accent text-accent-foreground",
  },
  new: {
    label: "New",
    className: "bg-success text-white",
  },
};

export default function ProductCard({
  product,
  index = 0,
}: {
  product: Product;
  index?: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true }}
      transition={{
        duration: 0.6,
        delay: index * 0.08,
        ease: [0.4, 0, 0.2, 1],
      }}
    >
      {console.log({product})}
      <Link href={`/product/${product?.categoryId?._id}`} className="group block">
        <div className="relative aspect-[4/5] overflow-hidden rounded-2xl bg-muted">
          <Image
            src={product.images[0]}
            alt={`${product.name} — ${product.category} streetwear t-shirt`}
            fill
            sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            className="object-cover transition-transform duration-700 ease-[cubic-bezier(0.4,0,0.2,1)] group-hover:scale-110"
          />

          {/* Badge */}
          {product.badge && (
            <span
              className={`absolute top-3 left-3 z-10 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-wider ${badgeConfig[product.badge].className}`}
            >
              {badgeConfig[product.badge].label}
            </span>
          )}

          {/* Quick View overlay */}
          <div className="absolute inset-0 flex items-center justify-center bg-foreground/0 transition-all duration-300 group-hover:bg-foreground/20">
            <span className="flex translate-y-4 items-center gap-2 rounded-full bg-surface/95 px-5 py-2.5 text-xs font-semibold text-foreground opacity-0 shadow-lg backdrop-blur-sm transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
              <Eye className="h-3.5 w-3.5" />
              Quick View
            </span>
          </div>
        </div>

        <div className="mt-4">
          <div className="flex items-start justify-between gap-2">
            <h3 className="font-display text-base uppercase tracking-tight text-foreground">
              {product.name}
            </h3>
            <p className="shrink-0 text-sm font-bold text-accent">
              ${product.price.toFixed(2)}
            </p>
          </div>
          <p className="mt-0.5 text-xs tracking-wide text-muted-foreground">
            {product.tagline}
          </p>
        </div>
      </Link>
    </motion.div>
  );
}
