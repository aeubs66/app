"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import {
  SignedIn,
  SignedOut,
  SignInButton,
  SignOutButton,
  useUser,
} from "@clerk/nextjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import {
  faBars,
  faRightFromBracket,
  faGaugeHigh,
  faFolderTree,
  faFileLines,
  faCircleUser,
  faChevronLeft,
  faChevronRight,
  faScaleBalanced,
  faTag,
} from "@fortawesome/free-solid-svg-icons";
import type { IconDefinition } from "@fortawesome/fontawesome-svg-core";

/**
 * Navigation item definition. Each entry contains the href, label, and icon.
 */
type NavItem = {
  href: string;
  label: string;
  icon: IconDefinition;
  exact?: boolean;
};

/**
 * Reusable navigation list with active styles and hover tooltips for collapsed state.
 */
function NavigationList({
  items,
  showLabels,
  isDesktop,
  onNavigate,
}: {
  items: NavItem[];
  showLabels: boolean;
  isDesktop: boolean;
  onNavigate?: () => void;
}) {
  const pathname = usePathname();

  return (
    <ul className="space-y-1" role="list">
      {items.map((item) => {
        const isActive = item.exact
          ? pathname === item.href
          : pathname === item.href || pathname.startsWith(`${item.href}/`);

        return (
          <li key={item.href} className="relative">
            <Link
              href={item.href}
              onClick={onNavigate}
              aria-label={item.label}
              className={`group relative flex rounded-xl py-2 text-sm font-medium transition-all duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 ${
                isActive
                  ? "bg-emerald-500/15 text-emerald-200 shadow-inner shadow-emerald-900/30"
                  : "text-gray-300 hover:bg-gray-800/70 hover:text-white"
              } ${showLabels ? "items-center justify-start gap-3 px-3" : "items-center justify-center px-2"}`}
              aria-current={isActive ? "page" : undefined}
            >
              <span
                className={`icon-pill relative flex h-9 w-9 items-center justify-center rounded-lg border transition-all duration-200 ${
                  isActive
                    ? "border-emerald-500/60 bg-emerald-500/20 text-emerald-200 shadow-[0_0_12px_rgba(16,185,129,0.3)]"
                    : "border-gray-700 bg-gray-900 text-gray-400 group-hover:border-emerald-500/40 group-hover:text-emerald-200"
                }`}
                aria-hidden="true"
              >
                <FontAwesomeIcon
                  icon={item.icon}
                  className="transition-transform duration-200 group-hover:scale-110 group-active:scale-95"
                />
              </span>

              {showLabels && (
                <span className="ml-3 truncate transition-opacity duration-200">
                  {item.label}
                </span>
              )}

              {!showLabels && isDesktop && (
                <span
                  className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 hidden -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-lg border border-emerald-500/30 bg-gray-950/95 px-3 py-1 text-xs font-semibold text-white shadow-xl ring-1 ring-emerald-500/20 opacity-0 backdrop-blur-sm transition-all duration-150 ease-out group-hover:flex group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:flex group-focus-within:translate-x-0 group-focus-within:opacity-100"
                  role="tooltip"
                >
                  <span className="relative flex items-center gap-2">
                    {item.label}
                    <span className="pointer-events-none absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-sm bg-gray-950/95 ring-1 ring-emerald-500/20" />
                  </span>
                </span>
              )}

              {/* Active indicator removed */}
            </Link>
          </li>
        );
      })}
    </ul>
  );
}

/**
 * Sidebar component featuring:
 * - Collapsible desktop behavior with smooth transitions.
 * - Mobile drawer with overlay and accessible controls.
 * - Font Awesome iconography and user profile integration.
 */
const DESKTOP_EXPANDED = "16rem";
const DESKTOP_COLLAPSED = "5rem";
const MOBILE_WIDTH = "16rem";

export default function Sidebar() {
  const [isExpanded, setIsExpanded] = useState(true);
  const [isMobileOpen, setIsMobileOpen] = useState(false);
  const [isDesktop, setIsDesktop] = useState(false);
  const [isLogoHovered, setIsLogoHovered] = useState(false);
  const pathname = usePathname();
  const { user } = useUser();

  // Collapse sidebar by default on smaller screens when navigating.
  useEffect(() => {
    setIsMobileOpen(false);
  }, [pathname]);

  const updateSidebarWidth = useCallback(
    (expanded: boolean, desktop: boolean, mobileOpen: boolean) => {
    if (typeof window === "undefined") {
      return;
    }
      const width = desktop
        ? expanded ? DESKTOP_EXPANDED : DESKTOP_COLLAPSED
        : mobileOpen ? MOBILE_WIDTH : "0px";

      document.documentElement.style.setProperty("--sidebar-width", width);
    },
    []
  );

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    const handleResize = () => {
      const desktop = window.innerWidth >= 768;
      setIsDesktop(desktop);
      updateSidebarWidth(isExpanded, desktop, isMobileOpen);
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [isExpanded, isMobileOpen]);

  useEffect(() => {
    updateSidebarWidth(isExpanded, isDesktop, isMobileOpen);
  }, [isExpanded, isDesktop, isMobileOpen]);

  const navigationItems = useMemo<NavItem[]>(
    () => [
      { href: "/dashboard", label: "Dashboard", icon: faGaugeHigh, exact: true },
      { href: "/projects", label: "Projects", icon: faFolderTree },
      { href: "/documents", label: "Documents", icon: faFileLines },
      { href: "/pricing", label: "Pricing", icon: faTag },
      { href: "/legal", label: "Legal", icon: faScaleBalanced },
    ],
    []
  );

  const sidebarWidthClass = isExpanded ? "md:w-72" : "md:w-20";
  const showLabels = !isDesktop || isExpanded;

  useEffect(() => {
    if (showLabels) {
      setIsLogoHovered(false);
    }
  }, [showLabels]);

  return (
    <>
      {/* Mobile hamburger trigger */}
      <button
        type="button"
        onClick={() => setIsMobileOpen(true)}
        className="md:hidden fixed top-4 left-4 z-40 flex items-center gap-2 rounded-full border border-gray-700 bg-gray-900/95 px-4 py-2 text-sm text-gray-100 shadow-lg backdrop-blur transition hover:border-emerald-600 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
        aria-label="Open navigation"
        aria-expanded={isMobileOpen}
      >
        <FontAwesomeIcon icon={faBars} />
        Menu
      </button>

      {/* Mobile backdrop */}
      <div
        className={`fixed inset-0 z-40 bg-black/70 backdrop-blur-sm transition-opacity duration-200 md:hidden ${
          isMobileOpen ? "opacity-100" : "pointer-events-none opacity-0"
        }`}
        role="presentation"
        onClick={() => setIsMobileOpen(false)}
      />

      <aside
        className={`app-shell__sidebar ${sidebarWidthClass} ${
          isMobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        } fixed inset-y-0 left-0 z-50 flex h-full flex-col overflow-y-auto border-r border-emerald-500/10 bg-gradient-to-b from-gray-950/95 via-gray-900/95 to-gray-950/98 shadow-2xl shadow-emerald-900/20 transition-[transform,width] duration-300 ease-in-out md:static md:h-screen md:flex-shrink-0 md:translate-x-0`}
        role="navigation"
        aria-label="Main"
        style={{
          width: isDesktop
            ? isExpanded ? DESKTOP_EXPANDED : DESKTOP_COLLAPSED
            : MOBILE_WIDTH,
        }}
      >
        {/* Brand + collapse toggle */}
        <div className="flex h-20 items-center justify-between border-b border-emerald-500/20 px-4">
          <div className="group relative">
            <Link
              href="/"
              className={`flex items-center focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/80 transition-all duration-200 ${
                showLabels ? "gap-3" : "justify-center"
              } ${!showLabels && isDesktop ? "cursor-pointer" : ""}`}
              onClick={(event) => {
                if (!showLabels && isDesktop) {
                  event.preventDefault();
                  setIsExpanded(true);
                  setIsLogoHovered(false);
                } else {
                  setIsMobileOpen(false);
                }
              }}
              onMouseEnter={() => {
                if (!showLabels && isDesktop) {
                  setIsLogoHovered(true);
                }
              }}
              onMouseLeave={() => {
                if (!showLabels && isDesktop) {
                  setIsLogoHovered(false);
                }
              }}
              onKeyDown={(event) => {
                if (
                  !showLabels &&
                  isDesktop &&
                  (event.key === "Enter" || event.key === " ")
                ) {
                  event.preventDefault();
                  setIsExpanded(true);
                  setIsLogoHovered(false);
                }
              }}
              aria-label={showLabels ? "LoomRead home" : "Expand sidebar"}
              role={!showLabels && isDesktop ? "button" : undefined}
              tabIndex={0}
            >
              {showLabels ? (
                <Image
                  src="/logo.png"
                  alt="LoomRead logo"
                  width={72}
                  height={72}
                  priority
                  className="h-11 w-11 rounded-2xl border border-emerald-500/40 bg-gray-900 p-1.5 object-contain shadow-[0_0_18px_rgba(16,185,129,0.35)] transition-transform duration-300 group-hover:scale-105"
                />
              ) : (
                <span className="relative flex h-11 w-11 items-center justify-center overflow-hidden rounded-2xl border border-emerald-500/40 bg-gray-900 transition-colors duration-300 group-hover:border-emerald-400/60">
                  <span
                    className={`absolute inset-0 rounded-2xl bg-emerald-500/15 transition-opacity duration-300 ${
                      isLogoHovered ? "opacity-80" : "opacity-30"
                    }`}
                    aria-hidden="true"
                  />
                  <Image
                    src="/logo.png"
                    alt="LoomRead logo"
                    fill
                    priority
                    className={`object-contain p-2 transition-all duration-300 ${
                      isLogoHovered ? "scale-75 opacity-0" : "scale-100 opacity-100"
                    }`}
                  />
                  <span
                    className={`pointer-events-none absolute flex h-6 w-6 items-center justify-center text-emerald-200 transition-all duration-300 ${
                      isLogoHovered ? "scale-100 opacity-100 rotate-0" : "scale-50 opacity-0 rotate-90"
                    }`}
                    aria-hidden="true"
                  >
                    <FontAwesomeIcon icon={faChevronRight} className="text-lg" />
                  </span>
                  <span className="sr-only">Expand sidebar</span>
                </span>
              )}
              <div
                className={`flex flex-col transition-all duration-200 ${
                  showLabels ? "opacity-100" : "hidden md:hidden"
                }`}
              >
                <span className="text-xs font-semibold uppercase tracking-[0.35em] text-emerald-200/80">
                  LoomRead
                </span>
                <span className="text-lg font-semibold text-white tracking-wide">PDF</span>
              </div>
            </Link>
            {!showLabels && isDesktop && (
              <span
                className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 hidden -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-lg border border-emerald-500/30 bg-gray-950/95 px-3 py-1 text-xs font-semibold text-white shadow-xl ring-1 ring-emerald-500/20 opacity-0 backdrop-blur-sm transition-all duration-150 ease-out group-hover:flex group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:flex group-focus-within:translate-x-0 group-focus-within:opacity-100"
                role="tooltip"
              >
                <span className="relative flex items-center gap-2">
                  Expand sidebar
                  <span className="pointer-events-none absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-sm bg-gray-950/95 ring-1 ring-emerald-500/20" />
                </span>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            {isDesktop && isExpanded && (
              <button
                type="button"
                onClick={() => setIsExpanded(false)}
                className="hidden rounded-full border border-gray-700 bg-gray-900/80 p-2 text-gray-300 transition hover:border-emerald-500/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 md:inline-flex"
                aria-label="Collapse sidebar"
              >
                <FontAwesomeIcon icon={faChevronLeft} />
              </button>
            )}

            <button
              type="button"
              onClick={() => setIsMobileOpen(false)}
              className="rounded-full border border-gray-700 bg-gray-900/80 p-2 text-gray-300 transition hover:border-emerald-500/40 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 md:hidden"
              aria-label="Close navigation"
            >
              <FontAwesomeIcon icon={faChevronLeft} />
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="flex-1 px-4 py-6">
          <NavigationList
            items={navigationItems}
            showLabels={showLabels}
            isDesktop={isDesktop}
            onNavigate={() => setIsMobileOpen(false)}
          />
        </div>

        {/* Profile section */}
        <div className="border-t border-emerald-500/15 px-4 py-5">
          <SignedIn>
            <div
              className={`group relative rounded-2xl bg-gray-900/80 shadow-inner shadow-black/40 transition-colors ${
                showLabels
                  ? "flex items-center gap-3 p-3"
                  : "flex flex-col items-center gap-3 px-3 py-4"
              }`}
              aria-label="Signed in user"
            >
              <Link
                href="/account"
                onClick={() => setIsMobileOpen(false)}
                className={`w-full rounded-xl border border-transparent p-1 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70 ${
                  showLabels ? "flex flex-1 items-center gap-3" : "flex flex-col items-center gap-3"
                }`}
              >
                {user?.imageUrl ? (
                  <div className="relative h-12 w-12 flex-shrink-0 overflow-hidden rounded-2xl border border-emerald-500/40 bg-gray-900 shadow-[0_0_14px_rgba(16,185,129,0.25)]">
                    <Image
                      src={user.imageUrl}
                      alt={`${user.firstName ?? "User"} avatar`}
                      fill
                      sizes="48px"
                      className="object-cover"
                    />
                  </div>
                ) : (
                  <span className="flex h-12 w-12 flex-shrink-0 items-center justify-center rounded-2xl border border-emerald-500/30 bg-gray-800 text-emerald-200 shadow-[0_0_10px_rgba(16,185,129,0.25)]">
                    <FontAwesomeIcon icon={faCircleUser} />
                  </span>
                )}

                <div
                  className={`min-w-0 flex-1 truncate text-left transition-opacity duration-200 ${
                    showLabels ? "opacity-100" : "hidden md:hidden"
                  }`}
                >
                  <p className="truncate text-sm font-semibold text-white">
                    {user?.fullName ?? "Anonymous"}
                  </p>
                  <p className="truncate text-xs text-gray-400">
                    {user?.primaryEmailAddress?.emailAddress ?? "Member"}
                  </p>
                </div>
              </Link>

              {showLabels && (
                <SignOutButton>
                  <button
                    type="button"
                    title="Sign out"
                    className="flex h-9 w-9 items-center justify-center rounded-lg border border-transparent bg-emerald-500/15 text-emerald-200 transition hover:border-emerald-500/40 hover:bg-emerald-500/20 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                    aria-label="Log out"
                  >
                    <FontAwesomeIcon icon={faRightFromBracket} />
                  </button>
                </SignOutButton>
              )}

              {!showLabels && isDesktop && (
                <div
                  className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 hidden -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-lg border border-emerald-500/30 bg-gray-950/95 px-3 py-2 text-xs font-semibold text-white shadow-xl ring-1 ring-emerald-500/20 opacity-0 backdrop-blur-sm transition-all duration-150 ease-out group-hover:flex group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:flex group-focus-within:translate-x-0 group-focus-within:opacity-100"
                  role="tooltip"
                >
                  <div className="relative flex flex-col gap-1">
                    <span>{user?.fullName ?? "Anonymous"}</span>
                    <span className="text-[11px] font-normal text-gray-300">
                      {user?.primaryEmailAddress?.emailAddress ?? "Member"}
                    </span>
                    <span className="pointer-events-none absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-sm bg-gray-950/95 ring-1 ring-emerald-500/20" />
                  </div>
                </div>
              )}
            </div>
          </SignedIn>

          <SignedOut>
            <div
              className={`group relative rounded-2xl border border-emerald-500/20 bg-emerald-500/10 text-gray-100 shadow-inner shadow-emerald-900/40 transition-all ${
                showLabels
                  ? "p-4"
                  : "flex flex-col items-center gap-3 px-3 py-4"
              }`}
            >
              {showLabels ? (
                <>
                  <p className="text-sm font-semibold">Welcome!</p>
                  <p className="mt-1 text-xs text-emerald-200/80">
                    Sign in to access your workspace.
                  </p>
                  <div className="mt-3 flex flex-col gap-2">
                    <SignInButton mode="modal">
                      <button className="w-full rounded-lg border border-emerald-400/40 px-4 py-2 text-sm font-medium text-emerald-100 transition hover:bg-emerald-400/10 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70">
                        Sign in
                      </button>
                    </SignInButton>
                    <Link
                      href="/sign-up"
                      className="w-full rounded-lg bg-emerald-500 px-4 py-2 text-center text-sm font-semibold text-emerald-950 transition hover:bg-emerald-400 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                    >
                      Create account
                    </Link>
                  </div>
                </>
              ) : (
                <SignInButton mode="modal">
                  <button
                    title="Sign in"
                    className="flex h-10 w-10 items-center justify-center rounded-full border border-emerald-500/40 bg-emerald-500/15 text-emerald-200 transition hover:border-emerald-400/60 hover:bg-emerald-500/25 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/70"
                    aria-label="Sign in or create account"
                  >
                    <FontAwesomeIcon icon={faCircleUser} />
                  </button>
                </SignInButton>
              )}

              {!showLabels && isDesktop && (
                <div
                  className="pointer-events-none absolute left-full top-1/2 z-40 ml-3 hidden -translate-y-1/2 translate-x-2 whitespace-nowrap rounded-lg border border-emerald-500/30 bg-gray-950/95 px-3 py-2 text-xs font-semibold text-white shadow-xl ring-1 ring-emerald-500/20 opacity-0 backdrop-blur-sm transition-all duration-150 ease-out group-hover:flex group-hover:translate-x-0 group-hover:opacity-100 group-focus-within:flex group-focus-within:translate-x-0 group-focus-within:opacity-100"
                  role="tooltip"
                >
                  <div className="relative flex items-center gap-2">
                    <span>Create an account to unlock features</span>
                    <span className="pointer-events-none absolute -left-2 top-1/2 h-3 w-3 -translate-y-1/2 rotate-45 rounded-sm bg-gray-950/95 ring-1 ring-emerald-500/20" />
                  </div>
                </div>
              )}
            </div>
          </SignedOut>
        </div>
      </aside>
    </>
  );
}

