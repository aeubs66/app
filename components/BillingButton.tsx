"use client";

import { useState } from "react";

export default function BillingButton() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const openPortal = async () => {
    try {
      setError(null);
      setLoading(true);
      const response = await fetch("/api/billing/session", { method: "POST" });

      let data: any = null;
      try {
        data = await response.json();
      } catch {
        data = null;
      }

      if (!response.ok || !data?.url) {
        throw new Error(
          data?.error || `Unable to open billing portal (status ${response.status})`
        );
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unexpected error");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <button
        data-billing
        onClick={openPortal}
        disabled={loading}
        className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 disabled:cursor-not-allowed disabled:opacity-60"
      >
        {loading ? "Opening…" : "Manage subscription"}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

