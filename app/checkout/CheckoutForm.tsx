"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart } from "@/lib/cart-context";

function InputField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        {...props}
        className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent"
      />
    </div>
  );
}

export default function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart();
  const [placed, setPlaced] = useState(false);

  const shipping = totalPrice >= 75 ? 0 : 5.99;
  const orderTotal = totalPrice + shipping;

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setPlaced(true);
    clearCart();
  }

  if (items.length === 0 && !placed) {
    return (
      <div className="mt-20 flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-display text-2xl uppercase tracking-tight text-foreground">Nothing to checkout</p>
        <Link
          href="/shop"
          className="mt-4 rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover"
        >
          Browse collection
        </Link>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {placed ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mt-20 flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-display text-3xl uppercase tracking-tighter text-foreground">
            Order placed!
          </h2>
          <p className="max-w-sm text-muted-foreground">
            Thank you for your order. We&apos;ll send you a confirmation email
            with tracking details shortly.
          </p>
          <Link
            href="/shop"
            className="mt-6 rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover"
          >
            Continue shopping
          </Link>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <form
            onSubmit={handleSubmit}
            className="mt-8 grid gap-12 lg:grid-cols-[1fr_340px]"
          >
            <div className="space-y-8">
              <fieldset>
                <legend className="font-display text-lg uppercase tracking-tight text-foreground">
                  Shipping information
                </legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <InputField label="First name" placeholder="Jane" required />
                  <InputField label="Last name" placeholder="Doe" required />
                  <div className="sm:col-span-2">
                    <InputField label="Address" placeholder="123 Main St" required />
                  </div>
                  <InputField label="City" placeholder="San Francisco" required />
                  <InputField label="ZIP code" placeholder="94102" required />
                  <div className="sm:col-span-2">
                    <InputField
                      label="Email"
                      type="email"
                      placeholder="jane@example.com"
                      required
                    />
                  </div>
                </div>
              </fieldset>

              <fieldset>
                <legend className="font-display text-lg uppercase tracking-tight text-foreground">
                  Payment
                </legend>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div className="sm:col-span-2">
                    <InputField
                      label="Card number"
                      placeholder="4242 4242 4242 4242"
                      required
                    />
                  </div>
                  <InputField label="Expiry" placeholder="MM/YY" required />
                  <InputField label="CVC" placeholder="123" required />
                </div>
              </fieldset>
            </div>

            <div className="h-fit rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display text-lg uppercase tracking-tight text-foreground">
                Order summary
              </h2>
              <div className="mt-4 max-h-48 space-y-3 overflow-y-auto">
                {items.map((item) => (
                  <div
                    key={`${item.slug}-${item.size}-${item.color}`}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {item.name} &times; {item.quantity}
                    </span>
                    <span className="text-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${totalPrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="font-medium text-success">Free</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                  <span>Total</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <button
                type="submit"
                className="mt-6 flex h-13 w-full items-center justify-center rounded-full bg-accent text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
              >
                Place order
              </button>
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
