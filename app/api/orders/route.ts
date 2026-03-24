import { NextResponse } from "next/server";
import { requireAuthSession } from "@/lib/auth-session";
import { createOrder } from "@/lib/order-store";
import { validateAndBuildOrderItems } from "@/lib/order-pricing";
import type { CreateOrderPayload } from "@/lib/order-types";

export const runtime = "nodejs";

function isBlank(value: string | undefined): boolean {
  return !value || value.trim().length === 0;
}

export async function POST(request: Request) {
  let session;
  try {
    session = await requireAuthSession();
  } catch {
    return NextResponse.json({ ok: false, error: "Unauthorized." }, { status: 401 });
  }

  let payload: CreateOrderPayload;
  try {
    payload = (await request.json()) as CreateOrderPayload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const address = payload.shippingAddress;
  if (
    !address ||
    isBlank(address.firstName) ||
    isBlank(address.lastName) ||
    isBlank(address.address) ||
    isBlank(address.city) ||
    isBlank(address.zipCode) ||
    isBlank(address.email) ||
    isBlank(address.phone)
  ) {
    return NextResponse.json(
      { ok: false, error: "Missing required shipping fields." },
      { status: 400 },
    );
  }

  try {
    const priced = validateAndBuildOrderItems(payload);
    const order = await createOrder({
      userId: session.userId,
      items: priced.items,
      shippingAddress: address,
      subtotal: priced.subtotal,
      shipping: priced.shipping,
      total: priced.total,
      currency: "INR",
      status: "pending_payment",
      payment: {
        method: "card",
        status: "pending",
        amount: priced.total,
        currency: "INR",
      },
    });

    return NextResponse.json({
      ok: true,
      order: {
        id: order.id,
        subtotal: order.subtotal,
        shipping: order.shipping,
        total: order.total,
        currency: order.currency,
        status: order.status,
      },
    });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Could not create order.";
    return NextResponse.json({ ok: false, error: message }, { status: 400 });
  }
}
