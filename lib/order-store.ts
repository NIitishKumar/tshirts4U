import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Order, OrderStatus, TrackingEvent } from "@/lib/order-types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "orders.json");

interface StoreShape {
  orders: Order[];
}

function nowIso() {
  return new Date().toISOString();
}

function createEvent(status: OrderStatus, note?: string): TrackingEvent {
  return {
    status,
    label: status.replaceAll("_", " "),
    at: nowIso(),
    note,
  };
}

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    const init: StoreShape = { orders: [] };
    await writeFile(DATA_FILE, JSON.stringify(init, null, 2), "utf8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStoreFile();
  const raw = await readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw) as StoreShape;
  } catch {
    return { orders: [] };
  }
}

async function writeStore(next: StoreShape) {
  await ensureStoreFile();
  const tempFile = `${DATA_FILE}.${randomUUID()}.tmp`;
  await writeFile(tempFile, JSON.stringify(next, null, 2), "utf8");
  await rename(tempFile, DATA_FILE);
}

function makeOrderId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomUUID().slice(0, 8).toUpperCase();
  return `ORD-${stamp}-${rand}`;
}

export function canCancelOrder(order: Order): boolean {
  return !["shipped", "delivered", "cancelled"].includes(order.status);
}

export async function createOrder(
  draft: Omit<Order, "id" | "createdAt" | "updatedAt" | "statusHistory" | "shipment">,
): Promise<Order> {
  const store = await readStore();
  const firstEvent = createEvent(draft.status, "Order created");
  const created: Order = {
    ...draft,
    id: makeOrderId(),
    createdAt: nowIso(),
    updatedAt: nowIso(),
    shipment: {
      carrier: null,
      trackingNumber: null,
      trackingUrl: null,
      events: [],
    },
    statusHistory: [firstEvent],
  };
  store.orders.unshift(created);
  await writeStore(store);
  return created;
}

export async function getOrder(orderId: string): Promise<Order | null> {
  const store = await readStore();
  return store.orders.find((o) => o.id === orderId) ?? null;
}

export async function updateOrder(
  orderId: string,
  update: (current: Order) => Order,
): Promise<Order | null> {
  const store = await readStore();
  const idx = store.orders.findIndex((o) => o.id === orderId);
  if (idx < 0) return null;
  const current = store.orders[idx];
  const next = update(current);
  next.updatedAt = nowIso();
  store.orders[idx] = next;
  await writeStore(store);
  return next;
}

export function pushStatus(
  order: Order,
  status: OrderStatus,
  note?: string,
): Order {
  const event = createEvent(status, note);
  const next = {
    ...order,
    status,
    statusHistory: [...order.statusHistory, event],
  };
  if (status === "shipped" || status === "delivered") {
    next.shipment = {
      ...next.shipment,
      events: [...next.shipment.events, event],
    };
  }
  return next;
}
