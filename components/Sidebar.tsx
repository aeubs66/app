"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { SignedIn, SignedOut, UserButton } from "@clerk/nextjs";
import Icon, { type IconName } from "./Icon";
export default function Sidebar({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  const pathname = usePathname();
  const links: { href: string; label: string; icon: IconName }[] = [
    { href: "/", label: "Overview", icon: "grid" },
    { href: "/dashboard", label: "Documents", icon: "folder" },
    { href: "/pricing", label: "AI workspace", icon: "spark" },
  ];
  return (
    <>
      {open && (
        <button
          className="sidebar-backdrop"
          onClick={onClose}
          aria-label="Close navigation"
        />
      )}
      <aside className={`workspace-sidebar ${open ? "is-open" : ""}`}>
        <Link
          href="/"
          className="rail-logo"
          onClick={onClose}
          aria-label="LoomRead home"
        >
          <span>L</span>
          <i />
        </Link>
        <button
          className="mobile-close icon-button"
          onClick={onClose}
          aria-label="Close navigation"
        >
          <Icon name="close" />
        </button>
        <Link
          href="/upload"
          className="rail-new"
          onClick={onClose}
          aria-label="New document"
          title="New document"
        >
          <Icon name="plus" size={23} />
          <span>New</span>
        </Link>
        <nav aria-label="Main navigation">
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              onClick={onClose}
              className={`rail-link ${pathname === item.href || (item.href === "/dashboard" && pathname.startsWith("/doc/")) ? "active" : ""}`}
              aria-current={pathname === item.href ? "page" : undefined}
            >
              <Icon name={item.icon} size={21} />
              <span>{item.label}</span>
            </Link>
          ))}
        </nav>
        <div className="rail-bottom">
          <Link
            href="/help"
            className="rail-link"
            title="Help"
            onClick={onClose}
          >
            <Icon name="help" size={21} />
            <span>Help</span>
          </Link>
          <Link
            href="/account"
            className="rail-link"
            title="Settings"
            onClick={onClose}
          >
            <Icon name="settings" size={21} />
            <span>Settings</span>
          </Link>
          <div className="rail-profile">
            <SignedIn>
              <UserButton afterSignOutUrl="/" />
            </SignedIn>
            <SignedOut>
              <Link
                href="/sign-in"
                className="guest-avatar"
                aria-label="Sign in"
              >
                G
              </Link>
            </SignedOut>
          </div>
        </div>
      </aside>
    </>
  );
}
