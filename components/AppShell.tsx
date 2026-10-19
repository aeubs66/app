"use client";
import { useState } from "react";
import { ClerkProvider, SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import { usePathname } from "next/navigation";
import Link from "next/link";
import Sidebar from "./Sidebar";
import Icon from "./Icon";
export default function AppShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);
  const pathname = usePathname();
  const section = pathname.startsWith("/doc/")
    ? "Document workspace"
    : {
        "/": "Overview",
        "/upload": "New document",
        "/dashboard": "My documents",
        "/pricing": "Explore workspace",
        "/account": "Settings",
        "/help": "Help & getting started",
        "/team/settings": "Team settings",
      }[pathname] || "Your workspace";
  return (
    <ClerkProvider
      appearance={{
        variables: {
          colorPrimary: "#6478ff",
          borderRadius: "0.65rem",
          colorBackground: "#151822",
          colorText: "#f0f2ff",
          colorInputBackground: "#0e1018",
          colorInputText: "#f0f2ff",
          colorTextSecondary: "#9b9fb7",
        },
      }}
    >
      <div className="workspace-shell">
        <a className="skip-link" href="#main-content">
          Skip to content
        </a>
        <Sidebar open={open} onClose={() => setOpen(false)} />
        <div className="workspace-body">
          <header className="workspace-header">
            <div className="breadcrumb">
              <button
                className="icon-button mobile-menu"
                onClick={() => setOpen(true)}
                aria-label="Open navigation"
                aria-expanded={open}
              >
                <Icon name="menu" />
              </button>
              <Link href="/" className="header-wordmark">
                LoomRead<span>✳</span>
              </Link>
              <span className="breadcrumb-slash">/</span>
              <strong>{section}</strong>
            </div>
            <div className="header-actions">
              <span className="private-label">
                <Icon name="shield" size={14} />
                Personal workspace
              </span>
              <span className="header-divider" />
              <SignedOut>
                <Link href="/sign-in" className="header-sign-in">
                  Sign in <Icon name="arrow" size={15} />
                </Link>
                <span className="guest-avatar small">G</span>
              </SignedOut>
              <SignedIn>
                <UserButton afterSignOutUrl="/" />
              </SignedIn>
            </div>
          </header>
          <main
            id="main-content"
            className={`workspace-main ${pathname.startsWith("/doc/") ? "chat-main" : ""}`}
          >
            {children}
          </main>
          <footer className="workspace-footer">
            <span>LoomRead / A better way to get the big picture.</span>
            <div>
              <span className="footer-dot" /> Private reading workspace{" "}
              <span className="footer-separator">·</span>
              <Link href="/legal?tab=privacy">Privacy</Link>
            </div>
          </footer>
        </div>
      </div>
    </ClerkProvider>
  );
}
