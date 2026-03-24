import { createHash, randomUUID } from "node:crypto";
import { mkdir, readFile, rename, writeFile } from "node:fs/promises";
import path from "node:path";
import type { OtpChallenge, OtpChannel } from "@/lib/auth-types";

const DATA_DIR = path.join(process.cwd(), "data");
const DATA_FILE = path.join(DATA_DIR, "otp-challenges.json");

interface StoreShape {
  challenges: OtpChallenge[];
}

const OTP_TTL_MS = 5 * 60 * 1000;
const MAX_ATTEMPTS = 5;

function nowIso() {
  return new Date().toISOString();
}

function hashOtp(raw: string): string {
  return createHash("sha256").update(raw).digest("hex");
}

async function ensureStoreFile() {
  await mkdir(DATA_DIR, { recursive: true });
  try {
    await readFile(DATA_FILE, "utf8");
  } catch {
    await writeFile(DATA_FILE, JSON.stringify({ challenges: [] }, null, 2), "utf8");
  }
}

async function readStore(): Promise<StoreShape> {
  await ensureStoreFile();
  const raw = await readFile(DATA_FILE, "utf8");
  try {
    return JSON.parse(raw) as StoreShape;
  } catch {
    return { challenges: [] };
  }
}

async function writeStore(next: StoreShape) {
  await ensureStoreFile();
  const tempFile = `${DATA_FILE}.${randomUUID()}.tmp`;
  await writeFile(tempFile, JSON.stringify(next, null, 2), "utf8");
  await rename(tempFile, DATA_FILE);
}

function generateOtpCode() {
  return `${Math.floor(100000 + Math.random() * 900000)}`;
}

export async function createOtpChallenge(channel: OtpChannel, identifier: string): Promise<{
  challengeId: string;
  code: string;
  expiresAt: string;
}> {
  const store = await readStore();
  const code = generateOtpCode();
  const challengeId = `OTP-${Date.now().toString(36).toUpperCase()}-${randomUUID().slice(0, 6).toUpperCase()}`;
  const expiresAt = new Date(Date.now() + OTP_TTL_MS).toISOString();

  store.challenges = store.challenges.filter(
    (c) =>
      !(
        c.channel === channel &&
        c.identifier === identifier &&
        c.consumedAt === null &&
        new Date(c.expiresAt).getTime() > Date.now()
      ),
  );

  store.challenges.unshift({
    id: challengeId,
    channel,
    identifier,
    codeHash: hashOtp(code),
    expiresAt,
    consumedAt: null,
    attempts: 0,
    maxAttempts: MAX_ATTEMPTS,
    createdAt: nowIso(),
  });
  await writeStore(store);
  return { challengeId, code, expiresAt };
}

export async function verifyOtpChallenge(params: {
  challengeId: string;
  identifier: string;
  code: string;
}): Promise<{ ok: true } | { ok: false; reason: string }> {
  const store = await readStore();
  const idx = store.challenges.findIndex((c) => c.id === params.challengeId);
  if (idx < 0) return { ok: false, reason: "Challenge not found." };

  const challenge = store.challenges[idx];
  if (challenge.identifier !== params.identifier) {
    return { ok: false, reason: "Identifier mismatch." };
  }
  if (challenge.consumedAt) return { ok: false, reason: "Challenge already used." };
  if (new Date(challenge.expiresAt).getTime() < Date.now()) {
    return { ok: false, reason: "OTP expired." };
  }
  if (challenge.attempts >= challenge.maxAttempts) {
    return { ok: false, reason: "Too many attempts." };
  }

  const expectedHash = hashOtp(params.code);
  if (expectedHash !== challenge.codeHash) {
    challenge.attempts += 1;
    store.challenges[idx] = challenge;
    await writeStore(store);
    return { ok: false, reason: "Invalid OTP code." };
  }

  challenge.consumedAt = nowIso();
  store.challenges[idx] = challenge;
  await writeStore(store);
  return { ok: true };
}
