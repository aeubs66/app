"use client";
import { use, useCallback, useEffect, useRef, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";
import Icon from "@/components/Icon";
import {
  getDocument,
  saveDocument,
  searchDocument,
  type ReadingDocument,
  type ReadingMessage,
} from "@/lib/documents";
import { apiRequest } from "@/lib/api";
import { buildAIContext, type AIAction } from "@/lib/ai-context";
import useAIStatus from "@/hooks/useAIStatus";
import ConfirmDialog from "@/components/ConfirmDialog";

export default function DocChatPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const { getToken, isLoaded, isSignedIn } = useAuth();
  const { status: aiStatus } = useAIStatus();
  const [aiEnabled, setAiEnabled] = useState(false);
  const [copied, setCopied] = useState<number | null>(null);
  const [clearConfirm, setClearConfirm] = useState(false);
  const [renaming, setRenaming] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const activeRequest = useRef<AbortController | null>(null);
  const [doc, setDoc] = useState<ReadingDocument | null>(null);
  const usesBuiltInReader = doc?.mode === "local" || doc?.storage === "vercel";
  const [messages, setMessages] = useState<ReadingMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");
  const [page, setPage] = useState(1);
  const [tab, setTab] = useState<"text" | "pdf">("text");
  const [pdfUrl, setPdfUrl] = useState("");
  const endRef = useRef<HTMLDivElement>(null);
  const requestLock = useRef(false);
  const load = useCallback(async () => {
    try {
      let current = await getDocument(id);
      if (!id.startsWith("local-") && !id.startsWith("cloud-")) {
        const token = await getToken({ template: "pdfs" });
        if (!token) throw new Error("Sign in to open this AI document.");
        const remote = await apiRequest<ReadingDocument>(
          `/api/documents/${encodeURIComponent(id)}`,
          token,
        );
        current = { ...current, ...remote, id, mode: "cloud" };
      }
      if (!current)
        throw new Error(
          "This document isn’t on this device. Open your library or upload the PDF again.",
        );
      current = { ...current, last_opened_at: new Date().toISOString() };
      await saveDocument(current, { sync: false });
      setDoc(current);
      setMessages(current.messages || []);
      setAiEnabled(current.aiEnabled || false);
      if (!current.pages?.some(text => text.trim().length > 10) && current.file) setTab("pdf");
      setError("");
    } catch (e) {
      setDoc(null);
      setMessages([]);
      setError(
        e instanceof Error ? e.message : "Could not open your document.",
      );
    } finally {
      setLoading(false);
    }
  }, [id, getToken]);
  useEffect(() => {
    if (id.startsWith("local-") || isLoaded)
      queueMicrotask(() => {
        void load();
      });
  }, [id, isLoaded, load]);
  useEffect(() => () => activeRequest.current?.abort(), [id]);
  useEffect(() => {
    if (!doc?.file) return;
    const url = URL.createObjectURL(doc.file);
    queueMicrotask(() => setPdfUrl(url));
    return () => URL.revokeObjectURL(url);
  }, [doc?.file]);
  useEffect(() => {
    if (doc?.mode !== "cloud" || doc.storage === "vercel" || doc.status !== "processing" || error) return;
    const timeout = window.setTimeout(() => {
      void load();
    }, 4000);
    return () => clearTimeout(timeout);
  }, [doc, load, error]);
  useEffect(() => {
    const conversation = endRef.current?.parentElement;
    conversation?.scrollTo({
      top: conversation.scrollHeight,
      behavior: "smooth",
    });
  }, [messages, sending]);
  const send = async (question: string, action: AIAction = "answer") => {
    if (
      !question.trim() ||
      !doc ||
      doc.status !== "ready" ||
      requestLock.current
    )
      return;
    requestLock.current = true;
    setSending(true);
    setError("");
    setInput("");
    const next: ReadingMessage[] = [
      ...messages,
      { role: "user", content: question.trim() },
    ];
    setMessages(next);
    const controller = new AbortController();
    activeRequest.current = controller;
    try {
      let answer: ReadingMessage;
      if (usesBuiltInReader && aiEnabled) {
        if (!doc.pages?.some(text => text.trim().length > 10))
          throw new Error("This PDF contains scanned images. You can view and save it, but questions need a PDF with selectable text.");
        if (!aiStatus?.configured)
          throw new Error(
            "The AI connection is not ready. Open AI workspace to check it, or switch to local search.",
          );
        if (aiStatus.requiresSignIn && !isSignedIn)
          throw new Error(
            "Sign in to use AI answers. Local search is available without an account.",
          );
        const history = messages
          .slice(-4)
          .map((m) => ({ role: m.role, content: m.content.slice(0, 600) }));
        const excerpts = buildAIContext(
          doc.pages || [],
          question,
          history,
          action,
        );
        const response = await fetch("/api/ai/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            question,
            title: doc.title.slice(0, 250),
            action,
            totalPages: doc.num_pages,
            excerpts,
            history,
          }),
          signal: controller.signal,
        });
        const result = await response.json();
        if (!response.ok)
          throw new Error(
            result.error || "The AI couldn’t complete this answer.",
          );
        answer = {
          role: "assistant",
          content: result.answer,
          citations: result.citations,
          engine: "groq",
          sourcePages: result.sourcePages,
        };
      } else if (usesBuiltInReader)
        answer = {
          ...searchDocument(doc.pages || [], question),
          engine: "local",
        };
      else {
        const token = await getToken({ template: "pdfs" });
        if (!token)
          throw new Error("Sign in again to continue this conversation.");
        const data = await apiRequest<{
          answer: string;
          citations?: (
            string | { page?: number; page_number?: number; text?: string }
          )[];
        }>(`/api/documents/${encodeURIComponent(id)}/ask`, token, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ question: question.trim(), k: 5 }),
          signal: controller.signal,
        });
        if (!data.answer)
          throw new Error(
            "No answer was returned. Please try your question again.",
          );
        answer = {
          role: "assistant",
          content: data.answer,
          engine: "cloud",
          citations: data.citations
            ?.map((c) =>
              typeof c === "string"
                ? { page: Number(c.match(/\d+/)?.[0] || 0) }
                : { page: c.page || c.page_number || 0, text: c.text },
            )
            .filter((c) => c.page > 0),
        };
      }
      const updated = [...next, answer];
      setMessages(updated);
      const saved = { ...doc, messages: updated };
      await saveDocument(saved);
      setDoc(saved);
    } catch (e) {
      setMessages(messages);
      setInput(question);
      if (!controller.signal.aborted)
        setError(
          e instanceof Error ? e.message : "Couldn’t answer. Please try again.",
        );
    } finally {
      setSending(false);
      requestLock.current = false;
      activeRequest.current = null;
    }
  };
  const changeAI = async (enabled: boolean) => {
    if (!doc) return;
    setAiEnabled(enabled);
    setError("");
    try {
      const updated = { ...doc, aiEnabled: enabled };
      await saveDocument(updated);
      setDoc(updated);
    } catch {
      setAiEnabled(!enabled);
      setError("Couldn’t save your reading preference.");
    }
  };
  const clearChat = async () => {
    if (!doc || sending) return;
    try {
      const updated = { ...doc, messages: [] };
      await saveDocument(updated);
      setDoc(updated);
      setMessages([]);
      setClearConfirm(false);
    } catch {
      setError("Couldn’t clear this conversation. Please try again.");
      setClearConfirm(false);
    }
  };
  const rename = async () => {
    if (!doc || !newTitle.trim()) return;
    try {
      const title =
        newTitle
          .trim()
          .slice(0, 220)
          .replace(/\.pdf$/i, "") + ".pdf";
      const updated = { ...doc, title };
      await saveDocument(updated);
      setDoc(updated);
      setRenaming(false);
    } catch {
      setError("Couldn’t rename this document.");
    }
  };
  const download = (blob: Blob, filename: string) => {
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    a.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  };
  if (loading)
    return (
      <div className="reading-loading">
        <span className="loading-ring" />
        <h2>Opening a new perspective…</h2>
      </div>
    );
  if (!doc)
    return (
      <div className="reading-loading">
        <Icon name="file" size={36} />
        <h2>We couldn’t open this document.</h2>
        <p role="alert">{error}</p>
        <Link href="/dashboard" className="button primary">
          Back to your library
        </Link>
        <button
          className="text-button"
          onClick={() => {
            setLoading(true);
            void load();
          }}
        >
          Try again
        </button>
      </div>
    );
  return (
    <div className="reading-room">
      <div className="reading-heading">
        <div>
          <Link href="/dashboard" className="reading-back">
            ← Your library
          </Link>
          {renaming ? (
            <form
              className="rename-form"
              onSubmit={(e) => {
                e.preventDefault();
                void rename();
              }}
            >
              <input
                autoFocus
                value={newTitle}
                maxLength={220}
                aria-label="Document title"
                onChange={(e) => setNewTitle(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") setRenaming(false);
                }}
              />
              <button className="button primary" disabled={!newTitle.trim()}>
                Save
              </button>
              <button
                type="button"
                className="button secondary"
                onClick={() => setRenaming(false)}
              >
                Cancel
              </button>
            </form>
          ) : (
            <h1>
              {doc.title.replace(/\.pdf$/i, "")}
              {usesBuiltInReader && (
                <button
                  className="icon-button rename-trigger"
                  onClick={() => {
                    setNewTitle(doc.title.replace(/\.pdf$/i, ""));
                    setRenaming(true);
                  }}
                  aria-label="Rename document"
                >
                  <Icon name="settings" size={16} />
                </button>
              )}
            </h1>
          )}
          <p>
            <span className="status-dot" />
            {doc.num_pages} pages <span>·</span>
            {doc.storage === "vercel" ? "Saved to your private cloud library" : usesBuiltInReader
              ? aiEnabled
                ? "Groq AI · PDF saved on this device"
                : "Local reading · source passages"
              : "Connected AI workspace"}
            {doc.sample && <span className="sample-tag">SAMPLE</span>}
          </p>
        </div>
        <div className="heading-buttons">
          {messages.length > 0 && (
            <button
              className="button secondary"
              disabled={sending}
              onClick={() => setClearConfirm(true)}
              aria-label="Clear chat"
            >
              <Icon name="trash" size={16} />
              <span>Clear chat</span>
            </button>
          )}
          {doc.file && (
            <button
              className="button secondary"
              onClick={() => download(doc.file!, doc.title)}
              aria-label="Download PDF"
            >
              <Icon name="download" size={16} />
              <span>Download PDF</span>
            </button>
          )}
          <button
            className="button secondary"
            disabled={!messages.length}
            aria-label="Export chat"
            onClick={() =>
              download(
                new Blob(
                  [
                    messages
                      .map(
                        (m) =>
                          `${m.role === "user" ? "You" : "LoomRead"}: ${m.content}`,
                      )
                      .join("\n\n"),
                  ],
                  { type: "text/plain" },
                ),
                `${doc.title.replace(/\.pdf$/i, "")}-conversation.txt`,
              )
            }
          >
            <Icon name="download" size={16} />
            <span>Export chat</span>
          </button>
        </div>
      </div>
      <div className="reading-columns">
        <section className="pdf-panel" aria-label="Document preview">
          <div className="panel-toolbar">
            <span>
              <Icon name="file" size={16} />
              Your document
            </span>
            <div className="preview-tabs">
              <button
                className={tab === "text" ? "selected" : ""}
                onClick={() => setTab("text")}
              >
                Text
              </button>
              <button
                className={tab === "pdf" ? "selected" : ""}
                disabled={!pdfUrl}
                onClick={() => setTab("pdf")}
              >
                PDF
              </button>
            </div>
          </div>
          <div className="page-controls">
            <button
              className="icon-button"
              aria-label="Previous page"
              disabled={page <= 1}
              onClick={() => setPage((p) => p - 1)}
            >
              ←
            </button>
            <span>
              Page{" "}
              <select
                value={page}
                onChange={(e) => setPage(Number(e.target.value))}
                aria-label="Jump to page"
              >
                {Array.from({ length: Math.max(1, doc.num_pages) }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {i + 1}
                  </option>
                ))}
              </select>{" "}
              of {Math.max(1, doc.num_pages)}
            </span>
            <button
              className="icon-button"
              aria-label="Next page"
              disabled={page >= doc.num_pages}
              onClick={() => setPage((p) => p + 1)}
            >
              →
            </button>
          </div>
          {tab === "pdf" && pdfUrl ? (
            <iframe
              key={page}
              className="pdf-frame"
              src={`${pdfUrl}#page=${page}`}
              title={`${doc.title}, page ${page}`}
            />
          ) : (
            <div className="text-preview">
              <div className="reading-paper">
                <span className="paper-overline">
                  {doc.sample
                    ? "LOOMREAD / FIELD NOTES"
                    : "DOCUMENT / EXTRACTED TEXT"}
                </span>
                <div className="reading-paper-rule" />
                <div className="page-text">
                  {doc.pages?.[page - 1] ||
                    "A text preview is available for documents uploaded on this device. You can still ask questions about this document in the AI workspace."}
                </div>
                <span className="reading-page-number">
                  {String(page).padStart(2, "0")}
                </span>
              </div>
            </div>
          )}
        </section>
        <section
          className="conversation-panel"
          aria-label="Document conversation"
        >
          <div className="panel-toolbar">
            <span>
              <Icon name="spark" size={17} />A conversation with your document
            </span>
            <span className="live-pill">
              {usesBuiltInReader ? (aiEnabled ? "GROQ AI" : "LOCAL") : "AI"}
            </span>
          </div>
          {usesBuiltInReader && (
            <div className="answer-mode-panel">
              <div className="answer-mode-tabs" aria-label="Answer mode">
                <button
                  className={!aiEnabled ? "selected" : ""}
                  disabled={sending}
                  onClick={() => void changeAI(false)}
                  aria-pressed={!aiEnabled}
                >
                  <Icon name="search" size={14} />
                  Local search
                </button>
                <button
                  className={aiEnabled ? "selected" : ""}
                  disabled={sending}
                  onClick={() => void changeAI(true)}
                  aria-pressed={aiEnabled}
                >
                  <Icon name="spark" size={14} />
                  AI answers
                </button>
              </div>
              <p>
                {aiEnabled
                  ? "Selected document passages and recent messages are sent to Groq when you ask a question."
                  : "Searches your document on this device. No document text is sent to AI."}
              </p>
              {aiEnabled &&
                (!aiStatus?.configured ||
                  (aiStatus.requiresSignIn && !isSignedIn)) && (
                  <Link
                    href={
                      aiStatus?.requiresSignIn && !isSignedIn
                        ? "/sign-in"
                        : "/pricing"
                    }
                    className="text-button"
                  >
                    {aiStatus?.requiresSignIn && !isSignedIn
                      ? "Sign in to use AI answers"
                      : "Check AI connection"}
                    <Icon name="arrow" size={13} />
                  </Link>
                )}
            </div>
          )}
          <div className="conversation-messages" aria-live="polite">
            <div className="conversation-welcome">
              <span className="welcome-symbol">
                <Icon name="spark" size={26} />
              </span>
              <span className="eyebrow">LET CURIOSITY LEAD</span>
              <h2>
                There’s more between
                <br />
                the lines.
              </h2>
              <p>
                {usesBuiltInReader && !aiEnabled
                  ? "Ask a question to find relevant passages. Every result takes you back to the original page."
                  : "Ask a question, explore an idea, or find the key takeaways. Your document is the starting point."}
              </p>
              {!messages.length && (
                <div className="suggested-questions">
                  {[
                    "What are the key takeaways?",
                    "What does it say about attention?",
                    "How can I apply these ideas?",
                  ].map((q, i) => (
                    <button
                      key={q}
                      onClick={() =>
                        void send(
                          i === 1 && !doc.sample
                            ? "What are the main ideas?"
                            : q,
                        )
                      }
                      disabled={doc.status !== "ready" || sending}
                    >
                      <Icon
                        name={i === 0 ? "spark" : i === 1 ? "search" : "chat"}
                        size={16}
                      />
                      {i === 1 && !doc.sample ? "What are the main ideas?" : q}
                      <Icon name="arrow" size={15} />
                    </button>
                  ))}
                </div>
              )}
            </div>
            {messages.map((m, index) => (
              <article className={`message ${m.role}`} key={index}>
                <span className="message-avatar">
                  {m.role === "user" ? "Y" : <Icon name="spark" size={16} />}
                </span>
                <div>
                  <span className="message-author">
                    {m.role === "user" ? "You" : "LoomRead"}
                    {m.role === "assistant" && (
                      <small>
                        {m.engine === "groq"
                          ? "GROQ AI"
                          : m.engine === "cloud" || !usesBuiltInReader
                            ? "DOCUMENT AI"
                            : "SOURCE PASSAGES"}
                      </small>
                    )}
                  </span>
                  <p>{m.content}</p>
                  {m.engine === "groq" && m.sourcePages && (
                    <p className="source-coverage">
                      Based on {m.sourcePages.length} of {doc.num_pages}{" "}
                      {doc.num_pages === 1 ? "page" : "pages"} · selected
                      excerpts
                    </p>
                  )}
                  {m.citations && (
                    <div className="citations">
                      {m.citations.map((c, i) => (
                        <button
                          key={i}
                          className="citation"
                          onClick={() => {
                            setPage(
                              Math.max(
                                1,
                                Math.min(doc.num_pages || c.page, c.page),
                              ),
                            );
                            setTab("text");
                          }}
                        >
                          <Icon name="file" size={12} />
                          Page {c.page}
                          <Icon name="arrow" size={12} />
                        </button>
                      ))}
                    </div>
                  )}
                  <button
                    className="text-button copy-answer"
                    onClick={async () => {
                      try {
                        await navigator.clipboard.writeText(m.content);
                        setCopied(index);
                        setTimeout(() => setCopied(null), 2000);
                      } catch {
                        setError(
                          "Couldn’t copy. Select the message text and copy it manually.",
                        );
                      }
                    }}
                  >
                    {copied === index ? "Copied ✓" : "Copy text"}
                  </button>
                </div>
              </article>
            ))}
            {sending && (
              <p className="thinking" role="status">
                {aiEnabled || !usesBuiltInReader
                  ? "Reading your sources"
                  : "Finding relevant passages"}
                <span>…</span>
              </p>
            )}
            <div ref={endRef} />
          </div>
          <div className="conversation-input-area">
            <div className="reading-actions">
              <button
                disabled={sending || doc.status !== "ready"}
                onClick={() =>
                  void send(
                    "Summarize the key takeaways from the provided document passages.",
                    "summary",
                  )
                }
              >
                <Icon name="file" size={13} />
                Summarize
              </button>
              <button
                disabled={sending || doc.status !== "ready"}
                onClick={() =>
                  void send(
                    "Explain the main ideas in simple terms.",
                    "explain",
                  )
                }
              >
                <Icon name="spark" size={13} />
                Explain simply
              </button>
              {(aiEnabled || !usesBuiltInReader) && (
                <button
                  disabled={sending || doc.status !== "ready"}
                  onClick={() =>
                    void send(
                      "Create three study questions with answers based only on these document passages.",
                      "quiz",
                    )
                  }
                >
                  <Icon name="book" size={13} />
                  Quiz me
                </button>
              )}
            </div>
            {error && (
              <div className="notice error" role="alert">
                {error}
                <button
                  className="icon-button"
                  aria-label="Dismiss error"
                  onClick={() => setError("")}
                >
                  <Icon name="close" size={14} />
                </button>
              </div>
            )}
            {doc.status !== "ready" && (
              <div className="notice" role="status">
                {doc.status === "failed"
                  ? "Processing failed. Try uploading this document again."
                  : "Your PDF is being processed. You can start asking questions when it’s ready."}
                {doc.status === "processing" && (
                  <button className="text-button" onClick={() => void load()}>
                    Refresh
                  </button>
                )}
              </div>
            )}
            <form
              className="chat-form"
              onSubmit={(e) => {
                e.preventDefault();
                void send(input);
              }}
            >
              <textarea
                rows={2}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="What are you curious about?"
                aria-label="Ask about your document"
                maxLength={2000}
                disabled={sending || doc.status !== "ready"}
                onKeyDown={(e) => {
                  if (
                    e.key === "Enter" &&
                    !e.shiftKey &&
                    !e.nativeEvent.isComposing
                  ) {
                    e.preventDefault();
                    void send(input);
                  }
                }}
              />
              {sending ? (
                <button
                  className="send-button"
                  type="button"
                  onClick={() => activeRequest.current?.abort()}
                  aria-label="Cancel answer"
                >
                  <Icon name="close" size={18} />
                </button>
              ) : (
                <button
                  className="send-button"
                  disabled={!input.trim() || sending || doc.status !== "ready"}
                  aria-label="Send question"
                >
                  <Icon name="arrow" size={20} />
                </button>
              )}
            </form>
            <p className="input-footnote">
              {usesBuiltInReader && !aiEnabled
                ? "Finds matching source text on your device. Not an AI-generated answer."
                : "AI can make mistakes. Follow citations to verify the source."}
            </p>
          </div>
        </section>
      </div>
      {clearConfirm && (
        <ConfirmDialog
          titleId="clear-chat-title"
          onDismiss={() => setClearConfirm(false)}
        >
          <h2 id="clear-chat-title">Start a fresh conversation?</h2>
          <p>
            This clears the conversation stored in this browser. Your PDF stays
            in your library. Export the chat first if you want a copy.
          </p>
          <div>
            <button
              autoFocus
              className="button secondary"
              onClick={() => setClearConfirm(false)}
            >
              Keep conversation
            </button>
            <button className="button danger" onClick={() => void clearChat()}>
              Clear conversation
            </button>
          </div>
        </ConfirmDialog>
      )}
    </div>
  );
}
