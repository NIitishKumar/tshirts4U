"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const router = useRouter();
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [step, setStep] = useState<"phone" | "otp">("phone");
  const [challengeId, setChallengeId] = useState("");
  const [code, setCode] = useState("");
  const [devCode, setDevCode] = useState<string | null>(null);
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function sendOtpToPhone() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/otp/send", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ channel: "phone", identifier: phone }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "Failed to send OTP.");
      setChallengeId(json.challengeId);
      setDevCode(json?.devCode ?? null);
      setStep("otp");
      setStatus("OTP sent to your phone number.");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to send OTP.");
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const res = await fetch("/api/auth/otp/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: email.trim() || `user_${phone.replace(/\D/g, "")}@t4u.local`,
          phone,
          channel: "phone",
          identifier: phone,
          challengeId,
          code,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json?.error ?? "OTP verification failed.");
      router.push("/shop");
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "OTP verification failed.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mx-auto max-w-lg px-6 pt-28 pb-24">
      <h1 className="font-display text-4xl uppercase tracking-tighter text-foreground">Login</h1>
      <p className="mt-2 text-sm text-muted-foreground">
        Phone-first OTP login. Add email optionally to complete profile.
      </p>

      <div className="mt-8 space-y-4 rounded-2xl border border-border bg-surface p-6">
        <button
          type="button"
          className="h-12 w-full rounded-full border border-border text-sm font-bold uppercase tracking-wider text-foreground transition hover:border-accent hover:text-accent"
          onClick={() =>
            setStatus("SSO UI is ready. Connect Google/Apple backend provider to activate.")
          }
        >
          Continue with SSO
        </button>

        <div className="relative py-1">
          <div className="h-px bg-border" />
          <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 bg-surface px-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
            OR
          </span>
        </div>

        <input
          value={phone}
          onChange={(e) => setPhone(e.target.value)}
          placeholder="Phone (e.g. +919999999999)"
          className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-accent"
        />
        {step === "phone" ? (
          <button
            type="button"
            onClick={sendOtpToPhone}
            disabled={loading}
            className="h-12 w-full rounded-full bg-accent text-sm font-bold uppercase tracking-wider text-accent-foreground"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        ) : (
          <>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Email (optional)"
              className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-accent"
            />
            <input
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter OTP code"
              className="h-11 w-full rounded-xl border border-border bg-surface px-4 text-sm text-foreground outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={verifyOtp}
              disabled={loading}
              className="h-12 w-full rounded-full bg-accent text-sm font-bold uppercase tracking-wider text-accent-foreground"
            >
              {loading ? "Verifying..." : "Verify OTP"}
            </button>
            <button
              type="button"
              onClick={() => {
                setStep("phone");
                setCode("");
                setChallengeId("");
                setDevCode(null);
                setStatus(null);
                setError(null);
              }}
              className="h-11 w-full rounded-full border border-border text-xs font-bold uppercase tracking-wider text-foreground"
            >
              Change phone number
            </button>
          </>
        )}

        {status ? <p className="text-xs text-success">{status}</p> : null}
        {devCode ? (
          <p className="text-xs text-muted-foreground">Dev OTP: {devCode}</p>
        ) : null}
        {error ? <p className="text-xs text-red-400">{error}</p> : null}
        <p className="pt-1 text-[11px] text-muted-foreground">
          By continuing you agree to our terms. Need help? <Link href="/about" className="underline">Contact support</Link>.
        </p>
      </div>
    </div>
  );
}
