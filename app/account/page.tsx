"use client";
import { SignedIn, SignedOut, UserProfile } from "@clerk/nextjs";
import Link from "next/link";
import Icon from "@/components/Icon";
import AIConnection from "@/components/AIConnection";
export default function AccountPage() {
  return (
    <div className="info-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">MAKE YOURSELF AT HOME</span>
          <h1>
            Your space. <em>Your settings.</em>
          </h1>
          <p>Manage your account and the way you read.</p>
        </div>
      </div>
      <AIConnection />
      <SignedIn>
        <div className="settings-profile">
          <UserProfile routing="hash" />
        </div>
        <Link href="/team/settings" className="text-button">
          Team workspace <Icon name="arrow" size={16} />
        </Link>
      </SignedIn>
      <SignedOut>
        <section className="info-card">
          <Icon name="shield" size={27} />
          <h2>Your local workspace</h2>
          <p>
            Local documents stay in this browser. Sign in to save new PDFs and
            conversations privately in the cloud and open them across devices.
          </p>
          <Link href="/sign-in" className="button primary">
            Sign in <Icon name="arrow" size={16} />
          </Link>
        </section>
      </SignedOut>
      <div className="settings-row">
        <div>
          <strong>Your reading data</strong>
          <p>
            Manage individual documents in your library. Download files and
            export chats before clearing browser data.
          </p>
        </div>
        <Link href="/dashboard" className="button secondary">
          Open library
        </Link>
      </div>
    </div>
  );
}
