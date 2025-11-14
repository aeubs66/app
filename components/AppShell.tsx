"use client";

import {
  ClerkLoaded,
  ClerkProvider,
  SignInButton,
  SignUpButton,
  useUser,
} from "@clerk/nextjs";
import Link from "next/link";
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
    <div className="flex min-h-screen flex-col bg-gray-900 text-gray-100">
      <header className="sticky top-0 z-40 border-b border-gray-800/80 bg-gray-950/90 px-4 py-4 backdrop-blur-sm sm:px-6">
        <div className="mx-auto flex w-full max-w-6xl flex-col items-center justify-between gap-3 sm:flex-row">
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-semibold text-white transition hover:text-emerald-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
          >
            <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl border border-emerald-500/30 bg-gray-900 text-emerald-200">
              CW
            </span>
            <span className="tracking-tight">Chat with PDF</span>
          </Link>

          <div className="flex w-full items-center justify-center gap-2 sm:w-auto">
            <SignInButton mode="modal">
              <button
                type="button"
                className="w-full rounded-lg border border-emerald-500/40 px-4 py-2 text-sm font-semibold text-emerald-100 transition hover:border-emerald-400/60 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 sm:w-auto"
              >
                Sign in
              </button>
            </SignInButton>
            <SignUpButton mode="modal">
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

      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-6xl px-6 py-10 sm:px-10 lg:px-16">{children}</div>
      </main>
    </div>
  );
}

