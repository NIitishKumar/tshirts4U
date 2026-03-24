import type { AuthSessionPayload } from "@/lib/auth-types";

function stringifyMongoId(id: unknown): string {
  if (typeof id === "string") return id;
  if (
    id &&
    typeof id === "object" &&
    id !== null &&
    "$oid" in id &&
    typeof (id as { $oid: unknown }).$oid === "string"
  ) {
    return (id as { $oid: string }).$oid;
  }
  return "";
}

/**
 * Map your API user (e.g. Mongo) into the JWT session shape.
 */
export function authPayloadFromExternalUser(user: unknown): AuthSessionPayload | null {
  if (!user || typeof user !== "object") return null;
  const u = user as Record<string, unknown>;

  const userId =
    stringifyMongoId(u._id) ||
    (typeof u.id === "string" ? u.id : "") ||
    (typeof u.userId === "string" ? u.userId : "");
  const phone = typeof u.phone === "string" ? u.phone.trim() : "";
  const email = typeof u.email === "string" ? u.email.trim().toLowerCase() : "";

  if (!userId || !phone) return null;

  return {
    userId,
    email: email || "",
    phone,
  };
}
