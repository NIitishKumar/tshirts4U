"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle, ShoppingBag } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { useCart, type CartItem } from "@/lib/cart-context";
import type { PaymentMethod } from "@/lib/order-types";
import type { Address, CreateAddressPayload } from "@/lib/address-types";
import api, { readApiErrorMessage } from "../services/appi";

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
  const { items, clearCart } = useCart();
  const router = useRouter();
  const [placed, setPlaced] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod>("card");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [otpChannel, setOtpChannel] = useState<"email" | "phone">("email");
  const [otpIdentifier, setOtpIdentifier] = useState("");
  const [otpChallengeId, setOtpChallengeId] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpVerified, setOtpVerified] = useState(false);
  const [otpSent, setOtpSent] = useState(false);
  const [otpStatus, setOtpStatus] = useState<string | null>(null);
  const [buyNowItem, setBuyNowItem] = useState<CartItem | null>(null);
  const [userId, setUserId] = useState<string | null>(null);

  const [savedAddresses, setSavedAddresses] = useState<Address[]>([]);
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null);
  const [savedAddressDraftKey, setSavedAddressDraftKey] = useState<string | null>(null);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [addressesError, setAddressesError] = useState<string | null>(null);
  const [isPersistingAddress, setIsPersistingAddress] = useState(false);
  const [addingNewAddress, setAddingNewAddress] = useState(false);
  const [step, setStep] = useState(0);
  const [shippingData, setShippingData] = useState({
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    zipCode: "",
    state: "ENG",
    country: "UK",
    latitude: "0",
    longitude: "0",
    email: "",
    phone: "",
  });

  type AddressDraft = {
    firstName: string;
    lastName: string;
    phone: string;
    address: string;
    city: string;
    state: string;
    country: string;
    postalCode: string;
    latitude: number;
    longitude: number;
  };

  function getDraftFromShippingData(): AddressDraft {
    const latitude = Number(shippingData.latitude);
    const longitude = Number(shippingData.longitude);
    return {
      firstName: shippingData.firstName.trim(),
      lastName: shippingData.lastName.trim(),
      phone: shippingData.phone.trim(),
      address: shippingData.address.trim(),
      city: shippingData.city.trim(),
      state: shippingData.state.trim(),
      country: shippingData.country.trim(),
      postalCode: shippingData.zipCode.trim(),
      latitude: Number.isFinite(latitude) ? latitude : 0,
      longitude: Number.isFinite(longitude) ? longitude : 0,
    };
  }

  function draftKey(d: AddressDraft): string {
    return JSON.stringify(d);
  }

  function draftKeyFromAddress(a: Address): string {
    return draftKey({
      firstName: a.firstName.trim(),
      lastName: a.lastName.trim(),
      phone: a.phone.trim(),
      address: a.address.trim(),
      city: a.city.trim(),
      state: a.state.trim(),
      country: a.country.trim(),
      postalCode: a.postalCode?.trim(),
      latitude: a.latitude,
      longitude: a.longitude,
    });
  }

  function applyAddressToShippingData(a: Address) {
    setShippingData((prev) => ({
      ...prev,
      firstName: a.firstName || prev.firstName,
      lastName: a.lastName || prev.lastName,
      phone: a.phone || prev.phone,
      address: a.address,
      city: a.city,
      zipCode: a.postalCode,
      state: a.state,
      country: a.country,
      latitude: String(a.latitude),
      longitude: String(a.longitude),
    }));
  }

  const hideFirstLastInputs =
    !!selectedAddressId &&
    !addingNewAddress &&
    shippingData.firstName.trim().length > 0 &&
    shippingData.lastName.trim().length > 0;

  const hidePhoneInput =
    !!selectedAddressId && !addingNewAddress && shippingData.phone.trim().length > 0;

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

  useEffect(() => {
    const user = localStorage.getItem("user");
    if (!user) return;
    const userData = JSON.parse(user) as User;
    setIsLoggedIn(true);
    setUserId(userData._id);
  }, []);

  useEffect(() => {
    if (!isLoggedIn || !userId) return;
    const uid = userId;

    async function loadAddresses() {
      setAddressesLoading(true);
      setAddressesError(null);
      try {
        const res = await api.get<{ addresses: Address[] }>(`/api/users/${encodeURIComponent(uid)}/addresses`, {
          params: {
            user: userId,
          },
        });
        setSavedAddresses(res.data.addresses);
      } catch (e: unknown) {
        setAddressesError(e instanceof Error ? e.message : "Failed to load saved addresses.");
      } finally {
        setAddressesLoading(false);
      }
    }
    void loadAddresses();
  }, [isLoggedIn, userId]);

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

  const stepLabels = useMemo(
    () =>
      isLoggedIn
        ? ["Shipping", "Payment", "Review"]
        : ["Shipping", "Verify", "Payment", "Review"],
    [isLoggedIn],
  );

  async function sendOtp() {
    setError(null);
    setOtpStatus(null);
    setOtpVerified(false);
    const identifier =
      otpChannel === "email" ? shippingData.email.trim() : shippingData.phone.trim();
    if (!identifier) {
      setError(`Enter your ${otpChannel} first.`);
      return;
    }

    setOtpSent(false);

    try {
      const response = await api.post<{
        ok?: boolean;
        error?: string;
        challengeId?: string;
        otp?: string;
        devCode?: string;
        user?: unknown;
      }>("/api/auth/login", {
        channel: otpChannel,
        identifier,
        phone: shippingData.phone.trim(),
      });

      if (response.status >= 400 || !response.data?.ok) {
        setError(readApiErrorMessage(response.data) ?? (response.data?.error as string) ?? "Failed to send OTP.");
        return;
      }

      // Some backends only return `otp` (dev/demo) and omit `challengeId`.
      // We make challengeId optional so the UI can still enter OTP and verify.
      const dataRec = (response.data ?? {}) as Record<string, unknown>;
      const challengeId =
        typeof response.data?.challengeId === "string"
          ? response.data.challengeId
          : typeof dataRec.requestId === "string"
            ? dataRec.requestId
            : typeof dataRec.sessionId === "string"
              ? dataRec.sessionId
              : "";

      const devOtp =
        typeof response.data?.otp === "string"
          ? response.data.otp
          : typeof response.data?.devCode === "string"
            ? response.data.devCode
            : null;

      setOtpIdentifier(identifier);
      setOtpChallengeId(challengeId);
      setOtpCode("");
      setOtpSent(true);
      setOtpStatus(
        devOtp
          ? `OTP sent (check below: ${devOtp})`
          : "OTP sent. Check inbox/messages.",
      );
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send OTP.");
    }
  }

  async function verifyOtp() {
    setError(null);
    setOtpStatus(null);
    if (!otpCode.trim()) {
      setError("Enter the OTP code first.");
      return;
    }

    try {
      const response = await api.post<{
        ok?: boolean;
        error?: string;
        user?: unknown;
      }>("/api/auth/verify-otp", {
        phone: shippingData.phone.trim(),
        channel: otpChannel,
        identifier: otpIdentifier,
        challengeId: otpChallengeId,
        code: otpCode.trim(),
        otp: otpCode.trim(),
      });

      if (response.status >= 400 || !response.data?.ok) {
        setError(readApiErrorMessage(response.data) ?? (response.data?.error as string) ?? "OTP verification failed.");
        return;
      }

      const user = response.data.user;
      // Persist session cookie so order APIs can associate `userId`.
      const sessionRes = await fetch("/api/auth/external-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user }),
      });
      const sessionJson = await readJsonSafe(sessionRes);
      if (!sessionRes.ok || !sessionJson?.ok) {
        setError((sessionJson?.error as string) ?? "Could not start session.");
        return;
      }

      setOtpVerified(true);
      setOtpSent(true);
      setOtpStatus("OTP verified. You can place the order.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OTP verification failed.");
    }
  }

  function validateShipping(): boolean {
    const required = [
      shippingData.firstName,
      shippingData.lastName,
      shippingData.address,
      shippingData.city,
      shippingData.zipCode,
      shippingData.phone,
    ];
    const isValid = required.every((value) => value.trim().length > 0);
    if (!isValid) {
      setError("Please fill all shipping details before continuing.");
    }
    return isValid;
  }

  async function persistAddressIfNeeded(): Promise<boolean> {
    if (!isLoggedIn || !userId) return true;

    const draft = getDraftFromShippingData();
    const key = draftKey(draft);

    const payload: CreateAddressPayload = {
      firstName: draft.firstName,
      lastName: draft.lastName,
      phone: draft.phone,
      address: draft.address,
      city: draft.city,
      state: draft.state,
      country: draft.country,
      postalCode: draft.postalCode,
      latitude: draft.latitude,
      longitude: draft.longitude,
    };

    // If nothing selected yet, only create if the address fields are actually filled.
    const hasAddressInput =
      shippingData.address.trim().length > 0 ||
      shippingData.city.trim().length > 0 ||
      shippingData.zipCode.trim().length > 0;

    try {
      setIsPersistingAddress(true);

      if (selectedAddressId) {
        if (savedAddressDraftKey === key) return true;
        const res = await api.put(
          `/api/users/${encodeURIComponent(userId)}/addresses/${encodeURIComponent(
            selectedAddressId,
          )}`,
            payload,
        );
        if (res.status >= 400 || !res.data?.ok) {
          throw new Error((res.data?.error as string) ?? "Failed to update address.");
        }

        const updated = res.data.address as Address;
        setSavedAddresses((prev) => prev.map((a) => (a._id === updated._id ? updated : a)));
        setSavedAddressDraftKey(draftKeyFromAddress(updated));
        setSelectedAddressId(updated._id);
        setAddingNewAddress(false);
        applyAddressToShippingData(updated);
        return true;
      }

      if (!hasAddressInput) return true;
      const res = await api.post(`/api/users/${encodeURIComponent(userId)}/addresses`, 
        payload,
      );
      if (res.status >= 400 || !res.data?.ok) {
        throw new Error((res.data?.error as string) ?? "Failed to save address.");
      }

      const created = res.data.address as Address;
      setSavedAddresses((prev) => [created, ...prev]);
      setSelectedAddressId(created._id);
      setSavedAddressDraftKey(draftKeyFromAddress(created));
      setAddingNewAddress(false);
      applyAddressToShippingData(created);
      return true;
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save address.");
      return false;
    } finally {
      setIsPersistingAddress(false);
    }
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
                {stepLabels.map((label, idx) => {
                  const actualStep = isLoggedIn && idx >= 1 ? idx + 1 : idx;
                  return (
                  <button
                    key={label}
                    type="button"
                    onClick={() => setStep(actualStep)}
                    className={`rounded-full px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider ${
                      step === actualStep
                        ? "bg-accent text-accent-foreground"
                        : "border border-border text-muted-foreground"
                    }`}
                  >
                    {idx + 1}. {label}
                  </button>
                  );
                })}
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
                      {!hideFirstLastInputs ? (
                        <>
                          <InputField
                            label="First name"
                            value={shippingData.firstName}
                            onChange={(e) =>
                              setShippingData((s) => ({
                                ...s,
                                firstName: e.target.value,
                              }))
                            }
                          />
                          <InputField
                            label="Last name"
                            value={shippingData.lastName}
                            onChange={(e) =>
                              setShippingData((s) => ({
                                ...s,
                                lastName: e.target.value,
                              }))
                            }
                          />
                        </>
                      ) : null}
                      {isLoggedIn ? (
                        <div className="sm:col-span-2">
                          <p className="mb-1.5 text-sm font-medium text-foreground">
                            Saved addresses
                          </p>
                          {savedAddresses.length > 0 || addressesLoading || addressesError ? (
                            <div className="space-y-2">
                              {addressesLoading ? (
                                <p className="text-xs text-muted-foreground">
                                  Loading saved addresses...
                                </p>
                              ) : null}
                              {addressesError ? (
                                <p className="text-xs text-red-400">
                                  {addressesError}
                                </p>
                              ) : null}

                              {savedAddresses.map((a) => {
                                const isSelected = selectedAddressId === a._id;
                                return (
                                  <button
                                    key={a._id}
                                    type="button"
                                    onClick={() => {
                                      setAddingNewAddress(false);
                                      setSelectedAddressId(a._id);
                                      setSavedAddressDraftKey(
                                        draftKeyFromAddress(a),
                                      );
                                      applyAddressToShippingData(a);
                                    }}
                                    className={`w-full rounded-xl border px-4 py-3 text-left transition ${
                                      isSelected
                                        ? "border-accent bg-accent/10"
                                        : "border-border bg-surface hover:border-accent/40"
                                    }`}
                                  >
                                    <p className="text-xs font-bold uppercase tracking-[0.2em] text-accent">
                                      {a.city}
                                    </p>
                                    <p className="mt-1 text-sm font-semibold text-foreground">
                                      {a.address}
                                    </p>
                                    <p className="mt-1 text-xs text-muted-foreground">
                                      {a.postalCode} • {a.state} • {a.country}
                                    </p>
                                  </button>
                                );
                              })}

                              <button
                                type="button"
                                onClick={() => {
                                  setAddingNewAddress(true);
                                  setSelectedAddressId(null);
                                  setSavedAddressDraftKey(null);
                                  setShippingData((prev) => ({
                                    ...prev,
                                    address: "",
                                    city: "",
                                    zipCode: "",
                                    state: "ENG",
                                    country: "UK",
                                    latitude: "0",
                                    longitude: "0",
                                  }));
                                }}
                                className="w-full rounded-xl border border-border bg-surface px-4 py-3 text-left text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-accent hover:text-accent"
                              >
                                + Add new address
                              </button>
                            </div>
                          ) : null}
                        </div>
                      ) : null}
                      <div className="sm:col-span-2">
                        {(!isLoggedIn ||
                          savedAddresses.length === 0 ||
                          addingNewAddress) && (
                          <InputField
                            label="Address"
                            value={shippingData.address}
                            onChange={(e) =>
                              setShippingData((s) => ({
                                ...s,
                                address: e.target.value,
                              }))
                            }
                          />
                        )}
                      </div>
                      {(!isLoggedIn ||
                        savedAddresses.length === 0 ||
                        addingNewAddress) && (
                        <>
                          <InputField
                            label="City"
                            value={shippingData.city}
                            onChange={(e) =>
                              setShippingData((s) => ({
                                ...s,
                                city: e.target.value,
                              }))
                            }
                          />
                          <InputField
                            label="ZIP code"
                            value={shippingData.zipCode}
                            onChange={(e) =>
                              setShippingData((s) => ({
                                ...s,
                                zipCode: e.target.value,
                              }))
                            }
                          />
                        </>
                      )}
                      {/* <div className="sm:col-span-2">
                        <InputField label="Email" type="email" value={shippingData.email} onChange={(e) => setShippingData((s) => ({ ...s, email: e.target.value }))} />
                      </div> */}
                      {!hidePhoneInput ? (
                        <div className="sm:col-span-2">
                          <InputField
                            label="Phone"
                            value={shippingData.phone}
                            onChange={(e) =>
                              setShippingData((s) => ({
                                ...s,
                                phone: e.target.value,
                              }))
                            }
                          />
                        </div>
                      ) : null}
                    </div>
                    <button
                      type="button"
                      onClick={async () => {
                        setError(null);
                        if (!validateShipping()) return;
                        if (isLoggedIn) {
                          const ok = await persistAddressIfNeeded();
                          if (!ok) return;
                        }
                        setStep(isLoggedIn ? 2 : 1);
                      }}
                      disabled={isPersistingAddress}
                      className="h-11 rounded-full bg-accent px-5 text-xs font-bold uppercase tracking-wider text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {isLoggedIn ? "Continue to payment" : "Continue to verify"}
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
                      {!otpSent ? (
                        (["email", "phone"] as const).map((channel) => (
                          <button
                            key={channel}
                            type="button"
                            onClick={() => {
                              setOtpChannel(channel);
                              setOtpSent(false);
                              setOtpVerified(false);
                              setOtpCode("");
                              setOtpChallengeId("");
                              setOtpStatus(null);
                            }}
                            className={`h-11 rounded-xl border text-sm font-semibold uppercase tracking-wide transition ${
                              otpChannel === channel
                                ? "border-accent bg-accent/10 text-accent"
                                : "border-border bg-surface text-muted-foreground hover:border-accent/40"
                            }`}
                          >
                            {channel}
                          </button>
                        ))
                      ) : null}
                    </div>
                    <div className="flex gap-2">
                      {!otpSent ? (
                        <button
                          type="button"
                          onClick={() => void sendOtp()}
                          className="h-11 rounded-full border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
                        >
                          Send OTP
                        </button>
                      ) : (
                        <>
                          <input
                            value={otpCode}
                            onChange={(e) => setOtpCode(e.target.value)}
                            placeholder="Enter OTP"
                            className="h-11 flex-1 rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-accent"
                          />
                          {!otpVerified ? (
                            <button
                              type="button"
                              disabled={!otpCode.trim()}
                              onClick={() => void verifyOtp()}
                              className="h-11 rounded-full bg-accent px-4 text-xs font-bold uppercase tracking-wider text-accent-foreground disabled:cursor-not-allowed disabled:opacity-60"
                            >
                              Verify
                            </button>
                          ) : null}
                        </>
                      )}
                    </div>
                    {otpStatus ? <p className="text-xs text-success">{otpStatus}</p> : null}
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setStep(0);
                          setOtpSent(false);
                          setOtpVerified(false);
                          setOtpChallengeId("");
                          setOtpCode("");
                          setOtpStatus(null);
                        }}
                        className="h-11 rounded-full border border-border px-4 text-xs font-bold uppercase tracking-wider text-foreground"
                      >
                        Back
                      </button>
                      {otpVerified ? (
                        <button
                          type="button"
                          onClick={() => setStep(2)}
                          className="h-11 rounded-full bg-accent px-4 text-xs font-bold uppercase tracking-wider text-accent-foreground"
                        >
                          Continue to payment
                        </button>
                      ) : null}
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
                        onClick={() => setStep(isLoggedIn ? 0 : 1)}
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

                    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                      <h3 className="font-display text-sm uppercase tracking-tight text-foreground">
                        Delivery address
                      </h3>
                      <p className="text-sm font-semibold text-foreground">
                        {shippingData.firstName} {shippingData.lastName}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {shippingData.phone}
                        {shippingData.email ? ` • ${shippingData.email}` : ""}
                      </p>
                      <p className="text-sm text-foreground">
                        {shippingData.address}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {shippingData.city} • {shippingData.zipCode}
                        {shippingData.state ? ` • ${shippingData.state}` : ""}
                        {shippingData.country ? ` • ${shippingData.country}` : ""}
                      </p>
                    </div>

                    <div className="space-y-2 rounded-2xl border border-border bg-surface p-4">
                      <h3 className="font-display text-sm uppercase tracking-tight text-foreground">
                        Payment
                      </h3>
                      <p className="text-sm text-muted-foreground">
                        Method:{" "}
                        <span className="font-semibold text-foreground">
                          {paymentMethod.toUpperCase()}
                        </span>
                      </p>
                    </div>

                    <div className="space-y-3 rounded-2xl border border-border bg-surface p-4">
                      <h3 className="font-display text-sm uppercase tracking-tight text-foreground">
                        Items
                      </h3>
                      <div className="space-y-2">
                        {checkoutItems.map((item) => (
                          <div
                            key={`${item.slug}-${item.size}-${item.color}`}
                            className="flex justify-between gap-3 text-sm"
                          >
                            <div className="min-w-0">
                              <p className="truncate font-medium text-foreground">
                                {item.name ?? item.slug}
                                <span className="text-muted-foreground">
                                  {" "}
                                  ({item.size}, {item.color})
                                </span>
                              </p>
                              <p className="text-xs text-muted-foreground">
                                Qty: {item.quantity}
                              </p>
                            </div>
                            <p className="text-foreground">
                              ${(item.price * item.quantity).toFixed(2)}
                            </p>
                          </div>
                        ))}
                      </div>
                    </div>

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
