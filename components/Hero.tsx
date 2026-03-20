"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import { getFeaturedProducts } from "@/lib/products";

const ease = [0.4, 0, 0.2, 1] as const;

export default function Hero() {
  const hero = getFeaturedProducts()[0];

  return (
    <section className="relative min-h-[100dvh] overflow-hidden bg-muted/50">
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_30%_50%,_rgba(230,165,126,0.06)_0%,_transparent_70%)]" />

      <div className="relative z-10 mx-auto grid max-w-7xl items-center gap-12 px-6 py-32 lg:grid-cols-2 lg:gap-16 lg:px-8 lg:py-0 lg:min-h-[100dvh]">
        {/* Text */}
        <div className="pt-20 lg:pt-0">
          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease }}
            className="text-xs font-semibold uppercase tracking-[0.4em] text-accent"
          >
            Wear the culture
          </motion.p>

          <motion.h1
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.9, delay: 0.15, ease }}
            className="mt-6 font-display text-6xl uppercase leading-[0.9] tracking-tighter text-foreground sm:text-8xl lg:text-9xl"
          >
            Simply
            <br />
            beautiful
            <br />
            <span className="text-accent">tees</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.35, ease }}
            className="mt-8 max-w-md text-base leading-relaxed tracking-wide text-muted-foreground"
          >
            Premium t-shirts in soft, natural tones — designed for everyday
            comfort and effortless style.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.55, ease }}
            className="mt-10 flex flex-col gap-4 sm:flex-row"
          >
            <Link
              href="/shop"
              className="group inline-flex items-center justify-center gap-3 rounded-full bg-accent px-10 py-4 text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover hover:shadow-xl hover:shadow-accent/25"
            >
              Shop Now
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
            <Link
              href="/about"
              className="inline-flex items-center justify-center gap-3 rounded-full border border-border px-10 py-4 text-sm font-bold uppercase tracking-wider text-foreground transition-all duration-300 hover:border-accent/40 hover:bg-accent/5"
            >
              Our Story
            </Link>
          </motion.div>
        </div>

        {/* Product image */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95, x: 40 }}
          animate={{ opacity: 1, scale: 1, x: 0 }}
          transition={{ duration: 1, delay: 0.3, ease }}
          className="relative mx-auto w-full max-w-md lg:max-w-none"
        >
          <div className="relative aspect-[3/4] overflow-hidden rounded-3xl bg-muted shadow-2xl shadow-accent/10">
            {hero && (
              <Image
                src={hero.images[0]}
                alt={`${hero.name} — premium streetwear t-shirt by tshirts4U`}
                fill
                priority
                sizes="(max-width: 1024px) 80vw, 40vw"
                className="object-cover"
              />
            )}

            {/* Floating badge */}
            <div className="absolute bottom-6 left-6 right-6">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.9, ease }}
                className="rounded-2xl bg-surface/90 p-4 backdrop-blur-md"
              >
                <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-accent">
                  Featured
                </p>
                <p className="mt-1 font-display text-xl uppercase tracking-tight text-foreground">
                  {hero?.name ?? "Classic White Tee"}
                </p>
                <p className="text-sm font-semibold text-accent">
                  ${hero?.price.toFixed(2) ?? "42.00"}
                </p>
              </motion.div>
            </div>
          </div>

          {/* Decorative accent circle */}
          <div className="absolute -bottom-6 -right-6 -z-10 h-48 w-48 rounded-full bg-accent/10 blur-3xl" />
          <div className="absolute -top-8 -left-8 -z-10 h-32 w-32 rounded-full bg-accent/5 blur-2xl" />
        </motion.div>
      </div>

      {/* Scroll indicator */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.4, duration: 0.8 }}
        className="absolute bottom-8 left-1/2 -translate-x-1/2"
      >
        <motion.div
          animate={{ y: [0, 6, 0] }}
          transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
          className="h-9 w-5 rounded-full border-2 border-accent/30 p-1"
        >
          <div className="h-1.5 w-full rounded-full bg-accent/50" />
        </motion.div>
      </motion.div>
    </section>
  );
}
