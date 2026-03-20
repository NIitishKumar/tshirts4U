import type { Metadata } from "next";
import AnimatedSection from "@/components/AnimatedSection";
import CartContent from "./CartContent";

export const metadata: Metadata = {
  title: "Your Cart — tshirts4U",
  description:
    "Review the streetwear t-shirts in your cart and proceed to checkout at tshirts4U.",
  robots: { index: false, follow: false },
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
