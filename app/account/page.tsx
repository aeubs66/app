"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useAuth, useUser } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface SubscriptionSummary {
  subscription: {
    subscription_id: string;
    product: string;
    status: string;
    seat_limit: number;
    extra_seats: number;
    current_period_end: string | null;
    monthly_credits: number;
  } | null;
  credits_remaining: number;
  credits_total: number;
  month_tag: string;
}

export default function AccountPage() {
  const { user, isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [personal, setPersonal] = useState<SubscriptionSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [portalLoading, setPortalLoading] = useState(false);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    const fetchSubscription = async () => {
      try {
        const token = await getToken({ template: "pdfs" });
        if (!token) {
          throw new Error("Authentication token missing");
        }

        const response = await fetch(`${API_URL}/api/subscriptions/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load subscription (${response.status})`);
        }

        const data = await response.json();
        setPersonal(data.personal);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load subscription data.");
      } finally {
        setLoading(false);
      }
    };

    fetchSubscription();
  }, [getToken, isSignedIn]);

  const handleOpenBillingPortal = async () => {
    if (!isSignedIn || !user) {
      return;
    }

    setPortalLoading(true);
    try {
      const token = await getToken({ template: "pdfs" });
      if (!token) {
        throw new Error("Authentication token missing");
      }

      const response = await fetch(`${API_URL}/api/billing/portal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_id: user.id,
          entity_type: "user",
          return_url: `${window.location.origin}/account`,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unable to open billing portal" }));
        throw new Error(errorData.detail || "Unable to open billing portal");
      }

      const data = await response.json();
      if (!data.url) {
        throw new Error("Billing portal URL missing. Verify Clerk Billing configuration.");
      }

      window.location.href = data.url;
    } catch (err) {
      setError(err instanceof Error ? err.message : "Unable to open billing portal.");
    } finally {
      setPortalLoading(false);
    }
  };

  const planLabel = personal?.subscription?.product
    ? personal.subscription.product.charAt(0).toUpperCase() + personal.subscription.product.slice(1)
    : "Free";

  const planStatus = personal?.subscription?.status ?? "inactive";
  const periodEnd = personal?.subscription?.current_period_end
    ? new Date(personal.subscription.current_period_end).toLocaleDateString()
    : "--";

  const creditsUsed = personal
    ? Math.max(0, personal.credits_total - personal.credits_remaining)
    : 0;

  const creditPercent = personal && personal.credits_total > 0
    ? Math.min(100, Math.round((creditsUsed / personal.credits_total) * 100))
    : 0;

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account</h1>
          <p className="text-gray-400">Manage your plan and billing</p>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Current Plan</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading plan details...</p>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Plan</span>
                <span className="text-white font-medium">{planLabel}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Status</span>
                <span className={planStatus === "active" ? "text-emerald-400" : "text-yellow-400"}>
                  {planStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Next billing date</span>
                <span className="text-white">{periodEnd}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-gray-300">Credits</span>
                <span className="text-white">
                  {creditsUsed} / {personal?.credits_total ?? 0}
                </span>
              </div>
            </div>
          )}
          <div className="mt-6 pt-6 border-t border-gray-700">
            <Link href="/pricing" className="text-emerald-400 hover:text-emerald-300 text-sm">
              Change plan →
            </Link>
          </div>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 mb-6">
          <h2 className="text-lg font-semibold text-white mb-4">Billing</h2>
          <p className="text-gray-300 mb-4">Manage your payment methods and view invoices</p>
          <button
            onClick={handleOpenBillingPortal}
            disabled={portalLoading}
            className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
          >
            {portalLoading ? "Opening..." : "Manage Billing"}
          </button>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-white mb-4">Usage</h2>
          {loading ? (
            <p className="text-gray-400 text-sm">Loading usage data...</p>
          ) : (
            <div className="space-y-4">
              <div>
                <div className="flex justify-between mb-2">
                  <span className="text-gray-300">Chats this month ({personal?.month_tag ?? "--"})</span>
                  <span className="text-white">
                    {creditsUsed} / {personal?.credits_total ?? 0}
                  </span>
                </div>
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${creditPercent}%` }}
                  ></div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

