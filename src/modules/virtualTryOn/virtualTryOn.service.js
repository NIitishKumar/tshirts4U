import OpenAI from "openai";
import { toFile } from "openai/uploads";
import Replicate from "replicate";
import sharp from "sharp";
import {
  DEFAULT_REPLICATE_TRYON_MODEL,
  INPAINT_SIZE,
} from "../../config/constants.js";
import { openAiKey } from "../../utils/openaiKeys.js";
import { isReplicateInsufficientCredit } from "../../utils/replicateCredit.js";
import {
  buildTorsoEditMask,
  compositeOriginalFaceBand,
  extractOpenAiImageResult,
  jpegDataUrlToBuffer,
  tryOnResultToBuffer,
} from "../../utils/imageTryOn.js";

export async function runReplicateTryOn(params) {
  const token = process.env.REPLICATE_API_TOKEN?.trim();
  if (!token) {
    throw new Error("REPLICATE_API_TOKEN is not set.");
  }
  const replicate = new Replicate({ auth: token });
  const model =
    process.env.REPLICATE_TRYON_MODEL || DEFAULT_REPLICATE_TRYON_MODEL;

  const output = await replicate.run(model, {
    input: {
      human_img: params.humanDataUrl,
      garm_img: params.garmentImageUrl,
      garment_des: params.garmentDescription,
      category: "upper_body",
      crop: true,
    },
  });

  const resultUrl =
    typeof output === "string"
      ? output
      : Array.isArray(output) && typeof output[0] === "string"
        ? output[0]
        : null;

  if (!resultUrl) {
    throw new Error("Replicate returned an unexpected output shape.");
  }
  return resultUrl;
}

async function describeGarmentForEdit(
  openai,
  garmentImageUrl,
  garmentDescription,
) {
  const garmentVision = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Describe this garment in detail for a photo edit (one paragraph): colors, fit, neckline, sleeve length, fabric texture, hems, and any print or logo. Product label: ${garmentDescription}`,
          },
          { type: "image_url", image_url: { url: garmentImageUrl } },
        ],
      },
    ],
    max_tokens: 400,
  });
  const text =
    garmentVision.choices[0]?.message?.content?.trim() ?? garmentDescription;
  return text.slice(0, 2000);
}

async function runOpenAiGenerateLegacy(openai, params) {
  const vision = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      {
        role: "user",
        content: [
          {
            type: "text",
            text: `Virtual apparel preview. Image 1: shopper webcam (upper body). Image 2: product garment.

Two lines only:
Garment: describe image 2 (fit, color, neckline, graphics).
Scene: pose/framing from image 1 only — no identity.

Context: ${params.garmentDescription}`,
          },
          { type: "image_url", image_url: { url: params.humanDataUrl } },
          { type: "image_url", image_url: { url: params.garmentImageUrl } },
        ],
      },
    ],
    max_tokens: 350,
  });
  const summary = vision.choices[0]?.message?.content?.trim() ?? "";
  if (!summary) {
    throw new Error("OpenAI vision returned no description.");
  }
  const imageModel = process.env.OPENAI_IMAGE_MODEL?.trim() || "dall-e-3";
  const prompt = `Professional fashion e-commerce photo, upper body, front view, one adult model, modest styling. Match this brief: ${summary.slice(0, 900)}. Clean neutral studio background, soft light, sharp focus on the shirt. Photorealistic catalog style.`;
  const img = await openai.images.generate({
    model: imageModel,
    prompt,
    size: "1024x1024",
    quality: "standard",
    n: 1,
  });
  return extractOpenAiImageResult(img);
}

async function runOpenAiInpaintTryOn(openai, params, garmentDetail) {
  const jpegBuf = jpegDataUrlToBuffer(params.humanDataUrl);
  const userPng = await sharp(jpegBuf)
    .resize(INPAINT_SIZE, INPAINT_SIZE, {
      fit: "cover",
      position: "centre",
    })
    .png()
    .toBuffer();

  const maskPng = await buildTorsoEditMask(INPAINT_SIZE, INPAINT_SIZE);

  const editPrompt =
    `Replace ONLY the clothing inside the transparent mask region on this person's torso with a shirt that matches this product description exactly: ${garmentDetail}\n\n` +
    `Keep the same real person: preserve face, hair, skin, arms, hands, neck, background, lighting, and camera angle. Do not replace the person with a stock model. Photorealistic fabric and seams.`;

  const preferred =
    process.env.OPENAI_IMAGE_EDIT_MODEL?.trim() || "gpt-image-1.5";
  const fallbacks = ["gpt-image-1.5", "gpt-image-1", "gpt-image-1-mini"].filter(
    (m, i, a) => a.indexOf(m) === i,
  );
  const tryModels = [preferred, ...fallbacks.filter((m) => m !== preferred)];

  const skipFaceRestore =
    process.env.OPENAI_TRYON_SKIP_FACE_RESTORE?.trim() === "1";
  const faceBandRatio = Number(
    process.env.OPENAI_TRYON_FACE_BAND_RATIO ?? "0.44",
  );

  let lastErr;
  for (const model of tryModels) {
    try {
      const editPayload = {
        model,
        image: await toFile(userPng, "capture.png", { type: "image/png" }),
        mask: await toFile(maskPng, "mask.png", { type: "image/png" }),
        prompt: editPrompt.slice(0, 32000),
        size: "1024x1024",
      };
      if (!model.includes("mini")) {
        editPayload.input_fidelity = "high";
      }
      const img = await openai.images.edit(editPayload);
      const raw = extractOpenAiImageResult(img);
      if (skipFaceRestore) {
        return raw;
      }
      const editedBuf = await tryOnResultToBuffer(raw);
      const editedSized = await sharp(editedBuf)
        .resize(INPAINT_SIZE, INPAINT_SIZE, { fit: "cover", position: "centre" })
        .png()
        .toBuffer();
      const restored = await compositeOriginalFaceBand(
        editedSized,
        userPng,
        Number.isFinite(faceBandRatio) ? faceBandRatio : 0.44,
      );
      return `data:image/png;base64,${restored.toString("base64")}`;
    } catch (e) {
      lastErr = e;
    }
  }
  throw lastErr instanceof Error
    ? lastErr
    : new Error("OpenAI image edit failed for all models.");
}

async function runOpenAiTryOn(params) {
  const key = openAiKey();
  if (!key) {
    throw new Error(
      "OPENAI_API_KEY is not set. Put it in api-server/.env (or root .env) and restart the api-server.",
    );
  }
  const openai = new OpenAI({ apiKey: key });
  const mode = (process.env.OPENAI_TRYON_MODE ?? "inpaint").toLowerCase();

  const garmentDetail = await describeGarmentForEdit(
    openai,
    params.garmentImageUrl,
    params.garmentDescription,
  );

  if (mode === "generate") {
    const resultUrl = await runOpenAiGenerateLegacy(openai, params);
    return { resultUrl, mode: "generate" };
  }

  try {
    const resultUrl = await runOpenAiInpaintTryOn(
      openai,
      params,
      garmentDetail,
    );
    return { resultUrl, mode: "inpaint" };
  } catch (e) {
    if (process.env.OPENAI_TRYON_FALLBACK_GENERATE === "1") {
      console.warn(
        "OpenAI inpaint failed, using OPENAI_TRYON_FALLBACK_GENERATE:",
        e,
      );
      const resultUrl = await runOpenAiGenerateLegacy(openai, params);
      return { resultUrl, mode: "generate" };
    }
    throw e;
  }
}

function resolveEngine() {
  let rawEngine = (process.env.TRY_ON_ENGINE ?? "auto").toLowerCase();
  if (!["replicate", "openai", "auto"].includes(rawEngine)) {
    rawEngine = "auto";
  }
  const hasRep = Boolean(process.env.REPLICATE_API_TOKEN?.trim());
  const hasOpenAI = Boolean(openAiKey());

  let engine = rawEngine;
  if (engine === "auto") {
    if (hasRep && hasOpenAI) engine = "replicate_then_openai";
    else if (hasRep) engine = "replicate";
    else if (hasOpenAI) engine = "openai";
    else engine = "none";
  }
  return { engine, hasRep, hasOpenAI };
}

/**
 * @returns {Promise<{ statusCode?: number, body: object }>}
 */
export async function runVirtualTryOn({
  humanDataUrl,
  garmentImageUrl,
  garmentDescription,
}) {
  const { engine, hasRep, hasOpenAI } = resolveEngine();

  if (engine === "none") {
    return {
      statusCode: 503,
      body: {
        ok: false,
        error:
          "Set REPLICATE_API_TOKEN and/or OPENAI_API_KEY in the api-server environment.",
      },
    };
  }

  if (engine === "openai") {
    if (!hasOpenAI) {
      return {
        statusCode: 503,
        body: {
          ok: false,
          error: "TRY_ON_ENGINE=openai requires OPENAI_API_KEY.",
        },
      };
    }
    const { resultUrl, mode } = await runOpenAiTryOn({
      humanDataUrl,
      garmentImageUrl,
      garmentDescription,
    });
    return {
      body: {
        ok: true,
        status: mode === "inpaint" ? "openai_inpaint" : "openai_generate",
        engine: "openai",
        resultUrl,
        privacy:
          mode === "inpaint"
            ? "Your snapshot was sent to OpenAI for masked inpainting (same person, torso clothing updated). Review OpenAI’s policies."
            : "Photos were sent to OpenAI (vision + image generation). Review OpenAI’s policies.",
      },
    };
  }

  if (engine === "replicate") {
    if (!hasRep) {
      return {
        statusCode: 503,
        body: {
          ok: false,
          error: "TRY_ON_ENGINE=replicate requires REPLICATE_API_TOKEN.",
        },
      };
    }
    const resultUrl = await runReplicateTryOn({
      humanDataUrl,
      garmentImageUrl,
      garmentDescription,
    });
    return {
      body: {
        ok: true,
        status: "complete",
        engine: "replicate",
        resultUrl,
        privacy:
          "Image was sent to Replicate for inference. Review Replicate’s data handling and your privacy policy.",
      },
    };
  }

  if (!hasRep) {
    if (!hasOpenAI) {
      return {
        statusCode: 503,
        body: {
          ok: false,
          error: "No REPLICATE_API_TOKEN and no OPENAI_API_KEY.",
        },
      };
    }
    const { resultUrl, mode } = await runOpenAiTryOn({
      humanDataUrl,
      garmentImageUrl,
      garmentDescription,
    });
    return {
      body: {
        ok: true,
        status: mode === "inpaint" ? "openai_inpaint" : "openai_generate",
        engine: "openai",
        resultUrl,
        privacy:
          mode === "inpaint"
            ? "Your snapshot was sent to OpenAI for masked inpainting. Review OpenAI’s policies."
            : "Photos were sent to OpenAI (vision + image generation). Review OpenAI’s policies.",
      },
    };
  }

  try {
    const resultUrl = await runReplicateTryOn({
      humanDataUrl,
      garmentImageUrl,
      garmentDescription,
    });
    return {
      body: {
        ok: true,
        status: "complete",
        engine: "replicate",
        resultUrl,
        privacy:
          "Image was sent to Replicate for inference. Review Replicate’s data handling.",
      },
    };
  } catch (e) {
    console.error(e);
    if (
      isReplicateInsufficientCredit(e) &&
      hasOpenAI &&
      engine === "replicate_then_openai"
    ) {
      const { resultUrl, mode } = await runOpenAiTryOn({
        humanDataUrl,
        garmentImageUrl,
        garmentDescription,
      });
      return {
        body: {
          ok: true,
          status: mode === "inpaint" ? "openai_inpaint" : "openai_generate",
          engine: "openai_fallback",
          resultUrl,
          privacy:
            mode === "inpaint"
              ? "Replicate had insufficient credit; OpenAI inpainted your capture instead (torso mask, same person)."
              : "Replicate had insufficient credit; OpenAI used text-to-image instead.",
        },
      };
    }
    throw e;
  }
}
