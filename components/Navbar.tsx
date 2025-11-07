"use client";

import Link from "next/link";
import { SignedIn, SignedOut, UserButton, SignInButton } from "@clerk/nextjs";

export default function Navbar() {
  return (
    <nav className="border-b border-gray-800 bg-gray-900/50 backdrop-blur-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="text-xl font-semibold text-white hover:text-gray-300 transition-colors">
              Chat with PDF
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <SignedIn>
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-gray-200 transition-colors"
              >
                Dashboard
              </Link>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>

            <SignedOut>
              <SignInButton mode="modal">
                <button className="text-sm text-gray-400 hover:text-gray-200 transition-colors">
                  Sign in
                </button>
              </SignInButton>
              <Link
                href="/sign-up"
                className="px-4 py-2 text-sm font-medium text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors"
              >
                Get started
              </Link>
            </SignedOut>
          </div>
        </div>
      </div>
    </nav>
  );
}

