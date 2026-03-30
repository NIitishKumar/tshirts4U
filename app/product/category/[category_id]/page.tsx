"use client";
import api from "@/app/services/appi";
import type { Product } from "@/lib/products";
import type { ApiCategory } from "@/lib/categories-api";
import Breadcrumbs from "@/components/Breadcrumbs";
import AnimatedSection from "@/components/AnimatedSection";
import ProductGrid from "@/components/ProductGrid";
import { use, useEffect, useState } from "react";

export default function CategoryPage({
  params,
}: {
  params: Promise<{ category_id: string }>;
}) {
  const { category_id } = use(params);
  const [category, setCategory] = useState<ApiCategory | null>(null);
  const [products, setProducts] = useState<Product[]>([]);


  useEffect(() => {
    const fetchCategory = async () => {
      try {
        const { data } = await api.get<{ category: ApiCategory }>(
          `/api/categories/${category_id}`,
        );
        setCategory(data?.category ?? null);
      } catch {
        setCategory(null);
      }
    };
    fetchCategory();
  }, [category_id]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const { data } = await api.get<{ products: Product[] }>(
          `/api/products/category/${category_id}`,
        );
        setProducts(data?.products ?? []);
      } catch {
        setProducts([]);
      }
    };
    fetchProducts();
  }, [category_id]);

  return (
    <div className="mx-auto max-w-7xl px-6 pt-28 pb-24 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          ...(category?.name ? [{ label: category.name }] : []),
        ]}
      />
      <AnimatedSection className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          Collection
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-tighter text-foreground sm:text-6xl">
          {category?.name} t-shirts
        </h1>
        <p className="mt-2 text-sm tracking-wide text-muted-foreground">
          {products.length} style{products.length === 1 ? "" : "s"} to explore
        </p>  
      </AnimatedSection>
      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}

