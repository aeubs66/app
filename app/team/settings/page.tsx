"use client";

import { useEffect, useMemo, useState } from "react";
import { useAuth, useUser } from "@clerk/nextjs";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface TeamSubscriptionSummary {
  team: {
    id: string;
    name: string;
    seat_limit: number;
    clerk_organization_id?: string | null;
  };
  subscription: {
    subscription_id: string;
    status: string;
    extra_seats: number;
  } | null;
  credits_remaining: number;
  credits_total: number;
  month_tag: string;
}

export default function TeamSettingsPage() {
  const { isSignedIn } = useUser();
  const { getToken } = useAuth();
  const [teams, setTeams] = useState<TeamSubscriptionSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [billingLoading, setBillingLoading] = useState<string | null>(null);

  useEffect(() => {
    if (!isSignedIn) {
      setLoading(false);
      return;
    }

    const fetchTeams = async () => {
      try {
        const token = await getToken({ template: "pdfs" });
        if (!token) throw new Error("Authentication token missing");

        const response = await fetch(`${API_URL}/api/subscriptions/`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (!response.ok) {
          throw new Error(`Failed to load team subscriptions (${response.status})`);
        }

        const data = await response.json();
        setTeams(data.teams || []);
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unable to load team data.");
      } finally {
        setLoading(false);
      }
    };

    fetchTeams();
  }, [getToken, isSignedIn]);

  const handleInvite = async (team: TeamSubscriptionSummary) => {
    const email = window.prompt("Enter the teammate's email address");
    if (!email) {
      return;
    }

    try {
      const token = await getToken({ template: "pdfs" });
      if (!token) throw new Error("Authentication token missing");

      const response = await fetch(`${API_URL}/api/teams/${team.team.id}/invite`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ email }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Unable to send invite" }));
        throw new Error(errorData.detail || "Unable to send invite");
      }

      alert("Invite placeholder sent. (Actual invitation flow pending)");
    } catch (err) {
      alert(err instanceof Error ? err.message : "Failed to send invitation");
    }
  };

  const handleOpenBillingPortal = async (team: TeamSubscriptionSummary) => {
    if (!team.team.clerk_organization_id) {
      alert("This team is not linked to a Clerk organization. Set clerk_organization_id to enable billing portal.");
      return;
    }

    setBillingLoading(team.team.id);
    try {
      const token = await getToken({ template: "pdfs" });
      if (!token) throw new Error("Authentication token missing");

      const response = await fetch(`${API_URL}/api/billing/portal`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          entity_id: team.team.clerk_organization_id,
          entity_type: "organization",
          return_url: `${window.location.origin}/team/settings`,
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
      alert(err instanceof Error ? err.message : "Unable to open billing portal");
    } finally {
      setBillingLoading(null);
    }
  };

  const seatUsage = (team: TeamSubscriptionSummary) => {
    const seatLimit = team.team.seat_limit || 0;
    const extraSeats = team.subscription?.extra_seats ?? 0;
    const activeSeats = Math.min(seatLimit, seatLimit - extraSeats + extraSeats); // placeholder until member count is fetched
    return { seatLimit, activeSeats };
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Team Settings</h1>
          <p className="text-gray-400">Manage your team members and billing</p>
          {error && <p className="mt-3 text-sm text-red-400">{error}</p>}
        </div>

        {loading ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <p className="text-gray-400 text-sm">Loading team data...</p>
          </div>
        ) : teams.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
            <p className="text-gray-300">You are not part of any teams yet.</p>
          </div>
        ) : (
          teams.map((team) => {
            const { seatLimit } = seatUsage(team);
            const creditsUsed = Math.max(0, team.credits_total - team.credits_remaining);
            const creditPercent = team.credits_total > 0
              ? Math.min(100, Math.round((creditsUsed / team.credits_total) * 100))
              : 0;

            return (
              <div key={team.team.id} className="space-y-6 mb-10">
                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <h2 className="text-lg font-semibold text-white">{team.team.name}</h2>
                      <p className="text-gray-400 text-sm">
                        Subscription: {team.subscription?.subscription_id ?? "None"} ({team.subscription?.status ?? "inactive"})
                      </p>
                    </div>
                    <button
                      onClick={() => handleInvite(team)}
                      className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
                    >
                      Invite Member
                    </button>
                  </div>
                  <p className="text-gray-400 text-sm">
                    Seat limit: {seatLimit} (base {team.subscription?.extra_seats ? `${seatLimit - team.subscription.extra_seats} + ${team.subscription.extra_seats} extra` : seatLimit})
                  </p>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Usage</h3>
                  <div className="flex justify-between mb-2">
                    <span className="text-gray-300">Team credits ({team.month_tag})</span>
                    <span className="text-white">{creditsUsed} / {team.credits_total}</span>
                  </div>
                  <div className="w-full bg-gray-700 rounded-full h-2">
                    <div className="bg-emerald-600 h-2 rounded-full" style={{ width: `${creditPercent}%` }}></div>
                  </div>
                </div>

                <div className="bg-gray-800 rounded-lg border border-gray-700 p-6">
                  <h3 className="text-lg font-semibold text-white mb-4">Billing</h3>
                  <p className="text-gray-300 mb-4">Manage your team subscription and invoices</p>
                  <button
                    onClick={() => handleOpenBillingPortal(team)}
                    disabled={billingLoading === team.team.id}
                    className="px-4 py-2 bg-gray-700 hover:bg-gray-600 disabled:bg-gray-600 disabled:cursor-not-allowed text-white text-sm font-medium rounded-lg transition-colors"
                  >
                    {billingLoading === team.team.id ? "Opening..." : "Open Billing Portal"}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

