import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { Address, CreateAddressPayload, EditAddressPayload } from "@/lib/address-types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "addresses.json");

interface StoreShape {
  // Stored shape may be missing newer fields in existing JSON.
  addresses: Array<{ userId: string } & Partial<Address>>;
}

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    const init: StoreShape = { addresses: [] };
    await writeFile(DATA_FILE, JSON.stringify(init, null, 2), "utf8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStoreFile();
  const raw = await readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw) as StoreShape;
  } catch {
    return { addresses: [] };
  }
}

async function writeStore(next: StoreShape) {
  await ensureStoreFile();
  const tempFile = `${DATA_FILE}.${randomUUID()}.tmp`;
  await writeFile(tempFile, JSON.stringify(next, null, 2), "utf8");
  await rename(tempFile, DATA_FILE);
}

function makeAddressId() {
  const stamp = Date.now().toString(36).toUpperCase();
  const rand = randomUUID().slice(0, 8).toUpperCase();
  return `ADR-${stamp}-${rand}`;
}

export async function getAddressesByUserId(userId: string): Promise<Address[]> {
  const store = await readStore();
  return store.addresses
    .filter((a) => a.userId === userId)
    .map((a) => {
      const { userId: _userId, ...rest } = a as typeof a & { userId: string };
      void _userId;
      const normalized: Address = {
        _id: String(rest._id ?? ""),
        firstName: String(rest.firstName ?? ""),
        lastName: String(rest.lastName ?? ""),
        phone: String(rest.phone ?? ""),
        address: String(rest.address ?? ""),
        city: String(rest.city ?? ""),
        state: String(rest.state ?? ""),
        country: String(rest.country ?? ""),
        postalCode: String(rest.postalCode ?? ""),
        latitude: typeof rest.latitude === "number" ? rest.latitude : Number(rest.latitude ?? 0),
        longitude:
          typeof rest.longitude === "number"
            ? rest.longitude
            : Number(rest.longitude ?? 0),
      };
      return normalized;
    })
    .filter((a) => a._id.length > 0);
}

export async function createAddressForUser(
  userId: string,
  payload: CreateAddressPayload,
): Promise<Address> {
  const store = await readStore();
  const created: Address = {
    ...payload,
    _id: makeAddressId(),
  };

  store.addresses.unshift({ userId, ...created });
  await writeStore(store);
  return created;
}

export async function updateAddressForUser(
  userId: string,
  addressId: string,
  payload: EditAddressPayload,
): Promise<Address | null> {
  const store = await readStore();
  const idx = store.addresses.findIndex((a) => a.userId === userId && a._id === addressId);
  if (idx < 0) return null;

  const current = store.addresses[idx];

  const next: Address = {
    _id: String(current._id ?? addressId),
    firstName: String(payload.firstName ?? current.firstName ?? ""),
    lastName: String(payload.lastName ?? current.lastName ?? ""),
    phone: String(payload.phone ?? current.phone ?? ""),
    address: String(payload.address ?? current.address ?? ""),
    city: String(payload.city ?? current.city ?? ""),
    state: String(payload.state ?? current.state ?? ""),
    country: String(payload.country ?? current.country ?? ""),
    postalCode: String(payload.postalCode ?? current.postalCode ?? ""),
    latitude:
      payload.latitude ?? current.latitude ?? 0,
    longitude:
      payload.longitude ?? current.longitude ?? 0,
  };

  store.addresses[idx] = { userId, ...next };
  await writeStore(store);
  return next;
}

export async function deleteAddressForUser(
  userId: string,
  addressId: string,
): Promise<Address[]> {
  const store = await readStore();
  const nextStore: StoreShape = {
    addresses: store.addresses.filter((a) => !(a.userId === userId && a._id === addressId)),
  };
  await writeStore(nextStore);
  return nextStore.addresses
    .filter((a) => a.userId === userId)
    .map((a) => {
      const { userId: _userId, ...rest } = a as typeof a & { userId: string };
      void _userId;
      const normalized: Address = {
        _id: String(rest._id ?? ""),
        firstName: String(rest.firstName ?? ""),
        lastName: String(rest.lastName ?? ""),
        phone: String(rest.phone ?? ""),
        address: String(rest.address ?? ""),
        city: String(rest.city ?? ""),
        state: String(rest.state ?? ""),
        country: String(rest.country ?? ""),
        postalCode: String(rest.postalCode ?? ""),
        latitude: typeof rest.latitude === "number" ? rest.latitude : Number(rest.latitude ?? 0),
        longitude:
          typeof rest.longitude === "number"
            ? rest.longitude
            : Number(rest.longitude ?? 0),
      };
      return normalized;
    });
}

