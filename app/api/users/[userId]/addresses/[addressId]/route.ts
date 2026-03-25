import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import {
  deleteAddressForUser,
  updateAddressForUser,
} from "@/lib/address-store";
import type { EditAddressPayload } from "@/lib/address-types";

export const runtime = "nodejs";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

async function resolveParams(
  params:
    | { userId: string; addressId: string }
    | Promise<{ userId: string; addressId: string }>,
): Promise<{ userId: string; addressId: string }> {
  const maybeThen = (params as { then?: unknown }).then;
  if (typeof maybeThen === "function") return await params;
  return params;
}

function parseFiniteNumber(v: unknown): number | null {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim().length > 0) {
    const n = Number(v);
    if (Number.isFinite(n)) return n;
  }
  return null;
}

function validateEditPayload(body: unknown): EditAddressPayload | null {
  const b = body as Record<string, unknown> | null | undefined;
  if (!b) return null;

  const out: EditAddressPayload = {};

  if (b.firstName !== undefined) {
    if (!isNonEmptyString(b.firstName)) return null;
    out.firstName = b.firstName.trim();
  }
  if (b.lastName !== undefined) {
    if (!isNonEmptyString(b.lastName)) return null;
    out.lastName = b.lastName.trim();
  }
  if (b.phone !== undefined) {
    if (!isNonEmptyString(b.phone)) return null;
    out.phone = b.phone.trim();
  }
  if (b.address !== undefined) {
    if (!isNonEmptyString(b.address)) return null;
    out.address = b.address.trim();
  }
  if (b.city !== undefined) {
    if (!isNonEmptyString(b.city)) return null;
    out.city = b.city.trim();
  }
  if (b.state !== undefined) {
    if (!isNonEmptyString(b.state)) return null;
    out.state = b.state.trim();
  }
  if (b.country !== undefined) {
    if (!isNonEmptyString(b.country)) return null;
    out.country = b.country.trim();
  }
  if (b.postalCode !== undefined) {
    if (!isNonEmptyString(b.postalCode)) return null;
    out.postalCode = b.postalCode.trim();
  }

  if (b.latitude !== undefined) {
    const lat = parseFiniteNumber(b.latitude);
    if (lat == null) return null;
    out.latitude = lat;
  }
  if (b.longitude !== undefined) {
    const lng = parseFiniteNumber(b.longitude);
    if (lng == null) return null;
    out.longitude = lng;
  }

  if (Object.keys(out).length === 0) return null;
  return out;
}

export async function PUT(
  request: Request,
  context: {
    params:
      | { userId: string; addressId: string }
      | Promise<{ userId: string; addressId: string }>;
  },
) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { userId, addressId } = await resolveParams(context.params);
  if (session.userId !== userId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = validateEditPayload(body);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Invalid payload for edit address." },
      { status: 400 },
    );
  }

  const address = await updateAddressForUser(userId, addressId, payload);
  if (!address) return NextResponse.json({ ok: false, error: "Address not found." }, { status: 404 });

  return NextResponse.json({ ok: true, address });
}

export async function DELETE(
  _request: Request,
  context: {
    params:
      | { userId: string; addressId: string }
      | Promise<{ userId: string; addressId: string }>;
  },
) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { userId, addressId } = await resolveParams(context.params);
  if (session.userId !== userId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const addresses = await deleteAddressForUser(userId, addressId);
  return NextResponse.json({ ok: true, addresses });
}

