import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import type { AuthSessionPayload } from "@/lib/auth-types";
import { signAuthJwt, verifyAuthJwt } from "@/lib/auth-jwt";

const AUTH_COOKIE = "t4u_auth";

function cookieOptions() {
  return {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax" as const,
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  };
}

export async function getAuthSession(): Promise<AuthSessionPayload | null> {
  const store = await cookies();
  const token = store.get(AUTH_COOKIE)?.value;
  if (!token) return null;
  return verifyAuthJwt(token);
}

export async function requireAuthSession(): Promise<AuthSessionPayload> {
  const session = await getAuthSession();
  if (!session) {
    throw new Error("Unauthorized");
  }
  return session;
}

export async function setAuthSessionCookie(
  response: NextResponse,
  payload: AuthSessionPayload,
) {
  const token = await signAuthJwt(payload);
  response.cookies.set(AUTH_COOKIE, token, cookieOptions());
}

export function clearAuthSessionCookie(response: NextResponse) {
  response.cookies.set(AUTH_COOKIE, "", { ...cookieOptions(), maxAge: 0 });
}
