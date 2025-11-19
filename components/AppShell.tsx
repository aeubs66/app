"use client";

import {
  ClerkLoaded,
  ClerkProvider,
  SignInButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
import Image from "next/image";
import Sidebar from "@/components/Sidebar";

export default function AppShell({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <ClerkLoaded>
        <ShellContent>{children}</ShellContent>
      </ClerkLoaded>
    </ClerkProvider>
  );
}

function ShellContent({ children }: { children: React.ReactNode }) {
  const { isSignedIn } = useUser();

  if (isSignedIn) {
    return (
      <div className="app-shell flex min-h-screen bg-gray-900 text-gray-100">
        <Sidebar />
        <main className="app-shell__content flex-1 min-h-screen min-w-0 overflow-y-auto">
          <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-16">
            {children}
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen w-full flex-col bg-gray-900 text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-800/80 bg-gray-950/90 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <div className="flex items-center gap-6">
            <Link
              href="/"
              className="flex items-center gap-3 text-lg font-semibold text-white transition hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              <Image
                src="/logo.png"
                alt="LoomRead logo"
                width={48}
                height={48}
                priority
                className="h-12 w-12 rounded-xl border border-emerald-500/30 bg-gray-900 object-contain p-0.5"
              />
              <span className="tracking-tight">LoomRead</span>
            </Link>
            <Link
              href="/pricing"
              className="hidden sm:flex text-sm font-medium text-gray-300 transition hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              Pricing
            </Link>
          </div>

          <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
            <SignInButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button
                type="button"
                className="w-full rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 sm:w-auto"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal" fallbackRedirectUrl="/dashboard">
              <button
                type="button"
                className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 sm:w-auto"
              >
                Create account
              </button>
            </SignUpButton>
          </div>
        </div>
      </header>

      <main className="flex-1 bg-gray-900">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-16">{children}</div>
      </main>

      <footer className="w-full border-t border-gray-800/80 bg-gray-900 px-4 py-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-4 sm:flex-row">
          <p className="text-sm text-gray-400">
            © {new Date().getFullYear()} LoomRead. All rights reserved.
          </p>
          <div className="flex items-center gap-6 text-sm">
            <Link
              href="/legal?tab=privacy"
              className="text-gray-400 transition hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              Privacy Policy
            </Link>
            <span className="text-gray-600">•</span>
            <Link
              href="/legal?tab=terms"
              className="text-gray-400 transition hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
            >
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}

