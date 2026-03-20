"use client";

import type { ProductColor } from "@/lib/products";

export default function ColorSelector({
  colors,
  selected,
  onChange,
}: {
  colors: ProductColor[];
  selected: ProductColor | null;
  onChange: (color: ProductColor) => void;
}) {
  return (
    <div className="flex items-center gap-3">
      {colors.map((color) => (
        <button
          key={color.name}
          onClick={() => onChange(color)}
          title={color.name}
          className={`relative h-8 w-8 rounded-full border-2 transition-all duration-200 ${
            selected?.name === color.name
              ? "border-accent scale-110"
              : "border-border hover:border-accent/40"
          }`}
        >
          <span
            className="absolute inset-1 rounded-full"
            style={{ backgroundColor: color.hex }}
          />
        </button>
      ))}
      {selected && (
        <span className="text-sm text-muted-foreground">{selected.name}</span>
      )}
    </div>
  );
}
