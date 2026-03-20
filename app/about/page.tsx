import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import AnimatedSection from "@/components/AnimatedSection";

export const metadata: Metadata = {
  title: "About tshirts4U — Our Streetwear Brand Story & Values",
  description:
    "tshirts4U makes premium streetwear t-shirts from heavyweight cotton. Learn about our story, our commitment to quality, and why our tees are built different.",
  alternates: { canonical: "/about" },
};

const values = [
  {
    number: "01",
    title: "Quality first",
    description:
      "We source the softest, most durable cotton from trusted mills around the world. Every seam, every stitch is considered — because the details matter.",
  },
  {
    number: "02",
    title: "Thoughtful design",
    description:
      "Our pieces are designed to be timeless, not trendy. Soft colours, flattering fits, and textures that feel wonderful against your skin.",
  },
  {
    number: "03",
    title: "Built to last",
    description:
      "We believe in slow fashion. Our tees are made to age beautifully — getting softer with every wash while keeping their shape.",
  },
  {
    number: "04",
    title: "Community",
    description:
      "We're building something bigger than a clothing brand. A community of people who value comfort, simplicity, and being kind to the planet.",
  },
];

export default function AboutPage() {
  return (
    <div className="pt-20">
      {/* Hero */}
      <section className="flex min-h-[50vh] items-center justify-center bg-muted/50">
        <AnimatedSection className="mx-auto max-w-3xl px-6 py-24 text-center">
          <p className="text-xs font-medium uppercase tracking-[0.3em] text-accent">
            Our story
          </p>
          <h1 className="mt-6 font-display text-5xl uppercase leading-[0.9] tracking-tighter text-foreground sm:text-7xl">
            Made with heart,
            <br />
            worn with joy
          </h1>
          <p className="mx-auto mt-6 max-w-lg text-base leading-relaxed tracking-wide text-muted-foreground">
            tshirts4U started with a simple wish — to create the perfect
            streetwear t-shirt. Premium cotton, heavyweight fabrics, and fits
            that feel as good as they look. Built for everyday comfort.
          </p>
        </AnimatedSection>
      </section>

      {/* Our Story */}
      <section className="mx-auto max-w-4xl px-6 py-24 lg:px-8">
        <AnimatedSection>
          <div className="grid gap-12 md:grid-cols-2 md:items-center">
            <div>
              <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
                How it began
              </p>
              <h2 className="mt-3 font-display text-3xl uppercase tracking-tighter text-foreground sm:text-4xl">
                A better everyday basic
              </h2>
            </div>
            <div className="space-y-4 text-sm leading-relaxed tracking-wide text-muted-foreground">
              <p>
                We were tired of t-shirts that lost their softness after a
                few washes, or faded before you even got attached. We wanted
                premium streetwear tees that actually last — heavyweight cotton
                that gets better with age.
              </p>
              <p>
                So we built tshirts4U. We partnered with mills that care about
                craft, chose fabrics that feel amazing against the skin, and
                designed cuts that flatter without overthinking it. Every tee is
                made from ethically sourced cotton.
              </p>
              <p>
                Every piece is washed, worn, and tested before it reaches you.
                Because if we wouldn&apos;t wear it ourselves, we wouldn&apos;t
                ask you to. That&apos;s what makes our t-shirts different.
              </p>
            </div>
          </div>
        </AnimatedSection>
      </section>

      {/* Values */}
      <section className="border-y border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <AnimatedSection className="text-center">
            <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
              What matters to us
            </p>
            <h2 className="mt-3 font-display text-4xl uppercase tracking-tighter text-foreground sm:text-5xl">
              Our values
            </h2>
          </AnimatedSection>

          <div className="mt-16 grid gap-8 sm:grid-cols-2">
            {values.map((value, i) => (
              <AnimatedSection
                key={value.number}
                delay={i * 0.1}
                className="rounded-2xl border border-border bg-surface p-8"
              >
                <span className="font-display text-3xl text-accent/30">
                  {value.number}
                </span>
                <h3 className="mt-3 font-display text-lg uppercase tracking-tight text-foreground">
                  {value.title}
                </h3>
                <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
                  {value.description}
                </p>
              </AnimatedSection>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24">
        <AnimatedSection className="mx-auto max-w-2xl px-6 text-center">
          <h2 className="font-display text-4xl uppercase tracking-tighter text-foreground sm:text-6xl">
            Ready to find
            <br />
            <span className="text-accent">your new favourite?</span>
          </h2>
          <p className="mx-auto mt-4 max-w-md text-muted-foreground">
            Browse our collection and see what feels right.
          </p>
          <div className="mt-8">
            <Link
              href="/shop"
              className="group inline-flex items-center gap-3 rounded-full bg-accent px-8 py-3.5 text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
            >
              Shop the collection
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </div>
        </AnimatedSection>
      </section>
    </div>
  );
}
