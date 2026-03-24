"use client";

import Image from "next/image";
import {
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";
import { Camera, X, Loader2, ImageIcon } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import type { Product, ProductColor } from "@/lib/products";
import {
  resolveGarmentImageForTryOn,
  resolveTryOnOverlay,
} from "@/lib/products";

type CameraError = "denied" | "unavailable" | "insecure" | null;

function mapNormToOverlay(
  lm: { x: number; y: number },
  video: HTMLVideoElement,
  wrap: HTMLElement,
  mirrorX: boolean,
): { x: number; y: number } {
  const vW = video.videoWidth;
  const vH = video.videoHeight;
  const wr = wrap.getBoundingClientRect();
  const vr = video.getBoundingClientRect();
  if (!vW || !vH) return { x: wr.width / 2, y: wr.height / 2 };
  const scale = Math.min(vr.width / vW, vr.height / vH);
  const dw = vW * scale;
  const dh = vH * scale;
  const ox = vr.left - wr.left + (vr.width - dw) / 2;
  const oy = vr.top - wr.top + (vr.height - dh) / 2;
  const nx = mirrorX ? 1 - lm.x : lm.x;
  return {
    x: ox + nx * dw,
    y: oy + lm.y * dh,
  };
}

export default function VirtualTryOn({
  open,
  onClose,
  product,
  selectedColor,
  garmentGalleryIndex,
}: {
  open: boolean;
  onClose: () => void;
  product: Product;
  selectedColor: ProductColor;
  /** Which product.images[] entry is shown in the PDP gallery (must match try-on reference). */
  garmentGalleryIndex: number;
}) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const wrapRef = useRef<HTMLDivElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const rafRef = useRef<number>(0);
  const landmarkerRef = useRef<
    import("@mediapipe/tasks-vision").PoseLandmarker | null
  >(null);

  const [cameraError, setCameraError] = useState<CameraError>(null);
  const [poseEnabled, setPoseEnabled] = useState(true);
  const [poseLoading, setPoseLoading] = useState(false);
  const [overlayStyle, setOverlayStyle] = useState({
    left: "50%",
    top: "42%",
    width: "58%",
    transform: "translate(-50%, -50%) rotate(0deg)",
  });
  const [captureState, setCaptureState] = useState<
    "idle" | "uploading" | "done" | "error"
  >("idle");
  const [captureMessage, setCaptureMessage] = useState<string | null>(null);
  const [resultPreviewUrl, setResultPreviewUrl] = useState<string | null>(null);

  const overlaySrc = resolveTryOnOverlay(product, selectedColor.name);

  const stopCamera = useCallback(() => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    if (videoRef.current) videoRef.current.srcObject = null;
  }, []);

  const stopPose = useCallback(() => {
    cancelAnimationFrame(rafRef.current);
    landmarkerRef.current?.close();
    landmarkerRef.current = null;
    setPoseLoading(false);
  }, []);

  useEffect(() => {
    if (!open) {
      stopCamera();
      stopPose();
      setCameraError(null);
      setCaptureState("idle");
      setCaptureMessage(null);
      setResultPreviewUrl(null);
      setOverlayStyle({
        left: "50%",
        top: "42%",
        width: "58%",
        transform: "translate(-50%, -50%) rotate(0deg)",
      });
      return;
    }

    if (typeof window === "undefined" || !window.isSecureContext) {
      setCameraError("insecure");
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: "user", width: { ideal: 1280 }, height: { ideal: 720 } },
          audio: false,
        });
        if (cancelled) {
          stream.getTracks().forEach((t) => t.stop());
          return;
        }
        streamRef.current = stream;
        const v = videoRef.current;
        if (v) {
          v.srcObject = stream;
          await v.play().catch(() => {});
        }
        setCameraError(null);
      } catch (e) {
        const err = e as { name?: string };
        if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
          setCameraError("denied");
        } else {
          setCameraError("unavailable");
        }
      }
    })();

    return () => {
      cancelled = true;
      stopCamera();
    };
  }, [open, stopCamera]);

  useEffect(() => {
    if (!open || !poseEnabled || cameraError) {
      stopPose();
      if (!poseEnabled && open && !cameraError) {
        setOverlayStyle({
          left: "50%",
          top: "42%",
          width: "58%",
          transform: "translate(-50%, -50%) rotate(0deg)",
        });
      }
      return;
    }

    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap) return;

    let cancelled = false;
    setPoseLoading(true);

    (async () => {
      try {
        const { PoseLandmarker, FilesetResolver } = await import(
          "@mediapipe/tasks-vision"
        );
        if (cancelled) return;

        const fileset = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.17/wasm",
        );
        const modelAssetPath =
          "https://storage.googleapis.com/mediapipe-models/pose_landmarker/pose_landmarker_lite/float16/1/pose_landmarker_lite.task";
        const opts = {
          baseOptions: { modelAssetPath, delegate: "GPU" as const },
          runningMode: "VIDEO" as const,
          numPoses: 1,
        };
        let landmarker: import("@mediapipe/tasks-vision").PoseLandmarker;
        try {
          landmarker = await PoseLandmarker.createFromOptions(fileset, opts);
        } catch {
          landmarker = await PoseLandmarker.createFromOptions(fileset, {
            ...opts,
            baseOptions: { modelAssetPath, delegate: "CPU" },
          });
        }
        if (cancelled) {
          landmarker.close();
          return;
        }
        landmarkerRef.current = landmarker;
        setPoseLoading(false);

        const tick = () => {
          if (cancelled || !landmarkerRef.current || !videoRef.current || !wrapRef.current) {
            return;
          }
          const v = videoRef.current;
          const w = wrapRef.current;
          if (v.readyState < 2) {
            rafRef.current = requestAnimationFrame(tick);
            return;
          }

          const result = landmarkerRef.current.detectForVideo(v, performance.now());
          const pose = result.landmarks[0];
          if (pose && pose.length > 24) {
            const ls = pose[11];
            const rs = pose[12];
            const lh = pose[23];
            const rh = pose[24];
            const pLs = mapNormToOverlay(ls, v, w, true);
            const pRs = mapNormToOverlay(rs, v, w, true);
            const pLh = mapNormToOverlay(lh, v, w, true);
            const pRh = mapNormToOverlay(rh, v, w, true);
            const shoulderMid = {
              x: (pLs.x + pRs.x) / 2,
              y: (pLs.y + pRs.y) / 2,
            };
            const hipMid = {
              x: (pLh.x + pRh.x) / 2,
              y: (pLh.y + pRh.y) / 2,
            };
            const cx = (shoulderMid.x + hipMid.x) / 2;
            const cy = (shoulderMid.y + hipMid.y) / 2;
            const shoulderW = Math.hypot(pRs.x - pLs.x, pRs.y - pLs.y);
            const overlayW = Math.max(shoulderW * 2.35, 120);
            const angle = Math.atan2(pRs.y - pLs.y, pRs.x - pLs.x);

            setOverlayStyle({
              left: `${cx}px`,
              top: `${cy}px`,
              width: `${overlayW}px`,
              transform: `translate(-50%, -50%) rotate(${angle}rad)`,
            });
          }
          rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      } catch {
        if (!cancelled) setPoseLoading(false);
      }
    })();

    return () => {
      cancelled = true;
      stopPose();
    };
  }, [open, poseEnabled, cameraError, stopPose]);

  async function handleCapture() {
    const video = videoRef.current;
    const wrap = wrapRef.current;
    if (!video || !wrap || video.readyState < 2) return;

    setCaptureState("uploading");
    setCaptureMessage(null);
    setResultPreviewUrl(null);

    await new Promise<void>((resolve) => {
      if (typeof video.requestVideoFrameCallback === "function") {
        video.requestVideoFrameCallback(() => resolve());
      } else {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }
    });

    const canvas = document.createElement("canvas");
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setCaptureState("error");
      setCaptureMessage("Could not capture frame.");
      return;
    }
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = "high";
    ctx.save();
    ctx.translate(canvas.width, 0);
    ctx.scale(-1, 1);
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    ctx.restore();

    const blob = await new Promise<Blob | null>((res) =>
      canvas.toBlob((b) => res(b), "image/jpeg", 0.92),
    );
    if (!blob) {
      setCaptureState("error");
      setCaptureMessage("Could not encode image.");
      return;
    }

    const garmentImageUrl = resolveGarmentImageForTryOn(
      product,
      selectedColor.name,
      garmentGalleryIndex,
    );
    if (!garmentImageUrl) {
      setCaptureState("error");
      setCaptureMessage(
        "Product needs an HTTPS garment image for AI try-on (use the main product photo or add a try-on image URL).",
      );
      return;
    }

    const form = new FormData();
    form.append("photo", blob, "try-on.jpg");
    form.append("productSlug", product.slug);
    form.append("colorName", selectedColor.name);
    form.append("garmentImageUrl", garmentImageUrl);
    form.append(
      "garmentDescription",
      `${product.name} — ${selectedColor.name} t-shirt`,
    );

    try {
      const response = await fetch("/api/virtual-try-on", {
        method: "POST",
        body: form,
      });
      const data = (await response.json()) as {
        ok?: boolean;
        status?: string;
        resultUrl?: string;
        message?: string;
        privacy?: string;
        error?: string;
      };
      if (!response.ok) {
        setCaptureState("error");
        setCaptureMessage(data.error ?? "Request failed.");
        return;
      }
      if (data.resultUrl) {
        setResultPreviewUrl(data.resultUrl);
        setCaptureState("done");
        setCaptureMessage(data.privacy ?? "AI preview ready below.");
        return;
      }
      setCaptureState("done");
      setCaptureMessage(data.message ?? data.privacy ?? "OK");
    } catch {
      setCaptureState("error");
      setCaptureMessage("Network error.");
    }
  }

  return (
    <AnimatePresence>
      {open && (
      <motion.div
        key="virtual-tryon-backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm"
        role="dialog"
        aria-modal="true"
        aria-labelledby="virtual-tryon-title"
      >
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 16 }}
          className="relative flex max-h-[min(92vh,900px)] w-full max-w-lg flex-col overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
        >
          <div className="flex items-center justify-between border-b border-border px-4 py-3">
            <div className="flex items-center gap-2">
              <Camera className="h-5 w-5 text-accent" aria-hidden />
              <h2
                id="virtual-tryon-title"
                className="font-display text-lg uppercase tracking-tight text-foreground"
              >
                Try on with camera
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="rounded-full p-2 text-muted-foreground transition hover:bg-muted hover:text-foreground"
              aria-label="Close"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          <div className="flex flex-1 flex-col gap-3 overflow-y-auto p-4">
            <p className="text-xs leading-relaxed text-muted-foreground">
              Live preview layers a shirt graphic over your camera.{" "}
              <span className="text-foreground/90">AI try-on</span> sends your
              snapshot plus the <strong className="text-foreground/90">main product photo you have selected</strong>{" "}
              above the button (thumbnails) to the try-on service. Expect ~30–60 seconds.
            </p>

            <div
              ref={wrapRef}
              className="relative aspect-3/4 w-full overflow-hidden rounded-xl bg-muted"
            >
              {cameraError === "insecure" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <p className="text-sm text-destructive">
                    Camera needs a secure context (HTTPS).
                  </p>
                </div>
              )}
              {cameraError === "denied" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <p className="text-sm text-foreground">
                    Camera permission was denied. Allow camera access in your
                    browser settings and try again.
                  </p>
                </div>
              )}
              {cameraError === "unavailable" && (
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 p-6 text-center">
                  <p className="text-sm text-foreground">
                    No camera found or it is in use by another app.
                  </p>
                </div>
              )}
              {!cameraError && (
                <>
                  <video
                    ref={videoRef}
                    className="absolute inset-0 h-full w-full scale-x-[-1] object-contain"
                    playsInline
                    muted
                    autoPlay
                  />
                  <div
                    className="pointer-events-none absolute z-10"
                    style={{
                      left: overlayStyle.left,
                      top: overlayStyle.top,
                      width: overlayStyle.width,
                      transform: overlayStyle.transform,
                    }}
                  >
                    <div
                      className="relative aspect-200/260 w-full overflow-visible"
                      style={{
                        filter: `drop-shadow(0 4px 12px ${selectedColor.hex}55)`,
                      }}
                    >
                      <div
                        className="absolute inset-[8%] rounded-[35%] opacity-35 mix-blend-overlay"
                        style={{ backgroundColor: selectedColor.hex }}
                        aria-hidden
                      />
                      <Image
                        src={overlaySrc}
                        alt=""
                        fill
                        className="object-contain opacity-90 mix-blend-soft-light"
                        sizes="400px"
                        unoptimized={overlaySrc.endsWith(".svg")}
                      />
                    </div>
                  </div>
                  {poseLoading && (
                    <div className="absolute bottom-3 left-3 flex items-center gap-2 rounded-full bg-background/80 px-3 py-1.5 text-xs text-muted-foreground backdrop-blur">
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      Loading body tracking…
                    </div>
                  )}
                </>
              )}
            </div>

            <label className="flex cursor-pointer items-center gap-2 text-sm text-foreground">
              <input
                type="checkbox"
                className="accent-accent"
                checked={poseEnabled}
                onChange={(e) => setPoseEnabled(e.target.checked)}
              />
              Follow body (pose tracking)
            </label>

            <div className="rounded-lg border border-border bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <strong className="font-medium text-foreground">Privacy:</strong>{" "}
              Video stays in your browser. AI try-on sends your capture and the
              selected product photo to this app’s API, which forwards to the
              try-on service. Override the backend URL with{" "}
              <code className="text-foreground/80">TRY_ON_PROVIDER_URL</code> in{" "}
              <code className="text-foreground/80">.env</code> if needed.
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                disabled={!!cameraError || captureState === "uploading"}
                onClick={handleCapture}
                className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 py-2.5 text-sm font-bold uppercase tracking-wider text-accent-foreground transition hover:bg-accent-hover disabled:cursor-not-allowed disabled:opacity-50"
              >
                {captureState === "uploading" ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" />
                    Generating…
                  </>
                ) : (
                  <>
                    <ImageIcon className="h-4 w-4" />
                    AI try-on
                  </>
                )}
              </button>
            </div>

            {captureMessage && (
              <p
                className={`text-xs ${
                  captureState === "error"
                    ? "text-destructive"
                    : "text-muted-foreground"
                }`}
              >
                {captureMessage}
              </p>
            )}

            {resultPreviewUrl && (
              <div className="space-y-2">
                <p className="text-xs font-medium uppercase tracking-wider text-foreground">
                  AI preview
                </p>
                <div className="relative aspect-3/4 w-full overflow-hidden rounded-xl border border-border bg-muted">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={resultPreviewUrl}
                    alt={`AI try-on preview for ${product.name}`}
                    className="h-full w-full object-contain"
                  />
                </div>
              </div>
            )}
          </div>
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
}
