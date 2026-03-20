"use client";

import type { Size } from "@/lib/products";

export default function SizeSelector({
  sizes,
  selected,
  onChange,
}: {
  sizes: Size[];
  selected: Size | null;
  onChange: (size: Size) => void;
}) {
  return (
    <div className="flex flex-wrap gap-2">
      {sizes.map((size) => (
        <button
          key={size}
          onClick={() => onChange(size)}
          className={`flex h-10 min-w-[2.75rem] items-center justify-center rounded-full border px-3 text-sm font-medium transition-all duration-200 ${
            selected === size
              ? "border-accent bg-accent text-accent-foreground"
              : "border-border bg-surface text-foreground hover:border-accent/40"
          }`}
        >
          {size}
        </button>
      ))}
    </div>
  );
}
