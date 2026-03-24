import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/auth-session";
import { getOrder, updateOrder } from "@/lib/order-store";
import { getRazorpayClient, getRazorpayPublicKey } from "@/lib/razorpay";

export const runtime = "nodejs";

interface CreateRazorpayPayload {
  orderId: string;
  method: "card" | "upi";
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAuthSession();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let payload: CreateRazorpayPayload;
  try {
    payload = (await request.json()) as CreateRazorpayPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (!payload?.orderId || !payload?.method) {
    return NextResponse.json(
      { ok: false, error: "orderId and method are required." },
      { status: 400 },
    );
  }

  if (!["card", "upi"].includes(payload.method)) {
    return NextResponse.json({ ok: false, error: "Unsupported payment method." }, { status: 400 });
  }

  const order = await getOrder(payload.orderId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }
  if (order.userId !== session.userId) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  if (order.status === "cancelled" || order.status === "delivered") {
    return NextResponse.json({ ok: false, error: "Order is not payable." }, { status: 400 });
  }

  try {
    const client = getRazorpayClient();
    const rzOrder = await client.orders.create({
      amount: Math.round(order.total * 100),
      currency: "INR",
      receipt: order.id,
      notes: { orderId: order.id, method: payload.method },
    });

    await updateOrder(order.id, (current) => ({
      ...current,
      payment: {
        ...current.payment,
        method: payload.method,
        status: "pending",
        amount: current.total,
        currency: "INR",
        razorpayOrderId: rzOrder.id,
      },
    }));

    return NextResponse.json({
      ok: true,
      razorpay: {
        keyId: getRazorpayPublicKey(),
        orderId: rzOrder.id,
        amount: rzOrder.amount,
        currency: rzOrder.currency,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Could not start payment.";
    return NextResponse.json({ ok: false, error: message }, { status: 500 });
  }
}
