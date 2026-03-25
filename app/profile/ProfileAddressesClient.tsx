"use client";

import { useEffect, useMemo, useState } from "react";
import type { Address, CreateAddressPayload } from "@/lib/address-types";

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

type FormState = {
  firstName: string;
  lastName: string;
  phone: string;
  address: string;
  city: string;
  state: string;
  country: string;
  postalCode: string;
  latitude: string;
  longitude: string;
};

const emptyForm: FormState = {
  firstName: "",
  lastName: "",
  phone: "",
  address: "",
  city: "",
  state: "ENG",
  country: "UK",
  postalCode: "",
  latitude: "0",
  longitude: "0",
};

function addressToForm(a: Address): FormState {
  return {
    firstName: a.firstName,
    lastName: a.lastName,
    phone: a.phone,
    address: a.address,
    city: a.city,
    state: a.state,
    country: a.country,
    postalCode: a.postalCode,
    latitude: String(a.latitude),
    longitude: String(a.longitude),
  };
}

function formToCreatePayload(form: FormState): CreateAddressPayload {
  const latitude = Number(form.latitude);
  const longitude = Number(form.longitude);
  return {
    firstName: form.firstName.trim(),
    lastName: form.lastName.trim(),
    phone: form.phone.trim(),
    address: form.address.trim(),
    city: form.city.trim(),
    state: form.state.trim(),
    country: form.country.trim(),
    postalCode: form.postalCode.trim(),
    latitude: Number.isFinite(latitude) ? latitude : 0,
    longitude: Number.isFinite(longitude) ? longitude : 0,
  };
}

function isFormValid(form: FormState): boolean {
  return (
    form.firstName.trim().length > 0 &&
    form.lastName.trim().length > 0 &&
    form.phone.trim().length > 0 &&
    form.address.trim().length > 0 &&
    form.city.trim().length > 0 &&
    form.state.trim().length > 0 &&
    form.country.trim().length > 0 &&
    form.postalCode.trim().length > 0 &&
    Number.isFinite(Number(form.latitude)) &&
    Number.isFinite(Number(form.longitude))
  );
}

export default function ProfileAddressesClient({ userId }: { userId: string }) {
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const [editingAddressId, setEditingAddressId] = useState<string | null>(null);
  const [form, setForm] = useState<FormState>(emptyForm);
  const [saving, setSaving] = useState(false);

  const editorTitle = useMemo(
    () => (editingAddressId ? "Edit address" : "Add new address"),
    [editingAddressId],
  );

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/addresses`, {
        cache: "no-store",
      });
      const json = (await res.json()) as { ok?: boolean; addresses?: Address[]; error?: string };
      if (!res.ok || !json.ok || !Array.isArray(json.addresses)) {
        throw new Error(json.error ?? "Failed to load addresses.");
      }
      setAddresses(json.addresses);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed to load addresses.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userId]);

  async function handleCreateOrUpdate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (!isFormValid(form)) {
      setError("Please fill all address fields with valid latitude and longitude.");
      return;
    }

    setSaving(true);
    try {
      const payload = formToCreatePayload(form);
      if (editingAddressId) {
        const res = await fetch(
          `/api/users/${encodeURIComponent(userId)}/addresses/${encodeURIComponent(editingAddressId)}`,
          {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(payload),
          },
        );
        const json = (await res.json()) as { ok?: boolean; address?: Address; error?: string };
        if (!res.ok || !json.ok || !json.address) {
          throw new Error(json.error ?? "Failed to update address.");
        }

        setAddresses((prev) =>
          prev.map((a) => (a._id === json.address?._id ? json.address! : a)),
        );
        setEditingAddressId(null);
        setForm(emptyForm);
      } else {
        const res = await fetch(`/api/users/${encodeURIComponent(userId)}/addresses`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        const json = (await res.json()) as { ok?: boolean; address?: Address; error?: string };
        if (!res.ok || !json.ok || !json.address) {
          throw new Error(json.error ?? "Failed to create address.");
        }

        setAddresses((prev) => [json.address!, ...prev]);
        setForm(emptyForm);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not save address.");
    } finally {
      setSaving(false);
    }
  }

  function startEdit(a: Address) {
    setEditingAddressId(a._id);
    setForm(addressToForm(a));
    setError(null);
  }

  async function handleDelete(addressId: string) {
    setError(null);
    setSaving(true);
    try {
      const res = await fetch(
        `/api/users/${encodeURIComponent(userId)}/addresses/${encodeURIComponent(addressId)}`,
        { method: "DELETE" },
      );
      const json = (await res.json()) as { ok?: boolean; addresses?: Address[]; error?: string };
      if (!res.ok || !json.ok || !Array.isArray(json.addresses)) {
        throw new Error(json.error ?? "Failed to delete address.");
      }

      setAddresses(json.addresses);
      if (editingAddressId === addressId) {
        setEditingAddressId(null);
        setForm(emptyForm);
      }
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Could not delete address.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="space-y-8">
      <div>
        <h2 className="font-display text-xl uppercase tracking-tight text-foreground">
          Saved addresses
        </h2>
        <p className="mt-1 text-sm text-muted-foreground">
          Use these during checkout to avoid retyping your address.
        </p>
      </div>

      {loading ? (
        <div className="rounded-2xl border border-border bg-surface p-6">
          Loading...
        </div>
      ) : error ? (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-red-400">
          {error}
        </div>
      ) : addresses.length === 0 ? (
        <div className="rounded-2xl border border-border bg-surface p-6 text-sm text-muted-foreground">
          You have no saved addresses yet.
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {addresses.map((a) => (
            <div key={a._id} className="rounded-2xl border border-border bg-surface p-6">
              <p className="text-xs uppercase tracking-[0.2em] text-accent">Address</p>
              <p className="mt-2 text-sm font-semibold text-foreground">
                {a.address}
              </p>
              <p className="mt-1 text-sm text-muted-foreground">
                {a.city}, {a.state} {a.postalCode}, {a.country}
              </p>
              <p className="mt-2 text-xs text-muted-foreground">
                Coordinates: {a.latitude}, {a.longitude}
              </p>

              <div className="mt-4 flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => startEdit(a)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-accent hover:text-accent"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => void handleDelete(a._id)}
                  className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-red-400 hover:text-red-400"
                  disabled={saving}
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <form onSubmit={handleCreateOrUpdate} className="rounded-2xl border border-border bg-surface p-6">
        <div className="flex items-start justify-between gap-4">
          <div>
            <h2 className="font-display text-xl uppercase tracking-tight text-foreground">
              {editorTitle}
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {editingAddressId
                ? "Update your saved address details."
                : "Add an address that will be available in checkout."}
            </p>
          </div>
          {editingAddressId ? (
            <button
              type="button"
              onClick={() => {
                setEditingAddressId(null);
                setForm(emptyForm);
              }}
              className="rounded-full border border-border px-4 py-2 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-accent hover:text-accent"
            >
              Cancel
            </button>
          ) : null}
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          <InputField
            label="First name"
            value={form.firstName}
            onChange={(e) => setForm((s) => ({ ...s, firstName: e.target.value }))}
            placeholder="John"
            disabled={saving}
          />
          <InputField
            label="Last name"
            value={form.lastName}
            onChange={(e) => setForm((s) => ({ ...s, lastName: e.target.value }))}
            placeholder="Doe"
            disabled={saving}
          />
          <InputField
            label="Phone"
            value={form.phone}
            onChange={(e) => setForm((s) => ({ ...s, phone: e.target.value }))}
            placeholder="+447..."
            disabled={saving}
          />
          <div className="sm:col-span-2">
            <InputField
              label="Address"
              value={form.address}
              onChange={(e) => setForm((s) => ({ ...s, address: e.target.value }))}
              placeholder="123 Main St"
              disabled={saving}
            />
          </div>
          <InputField
            label="City"
            value={form.city}
            onChange={(e) => setForm((s) => ({ ...s, city: e.target.value }))}
            placeholder="London"
            disabled={saving}
          />
          <InputField
            label="State"
            value={form.state}
            onChange={(e) => setForm((s) => ({ ...s, state: e.target.value }))}
            placeholder="ENG"
            disabled={saving}
          />
          <InputField
            label="Country"
            value={form.country}
            onChange={(e) => setForm((s) => ({ ...s, country: e.target.value }))}
            placeholder="UK"
            disabled={saving}
          />
          <InputField
            label="Postal code"
            value={form.postalCode}
            onChange={(e) => setForm((s) => ({ ...s, postalCode: e.target.value }))}
            placeholder="SW1A"
            disabled={saving}
          />

          <InputField
            label="Latitude"
            value={form.latitude}
            onChange={(e) => setForm((s) => ({ ...s, latitude: e.target.value }))}
            placeholder="51.5"
            disabled={saving}
          />
          <InputField
            label="Longitude"
            value={form.longitude}
            onChange={(e) => setForm((s) => ({ ...s, longitude: e.target.value }))}
            placeholder="-0.12"
            disabled={saving}
          />
        </div>

        <div className="mt-6 flex flex-wrap items-center gap-3">
          <button
            type="submit"
            disabled={saving}
            className="h-11 rounded-full bg-accent px-6 text-xs font-bold uppercase tracking-wider text-accent-foreground transition hover:bg-accent-hover"
          >
            {saving ? "Saving..." : editingAddressId ? "Save changes" : "Save address"}
          </button>
          <button
            type="button"
            disabled={saving}
            onClick={() => {
              setForm(emptyForm);
              setEditingAddressId(null);
              setError(null);
            }}
            className="h-11 rounded-full border border-border px-6 text-xs font-bold uppercase tracking-wider text-foreground transition hover:border-accent hover:text-accent"
          >
            Clear
          </button>
        </div>

        {error ? (
          <p className="mt-4 text-sm text-red-400" role="alert">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}

