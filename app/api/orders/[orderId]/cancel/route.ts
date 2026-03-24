import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/auth-session";
import { canCancelOrder, getOrder, pushStatus, updateOrder } from "@/lib/order-store";

export const runtime = "nodejs";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ orderId: string }> },
) {
  let session;
  try {
    session = await requireAuthSession();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }
  if (order.userId !== session.userId) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  if (!canCancelOrder(order)) {
    return NextResponse.json(
      { ok: false, error: "Order cannot be cancelled in current state." },
      { status: 400 },
    );
  }

  const updated = await updateOrder(orderId, (current) =>
    pushStatus(current, "cancelled", "Order cancelled by customer"),
  );

  return NextResponse.json({
    ok: true,
    order: {
      id: updated?.id,
      status: updated?.status,
    },
  });
}
