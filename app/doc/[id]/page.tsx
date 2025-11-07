"use client";

import { useState, useEffect, useRef, use } from "react";
import { useAuth } from "@clerk/nextjs";
import Link from "next/link";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Message {
  role: "user" | "assistant";
  content: string;
  citations?: string[];
}

export default function DocChatPage({ params }: { params: Promise<{ id: string }> }) {
  // Unwrap params Promise (Next.js 15+ requirement)
  const { id } = use(params);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: "assistant",
      content: "Hello! I'm ready to answer questions about your PDF. What would you like to know?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [docTitle, setDocTitle] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { getToken } = useAuth();

  useEffect(() => {
    fetchDocumentInfo();
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const fetchDocumentInfo = async () => {
    try {
      const token = await getToken({ template: "pdfs" });
      if (!token) return;

      const response = await fetch(`${API_URL}/api/documents/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.ok) {
        const doc = await response.json();
        setDocTitle(doc.title);
      }
    } catch (error) {
      console.error("Failed to fetch document:", error);
    }
  };

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage: Message = { role: "user", content: input };
    setMessages((prev) => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const token = await getToken({ template: "pdfs" });
      if (!token) {
        throw new Error("Not authenticated");
      }

      const response = await fetch(`${API_URL}/api/documents/${id}/ask`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ question: input, k: 5 }),
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: "Request failed" }));
        throw new Error(errorData.detail || `Request failed: ${response.status}`);
      }

      const data = await response.json();
      
      const assistantMessage: Message = {
        role: "assistant",
        content: data.answer,
        citations: data.citations,
      };
      
      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Chat error:", error);
      const errorMessage: Message = {
        role: "assistant",
        content: `Error: ${error instanceof Error ? error.message : "Failed to get answer"}`,
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const renderCitation = (citation: string) => {
    // Extract page numbers from citation like "[p3]" or "[p3–4]"
    return (
      <button
        className="text-emerald-400 hover:text-emerald-300 hover:underline text-xs mx-0.5"
        onClick={() => {
          // TODO: Open PDF viewer at this page
          console.log("Navigate to", citation);
        }}
      >
        {citation}
      </button>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col">
      <div className="max-w-4xl mx-auto w-full px-4 py-8 flex-1 flex flex-col">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold text-white mb-2">
                {docTitle || "Document Chat"}
              </h1>
              <Link
                href="/dashboard"
                className="text-sm text-gray-400 hover:text-gray-300 transition-colors"
              >
                ← Back to Dashboard
              </Link>
            </div>
          </div>
        </div>

        {/* Chat Messages Area */}
        <div className="flex-1 space-y-4 mb-6 overflow-y-auto">
          {messages.map((message, index) => (
            <div
              key={index}
              className={`rounded-lg p-4 border ${
                message.role === "assistant"
                  ? "bg-gray-800 border-gray-700"
                  : "bg-gray-700 border-gray-600"
              }`}
            >
              <div className="flex items-start gap-3">
                {message.role === "assistant" && (
                  <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">AI</span>
                  </div>
                )}
                {message.role === "user" && (
                  <div className="w-8 h-8 rounded-full bg-blue-600 flex items-center justify-center flex-shrink-0">
                    <span className="text-white text-sm font-semibold">You</span>
                  </div>
                )}
                <div className="flex-1">
                  <p className="text-gray-300 whitespace-pre-wrap">{message.content}</p>
                  {message.citations && message.citations.length > 0 && (
                    <div className="mt-2 flex flex-wrap gap-1">
                      {message.citations.map((citation, i) => (
                        <span key={i}>{renderCitation(citation)}</span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
          {loading && (
            <div className="bg-gray-800 rounded-lg p-4 border border-gray-700">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                  <span className="text-white text-sm font-semibold">AI</span>
                </div>
                <div className="flex-1">
                  <p className="text-gray-400">Thinking...</p>
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Chat Input */}
        <div className="border-t border-gray-700 pt-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder="Ask a question about your PDF..."
              disabled={loading}
              className="flex-1 bg-gray-800 border border-gray-700 rounded-lg px-4 py-3 text-white placeholder-gray-500 focus:outline-none focus:border-emerald-600 disabled:opacity-50"
            />
            <button
              onClick={handleSend}
              disabled={loading || !input.trim()}
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
            >
              {loading ? "..." : "Send"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

