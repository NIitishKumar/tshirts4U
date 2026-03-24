import Razorpay from "razorpay";

let client: Razorpay | null = null;

export function getRazorpayClient(): Razorpay {
  if (client) return client;
  const keyId = process.env.RAZORPAY_KEY_ID?.trim();
  const keySecret = process.env.RAZORPAY_KEY_SECRET?.trim();
  if (!keyId || !keySecret) {
    throw new Error("Razorpay keys are not configured.");
  }
  client = new Razorpay({ key_id: keyId, key_secret: keySecret });
  return client;
}

export function getRazorpayPublicKey(): string {
  return process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID?.trim() ?? "";
}
