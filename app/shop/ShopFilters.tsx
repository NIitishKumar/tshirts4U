"use client";

import Link from "next/link";
import type { Category } from "@/lib/products";

export default function ShopFilters({
  categories,
  activeCategory,
}: {
  categories: { value: Category; label: string }[];
  activeCategory?: string;
}) {
  return (
    <div className="flex flex-wrap justify-center gap-2">
      <Link
        href="/shop"
        className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
          !activeCategory
            ? "bg-accent text-accent-foreground"
            : "border border-border bg-surface text-muted-foreground hover:border-accent/40 hover:text-foreground"
        }`}
      >
        All
      </Link>
      {categories.map((cat) => (
        <Link
          key={cat.value}
          href={`/shop?category=${cat.value}`}
          className={`rounded-full px-5 py-2 text-xs font-bold uppercase tracking-wider transition-all duration-200 ${
            activeCategory === cat.value
              ? "bg-accent text-accent-foreground"
              : "border border-border bg-surface text-muted-foreground hover:border-accent/40 hover:text-foreground"
          }`}
        >
          {cat.label}
        </Link>
      ))}
    </div>
  );
}
