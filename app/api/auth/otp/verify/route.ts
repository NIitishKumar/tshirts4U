import { NextResponse } from "next/server";
import { setAuthSessionCookie } from "@/lib/auth-session";
import { verifyOtpChallenge } from "@/lib/otp-store";
import { upsertUserByEmailPhone } from "@/lib/user-store";
import type { OtpChannel } from "@/lib/auth-types";

export const runtime = "nodejs";

interface Payload {
  email: string;
  phone: string;
  channel: OtpChannel;
  identifier: string;
  challengeId: string;
  code: string;
}

export async function POST(request: Request) {
  try {
    let payload: Payload;
    try {
      payload = (await request.json()) as Payload;
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
    }

    const email = payload?.email?.trim().toLowerCase() ?? "";
    const phone = payload?.phone?.trim() ?? "";
    const channel = payload?.channel;
    const identifier = payload?.identifier?.trim() ?? "";
    const challengeId = payload?.challengeId?.trim() ?? "";
    const code = payload?.code?.trim() ?? "";

    if (!email || !phone || !channel || !identifier || !challengeId || !code) {
      return NextResponse.json(
        { ok: false, error: "Missing OTP verification fields." },
        { status: 400 },
      );
    }

    const result = await verifyOtpChallenge({ challengeId, identifier, code });
    if (!result.ok) {
      return NextResponse.json({ ok: false, error: result.reason }, { status: 400 });
    }

    const user = await upsertUserByEmailPhone(email, phone);
    const response = NextResponse.json({
      ok: true,
      user: {
        id: user.id,
        email: user.email,
        phone: user.phone,
      },
    });
    await setAuthSessionCookie(response, {
      userId: user.id,
      email: user.email,
      phone: user.phone,
    });
    return response;
  } catch (e: unknown) {
    const message =
      e instanceof Error ? e.message : "OTP verification could not complete.";
    const isConfig =
      message.includes("AUTH_JWT_SECRET") || message.includes("not configured");
    return NextResponse.json(
      {
        ok: false,
        error: isConfig
          ? "Server auth is not configured. Set AUTH_JWT_SECRET in .env and restart."
          : message,
      },
      { status: 500 },
    );
  }
}
