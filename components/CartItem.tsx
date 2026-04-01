"use client";

import Image from "next/image";
import { Minus, Plus, X } from "lucide-react";
import { useCart, type CartItem as CartItemType } from "@/lib/cart-context";

export default function CartItemRow({ item }: { item: CartItemType }) {
  const { updateQuantity, removeItem } = useCart();
  const lineTotal = item.price * item.quantity;

  return (
    <div className="flex gap-4 py-6">
      <div className="relative h-24 w-20 flex-shrink-0 overflow-hidden rounded-xl bg-muted">
        <Image
          src={item.image}
          alt={item.name}
          fill
          sizes="80px"
          className="object-cover"
        />
      </div>

      <div className="flex flex-1 flex-col justify-between">
        <div className="flex justify-between">
          <div>
            <h3 className="text-sm font-semibold text-foreground">{item.name}</h3>
            <p className="mt-0.5 text-xs text-muted-foreground">
              {item.size} &middot; {item.color}
            </p>
          </div>
          <button
            type="button"
            onClick={() => void removeItem(item)}
            className="rounded-full p-1 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={`Remove ${item.name}`}
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1 rounded-full border border-border">
            <button
              type="button"
              onClick={() =>
                void updateQuantity(item, item.quantity - 1)
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Decrease quantity"
            >
              <Minus className="h-3.5 w-3.5" />
            </button>
            <span className="min-w-[1.25rem] text-center text-sm font-medium">
              {item.quantity}
            </span>
            <button
              type="button"
              onClick={() =>
                void updateQuantity(item, item.quantity + 1)
              }
              className="flex h-8 w-8 items-center justify-center rounded-full text-muted-foreground transition-colors hover:text-foreground"
              aria-label="Increase quantity"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>

          <p className="text-sm font-semibold text-foreground">
            ${lineTotal.toFixed(2)}
          </p>
        </div>
      </div>
    </div>
  );
}
