"use client";
import { notFound } from "next/navigation";
import Breadcrumbs from "@/components/Breadcrumbs";
import api from "@/app/services/appi";
import { Product } from "@/lib/products";
import { use, useEffect, useState } from "react";
import ProductGrid from "@/components/ProductGrid";

interface Props {
  params: Promise<{ slug: string }>;
}

export default function ProductPage({ params }: Props) {

  const { slug } = use(params);
  console.log({slug});
  const [products, setProducts] = useState<Product[]>([]);
  console.log({products});
  useEffect(() => {
    const fetchProduct = async () => {
      try {
      const {data} = await api.get<{products: Product[]}>(`/api/products/category/${slug}`);
        console.log({data});
        setProducts(data?.products ?? []);
      } catch (error) {
        console.error(error);
      }
    };
    fetchProduct();
  }, [slug]);

  if (!products) notFound();

  const categoryLabel = slug.charAt(0).toUpperCase() + slug.slice(1);
  return (
    <div className="mx-auto max-w-7xl px-6 pt-28 pb-24 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          // { label: categoryLabel },
        ]}
      />
       <ProductGrid products={products} />
    </div>
  );
}
