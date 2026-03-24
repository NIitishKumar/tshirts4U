import type { Order } from "@/lib/order-types";
import { getBackendBaseUrl } from "@/lib/backend-config";
import { backendGetServer } from "@/lib/backend-fetch";

/**
 * Load a single order from the external API (same path shape as this app’s GET /api/orders/:id).
 */
export async function fetchOrderFromBackend(orderId: string): Promise<Order | null> {
  if (!getBackendBaseUrl()) return null;

  const res = await backendGetServer(`/api/orders/${encodeURIComponent(orderId)}`);
  if (res.status === 404) return null;
  if (!res.ok) return null;

  try {
    const json = (await res.json()) as { ok?: boolean; order?: Order };
    if (json?.ok && json.order) return json.order;
  } catch {
    return null;
  }
  return null;
}
