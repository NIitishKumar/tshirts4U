import axios from "axios";

/**
 * Do not throw on 4xx/5xx so callers can read JSON bodies like `{ ok: false, error: "Invalid OTP" }`.
 */
const api = axios.create({
  /**
   * Same-origin `/api/...` so Next.js `rewrites` can proxy to `NEXT_PUBLIC_API_URL` / `BACKEND_URL`.
   * Set one of those env vars to your backend base (e.g. http://127.0.0.1:4000), no trailing slash.
   */
  baseURL: "",
  headers: {
    "Content-Type": "application/json",
  },
  validateStatus: () => true,
});

export function readApiErrorMessage(data: unknown): string | null {
  if (data == null) return null;
  if (typeof data === "string") {
    try {
      const parsed = JSON.parse(data) as { error?: string; message?: string };
      return parsed.error ?? parsed.message ?? null;
    } catch {
      return data.length > 0 ? data.slice(0, 200) : null;
    }
  }
  if (typeof data === "object") {
    const o = data as Record<string, unknown>;
    if (typeof o.error === "string" && o.error) return o.error;
    if (typeof o.message === "string" && o.message) return o.message;
  }
  return null;
}

export default api;
