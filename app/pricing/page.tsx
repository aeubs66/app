"use client";

import Link from "next/link";
import { SignedIn, SignedOut } from "@clerk/nextjs";

const CLERK_PLAN_STARTER_URL = process.env.NEXT_PUBLIC_CLERK_PLAN_STARTER_URL || "";

export default function PricingPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold text-white mb-4">Pricing</h1>
          <p className="text-xl text-gray-400">Choose the plan that works for you</p>
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
            <SignedOut>
              <Link
                href={`/sign-in?redirect_url=/pricing`}
                className="inline-flex w-full items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
              >
                Sign in to Subscribe
              </Link>
            </SignedOut>
            <SignedIn>
              {CLERK_PLAN_STARTER_URL ? (
                <a
                  href={CLERK_PLAN_STARTER_URL}
                  className="inline-flex w-full items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
                >
                  Continue in Clerk
                </a>
              ) : (
                <div className="text-sm text-red-400">
                  Set `NEXT_PUBLIC_CLERK_PLAN_STARTER_URL` to your Clerk plan link.
                </div>
              )}
            </SignedIn>
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
            <div className="text-sm text-gray-400 mb-4">
              Clerk's Payment Gateway currently supports a single hosted checkout plan. Contact support
              to enable additional plans.
            </div>
            <SignedIn>
              <a
                href="mailto:support@clerk.dev?subject=Enable%20Pro%20Plan"
                className="inline-flex w-full items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                Contact Clerk Support
              </a>
            </SignedIn>
            <SignedOut>
              <Link
                href={`/sign-in?redirect_url=/pricing`}
                className="inline-flex w-full items-center justify-center px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
              >
                Sign in to Learn More
              </Link>
            </SignedOut>
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
            <Link
              href="/team/settings"
              className="inline-flex w-full items-center justify-center px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              Manage in Team Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

