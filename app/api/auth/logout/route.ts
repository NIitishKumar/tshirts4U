import { NextResponse } from "next/server";
import { clearAuthSessionCookie } from "@/lib/auth-session";

export const runtime = "nodejs";

export async function POST() {
  const response = NextResponse.json({ ok: true });
  clearAuthSessionCookie(response);
  return response;
}
