"use client";

import { useState, useEffect, use } from "react";
import { categories, Product } from "@/lib/products";
import ProductGrid from "@/components/ProductGrid";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShopFilters from "./ShopFilters";
import AnimatedSection from "@/components/AnimatedSection";
import api from "../services/appi";

export default function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = use(searchParams);

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    const fetchProducts = async () => {
      const {data} = await api.get<{products: Product[], total: number}>(`/api/products?category=${category}`);
      setProducts(data?.products ?? []);
    };
    fetchProducts();
  }, [category]);

  const filtered = category
    ? products?.filter((p) => p.category === category) ?? []
    : products;

  const categoryLabel = category
    ? categories.find((c) => c.value === category)?.label
    : null;

  return (
    <div className="mx-auto max-w-7xl px-6 pt-28 pb-24 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: categoryLabel ? "/shop" : undefined },
          ...(categoryLabel ? [{ label: categoryLabel }] : []),
        ]}
      />

      <AnimatedSection className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          {categoryLabel ? categoryLabel : "The collection"}
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-tighter text-foreground sm:text-6xl">
          {categoryLabel
            ? `${categoryLabel} t-shirts`
            : "Shop all t-shirts"}
        </h1>
        <p className="mt-2 text-sm tracking-wide text-muted-foreground">
          {filtered.length} premium streetwear{" "}
          {filtered.length === 1 ? "style" : "styles"} to explore
        </p>
      </AnimatedSection>

      <div className="mt-10">
        <ShopFilters categories={categories} activeCategory={category} />
      </div>

      <div className="mt-10">
        <ProductGrid products={filtered} />
      </div>
    </div>
  );
}
