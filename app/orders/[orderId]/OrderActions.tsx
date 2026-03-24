"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function OrderActions({
  orderId,
  canCancel,
}: {
  orderId: string;
  canCancel: boolean;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function cancelOrder() {
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/orders/${orderId}/cancel`, { method: "POST" });
      const json = await res.json();
      if (!res.ok) {
        throw new Error(json?.error ?? "Cancel failed.");
      }
      router.refresh();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Cancel failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mt-6">
      {canCancel ? (
        <button
          type="button"
          onClick={cancelOrder}
          disabled={loading}
          className="rounded-full border border-border px-5 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-accent hover:text-accent disabled:opacity-50"
        >
          {loading ? "Cancelling..." : "Cancel order"}
        </button>
      ) : (
        <p className="text-xs text-muted-foreground">
          This order can no longer be cancelled.
        </p>
      )}
      {error && <p className="mt-2 text-xs text-red-400">{error}</p>}
    </div>
  );
}
