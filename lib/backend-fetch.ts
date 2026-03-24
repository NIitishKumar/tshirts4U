import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { getBackendBaseUrl, joinBackendUrl } from "@/lib/backend-config";

const HOP_BY_HOP = new Set([
  "connection",
  "keep-alive",
  "transfer-encoding",
  "proxy-authenticate",
  "proxy-authorization",
  "te",
  "trailer",
  "upgrade",
]);

export function filterForwardResponseHeaders(upstream: Response): Headers {
  const out = new Headers();
  upstream.headers.forEach((value, key) => {
    if (!HOP_BY_HOP.has(key.toLowerCase())) {
      out.append(key, value);
    }
  });
  return out;
}

export function upstreamToNextResponse(upstream: Response): NextResponse {
  return new NextResponse(upstream.body, {
    status: upstream.status,
    statusText: upstream.statusText,
    headers: filterForwardResponseHeaders(upstream),
  });
}

/** If a backend base URL is configured, proxy and return a NextResponse; otherwise null. */
export async function tryBackendProxy(
  incomingRequest: Request,
  options?: { timeoutMs?: number },
): Promise<NextResponse | null> {
  const upstream = await passThroughToBackend(incomingRequest, options);
  if (!upstream) return null;
  return upstreamToNextResponse(upstream);
}

function forwardRequestHeaders(incoming: Request, extra?: HeadersInit): Headers {
  const headers = new Headers(extra);
  const cookie = incoming.headers.get("cookie");
  if (cookie && !headers.has("cookie")) headers.set("cookie", cookie);
  const authorization = incoming.headers.get("authorization");
  if (authorization && !headers.has("authorization")) {
    headers.set("authorization", authorization);
  }
  const accept = incoming.headers.get("accept");
  if (accept && !headers.has("accept")) headers.set("accept", accept);
  return headers;
}

/**
 * Proxy the incoming request to the same pathname + query on the backend (e.g. /api/orders).
 */
export async function passThroughToBackend(
  incomingRequest: Request,
  options?: { timeoutMs?: number },
): Promise<Response | null> {
  const base = getBackendBaseUrl();
  if (!base) return null;

  const { pathname, search } = new URL(incomingRequest.url);
  const target = joinBackendUrl(base, `${pathname}${search}`);
  const method = incomingRequest.method;
  const headers = forwardRequestHeaders(incomingRequest);
  const contentType = incomingRequest.headers.get("content-type");
  if (contentType && !headers.has("content-type")) {
    headers.set("content-type", contentType);
  }

  const body =
    method !== "GET" && method !== "HEAD" ? incomingRequest.body : undefined;

  return fetch(target, {
    method,
    headers,
    body,
    duplex: body ? "half" : undefined,
    signal: AbortSignal.timeout(options?.timeoutMs ?? 60_000),
  } as RequestInit);
}

/**
 * POST JSON to a backend path; forwards cookies from the browser request.
 */
export async function backendPostJson(
  incomingRequest: Request,
  backendPath: string,
  body: unknown,
  options?: { timeoutMs?: number },
): Promise<Response> {
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error("backendPostJson requires BACKEND_BASE_URL or BASE_URL");
  }
  const url = joinBackendUrl(base, backendPath);
  const headers = forwardRequestHeaders(incomingRequest, {
    "Content-Type": "application/json",
  });

  return fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(body),
    signal: AbortSignal.timeout(options?.timeoutMs ?? 60_000),
  });
}

/**
 * POST multipart to the backend (after Next has validated / built FormData).
 */
export async function backendPostFormData(
  incomingRequest: Request,
  backendPath: string,
  formData: FormData,
  options?: { timeoutMs?: number },
): Promise<Response> {
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error("backendPostFormData requires BACKEND_BASE_URL or BASE_URL");
  }
  const url = joinBackendUrl(base, backendPath);
  const headers = forwardRequestHeaders(incomingRequest);

  return fetch(url, {
    method: "POST",
    headers,
    body: formData,
    signal: AbortSignal.timeout(options?.timeoutMs ?? 110_000),
  });
}

/** Build a Cookie header for server components / server actions. */
export async function cookieHeaderFromStore(): Promise<string | undefined> {
  const store = await cookies();
  const parts = store.getAll().map((c) => `${c.name}=${c.value}`);
  return parts.length > 0 ? parts.join("; ") : undefined;
}

/**
 * GET a backend path from server code (RSC), forwarding the user’s cookies.
 */
export async function backendGetServer(
  pathWithQuery: string,
  options?: { timeoutMs?: number },
): Promise<Response> {
  const base = getBackendBaseUrl();
  if (!base) {
    throw new Error("backendGetServer requires BACKEND_BASE_URL or BASE_URL");
  }
  const url = joinBackendUrl(base, pathWithQuery);
  const cookie = await cookieHeaderFromStore();
  const headers = new Headers();
  if (cookie) headers.set("cookie", cookie);

  return fetch(url, {
    method: "GET",
    headers,
    signal: AbortSignal.timeout(options?.timeoutMs ?? 60_000),
  });
}
