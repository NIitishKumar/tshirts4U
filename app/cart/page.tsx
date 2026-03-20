import type { Metadata } from "next";
import AnimatedSection from "@/components/AnimatedSection";
import CartContent from "./CartContent";

export const metadata: Metadata = {
  title: "Your Cart",
  description: "Review the items in your cart and proceed to checkout.",
};

export default function CartPage() {
  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-24 lg:px-8">
      <AnimatedSection>
        <h1 className="font-display text-4xl uppercase tracking-tighter text-foreground">
          Your cart
        </h1>
      </AnimatedSection>
      <CartContent />
    </div>
  );
}
