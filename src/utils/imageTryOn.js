import sharp from "sharp";
import { INPAINT_SIZE } from "../config/constants.js";

export function jpegDataUrlToBuffer(dataUrl) {
  const m = dataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
  if (!m) {
    throw new Error("Invalid camera image data.");
  }
  return Buffer.from(m[1], "base64");
}

/**
 * PNG mask for images.edit: transparent pixels = edit, opaque = keep.
 */
export async function buildTorsoEditMask(width, height) {
  const cx = width / 2;
  const cy = height * 0.63;
  const rx = width * 0.26;
  const ry = height * 0.175;
  const hole = Buffer.from(
    `<svg width="${width}" height="${height}" xmlns="http://www.w3.org/2000/svg">
      <ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="black"/>
    </svg>`,
  );
  return sharp({
    create: {
      width,
      height,
      channels: 4,
      background: { r: 255, g: 255, b: 255, alpha: 1 },
    },
  })
    .composite([{ input: hole, blend: "dest-out" }])
    .png()
    .toBuffer();
}

export function extractOpenAiImageResult(img) {
  const first = img.data?.[0];
  const url = first?.url;
  const b64 = first?.b64_json;
  if (url) return url;
  if (b64) return `data:image/png;base64,${b64}`;
  throw new Error("OpenAI returned no image URL or b64_json.");
}

export async function tryOnResultToBuffer(urlOrDataUrl) {
  if (urlOrDataUrl.startsWith("data:")) {
    const m = urlOrDataUrl.match(/^data:image\/[^;]+;base64,(.+)$/);
    if (!m) throw new Error("Invalid data URL image from OpenAI.");
    return Buffer.from(m[1], "base64");
  }
  const res = await fetch(urlOrDataUrl);
  if (!res.ok) {
    throw new Error(`Failed to fetch OpenAI image: ${res.status}`);
  }
  return Buffer.from(await res.arrayBuffer());
}

export async function compositeOriginalFaceBand(
  editedPng,
  originalPng,
  bandRatio,
) {
  const w = INPAINT_SIZE;
  const h = INPAINT_SIZE;
  const band = Math.max(
    1,
    Math.min(h - 1, Math.round(h * Math.min(0.55, Math.max(0.28, bandRatio)))),
  );
  const faceStrip = await sharp(originalPng)
    .extract({ left: 0, top: 0, width: w, height: band })
    .png()
    .toBuffer();

  return sharp(editedPng)
    .composite([{ input: faceStrip, left: 0, top: 0, blend: "over" }])
    .png()
    .toBuffer();
}
