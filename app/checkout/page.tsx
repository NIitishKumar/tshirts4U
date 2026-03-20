import type { Metadata } from "next";
import AnimatedSection from "@/components/AnimatedSection";
import CheckoutForm from "./CheckoutForm";

export const metadata: Metadata = {
  title: "Checkout",
  description: "Complete your order at tshirts4U.",
};

export default function CheckoutPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-24 lg:px-8">
      <AnimatedSection>
        <h1 className="font-display text-4xl uppercase tracking-tighter text-foreground">
          Checkout
        </h1>
      </AnimatedSection>
      <CheckoutForm />
    </div>
  );
}
