import { runVirtualTryOn } from "./virtualTryOn.service.js";
import {
  parseGarmentDescription,
  validateGarmentImageUrl,
} from "./virtualTryOn.validation.js";

export async function postVirtualTryOn(req, res) {
  try {
    if (!req.file?.buffer?.length) {
      res.status(400).json({ ok: false, error: "Missing photo." });
      return;
    }

    const garmentCheck = validateGarmentImageUrl(req.body.garmentImageUrl);
    if (!garmentCheck.ok) {
      res.status(400).json({ ok: false, error: garmentCheck.error });
      return;
    }

    const garmentDescription = parseGarmentDescription(req.body);
    const humanDataUrl = `data:image/jpeg;base64,${req.file.buffer.toString("base64")}`;

    const result = await runVirtualTryOn({
      humanDataUrl,
      garmentImageUrl: garmentCheck.value,
      garmentDescription,
    });

    if (result.statusCode) {
      res.status(result.statusCode).json(result.body);
      return;
    }
    res.json(result.body);
  } catch (e) {
    const message = e instanceof Error ? e.message : "Try-on failed.";
    console.error(message);
    res.status(500).json({ ok: false, error: message });
  }
}

export function getHealth(_req, res) {
  res.json({ ok: true, service: "virtual-try-on" });
}
