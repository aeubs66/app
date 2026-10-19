"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import Icon from "./Icon";
import {
  listDocuments,
  openSample,
  readPdf,
  removeDocument,
  saveDocument,
  type ReadingDocument,
} from "@/lib/documents";
import { apiRequest } from "@/lib/api";
import useAIStatus from "@/hooks/useAIStatus";
import ConfirmDialog from "./ConfirmDialog";

export default function ReadingWorkspace({
  library = false,
}: {
  library?: boolean;
}) {
  const router = useRouter();
  const { isSignedIn, getToken } = useAuth();
  const { status: aiStatus } = useAIStatus();
  const legacyCloud = process.env.NEXT_PUBLIC_ENABLE_LEGACY_BACKEND === "true";
  const inputRef = useRef<HTMLInputElement>(null);
  const uploadLock = useRef(false);
  const [documents, setDocuments] = useState<ReadingDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState("");
  const [dragging, setDragging] = useState(false);
  const [mode, setMode] = useState<"local" | "cloud">("local");
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [view, setView] = useState<"grid" | "list">("grid");
  const [pendingDelete, setPendingDelete] = useState<string | null>(null);
  const refresh = useCallback(async () => {
    try {
      const docs = await listDocuments();
      setDocuments(
        docs.sort(
          (a, b) =>
            Date.parse(b.last_opened_at || b.created_at) -
            Date.parse(a.last_opened_at || a.created_at),
        ),
      );
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not load your library.");
    } finally {
      setLoading(false);
    }
  }, []);
  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
    window.addEventListener("loomread:documents", refresh);
    return () => window.removeEventListener("loomread:documents", refresh);
  }, [refresh]);
  const connectCloud = async () => {
    setError("");
    setBusy("Connecting your AI library…");
    try {
      const token = await getToken({ template: "pdfs" });
      if (!token) throw new Error("Sign in to connect your AI workspace.");
      const data = await apiRequest<{ documents: ReadingDocument[] }>(
        "/api/documents/",
        token,
      );
      const local = await listDocuments();
      const localMap = new Map(local.map((d) => [d.id, d]));
      await Promise.all(
        (data.documents || []).map((d) =>
          saveDocument({ ...localMap.get(d.id), ...d, mode: "cloud" }),
        ),
      );
      await refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Unable to connect.");
    } finally {
      setBusy("");
    }
  };
  const upload = async (file?: File) => {
    if (!file || uploadLock.current) return;
    setError("");
    if (
      !file.name.toLowerCase().endsWith(".pdf") &&
      file.type !== "application/pdf"
    ) {
      setError("Choose a PDF file to get started.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      setError("This file is too large. Choose a PDF under 10 MB.");
      return;
    }
    if (!file.size) {
      setError("This file is empty. Choose another PDF.");
      return;
    }
    uploadLock.current = true;
    setBusy("Opening your PDF…");
    try {
      const pages = await readPdf(file, (page, total) =>
        setBusy(`Reading page ${page} of ${total}…`),
      );
      if (!pages.some((p) => p.trim().length > 10))
        throw new Error(
          "This PDF has no readable text. Try a text-based PDF; scanned images need OCR first.",
        );
      let id = `local-${crypto.randomUUID()}`;
      if (mode === "cloud") {
        const token = await getToken({ template: "pdfs" });
        if (!token)
          throw new Error("Sign in before uploading to your AI workspace.");
        setBusy("Uploading to your AI workspace…");
        const body = new FormData();
        body.append("file", file);
        const data = await apiRequest<{ document_id: string }>(
          "/api/documents/upload",
          token,
          { method: "POST", body },
        );
        if (!data.document_id)
          throw new Error(
            "The service did not return a document. Please try again.",
          );
        id = data.document_id;
      }
      await saveDocument({
        id,
        title: file.name,
        created_at: new Date().toISOString(),
        num_pages: pages.length,
        status: mode === "cloud" ? "processing" : "ready",
        mode,
        pages,
        file,
        size: file.size,
      });
      router.push(`/doc/${encodeURIComponent(id)}`);
    } catch (e) {
      setError(
        e instanceof Error
          ? e.message
          : "Couldn’t read this PDF. Try a different file.",
      );
    } finally {
      setBusy("");
      uploadLock.current = false;
      if (inputRef.current) inputRef.current.value = "";
    }
  };
  const trySample = async () => {
    if (busy) return;
    setBusy("Opening your sample…");
    setError("");
    try {
      router.push(`/doc/${await openSample()}`);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Could not open sample.");
    } finally {
      setBusy("");
    }
  };
  const filtered = documents.filter(
    (d) =>
      d.title.toLowerCase().includes(query.toLowerCase()) &&
      (filter === "all" || d.mode === filter),
  );
  const visible = library ? filtered : filtered.slice(0, 3);
  return (
    <div className="overview-page">
      <div className="page-intro">
        <div>
          <div className="eyebrow">
            <span />
            LESS SCROLLING. MORE UNDERSTANDING.
          </div>
          <h1>
            {library ? (
              <>
                Your knowledge.
                <br />
                <em>Organized.</em>
              </>
            ) : (
              <>
                Big documents.
                <br />
                <em>Bigger ideas.</em>
              </>
            )}
          </h1>
          <p>
            {library
              ? "Every document, every conversation. Pick up where you left off."
              : "Drop in a PDF. Pull out the answers. Make your next breakthrough."}
          </p>
        </div>
        <div className="hero-visual" aria-hidden="true">
          <div className="hero-visual-grid" />
          <div className="hero-orbit" />
          <div className="hero-orbit inner" />
          <div className="hero-file back">
            <Icon name="file" size={45} />
          </div>
          <div className="hero-file front">
            <span>PDF</span>
            <Icon name="file" size={57} />
            <i />
            <i />
            <i />
          </div>
          <span className="hero-signal">
            <Icon name="spark" size={18} />
            Ideas, unlocked.
          </span>
          <span className="hero-corner">[ YOUR NEXT BIG IDEA ]</span>
        </div>
      </div>
      <div className="workspace-metrics">
        <div>
          <span className="metric-icon blue">
            <Icon name="folder" size={19} />
          </span>
          <span>
            <strong>{documents.length.toString().padStart(2, "0")}</strong>
            <small>Documents</small>
          </span>
        </div>
        <div>
          <span className="metric-icon violet">
            <Icon name="file" size={19} />
          </span>
          <span>
            <strong>
              {documents
                .reduce((total, doc) => total + (doc.num_pages || 0), 0)
                .toString()
                .padStart(2, "0")}
            </strong>
            <small>Pages in your library</small>
          </span>
        </div>
        <div>
          <span className="metric-icon pink">
            <Icon name="chat" size={19} />
          </span>
          <span>
            <strong>
              {documents
                .reduce(
                  (total, doc) =>
                    total +
                    (doc.messages?.filter((m) => m.role === "user").length ||
                      0),
                  0,
                )
                .toString()
                .padStart(2, "0")}
            </strong>
            <small>Questions explored</small>
          </span>
        </div>
        <span className="metrics-label">
          <span />
          YOUR WORKSPACE, AT A GLANCE
        </span>
      </div>
      {!library && (
        <>
          <div className="start-grid">
            <section
              className={`upload-card ${dragging ? "dragging" : ""}`}
              onDragOver={(e) => {
                e.preventDefault();
                setDragging(true);
              }}
              onDragLeave={(e) => {
                if (!e.currentTarget.contains(e.relatedTarget as Node))
                  setDragging(false);
              }}
              onDrop={(e) => {
                e.preventDefault();
                setDragging(false);
                void upload(e.dataTransfer.files[0]);
              }}
              aria-busy={!!busy}
            >
              <div className="card-topline">
                <span className="eyebrow">
                  <Icon name="upload" size={14} />
                  IMPORT A DOCUMENT
                </span>
                <span className="step-number">START HERE ↙</span>
              </div>
              <div className="upload-zone">
                <div className="upload-illustration">
                  <span className="paper-back" />
                  <span className="paper-front">
                    <Icon name="file" size={31} />
                  </span>
                  <span className="upload-badge">
                    <Icon name="plus" size={17} />
                  </span>
                </div>
                <h2>
                  {busy ||
                    (dragging
                      ? "Drop it. We’re ready."
                      : "Drop your next big idea.")}
                </h2>
                <p>Drag &amp; drop your PDF, or browse your files.</p>
                <button
                  className="button primary upload-button"
                  disabled={!!busy}
                  onClick={() => inputRef.current?.click()}
                >
                  <Icon name="upload" size={17} />
                  {busy ? "Preparing document…" : "Upload a document"}
                  <Icon name="arrow" size={16} />
                </button>
                <input
                  ref={inputRef}
                  type="file"
                  accept=".pdf,application/pdf"
                  aria-label="Choose a PDF"
                  className="sr-only"
                  onChange={(e) => void upload(e.target.files?.[0])}
                />
                <small>
                  PDF up to 10 MB <span>·</span> Up to 500 pages
                </small>
              </div>
              <div className="upload-card-bottom">
                <span>
                  <Icon name="shield" size={14} />
                  {mode === "local"
                    ? "Stays on this device"
                    : "Sent to your AI workspace"}
                </span>
                <div className="mode-switch" aria-label="Reading mode">
                  <button
                    className={mode === "local" ? "selected" : ""}
                    onClick={() => setMode("local")}
                    disabled={!!busy}
                  >
                    Local reading
                  </button>
                  {isSignedIn && legacyCloud ? (
                    <button
                      className={mode === "cloud" ? "selected" : ""}
                      onClick={() => setMode("cloud")}
                      disabled={!!busy}
                    >
                      AI workspace
                    </button>
                  ) : (
                    <Link href="/pricing">
                      {aiStatus?.configured
                        ? "AI available after import ↗"
                        : "Connect AI ↗"}
                    </Link>
                  )}
                </div>
              </div>
            </section>
            <section className="sample-card">
              <div className="sample-top">
                <span className="eyebrow">THE TEST DRIVE</span>
                <span className="sample-tag">SAMPLE PDF</span>
              </div>
              <div className="sample-art" aria-hidden="true">
                <div className="orbit orbit-one" />
                <div className="orbit orbit-two" />
                <span className="art-spark one">✦</span>
                <span className="art-spark two">✧</span>
                <div className="sample-paper">
                  <div className="paper-meta">
                    LOOMREAD FIELD NOTES <span>№ 01</span>
                  </div>
                  <div className="paper-rule" />
                  <h3>
                    The art of
                    <br />
                    focused
                    <br />
                    <i>reading.</i>
                  </h3>
                  <div className="paper-lines">
                    <i />
                    <i />
                    <i />
                  </div>
                  <span className="paper-footer">
                    A FIELD GUIDE FOR CURIOUS MINDS
                  </span>
                </div>
                <div className="floating-chat">
                  <Icon name="chat" size={15} />
                  <span>What are the key takeaways?</span>
                  <span className="chat-spark">✧</span>
                </div>
              </div>
              <div className="sample-copy">
                <h2>Zero setup. All discovery.</h2>
                <p>Explore a sample and see where curiosity takes you.</p>
                <button
                  className="text-button"
                  onClick={trySample}
                  disabled={!!busy}
                >
                  Try the sample document <Icon name="arrow" size={17} />
                </button>
              </div>
            </section>
          </div>
          <div className="benefit-row">
            <div>
              <span className="benefit-icon">
                <Icon name="chat" />
              </span>
              <span>
                <strong>Ask your own questions</strong>
                <small>Get closer to what matters.</small>
              </span>
            </div>
            <div>
              <span className="benefit-icon">
                <Icon name="file" />
              </span>
              <span>
                <strong>Always find your source</strong>
                <small>Follow citations back to the page.</small>
              </span>
            </div>
            <div>
              <span className="benefit-icon">
                <Icon name="book" />
              </span>
              <span>
                <strong>Keep your thinking together</strong>
                <small>Your documents, in one quiet space.</small>
              </span>
            </div>
          </div>
        </>
      )}
      {error && (
        <div className="notice error" role="alert">
          <Icon name="help" size={19} />
          <span>{error}</span>
          <button
            className="icon-button"
            onClick={() => setError("")}
            aria-label="Dismiss error"
          >
            <Icon name="close" size={16} />
          </button>
        </div>
      )}
      <section className="documents-section">
        <div className="section-heading">
          <div>
            <h2>
              {library ? "Document library" : "Recently opened"}
              <span className="count-badge">{documents.length}</span>
            </h2>
            <p>
              {library
                ? "Find a document and make a little more sense of it."
                : "Your next answer might already be in here."}
            </p>
          </div>
          {library ? (
            <div className="heading-buttons">
              {isSignedIn && legacyCloud && (
                <button
                  className="button secondary"
                  onClick={connectCloud}
                  disabled={!!busy}
                >
                  Sync AI library
                </button>
              )}
              <Link href="/upload" className="button primary">
                <Icon name="plus" size={16} />
                Add document
              </Link>
            </div>
          ) : (
            <Link href="/dashboard" className="text-button">
              View all documents <Icon name="arrow" size={16} />
            </Link>
          )}
        </div>
        {(library || documents.length > 0) && (
          <div className="library-toolbar">
            <div className="filter-tabs" aria-label="Filter documents">
              {[
                ["all", "All documents"],
                ["local", "On this device"],
                ["cloud", "Cloud library"],
              ]
                .filter(
                  ([value]) =>
                    value !== "cloud" ||
                    legacyCloud ||
                    documents.some((d) => d.mode === "cloud"),
                )
                .map(([value, label]) => (
                  <button
                    key={value}
                    onClick={() => setFilter(value)}
                    className={filter === value ? "selected" : ""}
                  >
                    {label}
                  </button>
                ))}
            </div>
            <div className="library-tools">
              <label className="search-field">
                <Icon name="search" size={16} />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Find a document…"
                  aria-label="Find a document"
                />
              </label>
              <button
                className={`icon-button ${view === "grid" ? "selected" : ""}`}
                onClick={() => setView("grid")}
                aria-label="Grid view"
                aria-pressed={view === "grid"}
              >
                <Icon name="grid" size={17} />
              </button>
              <button
                className={`icon-button ${view === "list" ? "selected" : ""}`}
                onClick={() => setView("list")}
                aria-label="List view"
                aria-pressed={view === "list"}
              >
                <Icon name="list" size={17} />
              </button>
            </div>
          </div>
        )}
        {loading ? (
          <div className="library-empty">Opening your library…</div>
        ) : visible.length ? (
          <div
            className={`document-grid ${view === "list" ? "list-view" : ""}`}
          >
            {visible.map((doc, index) => (
              <article
                className={`document-card tone-${index % 3}`}
                key={doc.id}
              >
                <Link
                  className="document-card-link"
                  href={`/doc/${encodeURIComponent(doc.id)}`}
                >
                  <div className="document-preview">
                    <span className="document-kind">PDF</span>
                    <div className="mini-paper">
                      <span className="mini-paper-label">
                        {doc.sample ? "FIELD NOTES" : "YOUR DOCUMENT"}
                      </span>
                      <strong>{doc.title.replace(/\.pdf$/i, "")}</strong>
                      <div className="mini-lines">
                        <i />
                        <i />
                        <i />
                        <i />
                      </div>
                    </div>
                    <span className="doc-open">
                      <Icon name="arrow" size={17} />
                    </span>
                  </div>
                  <div className="document-info">
                    <h3>{doc.title}</h3>
                    <div>
                      <span>{doc.num_pages} pages</span>
                      <span>·</span>
                      <span>
                        {doc.mode === "local"
                          ? "On this device"
                          : "AI workspace"}
                      </span>
                    </div>
                    <div className="document-meta">
                      <span>
                        <Icon name="clock" size={12} />
                        {new Date(
                          doc.last_opened_at || doc.created_at,
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        })}
                      </span>
                      <span className={`status-label ${doc.status}`}>
                        <span />
                        {doc.status === "ready"
                          ? "Ready to read"
                          : doc.status === "failed"
                            ? "Needs attention"
                            : "Processing"}
                      </span>
                    </div>
                  </div>
                </Link>
                {doc.mode === "local" && (
                  <button
                    className="delete-document icon-button"
                    aria-label={`Remove ${doc.title}`}
                    onClick={() => setPendingDelete(doc.id)}
                  >
                    <Icon name="trash" size={15} />
                  </button>
                )}
              </article>
            ))}
          </div>
        ) : (
          <div className="library-empty">
            <span className="empty-icon">
              <Icon name="folder" size={25} />
            </span>
            <h3>
              {query || filter !== "all"
                ? "No matching documents"
                : "A little space for your next big idea."}
            </h3>
            <p>
              {query || filter !== "all"
                ? "Try another search or change your filter."
                : "Add your first PDF, or explore our short sample to get started."}
            </p>
            {!query && filter === "all" && (
              <button
                className="text-button"
                onClick={trySample}
                disabled={!!busy}
              >
                Open the sample <Icon name="arrow" size={16} />
              </button>
            )}
          </div>
        )}
      </section>
      <div className="bottom-tip">
        <span>✧</span>
        <p>
          <strong>A thought to start with</strong> Try asking “What are the key
          takeaways?” when you open your next document.
        </p>
        <Link href="/help" aria-label="Read getting started guide">
          <Icon name="arrow" size={17} />
        </Link>
      </div>
      {pendingDelete && (
        <ConfirmDialog
          titleId="delete-title"
          onDismiss={() => setPendingDelete(null)}
        >
          <span className="empty-icon">
            <Icon name="trash" />
          </span>
          <h2 id="delete-title">Remove this document?</h2>
          <p>
            This removes the PDF and its conversation from this browser. Your
            original file stays on your device.
          </p>
          <div>
            <button
              autoFocus
              className="button secondary"
              onClick={() => setPendingDelete(null)}
            >
              Keep document
            </button>
            <button
              className="button danger"
              onClick={async () => {
                try {
                  await removeDocument(pendingDelete);
                  setPendingDelete(null);
                } catch (e) {
                  setError(
                    e instanceof Error
                      ? e.message
                      : "Could not remove document.",
                  );
                  setPendingDelete(null);
                }
              }}
            >
              Remove document
            </button>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
