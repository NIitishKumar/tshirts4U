import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/auth-session";
import { getOrder, pushStatus, updateOrder } from "@/lib/order-store";
import type { Order } from "@/lib/order-types";

export const runtime = "nodejs";

interface CodPayload {
  orderId: string;
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAuthSession();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let payload: CodPayload;
  try {
    payload = (await request.json()) as CodPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload?.orderId) {
    return NextResponse.json({ ok: false, error: "orderId is required." }, { status: 400 });
  }

  const order = await getOrder(payload.orderId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }
  if (order.userId !== session.userId) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const updated = await updateOrder(order.id, (current) => {
    let next: Order = {
      ...current,
      payment: {
        ...current.payment,
        method: "cod",
        status: "cod_pending",
      },
    };
    next = pushStatus(next, "cod_confirmed", "Cash on delivery selected");
    next = pushStatus(next, "processing", "Order is being prepared");
    return next;
  });

  return NextResponse.json({
    ok: true,
    order: {
      id: updated?.id,
      status: updated?.status,
    },
  });
}
