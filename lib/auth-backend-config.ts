/**
 * Auth-related backend paths (delegates to shared backend-config).
 */

import {
  getBackendBaseUrl,
  getBackendPathOtpSend,
  getBackendPathOtpVerify,
  joinBackendUrl,
} from "@/lib/backend-config";

export function getAuthBackendBaseUrl(): string | null {
  return getBackendBaseUrl();
}

export function joinAuthBackendUrl(base: string, path: string): string {
  return joinBackendUrl(base, path);
}

export function getAuthBackendOtpSendPath(): string {
  return getBackendPathOtpSend();
}

export function getAuthBackendOtpVerifyPath(): string {
  return getBackendPathOtpVerify();
}
