import type { Metadata } from "next";
import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getAuthSession } from "@/lib/auth-session";
import { canCancelOrder, getOrder } from "@/lib/order-store";
import OrderActions from "./OrderActions";

export const metadata: Metadata = {
  title: "Order tracking — tshirts4U",
  description: "Track your tshirts4U order status and shipment progress.",
  robots: { index: false, follow: false },
};

export const runtime = "nodejs";

export default async function OrderDetailPage({
  params,
}: {
  params: Promise<{ orderId: string }>;
}) {
  const session = await getAuthSession();
  if (!session) {
    redirect("/login");
  }

  const { orderId } = await params;
  const order = await getOrder(orderId);
  if (!order) notFound();
  if (order.userId !== session.userId) notFound();

  return (
    <div className="mx-auto max-w-4xl px-6 pt-28 pb-24 lg:px-8">
      <div className="rounded-2xl border border-border bg-surface p-6">
        <p className="text-xs uppercase tracking-[0.2em] text-accent">Order</p>
        <h1 className="mt-2 font-display text-3xl uppercase tracking-tight text-foreground">
          {order.id}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Status: <span className="font-semibold text-foreground">{order.status}</span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Payment:{" "}
          <span className="font-semibold text-foreground">
            {order.payment.method} ({order.payment.status})
          </span>
        </p>
        <p className="mt-1 text-sm text-muted-foreground">
          Total: <span className="font-semibold text-foreground">INR {order.total.toFixed(2)}</span>
        </p>

        <OrderActions orderId={order.id} canCancel={canCancelOrder(order)} />
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-xl uppercase tracking-tight text-foreground">
          Tracking timeline
        </h2>
        <div className="mt-4 space-y-3">
          {order.statusHistory.map((event) => (
            <div key={`${event.at}-${event.status}`} className="rounded-xl border border-border p-4">
              <p className="text-sm font-semibold capitalize text-foreground">
                {event.label}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                {new Date(event.at).toLocaleString()}
              </p>
              {event.note ? <p className="mt-2 text-sm text-muted-foreground">{event.note}</p> : null}
            </div>
          ))}
        </div>
      </div>

      <div className="mt-8 rounded-2xl border border-border bg-surface p-6">
        <h2 className="font-display text-xl uppercase tracking-tight text-foreground">
          Items
        </h2>
        <div className="mt-4 space-y-2">
          {order.items.map((item) => (
            <div
              key={`${item.slug}-${item.size}-${item.color}`}
              className="flex justify-between gap-3 text-sm"
            >
              <p className="text-muted-foreground">
                {item.name} ({item.size}, {item.color}) x {item.quantity}
              </p>
              <p className="font-medium text-foreground">INR {item.lineTotal.toFixed(2)}</p>
            </div>
          ))}
        </div>
      </div>

      <Link
        href="/shop"
        className="mt-8 inline-flex rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover"
      >
        Continue shopping
      </Link>
    </div>
  );
}
