export function validateCreateUserBody(body) {
  const email = String(body?.email ?? "").trim();
  if (!email) {
    return { ok: false, error: "email is required." };
  }
  return { ok: true, email };
}
