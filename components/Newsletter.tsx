"use client";

import { useState } from "react";
import { ArrowRight } from "lucide-react";
import AnimatedSection from "./AnimatedSection";

export default function Newsletter() {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (email.trim()) setSubmitted(true);
  }

  return (
    <section className="bg-muted/50 py-24">
      <AnimatedSection className="mx-auto max-w-xl px-6 text-center">
        <h2 className="font-display text-4xl uppercase tracking-tighter text-foreground sm:text-5xl">
          Stay in the loop
        </h2>
        <p className="mt-3 text-sm tracking-wide text-muted-foreground">
          New arrivals, restocks, and thoughtful updates — no spam, ever.
        </p>

        {submitted ? (
          <p className="mt-8 text-sm font-medium text-success">
            You&apos;re in! We&apos;ll be in touch.
          </p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="mt-8 flex flex-col gap-3 sm:flex-row"
          >
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="your@email.com"
              className="flex-1 rounded-full border border-border bg-surface px-5 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent"
            />
            <button
              type="submit"
              className="group inline-flex items-center justify-center gap-2 rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover hover:shadow-md hover:shadow-accent/15"
            >
              Subscribe
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-0.5" />
            </button>
          </form>
        )}
      </AnimatedSection>
    </section>
  );
}
