"use client";

import axios from "axios";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import api, { readApiErrorMessage } from "../services/appi";

type LoginSendResponse = {
  ok?: boolean;
  error?: string;
  challengeId?: string;
  otp?: string;
  devCode?: string;
};

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
      if (!phone.trim()) {
        setError("Enter your phone number.");
        return;
      }
      const { data, status } = await api.post<LoginSendResponse>("/api/auth/login", {
        phone: phone.trim(),
        channel: "phone",
        identifier: phone.trim(),
      });

      if (status >= 400 || !data?.ok) {
        setError(readApiErrorMessage(data) ?? "Failed to send OTP.");
        return;
      }

      const cid = typeof data.challengeId === "string" ? data.challengeId : "";
      setChallengeId(cid);

      const devOtp =
        typeof data.otp === "string"
          ? data.otp
          : typeof data.devCode === "string"
            ? data.devCode
            : null;
      setDevCode(devOtp);

      setStep("otp");
      setStatus(
        devOtp
          ? `OTP sent (check below: ${devOtp})`
          : "OTP sent. Check your messages.",
      );
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response) {
        setError(readApiErrorMessage(e.response.data) ?? "Failed to send OTP.");
      } else {
        setError(e instanceof Error ? e.message : "Failed to send OTP.");
      }
    } finally {
      setLoading(false);
    }
  }

  async function verifyOtp() {
    setLoading(true);
    setError(null);
    setStatus(null);
    try {
      const { data, status } = await api.post<{
        ok?: boolean;
        error?: string;
        user?: unknown;
        otp?: unknown;
      }>("/api/auth/verify-otp", {
        phone: phone.trim(),
        channel: "phone",
        identifier: phone.trim(),
        challengeId,
        code: code.trim(),
        otp: code.trim(),
      });
      if (status >= 400 || !data?.ok) {
        setError(readApiErrorMessage(data) ?? "OTP verification failed.");
        return;
      }

      const sessionRes = await fetch("/api/auth/external-session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ user: data.user }),
      });
      let sessionJson: { ok?: boolean; error?: string } | null = null;
      try {
        sessionJson = (await sessionRes.json()) as { ok?: boolean; error?: string };
      } catch {
        sessionJson = null;
      }
      if (!sessionRes.ok || !sessionJson?.ok) {
        setError(readApiErrorMessage(sessionJson) ?? "Could not start session.");
        return;
      }

      router.push("/shop");
      router.refresh();
    } catch (e: unknown) {
      if (axios.isAxiosError(e) && e.response) {
        setError(readApiErrorMessage(e.response.data) ?? "OTP verification failed.");
      } else {
        setError(e instanceof Error ? e.message : "OTP verification failed.");
      }
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
          type="tel"
          maxLength={10}
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
