/**
 * External API server (e.g. http://127.0.0.1:3847).
 * Prefer BACKEND_BASE_URL; BASE_URL is supported for convenience (ensure it is not your site origin).
 */

export function getBackendBaseUrl(): string | null {
  const base =
    process.env.BACKEND_BASE_URL?.trim() ||
    process.env.BASE_URL?.trim() ||
    process.env.AUTH_BACKEND_BASE_URL?.trim() ||
    process.env.LOGIN_API_BASE_URL?.trim();
  return base ? base.replace(/\/$/, "") : null;
}

export function joinBackendUrl(base: string, path: string): string {
  const p = path.startsWith("/") ? path : `/${path}`;
  return `${base.replace(/\/$/, "")}${p}`;
}

/** Backend path for OTP send (defaults to mirroring this app’s route). */
export function getBackendPathOtpSend(): string {
  return (
    process.env.BACKEND_PATH_OTP_SEND?.trim() ||
    process.env.AUTH_BACKEND_OTP_SEND_PATH?.trim() ||
    "/api/auth/otp/send"
  );
}

/**
 * Backend path for OTP verify. When a backend base URL is set, defaults to /api/auth/otp/verify.
 */
export function getBackendPathOtpVerify(): string {
  const explicit =
    process.env.BACKEND_PATH_OTP_VERIFY?.trim() ||
    process.env.AUTH_BACKEND_OTP_VERIFY_PATH?.trim();
  if (explicit) return explicit;
  return getBackendBaseUrl() ? "/api/auth/otp/verify" : "";
}

export function getBackendPathVirtualTryOn(): string {
  return process.env.BACKEND_PATH_VIRTUAL_TRY_ON?.trim() || "/api/virtual-try-on";
}
