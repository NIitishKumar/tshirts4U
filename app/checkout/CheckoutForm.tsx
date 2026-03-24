"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, type CartItem } from "@/lib/cart-context";
import type { PaymentMethod } from "@/lib/order-types";

function InputField({
  label,
  ...props
}: { label: string } & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        {...props}
        className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground placeholder:text-muted-foreground outline-none transition-colors focus:border-accent"
      />
    </div>
  );
}

async function readJsonSafe(response: Response): Promise<Record<string, unknown> | null> {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text) as Record<string, unknown>;
  } catch {
    return null;
  }
}

export default function CheckoutForm() {
  const { items, totalPrice, clearCart } = useCart();
  const router = useRouter();
  const [placed, setPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [otpChannel, setOtpChannel] = useState<"email" | "phone">("email");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpChallengeId, setOtpChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpStatus, setOtpStatus] = useState<string | null>(null);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
  const [step, setStep] = useState(0);
  const [shippingData, setShippingData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    zipCode: "",
    email: "",
    phone: "",
  });

  useEffect(() => {
    try {
      const raw = sessionStorage.getItem("tshirts4u_buy_now_item");
      if (!raw) return;
      const parsed = JSON.parse(raw) as CartItem;
      if (
        parsed &&
        parsed.slug &&
        parsed.size &&
        parsed.color &&
        typeof parsed.price === "number"
      ) {
        setBuyNowItem(parsed);
      }
    } catch {
      setBuyNowItem(null);
    }
  }, []);

  const checkoutItems = useMemo(
    () => (buyNowItem ? [buyNowItem] : items),
    [buyNowItem, items],
  );
  const checkoutSubtotal = useMemo(
    () => checkoutItems.reduce((sum, item) => sum + item.price * item.quantity, 0),
    [checkoutItems],
  );

  const shipping = checkoutSubtotal >= 75 ? 0 : 5.99;
  const orderTotal = checkoutSubtotal + shipping;

  const normalizedItems = useMemo(
    () =>
      checkoutItems.map((item) => ({
        slug: item.slug,
        size: item.size,
        color: item.color,
        quantity: item.quantity,
      })),
    [checkoutItems],
  );

  async function sendOtp() {
    setError(null);
    setOtpStatus(null);
    const identifier =
      otpChannel === "email" ? shippingData.email.trim() : shippingData.phone.trim();
    if (!identifier) {
      setError(`Enter your ${otpChannel} first.`);
      return;
    }

    const res = await fetch("/api/auth/otp/send", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ channel: otpChannel, identifier }),
    });
    const json = await readJsonSafe(res);
    if (!res.ok) {
      setError((json?.error as string) ?? "Failed to send OTP.");
      return;
    }
    const challengeId = typeof json?.challengeId === "string" ? json.challengeId : "";
    if (!challengeId) {
      setError("Could not send OTP. Please try again.");
      return;
    }
    setOtpIdentifier(identifier);
    setOtpChallengeId(challengeId);
    setOtpVerified(false);
    setOtpStatus(
      json?.devCode
        ? `OTP sent (dev code: ${String(json.devCode)})`
        : "OTP sent. Check inbox/messages.",
    );
  }

  async function verifyOtp() {
    setError(null);
    setOtpStatus(null);
    if (!otpChallengeId || !otpCode) {
      setError("Send OTP and enter the code first.");
      return;
    }

    const res = await fetch("/api/auth/otp/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: shippingData.email.trim(),
        phone: shippingData.phone.trim(),
        channel: otpChannel,
        identifier: otpIdentifier,
        challengeId: otpChallengeId,
        code: otpCode,
      }),
    });
    const json = await readJsonSafe(res);
    if (!res.ok) {
      setError((json?.error as string) ?? "OTP verification failed.");
      return;
    }
    setOtpVerified(true);
    setOtpStatus("OTP verified. You can place the order.");
  }

  function validateShipping(): boolean {
    const required = [
      shippingData.firstName,
      shippingData.lastName,
      shippingData.address,
      shippingData.city,
      shippingData.zipCode,
      shippingData.email,
      shippingData.phone,
    ];
    const isValid = required.every((value) => value.trim().length > 0);
    if (!isValid) {
      setError("Please fill all shipping details before continuing.");
    }
    return isValid;
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      if (!otpVerified) throw new Error("Verify OTP before placing order.");
      const shippingAddress = {
        firstName: shippingData.firstName.trim(),
        lastName: shippingData.lastName.trim(),
        address: shippingData.address.trim(),
        city: shippingData.city.trim(),
        zipCode: shippingData.zipCode.trim(),
        email: shippingData.email.trim(),
        phone: shippingData.phone.trim(),
      };

      const createRes = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items: normalizedItems, shippingAddress }),
      });
      const createJson = await readJsonSafe(createRes);
      const createdOrderId =
        typeof createJson?.order === "object" &&
        createJson.order &&
        typeof (createJson.order as Record<string, unknown>).id === "string"
          ? ((createJson.order as Record<string, unknown>).id as string)
          : "";
      if (!createRes.ok || !createdOrderId) {
        throw new Error((createJson?.error as string) ?? "Could not create order.");
      }

      if (paymentMethod === "cod") {
        const codRes = await fetch("/api/orders/cod-confirm", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: createdOrderId }),
        });
        const codJson = await readJsonSafe(codRes);
        if (!codRes.ok) throw new Error((codJson?.error as string) ?? "COD confirmation failed.");
      } else {
        const createPayRes = await fetch("/api/payments/razorpay/create", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ orderId: createdOrderId, method: paymentMethod }),
        });
        const createPayJson = await readJsonSafe(createPayRes);
        const razorpayOrderId =
          typeof createPayJson?.razorpay === "object" &&
          createPayJson.razorpay &&
          typeof (createPayJson.razorpay as Record<string, unknown>).orderId === "string"
            ? ((createPayJson.razorpay as Record<string, unknown>).orderId as string)
            : "";
        if (!createPayRes.ok || !razorpayOrderId) {
          throw new Error((createPayJson?.error as string) ?? "Could not initialize payment.");
        }

        const verifyRes = await fetch("/api/payments/razorpay/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            orderId: createdOrderId,
            razorpayOrderId,
            razorpayPaymentId: `pay_${Math.random().toString(36).slice(2, 12)}`,
            razorpaySignature: "dev_signature",
          }),
        });
        const verifyJson = await readJsonSafe(verifyRes);
        if (!verifyRes.ok) throw new Error((verifyJson?.error as string) ?? "Payment verification failed.");
      }

      setPlaced(true);
      if (buyNowItem) {
        sessionStorage.removeItem("tshirts4u_buy_now_item");
        setBuyNowItem(null);
      } else {
        clearCart();
      }
      router.push(`/orders/${createdOrderId}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Checkout failed.");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (checkoutItems.length === 0 && !placed) {
    return (
      <div className="mt-20 flex flex-col items-center gap-4 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-full bg-muted">
          <ShoppingBag className="h-7 w-7 text-muted-foreground" />
        </div>
        <p className="font-display text-2xl uppercase tracking-tight text-foreground">Nothing to checkout</p>
        <Link
          href="/shop"
          className="mt-4 rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover"
        >
          Browse collection
        </Link>
      </div>
    );
  }

  return (
    <AnimatePresence mode="wait">
      {placed ? (
        <motion.div
          key="success"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
          className="mt-20 flex flex-col items-center gap-4 text-center"
        >
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-success/10">
            <CheckCircle className="h-8 w-8 text-success" />
          </div>
          <h2 className="font-display text-3xl uppercase tracking-tighter text-foreground">
            Order placed!
          </h2>
          <p className="max-w-sm text-muted-foreground">
            Thank you for your order. We&apos;ll send you a confirmation email
            with tracking details shortly.
          </p>
          <Link
            href="/shop"
            className="mt-6 rounded-full bg-accent px-6 py-3 text-sm font-bold uppercase tracking-wider text-accent-foreground transition-all duration-300 hover:bg-accent-hover"
          >
            Continue shopping
          </Link>
        </motion.div>
      ) : (
        <motion.div
          key="form"
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.3 }}
        >
          <form
            onSubmit={handleSubmit}
            className="mt-8 grid gap-12 lg:grid-cols-[1fr_340px]"
          >
            <div className="space-y-8">
              <div className="flex flex-wrap gap-2">
                {["Shipping", "Verify", "Payment", "Review"].map((label, idx) => (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStep(idx)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                      step === idx
                        ? "bg-accent text-accent-foreground"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {idx + 1}. {label}
                  </button>
                ))}
              </div>

              <AnimatePresence mode="wait">
                {step === 0 && (
                  <motion.fieldset
                    key="shipping"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <legend className="font-display text-lg uppercase tracking-tight text-foreground">
                      Shipping information
                    </legend>
                    <div className="grid gap-4 sm:grid-cols-2">
                      <InputField label="First name" value={shippingData.firstName} onChange={(e) => setShippingData((s) => ({ ...s, firstName: e.target.value }))} />
                      <InputField label="Last name" value={shippingData.lastName} onChange={(e) => setShippingData((s) => ({ ...s, lastName: e.target.value }))} />
                      <div className="sm:col-span-2">
                        <InputField label="Address" value={shippingData.address} onChange={(e) => setShippingData((s) => ({ ...s, address: e.target.value }))} />
                      </div>
                      <InputField label="City" value={shippingData.city} onChange={(e) => setShippingData((s) => ({ ...s, city: e.target.value }))} />
                      <InputField label="ZIP code" value={shippingData.zipCode} onChange={(e) => setShippingData((s) => ({ ...s, zipCode: e.target.value }))} />
                      <div className="sm:col-span-2">
                        <InputField label="Email" type="email" value={shippingData.email} onChange={(e) => setShippingData((s) => ({ ...s, email: e.target.value }))} />
                      </div>
                      <div className="sm:col-span-2">
                        <InputField label="Phone" value={shippingData.phone} onChange={(e) => setShippingData((s) => ({ ...s, phone: e.target.value }))} />
                      </div>
                    </div>
                    <button
                      type="button"
                      onClick={() => {
                        setError(null);
                        if (validateShipping()) setStep(1);
                      }}
                      className="h-11 rounded-full bg-accent px-5 text-xs font-bold uppercase tracking-wider text-accent-foreground"
                    >
                      Continue to verify
                    </button>
                  </motion.fieldset>
                )}

                {step === 1 && (
                  <motion.fieldset
                    key="verify"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <legend className="font-display text-lg uppercase tracking-tight text-foreground">
                      Verify account (OTP)
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-2">
                      {(["email", "phone"] as const).map((channel) => (
                        <button
                          key={channel}
                          type="button"
                          onClick={() => setOtpChannel(channel)}
                          className={`h-11 rounded-xl border text-sm font-semibold uppercase tracking-wide transition ${
                            otpChannel === channel
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border bg-surface text-muted-foreground hover:border-accent/40"
                          }`}
                        >
                          {channel}
                        </button>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => void sendOtp()}
                        className="h-11 rounded-full border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
                      >
                        Send OTP
                      </button>
                      <input
                        value={otpCode}
                        onChange={(e) => setOtpCode(e.target.value)}
                        placeholder="Enter OTP"
                        className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-accent"
                      />
                      <button
                        type="button"
                        onClick={() => void verifyOtp()}
                        className="h-11 rounded-full bg-accent px-4 text-xs font-bold uppercase tracking-wider text-accent-foreground"
                      >
                        Verify
                      </button>
                    </div>
                    {otpStatus ? <p className="text-xs text-success">{otpStatus}</p> : null}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(0)}
                        className="h-11 rounded-full border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        disabled={!otpVerified}
                        onClick={() => setStep(2)}
                        className="h-11 rounded-full bg-accent px-4 text-xs font-bold uppercase tracking-wider text-accent-foreground disabled:cursor-not-allowed disabled:opacity-50"
                      >
                        Continue to payment
                      </button>
                    </div>
                  </motion.fieldset>
                )}

                {step === 2 && (
                  <motion.fieldset
                    key="payment"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <legend className="font-display text-lg uppercase tracking-tight text-foreground">
                      Payment
                    </legend>
                    <div className="grid gap-2 sm:grid-cols-3">
                      {(["card", "upi", "cod"] as const).map((method) => (
                        <button
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`h-11 rounded-xl border text-sm font-semibold uppercase tracking-wide transition ${
                            paymentMethod === method
                              ? "border-accent bg-accent/10 text-accent"
                              : "border-border bg-surface text-muted-foreground hover:border-accent/40"
                          }`}
                        >
                          {method}
                        </button>
                      ))}
                    </div>
                    {paymentMethod !== "cod" && (
                      <p className="text-xs text-muted-foreground">
                        Demo mode: this flow creates Razorpay orders and verifies with a placeholder
                        signature. Replace with Razorpay Checkout + real callback verification.
                      </p>
                    )}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(1)}
                        className="h-11 rounded-full border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
                      >
                        Back
                      </button>
                      <button
                        type="button"
                        onClick={() => setStep(3)}
                        className="h-11 rounded-full bg-accent px-4 text-xs font-bold uppercase tracking-wider text-accent-foreground"
                      >
                        Review order
                      </button>
                    </div>
                  </motion.fieldset>
                )}

                {step === 3 && (
                  <motion.fieldset
                    key="review"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    className="space-y-4"
                  >
                    <legend className="font-display text-lg uppercase tracking-tight text-foreground">
                      Review and place order
                    </legend>
                    <p className="text-sm text-muted-foreground">
                      Please review the order summary and click place order when ready.
                    </p>
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setStep(2)}
                        className="h-11 rounded-full border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
                      >
                        Back
                      </button>
                      <button
                        type="submit"
                        disabled={isSubmitting}
                        className="h-11 rounded-full bg-accent px-5 text-xs font-bold uppercase tracking-wider text-accent-foreground disabled:opacity-70"
                      >
                        {isSubmitting ? "Processing..." : "Place order"}
                      </button>
                    </div>
                  </motion.fieldset>
                )}
              </AnimatePresence>
            </div>

            <div className="h-fit rounded-2xl border border-border bg-surface p-6">
              <h2 className="font-display text-lg uppercase tracking-tight text-foreground">
                Order summary
              </h2>
              <div className="mt-4 max-h-48 space-y-3 overflow-y-auto">
                {checkoutItems.map((item) => (
                  <div
                    key={`${item.slug}-${item.size}-${item.color}`}
                    className="flex justify-between text-sm"
                  >
                    <span className="text-muted-foreground">
                      {item.name} &times; {item.quantity}
                    </span>
                    <span className="text-foreground">
                      ${(item.price * item.quantity).toFixed(2)}
                    </span>
                  </div>
                ))}
              </div>
              <div className="mt-4 space-y-2 border-t border-border pt-4 text-sm">
                <div className="flex justify-between text-muted-foreground">
                  <span>Subtotal</span>
                  <span>${checkoutSubtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-muted-foreground">
                  <span>Shipping</span>
                  <span>
                    {shipping === 0 ? (
                      <span className="font-medium text-success">Free</span>
                    ) : (
                      `$${shipping.toFixed(2)}`
                    )}
                  </span>
                </div>
                <div className="flex justify-between border-t border-border pt-2 font-semibold text-foreground">
                  <span>Total</span>
                  <span>${orderTotal.toFixed(2)}</span>
                </div>
              </div>

              <p className="mt-6 text-xs text-muted-foreground">
                Complete steps on the left to place your order.
              </p>
              {error && <p className="mt-3 text-xs text-red-400">{error}</p>}
            </div>
          </form>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
