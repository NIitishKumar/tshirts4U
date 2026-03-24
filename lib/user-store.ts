import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import { randomUUID } from "node:crypto";
import type { User } from "@/lib/auth-types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "users.json");

interface StoreShape {
  users: User[];
}

function nowIso() {
  return new Date().toISOString();
}

function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

function normalizePhone(phone: string): string {
  return phone.replace(/\s+/g, "").trim();
}

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify({ users: [] }, null, 2), "utf8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStoreFile();
  const raw = await readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw) as StoreShape;
  } catch {
    return { users: [] };
  }
}

async function writeStore(next: StoreShape) {
  await ensureStoreFile();
  const tempFile = `${DATA_FILE}.${randomUUID()}.tmp`;
  await writeFile(tempFile, JSON.stringify(next, null, 2), "utf8");
  await rename(tempFile, DATA_FILE);
}

export async function findUserByEmailOrPhone(
  email: string,
  phone: string,
): Promise<User | null> {
  const store = await readStore();
  const e = normalizeEmail(email);
  const p = normalizePhone(phone);
  return store.users.find((user) => user.email === e || user.phone === p) ?? null;
}

export async function upsertUserByEmailPhone(email: string, phone: string): Promise<User> {
  const store = await readStore();
  const e = normalizeEmail(email);
  const p = normalizePhone(phone);
  const now = nowIso();
  const existingIdx = store.users.findIndex((u) => u.email === e || u.phone === p);
  if (existingIdx >= 0) {
    const current = store.users[existingIdx];
    const next: User = {
      ...current,
      email: e,
      phone: p,
      updatedAt: now,
      lastLoginAt: now,
    };
    store.users[existingIdx] = next;
    await writeStore(store);
    return next;
  }

  const created: User = {
    id: `USR-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 8).toUpperCase()}`,
    email: e,
    phone: p,
    createdAt: now,
    updatedAt: now,
    lastLoginAt: now,
  };
  store.users.unshift(created);
  await writeStore(store);
  return created;
}

export async function getUserById(userId: string): Promise<User | null> {
  const store = await readStore();
  return store.users.find((u) => u.id === userId) ?? null;
}
