import { openAiKey } from "../utils/openaiKeys.js";

function maskSecret(value) {
  if (!value) return "(not set)";
  if (value.length <= 14) return "(set)";
  return `${value.slice(0, 7)}…${value.slice(-4)}`;
}

function logListening(port) {
  console.log(`Virtual try-on API listening on http://127.0.0.1:${port}`);
}

function logRegisteredRoutes() {
  const routes = [
    ["POST", "/virtual-try-on", "multipart: photo, garmentImageUrl, …"],
    ["GET", "/health"],
    ["GET", "/api/users"],
    ["POST", "/api/auth/login"],
  ];
  for (const [method, path, hint] of routes) {
    const suffix = hint ? `  (${hint})` : "";
    console.log(`  ${method} ${path}${suffix}`);
  }
}

function logTryOnEnv() {
  console.log(
    `  TRY_ON_ENGINE=${process.env.TRY_ON_ENGINE ?? "auto"} (replicate|openai|auto)`,
  );
  console.log(
    `  OPENAI_API_KEY=${maskSecret(openAiKey())}  REPLICATE_API_TOKEN=${maskSecret(process.env.REPLICATE_API_TOKEN)}`,
  );
  console.log(
    `  OPENAI_TRYON_MODE=${process.env.OPENAI_TRYON_MODE ?? "inpaint"} (inpaint uses your camera frame)`,
  );
}

function warnMissingProviderKeys() {
  if (openAiKey() || process.env.REPLICATE_API_TOKEN?.trim()) return;
  console.warn(
    "  [!] No API keys loaded. Ensure api-server/.env exists and restart after edits.",
  );
}

/** Logged once when HTTP server is accepting connections. */
export function logServerReady(port) {
  logListening(port);
  logRegisteredRoutes();
  logTryOnEnv();
  warnMissingProviderKeys();
}
