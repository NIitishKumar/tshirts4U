"use client";

import Link from "next/link";
import { ShoppingBag } from "lucide-react";
import { useCart } from "@/lib/cart-context";
import CartItemRow from "@/components/CartItem";

export default function CartContent() {
  const { items, totalPrice } = useCart();

  function handleProceedToCheckout() {
    // If user comes from cart, force full-cart checkout (not Buy Now single item).
    sessionStorage.removeItem("tshirts4u_buy_now_item");
  }

  if (items.length === 0) {
    return (
      <div className="mt-20 flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-display text-2xl uppercase tracking-tight text-foreground">
          Your cart is empty
        </p>
        <p className="text-sm text-muted-foreground">
          Time to find something you love.
        </p>
        <Link
          href="/shop"
          className="mt-4 rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover hover:shadow-md hover:shadow-accent/15"
        >
          Browse collection
        </Link>
      </div>
    );
  }

  const shipping = totalPrice >= 75 ? 0 : 5.99;
  const orderTotal = totalPrice + shipping;

  return (
    <div className="mt-8 grid gap-12 lg:grid-cols-[1fr_340px]">
      <div className="divide-y divide-border">
        {items.map((item) => (
          <CartItemRow
            key={`${item.slug}-${item.size}-${item.color}`}
            item={item}
          />
        ))}
      </div>

      <div className="h-fit rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-lg uppercase tracking-tight text-foreground">
          Order summary
        </h2>

        <div className="mt-5 space-y-3 text-sm">
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
          {shipping > 0 && (
            <p className="text-xs text-muted-foreground">
              Free shipping on orders over $75
            </p>
          )}
          <div className="border-t border-border pt-3">
            <div className="flex justify-between font-semibold text-foreground">
              <span>Total</span>
              <span>${orderTotal.toFixed(2)}</span>
            </div>
          </div>
        </div>

        <Link
          href="/checkout"
          onClick={handleProceedToCheckout}
          className="mt-6 flex h-13 w-full items-center justify-center rounded-full bg-accent text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover hover:shadow-lg hover:shadow-accent/20"
        >
          Proceed to checkout
        </Link>
      </div>
    </div>
  );
}
