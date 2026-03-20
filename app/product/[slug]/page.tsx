import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { products, getProductBySlug } from "@/lib/products";
import { getSiteUrl } from "@/lib/site";
import ProductDetail from "./ProductDetail";
import ProductGrid from "@/components/ProductGrid";
import Breadcrumbs from "@/components/Breadcrumbs";
import AnimatedSection from "@/components/AnimatedSection";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateStaticParams() {
  return products.map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) return {};

  const siteUrl = getSiteUrl();
  const title = `${product.name} — Premium Streetwear T-Shirt`;
  const description =
    product.description.length > 160
      ? product.description.slice(0, 157) + "..."
      : product.description;

  return {
    title,
    description,
    alternates: {
      canonical: `/product/${product.slug}`,
    },
    openGraph: {
      title: `${product.name} | tshirts4U`,
      description,
      url: `${siteUrl}/product/${product.slug}`,
      type: "website",
      images: [
        {
          url: product.images[0],
          width: 600,
          height: 750,
          alt: `${product.name} — streetwear t-shirt by tshirts4U`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title: `${product.name} | tshirts4U`,
      description,
      images: [product.images[0]],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { slug } = await params;
  const product = getProductBySlug(slug);
  if (!product) notFound();

  const siteUrl = getSiteUrl();

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.name,
    description: product.description,
    image: product.images,
    url: `${siteUrl}/product/${product.slug}`,
    sku: product.sku,
    brand: {
      "@type": "Brand",
      name: "tshirts4U",
    },
    category: "T-Shirts",
    offers: {
      "@type": "Offer",
      price: product.price.toFixed(2),
      priceCurrency: "USD",
      availability: "https://schema.org/InStock",
      url: `${siteUrl}/product/${product.slug}`,
      seller: {
        "@type": "Organization",
        name: "tshirts4U",
      },
      priceValidUntil: new Date(
        Date.now() + 365 * 24 * 60 * 60 * 1000,
      ).toISOString().split("T")[0],
    },
    aggregateRating: {
      "@type": "AggregateRating",
      ratingValue: "4.8",
      reviewCount: "127",
    },
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: siteUrl,
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Shop",
        item: `${siteUrl}/shop`,
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.name,
        item: `${siteUrl}/product/${product.slug}`,
      },
    ],
  };

  const related = products
    .filter((p) => p.category === product.category && p.slug !== product.slug)
    .slice(0, 4);

  const categoryLabel =
    product.category.charAt(0).toUpperCase() + product.category.slice(1);

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="mx-auto max-w-7xl px-6 pt-28 pb-24 lg:px-8">
        <Breadcrumbs
          items={[
            { label: "Home", href: "/" },
            { label: "Shop", href: "/shop" },
            { label: categoryLabel, href: `/shop?category=${product.category}` },
            { label: product.name },
          ]}
        />

        <ProductDetail product={product} />

        {related.length > 0 && (
          <section className="mt-24">
            <AnimatedSection>
              <p className="text-xs font-medium uppercase tracking-[0.2em] text-accent">
                More streetwear tees
              </p>
              <h2 className="mt-2 font-display text-3xl uppercase tracking-tighter text-foreground">
                You might also like
              </h2>
            </AnimatedSection>
            <div className="mt-8">
              <ProductGrid products={related} />
            </div>
          </section>
        )}
      </div>
    </>
  );
}
