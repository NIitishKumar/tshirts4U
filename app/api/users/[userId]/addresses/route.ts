import { NextResponse } from "next/server";
import { getAuthSession } from "@/lib/auth-session";
import {
  createAddressForUser,
  getAddressesByUserId,
} from "@/lib/address-store";
import type { CreateAddressPayload } from "@/lib/address-types";

export const runtime = "nodejs";

function isNonEmptyString(v: unknown): v is string {
  return typeof v === "string" && v.trim().length > 0;
}

async function resolveParams(
  params: { userId: string } | Promise<{ userId: string }>,
): Promise<{ userId: string }> {
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

function validateCreatePayload(body: unknown): CreateAddressPayload | null {
  const b = body as Record<string, unknown> | null | undefined;
  if (!b) return null;

  if (
    !isNonEmptyString(b.firstName) ||
    !isNonEmptyString(b.lastName) ||
    !isNonEmptyString(b.phone) ||
    !isNonEmptyString(b.address) ||
    !isNonEmptyString(b.city) ||
    !isNonEmptyString(b.state) ||
    !isNonEmptyString(b.country) ||
    !isNonEmptyString(b.postalCode)
  ) {
    return null;
  }

  const latitude = parseFiniteNumber(b.latitude);
  const longitude = parseFiniteNumber(b.longitude);
  if (latitude == null || longitude == null) return null;

  return {
    firstName: b.firstName.trim(),
    lastName: b.lastName.trim(),
    phone: b.phone.trim(),
    address: b.address.trim(),
    city: b.city.trim(),
    state: b.state.trim(),
    country: b.country.trim(),
    postalCode: b.postalCode.trim(),
    latitude,
    longitude,
  };
}

export async function GET(
  _request: Request,
  context: { params: { userId: string } | Promise<{ userId: string }> },
) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { userId } = await resolveParams(context.params);
  if (session.userId !== userId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  const addresses = await getAddressesByUserId(userId);
  return NextResponse.json({ ok: true, addresses });
}

export async function POST(
  request: Request,
  context: { params: { userId: string } | Promise<{ userId: string }> },
) {
  const session = await getAuthSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const { userId } = await resolveParams(context.params);
  if (session.userId !== userId) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = validateCreatePayload(body);
  if (!payload) {
    return NextResponse.json(
      {
        ok: false,
        error:
          "Invalid payload. Need firstName, lastName, phone, address, city, state, country, postalCode, latitude, longitude.",
      },
      { status: 400 },
    );
  }

  const address = await createAddressForUser(userId, payload);
  return NextResponse.json({ ok: true, address });
}

