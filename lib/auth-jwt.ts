import { SignJWT, jwtVerify } from "jose";
import type { AuthSessionPayload } from "@/lib/auth-types";

const ISSUER = "tshirts4u";
const AUDIENCE = "tshirts4u-web";

function getJwtSecret(): Uint8Array {
  const secret = process.env.AUTH_JWT_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_JWT_SECRET is not configured.");
  }
  return new TextEncoder().encode(secret);
}

export async function signAuthJwt(payload: AuthSessionPayload): Promise<string> {
  return await new SignJWT(payload)
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setIssuer(ISSUER)
    .setAudience(AUDIENCE)
    .setExpirationTime("7d")
    .sign(getJwtSecret());
}

export async function verifyAuthJwt(token: string): Promise<AuthSessionPayload | null> {
  try {
    const verified = await jwtVerify(token, getJwtSecret(), {
      issuer: ISSUER,
      audience: AUDIENCE,
    });
    return verified.payload as unknown as AuthSessionPayload;
  } catch {
    return null;
  }
}
