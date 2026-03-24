import crypto from "node:crypto";
import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/auth-session";
import { getOrder, pushStatus, updateOrder } from "@/lib/order-store";
import type { Order } from "@/lib/order-types";

export const runtime = "nodejs";

interface VerifyPayload {
  orderId: string;
  razorpayOrderId: string;
  razorpayPaymentId: string;
  razorpaySignature: string;
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAuthSession();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let payload: VerifyPayload;
  try {
    payload = (await request.json()) as VerifyPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  if (
    !payload?.orderId ||
    !payload?.razorpayOrderId ||
    !payload?.razorpayPaymentId ||
    !payload?.razorpaySignature
  ) {
    return NextResponse.json(
      { ok: false, error: "Missing Razorpay verification fields." },
      { status: 400 },
    );
  }

  const order = await getOrder(payload.orderId);
  if (!order) {
    return NextResponse.json({ ok: false, error: "Order not found." }, { status: 404 });
  }
  if (order.userId !== session.userId) {
    return NextResponse.json({ ok: false, error: "Forbidden." }, { status: 403 });
  }

  const secret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!secret) {
    return NextResponse.json(
      { ok: false, error: "Razorpay secret is not configured." },
      { status: 500 },
    );
  }

  const expected = crypto
    .createHmac("sha256", secret)
    .update(`${payload.razorpayOrderId}|${payload.razorpayPaymentId}`)
    .digest("hex");

  const isDevBypass =
    process.env.NODE_ENV === "development" && payload.razorpaySignature === "dev_signature";
  if (expected !== payload.razorpaySignature && !isDevBypass) {
    return NextResponse.json({ ok: false, error: "Invalid payment signature." }, { status: 400 });
  }

  const updated = await updateOrder(order.id, (current) => {
    let next: Order = {
      ...current,
      payment: {
        ...current.payment,
        status: "paid",
        razorpayOrderId: payload.razorpayOrderId,
        razorpayPaymentId: payload.razorpayPaymentId,
        razorpaySignature: payload.razorpaySignature,
      },
    };
    next = pushStatus(next, "paid", "Online payment received");
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
