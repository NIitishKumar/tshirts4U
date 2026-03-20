import type { Metadata } from "next";
import Link from "next/link";
import Image from "next/image";
import { Truck, RotateCcw, Heart, Shield } from "lucide-react";

export const metadata: Metadata = {
  title:
    "tshirts4U — Premium Streetwear T-Shirts | Graphic Tees & Basics",
  description:
    "Shop premium streetwear t-shirts at tshirts4U. Bold graphic tees, oversized fits, heavyweight cotton basics, and luxury fabrics. Free shipping on orders over $75.",
  alternates: { canonical: "/" },
};
import Hero from "@/components/Hero";
import ProductGrid from "@/components/ProductGrid";
import AnimatedSection from "@/components/AnimatedSection";
import Newsletter from "@/components/Newsletter";
import Testimonials from "@/components/Testimonials";
import { getFeaturedProducts, products, categories } from "@/lib/products";

const categoryImages: Record<string, string> = {
  basics:
    "https://images.unsplash.com/photo-1620799139507-2a76f79a2f4d?w=400&h=500&fit=crop&auto=format&q=80",
  graphic:
    "https://images.unsplash.com/photo-1603113730470-780cbb2f32ca?w=400&h=500&fit=crop&auto=format&q=80",
  oversized:
    "https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop&crop=top&auto=format&q=80",
  premium:
    "https://images.unsplash.com/photo-1618354691438-25bc04584c23?w=400&h=500&fit=crop&auto=format&q=80",
};

const trustSignals = [
  {
    icon: Truck,
    title: "Free Shipping",
    description: "Complimentary on orders over $75",
  },
  {
    icon: RotateCcw,
    title: "Easy Returns",
    description: "30-day hassle-free returns",
  },
  {
    icon: Heart,
    title: "Made with Care",
    description: "Premium fabrics, ethically sourced",
  },
  {
    icon: Shield,
    title: "Secure Payment",
    description: "256-bit SSL encrypted checkout",
  },
];

export default function Home() {
  const featured = getFeaturedProducts();
  const bestSellers = products.filter((p) => p.badge === "best-seller");

  return (
    <>
      <Hero />

      {/* Marquee */}
      <div className="overflow-hidden border-y border-border bg-accent/5 py-3.5">
        <div className="animate-[marquee_25s_linear_infinite] flex whitespace-nowrap">
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="mx-8 font-display text-sm uppercase tracking-[0.2em] text-accent/70"
            >
              Wear the culture &bull; Premium cotton &bull; Bold by design
            </span>
          ))}
        </div>
      </div>

      {/* Featured Collection */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <AnimatedSection>
          <div className="flex items-end justify-between">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
                Curated for you
              </p>
              <h2 className="mt-2 font-display text-4xl uppercase tracking-tighter text-foreground sm:text-5xl">
                Featured collection
              </h2>
            </div>
            <Link
              href="/shop"
              className="hidden text-sm font-medium text-accent transition-colors hover:text-accent-hover sm:block"
            >
              View all &rarr;
            </Link>
          </div>
        </AnimatedSection>

        <div className="mt-12">
          <ProductGrid products={featured} />
        </div>

        <div className="mt-10 text-center sm:hidden">
          <Link
            href="/shop"
            className="text-sm font-medium text-accent transition-colors hover:text-accent-hover"
          >
            View all &rarr;
          </Link>
        </div>
      </section>

      {/* Slogan */}
      <section className="bg-muted/50 py-24">
        <AnimatedSection className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="font-display text-5xl uppercase leading-[0.9] tracking-tighter text-foreground sm:text-7xl">
            Not just a tee.
            <br />
            <span className="text-accent">A feeling.</span>
          </h2>
          <p className="mx-auto mt-6 max-w-md tracking-wide text-muted-foreground">
            The softest fabrics, the gentlest colours, the kind of comfort that
            makes you smile every time you put it on.
          </p>
        </AnimatedSection>
      </section>

      {/* Categories with images */}
      <section className="mx-auto max-w-7xl px-6 py-24 lg:px-8">
        <AnimatedSection className="text-center">
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
            Find your style
          </p>
          <h2 className="mt-2 font-display text-4xl uppercase tracking-tighter text-foreground sm:text-5xl">
            Shop by category
          </h2>
        </AnimatedSection>

        <div className="mt-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {categories.map((cat, i) => (
            <AnimatedSection key={cat.value} delay={i * 0.08}>
              <Link
                href={`/shop?category=${cat.value}`}
                className="group relative block overflow-hidden rounded-2xl"
              >
                <div className="relative aspect-[3/4]">
                  <Image
                    src={categoryImages[cat.value]}
                    alt={`${cat.label} streetwear t-shirts — shop ${cat.label.toLowerCase()} collection at tshirts4U`}
                    fill
                    sizes="(max-width: 640px) 50vw, 25vw"
                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <span className="font-display text-2xl uppercase tracking-tight text-white">
                      {cat.label}
                    </span>
                    <span className="mt-1 block text-xs font-medium text-white/70 transition-colors group-hover:text-white">
                      Explore &rarr;
                    </span>
                  </div>
                </div>
              </Link>
            </AnimatedSection>
          ))}
        </div>
      </section>

      {/* Best Sellers */}
      {bestSellers.length > 0 && (
        <section className="border-y border-border bg-muted/30 py-24">
          <div className="mx-auto max-w-7xl px-6 lg:px-8">
            <AnimatedSection>
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
                    Most loved
                  </p>
                  <h2 className="mt-2 font-display text-4xl uppercase tracking-tighter text-foreground sm:text-5xl">
                    Best sellers
                  </h2>
                </div>
                <Link
                  href="/shop"
                  className="hidden text-sm font-medium text-accent transition-colors hover:text-accent-hover sm:block"
                >
                  View all &rarr;
                </Link>
              </div>
            </AnimatedSection>
            <div className="mt-12">
              <ProductGrid products={bestSellers} />
            </div>
          </div>
        </section>
      )}

      {/* Testimonials */}
      <Testimonials />

      {/* Trust Signals */}
      <section className="bg-muted/30">
        <div className="mx-auto max-w-7xl px-6 py-20 lg:px-8">
          <div className="grid grid-cols-2 gap-10 sm:grid-cols-4">
            {trustSignals.map((signal, i) => (
              <AnimatedSection
                key={signal.title}
                delay={i * 0.1}
                className="flex flex-col items-center text-center"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10">
                  <signal.icon className="h-5 w-5 text-accent" />
                </div>
                <h3 className="mt-4 text-sm font-semibold text-foreground">
                  {signal.title}
                </h3>
                <p className="mt-1 text-xs text-muted-foreground">
                  {signal.description}
                </p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      <Newsletter />
    </>
  );
}
