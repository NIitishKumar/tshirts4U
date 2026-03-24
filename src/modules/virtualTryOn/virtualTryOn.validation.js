export function parseGarmentDescription(body) {
  return String(
    body?.garmentDescription ?? "Short Sleeve Round Neck T-shirt",
  ).slice(0, 500);
}

export function validateGarmentImageUrl(url) {
  const trimmed = String(url ?? "").trim();
  if (!trimmed.startsWith("https://")) {
    return {
      ok: false,
      error: "garmentImageUrl must be an https URL (e.g. product flat-lay).",
    };
  }
  return { ok: true, value: trimmed };
}
