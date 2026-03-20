"use client";

import { Star } from "lucide-react";
import { motion } from "framer-motion";

const reviews = [
  {
    name: "Sarah M.",
    location: "New York",
    rating: 5,
    text: "The softest tee I've ever owned. I bought three more the same week. The quality is unmatched at this price point.",
    product: "Classic White Tee",
  },
  {
    name: "James K.",
    location: "London",
    rating: 5,
    text: "Finally, a black tee that doesn't fade. I've washed it dozens of times and it still looks brand new. Fit is perfect.",
    product: "Essential Black Tee",
  },
  {
    name: "Emily R.",
    location: "Toronto",
    rating: 5,
    text: "The oversized fit is exactly what I wanted — relaxed but not sloppy. I wear it to work, to brunch, everywhere.",
    product: "Oversized Cloud Tee",
  },
];

export default function Testimonials() {
  return (
    <section className="border-y border-border bg-surface py-24">
      <div className="mx-auto max-w-7xl px-6 lg:px-8">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="text-center"
        >
          <p className="text-xs font-medium uppercase tracking-[0.25em] text-accent">
            Loved by thousands
          </p>
          <h2 className="mt-2 font-display text-4xl uppercase tracking-tighter text-foreground sm:text-5xl">
            What our customers say
          </h2>
        </motion.div>

        <div className="mt-14 grid gap-8 sm:grid-cols-3">
          {reviews.map((review, i) => (
            <motion.div
              key={review.name}
              initial={{ opacity: 0, y: 30 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.6, delay: i * 0.1 }}
              className="rounded-2xl border border-border bg-background p-6"
            >
              <div className="flex gap-0.5">
                {Array.from({ length: review.rating }).map((_, j) => (
                  <Star
                    key={j}
                    className="h-4 w-4 fill-accent text-accent"
                  />
                ))}
              </div>
              <p className="mt-4 text-sm leading-relaxed tracking-wide text-foreground">
                &ldquo;{review.text}&rdquo;
              </p>
              <div className="mt-5 flex items-center justify-between border-t border-border pt-4">
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    {review.name}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {review.location}
                  </p>
                </div>
                <p className="text-xs font-medium text-accent">
                  {review.product}
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
