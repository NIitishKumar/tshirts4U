"use client";

import { useState, useEffect, use } from "react";
import type { Category, Product } from "@/lib/products";
import ProductGrid from "@/components/ProductGrid";
import Breadcrumbs from "@/components/Breadcrumbs";
import ShopFilters from "./ShopFilters";
import AnimatedSection from "@/components/AnimatedSection";
import api from "../services/appi";

export default function ShopPage({ searchParams }: { searchParams: Promise<{ category?: string }> }) {
  const { category } = use(searchParams) as { category?: string } | undefined ?? {};

  const [products, setProducts] = useState<Product[]>([]);
  const [total, setTotal] = useState(0);
  const [categoriesFromApi, setCategoriesFromApi] = useState<Category[]>([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const {data} = await api.get<{products: Product[], total: number}>(`/api/products/by-category/${category}`);
        setProducts(data?.products ?? []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProducts();
  }, [category]);

  useEffect(() => {
    const fetchCategories = async () => {
      try { 
        const {data} = await api.get<{categories: Category[]}>(`/api/categories`);
        setCategoriesFromApi(data?.categories ?? []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchCategories();
  }, []);


  return (
    <div className="mx-auto max-w-7xl px-6 pt-28 pb-24 lg:px-8">
      <AnimatedSection className="text-center">
        <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
          {(categoriesFromApi?.find((c: Category) => c._id === category)?.name) || "The collection"}
        </p>
        <h1 className="mt-2 font-display text-4xl uppercase tracking-tighter text-foreground sm:text-6xl">
          {(categoriesFromApi?.find((c: Category) => c._id === category)?.name) || "The collection"}
        </h1>
        <p className="mt-2 text-sm tracking-wide text-muted-foreground">
          {products.length} premium streetwear{" "}
          {products.length === 1 ? "style" : "styles"} to explore
        </p>
      </AnimatedSection>

      <div className="mt-10">
        <ShopFilters categories={categoriesFromApi?.map((c) => ({value: c._id, label: c.name})) ?? []} activeCategory={category} />
      </div>

      <div className="mt-10">
        <ProductGrid products={products} />
      </div>
    </div>
  );
}
