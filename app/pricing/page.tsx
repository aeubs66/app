"use client";

import { useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface PlanButtonState {
  starter: boolean;
  pro: boolean;
  error: string | null;
}

export default function PricingPage() {
  const router = useRouter();
  const { isSignedIn, user } = useUser();
  const { getToken } = useAuth();
  const [state, setState] = useState<PlanButtonState>({ starter: false, pro: false, error: null });

  const handleCheckout = async (priceId: string, plan: "starter" | "pro") => {
    if (!isSignedIn || !user) {
      router.push(`/sign-in?redirect_url=/pricing`);
      return;
    }

    setState((prev) => ({ ...prev, [plan]: true, error: null }));

    try {
      const token = await getToken({ template: "pdfs" });
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_URL}/api/billing/checkout`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          price_id: priceId,
          scope: "personal",
          clerk_user_id: user.id,
          success_url: `${window.location.origin}/account`,
          cancel_url: `${window.location.origin}/pricing`,
        }),
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ detail: "Unable to start checkout" }));
        throw new Error(error.detail || "Unable to start checkout");
      }

      const data = await response.json();
      const url = data.url as string | undefined;
      if (!url) {
        throw new Error("Checkout URL not returned. Check Clerk Billing configuration.");
      }

      window.location.href = url;
    } catch (error) {
      const message = error instanceof Error ? error.message : "Checkout failed";
      setState((prev) => ({ ...prev, error: message }));
      console.error("Checkout error", error);
    } finally {
      setState((prev) => ({ ...prev, [plan]: false }));
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Pricing</h1>
          <p className="text-xl text-gray-400">Choose the plan that works for you</p>
          {state.error && (
            <p className="mt-4 text-sm text-red-400">{state.error}</p>
          )}
        </div>

        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {/* Starter Plan */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h3 className="text-2xl font-semibold text-white mb-2">Starter</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$7</span>
              <span className="text-gray-400">/month</span>
            </div>
            <p className="text-gray-400 mb-6">Perfect for personal use</p>
            <ul className="space-y-3 mb-8">
              <li className="text-gray-300">✓ 100 chat credits / month</li>
              <li className="text-gray-300">✓ Unlimited PDF uploads</li>
              <li className="text-gray-300">✓ Page citations</li>
            </ul>
            <button
              onClick={() => handleCheckout("starter_monthly", "starter")}
              disabled={state.starter}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {state.starter ? "Redirecting..." : "Start Starter"}
            </button>
          </div>

          {/* Pro Plan */}
          <div className="bg-gray-800 rounded-lg p-8 border-2 border-emerald-600 relative">
            <div className="absolute top-0 right-0 bg-emerald-600 text-white text-xs font-semibold px-3 py-1 rounded-bl-lg">
              Popular
            </div>
            <h3 className="text-2xl font-semibold text-white mb-2">Pro</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$15</span>
              <span className="text-gray-400">/month</span>
            </div>
            <p className="text-gray-400 mb-6">For power users</p>
            <ul className="space-y-3 mb-8">
              <li className="text-gray-300">✓ 400 chat credits / month</li>
              <li className="text-gray-300">✓ Priority ingestion</li>
              <li className="text-gray-300">✓ Export conversations</li>
              <li className="text-gray-300">✓ Advanced search filters</li>
            </ul>
            <button
              onClick={() => handleCheckout("pro_monthly", "pro")}
              disabled={state.pro}
              className="w-full px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-emerald-700 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {state.pro ? "Redirecting..." : "Upgrade to Pro"}
            </button>
          </div>

          {/* Team Plan */}
          <div className="bg-gray-800 rounded-lg p-8 border border-gray-700">
            <h3 className="text-2xl font-semibold text-white mb-2">Team</h3>
            <div className="mb-4">
              <span className="text-4xl font-bold text-white">$25</span>
              <span className="text-gray-400">/month</span>
            </div>
            <p className="text-gray-400 mb-6">Includes 3 seats + shared workspace</p>
            <ul className="space-y-3 mb-8">
              <li className="text-gray-300">✓ 200 team credits / month</li>
              <li className="text-gray-300">✓ +50 credits per extra seat</li>
              <li className="text-gray-300">✓ Centralized billing</li>
              <li className="text-gray-300">✓ Team management tools</li>
            </ul>
            <button
              onClick={() => router.push("/team/settings")}
              className="w-full px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Manage in Team Settings
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

