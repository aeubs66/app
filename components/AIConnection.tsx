"use client";
import Link from "next/link";
import { useAuth } from "@clerk/nextjs";
import Icon from "./Icon";
import useAIStatus from "@/hooks/useAIStatus";
export default function AIConnection() {
  const { status, error, refresh } = useAIStatus();
  const { isSignedIn } = useAuth();
  return (
    <section className="info-card ai-connection">
      <div className="connection-heading">
        <span className="welcome-symbol">
          <Icon name="spark" size={24} />
        </span>
        <span
          className={`connection-state ${status?.configured ? "connected" : ""}`}
        >
          <i />
          {error
            ? "Status unavailable"
            : !status
              ? "Checking…"
              : status.configured
                ? "Key configured"
                : "Key needed"}
        </span>
      </div>
      <h2>Groq · GPT-OSS 20B</h2>
      <p>
        Ask questions, summarize key points, explain difficult passages, and
        create study questions. Relevant excerpts go to Groq only when you
        choose AI answers in a document.
      </p>
      <div className="connection-details">
        <div>
          <span>Provider</span>
          <strong>Groq</strong>
        </div>
        <div>
          <span>Storage</span>
          <strong>PDFs stay on this device</strong>
        </div>
        <div>
          <span>API key</span>
          <strong>Server only · never shown in the browser</strong>
        </div>
      </div>
      {error && (
        <p role="alert" className="notice error">
          {error}
        </p>
      )}
      {status && !status.configured && (
        <div className="notice">
          The workspace owner needs to add a Groq key to the server environment.
          Local search works now.
        </div>
      )}
      <div className="heading-buttons">
        {status?.requiresSignIn && !isSignedIn ? (
          <Link href="/sign-in" className="button primary">
            Sign in for AI
            <Icon name="arrow" size={16} />
          </Link>
        ) : (
          <Link href="/dashboard" className="button primary">
            Open a document
            <Icon name="arrow" size={16} />
          </Link>
        )}
        <button className="button secondary" onClick={() => void refresh()}>
          Refresh status
        </button>
      </div>
      <p className="connection-footnote">
        The Groq free plan has request and token limits. No paid subscription is
        created by this app.{" "}
        <a
          href="https://console.groq.com/docs/your-data"
          target="_blank"
          rel="noreferrer"
        >
          Groq data policy ↗
        </a>
      </p>
    </section>
  );
}
