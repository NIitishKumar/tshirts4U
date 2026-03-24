import { NextResponse } from "next/server";

export const runtime = "nodejs";
/** Allow slow Replicate runs when this route proxies to the root API server. */
export const maxDuration = 120;

const MAX_BYTES = 6 * 1024 * 1024;

const MULTIPART_HINT =
  "Body must be raw multipart/form-data (binary parts), not a base64 string. From curl use: -F photo=@/path/to.jpg -F garmentImageUrl=... -F productSlug=... -F colorName=... -F garmentDescription=...";

export async function POST(request: Request) {
  let formData: FormData;
  try {
    formData = await request.formData();
  } catch (e) {
    if (process.env.NODE_ENV === "development") {
      console.error("[virtual-try-on] request.formData() failed:", e);
    }
    return NextResponse.json(
      {
        ok: false,
        error: "Invalid form data.",
        hint: MULTIPART_HINT,
      },
      { status: 400 },
    );
  }

  const photo = formData.get("photo");
  if (!(photo instanceof Blob) || photo.size === 0) {
    const photoType = photo === null ? "missing" : typeof photo;
    return NextResponse.json(
      {
        ok: false,
        error: "Missing or empty photo file.",
        hint:
          photo !== null && typeof photo === "string"
            ? "Field photo must be a file upload, not plain text. " + MULTIPART_HINT
            : MULTIPART_HINT,
        debug:
          process.env.NODE_ENV === "development"
            ? { photoField: photoType }
            : undefined,
      },
      { status: 400 },
    );
  }

  if (photo.size > MAX_BYTES) {
    return NextResponse.json(
      { ok: false, error: "Image too large." },
      { status: 413 },
    );
  }

  const providerUrl = process.env.TRY_ON_PROVIDER_URL?.trim();
  if (providerUrl) {
    const forward = new FormData();
    for (const [key, value] of formData.entries()) {
      forward.append(key, value as string | Blob);
    }

    try {
      const upstream = await fetch(providerUrl, {
        method: "POST",
        body: forward,
        signal: AbortSignal.timeout(110_000),
      });
      const body = await upstream.text();
      const contentType =
        upstream.headers.get("Content-Type") ?? "application/json";
      return new NextResponse(body, {
        status: upstream.status,
        headers: { "Content-Type": contentType },
      });
    } catch (e: unknown) {
      const message = e instanceof Error ? e.message : "Unknown error";
      return NextResponse.json(
        {
          ok: false,
          error:
            message.includes("aborted") || message.includes("timeout")
              ? "Try-on request timed out. The model may still be running — try again."
              : "Try-on provider request failed.",
        },
        { status: 502 },
      );
    }
  }

  return NextResponse.json({
    ok: true,
    status: "stub",
    message:
      "No AI image: set TRY_ON_PROVIDER_URL in the project root .env to your virtual try-on service base URL (POST /virtual-try-on with multipart photo + garment fields). Restart Next after editing .env.",
    privacy:
      "Stub mode does not call OpenAI or Replicate.",
  });
}
