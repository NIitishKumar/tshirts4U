"use client";
import Link from "next/link";
import Breadcrumbs from "@/components/Breadcrumbs";
import api, { readApiErrorMessage } from "@/app/services/appi";
import { parseProductFromApiResponse, type Product } from "@/lib/products";
import { use, useEffect, useState } from "react";
import ProductDetail from "./ProductDetail";

interface Props {
  params: Promise<{ productId: string }>;
}

export default function ProductPage({ params }: Props) {
  const { productId } = use(params);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await api.get<unknown>(`/api/products/${productId}`);

        if (cancelled) return;

        if (res.status < 200 || res.status >= 300) {
          setProduct(null);
          setError(
            readApiErrorMessage(res.data) ??
              `Could not load product (HTTP ${res.status}).`,
          );
          return;
        }

        const resolved = parseProductFromApiResponse(res.data);
        if (!resolved) {
          setProduct(null);
          setError("Product not found or unexpected response shape.");
          return;
        }
        setProduct(resolved);
      } catch {
        if (!cancelled) {
          setProduct(null);
          setError("Network error while loading the product.");
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    fetchProduct();
    return () => {
      cancelled = true;
    };
  }, [productId]);

  if (loading) {
    return (
      <div className="mx-auto max-w-7xl px-6 pt-28 pb-24 lg:px-8">
        <p className="text-sm text-muted-foreground">Loading product…</p>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="mx-auto max-w-7xl px-6 pt-28 pb-24 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: "Product" },
          ]}
        />
        <div className="mt-10 rounded-2xl border border-border bg-muted/30 p-8 text-center">
          <h1 className="font-display text-2xl uppercase tracking-tight text-foreground">
            Product unavailable
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">{error}</p>
          <p className="mt-4 text-xs text-muted-foreground">
            Ensure{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              NEXT_PUBLIC_API_URL
            </code>{" "}
            or{" "}
            <code className="rounded bg-muted px-1 py-0.5">BACKEND_URL</code>{" "}
            points at your API (e.g.{" "}
            <code className="rounded bg-muted px-1 py-0.5">
              http://127.0.0.1:4000
            </code>
            ) so{" "}
            <code className="rounded bg-muted px-1 py-0.5">/api/*</code> is
            proxied correctly.
          </p>
          <Link
            href="/shop"
            className="mt-6 inline-block text-sm font-medium text-accent hover:text-accent-hover"
          >
            Back to shop
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-6 pt-28 pb-24 lg:px-8">
      <Breadcrumbs
        items={[
          { label: "Home", href: "/" },
          { label: "Shop", href: "/shop" },
          { label: product.name },
        ]}
      />
      <div className="mt-10">
        <ProductDetail product={product} />
      </div>
    </div>
  );
}
