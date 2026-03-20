const DEFAULT_SITE_URL = "https://tshirts4u.example";

/** Canonical site origin (no trailing slash). Used for metadata, sitemap, and JSON-LD. */
export function getSiteUrl(): string {
  const raw = process.env.NEXT_PUBLIC_SITE_URL?.trim();
  if (!raw) return DEFAULT_SITE_URL;
  return raw.replace(/\/+$/, "");
}
