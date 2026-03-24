/**
 * Map external OTP API shapes to what the Next.js UI expects.
 */

export function normalizeOtpSendResponseBody(
  data: Record<string, unknown>,
): Record<string, unknown> {
  const out: Record<string, unknown> = { ...data };
  if (typeof out.challengeId !== "string" || !out.challengeId) {
    const alt = out.challenge_id ?? out.id;
    if (typeof alt === "string" && alt) out.challengeId = alt;
  }
  if (typeof out.expiresAt !== "string" || !out.expiresAt) {
    const exp = out.expires_at;
    if (typeof exp === "string" && exp) out.expiresAt = exp;
  }
  return out;
}
