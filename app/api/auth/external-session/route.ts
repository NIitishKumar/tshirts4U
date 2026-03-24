import { NextResponse } from "next/server";
import { authPayloadFromExternalUser } from "@/lib/map-external-auth-user";
import { setAuthSessionCookie } from "@/lib/auth-session";

export const runtime = "nodejs";

/**
 * After OTP verify against your external API, POST { user } here to set the httpOnly session cookie.
 * Navbar and /api/auth/me use this JWT to treat the user as logged in.
 */
export async function POST(request: Request) {
  let body: { user?: unknown };
  try {
    body = (await request.json()) as { user?: unknown };
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON body." }, { status: 400 });
  }

  const payload = authPayloadFromExternalUser(body.user);
  if (!payload) {
    return NextResponse.json(
      { ok: false, error: "Invalid user: need _id (or id) and phone." },
      { status: 400 },
    );
  }

  try {
    const response = NextResponse.json({
      ok: true,
      user: {
        id: payload.userId,
        email: payload.email,
        phone: payload.phone,
      },
    });
    await setAuthSessionCookie(response, payload);
    return response;
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Could not create session.";
    const isConfig = message.includes("AUTH_JWT_SECRET");
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
