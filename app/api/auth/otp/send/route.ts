import { NextResponse } from "next/server";
import { createOtpChallenge } from "@/lib/otp-store";
import type { OtpChannel } from "@/lib/auth-types";

export const runtime = "nodejs";

interface Payload {
  channel: OtpChannel;
  identifier: string;
}

function isEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
}

function isPhone(value: string) {
  return /^\+?[0-9]{10,15}$/.test(value);
}

export async function POST(request: Request) {
  let payload: Payload;
  try {
    payload = (await request.json()) as Payload;
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const channel = payload?.channel;
  const identifier = payload?.identifier?.trim() ?? "";
  if (!channel || !identifier || !["email", "phone"].includes(channel)) {
    return NextResponse.json({ ok: false, error: "Invalid OTP request." }, { status: 400 });
  }

  if (channel === "email" && !isEmail(identifier)) {
    return NextResponse.json({ ok: false, error: "Invalid email format." }, { status: 400 });
  }
  if (channel === "phone" && !isPhone(identifier)) {
    return NextResponse.json({ ok: false, error: "Invalid phone format." }, { status: 400 });
  }

  const challenge = await createOtpChallenge(channel, identifier);

  if (process.env.NODE_ENV === "development") {
    console.info(`[otp:${channel}] ${identifier} -> ${challenge.code}`);
  }

  return NextResponse.json({
    ok: true,
    challengeId: challenge.challengeId,
    expiresAt: challenge.expiresAt,
    ...(process.env.NODE_ENV === "development" ? { devCode: challenge.code } : {}),
  });
}
