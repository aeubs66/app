"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import { useAuth } from "@clerk/nextjs";
import { getPlanInfo, getLimit } from "@/lib/planFeatures";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

interface Document {
  id: string;
  title: string;
  num_pages: number;
  status: "processing" | "ready" | "failed";
  created_at: string;
}

// Note: Authentication is handled by middleware.ts
// This route is protected, so only authenticated users can access it
export default function DashboardPage() {
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const { getToken } = useAuth();

  const planSlug = "free";
  const planInfo = useMemo(() => getPlanInfo(planSlug), [planSlug]);
  const docLimit = getLimit(planSlug, "maxDocuments");

  useEffect(() => {
    fetchDocuments();
    // Poll for status updates every 5 seconds
    const interval = setInterval(fetchDocuments, 5000);
    return () => clearInterval(interval);
  }, []);

  const fetchDocuments = async () => {
    try {
      // Get JWT token using the "pdfs" template
      const token = await getToken({ template: "pdfs" });
      if (!token) return;

      const response = await fetch(`${API_URL}/api/documents/`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.ok) {
        const data = await response.json();
        setDocuments(data.documents || []);
      }
    } catch (error) {
      console.error("Failed to fetch documents:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles = {
      processing: "bg-yellow-900/20 text-yellow-400 border-yellow-700",
      ready: "bg-emerald-900/20 text-emerald-400 border-emerald-700",
      failed: "bg-red-900/20 text-red-400 border-red-700",
    };
    return (
      <span
        className={`px-2 py-1 text-xs font-medium rounded border ${
          styles[status as keyof typeof styles] || styles.processing
        }`}
      >
        {status}
      </span>
    );
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Dashboard</h1>
          <p className="text-gray-400">Manage your documents and account</p>
        </div>

        {/* Credits */}
        <div className="grid md:grid-cols-1 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Usage</h2>
            <div className="space-y-2">
              <p className="text-gray-300">
                Documents stored:{" "}
                <span className="text-white">
                  {documents.length} {docLimit === Infinity ? "" : `/ ${docLimit}`}
                </span>
              </p>
              {docLimit !== Infinity && (
                <div className="w-full bg-gray-700 rounded-full h-2">
                  <div
                    className="bg-emerald-600 h-2 rounded-full"
                    style={{ width: `${Math.min(100, (documents.length / docLimit) * 100)}%` }}
                  ></div>
                </div>
              )}
              {docLimit !== Infinity && documents.length >= docLimit && (
                <p className="text-xs text-amber-300">
                  You’ve hit the {planInfo.name} storage limit. Upgrade to keep more PDFs.
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Your Documents</h2>
            <Link
              href="/upload"
              className={`px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors ${
                docLimit !== Infinity && documents.length >= docLimit
                  ? "bg-gray-600 cursor-not-allowed opacity-60"
                  : "bg-emerald-600 hover:bg-emerald-700"
              }`}
              aria-disabled={docLimit !== Infinity && documents.length >= docLimit}
            >
              Upload PDF
            </Link>
          </div>
          <div className="p-6">
            {loading ? (
              <div className="text-center py-12">
                <p className="text-gray-400">Loading documents...</p>
              </div>
            ) : documents.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-gray-400 mb-4">No documents yet</p>
                {docLimit === Infinity || documents.length < docLimit ? (
                  <Link href="/upload" className="text-emerald-400 hover:text-emerald-300">
                    Upload your first PDF →
                  </Link>
                ) : (
                  <button
                    type="button"
                    onClick={() => document.querySelector("button[data-billing]")?.dispatchEvent(new Event("click"))}
                    className="text-emerald-400 hover:text-emerald-300"
                  >
                    Upgrade to start uploading →
                  </button>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                {documents.map((doc) => (
                  <Link
                    key={doc.id}
                    href={`/doc/${doc.id}`}
                    className="block p-4 bg-gray-700 hover:bg-gray-600 rounded-lg border border-gray-600 transition-colors"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex-1">
                        <h3 className="text-white font-medium mb-1">{doc.title}</h3>
                        <div className="flex items-center gap-4 text-sm text-gray-400">
                          <span>{doc.num_pages} pages</span>
                          <span>•</span>
                          <span>{new Date(doc.created_at).toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div>{getStatusBadge(doc.status)}</div>
                    </div>
                  </Link>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

