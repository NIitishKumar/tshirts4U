import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/auth-session";
import { getOrder } from "@/lib/order-store";

export const runtime = "nodejs";

export async function GET(
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

  return NextResponse.json({ ok: true, order });
}
