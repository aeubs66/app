"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { useAuth } from "@clerk/nextjs";

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

        {/* Plan Status & Credits */}
        <div className="grid md:grid-cols-2 gap-6 mb-8">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Plan Status</h2>
            <div className="space-y-2">
              <p className="text-gray-300">Current Plan: <span className="text-emerald-400">Starter</span></p>
              <p className="text-gray-300">Status: <span className="text-emerald-400">Active</span></p>
            </div>
            <Link
              href="/account"
              className="mt-4 inline-block text-emerald-400 hover:text-emerald-300 text-sm"
            >
              Manage plan →
            </Link>
          </div>

          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <h2 className="text-lg font-semibold text-white mb-4">Credits</h2>
            <div className="space-y-2">
              <p className="text-gray-300">PDFs this month: <span className="text-white">3 / 10</span></p>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-emerald-600 h-2 rounded-full" style={{ width: "30%" }}></div>
              </div>
            </div>
          </div>
        </div>

        {/* Documents List */}
        <div className="bg-gray-800 rounded-lg border border-gray-700">
          <div className="p-6 border-b border-gray-700 flex justify-between items-center">
            <h2 className="text-lg font-semibold text-white">Your Documents</h2>
            <Link
              href="/upload"
              className="px-4 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-sm font-medium rounded-lg transition-colors"
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
                <Link
                  href="/upload"
                  className="text-emerald-400 hover:text-emerald-300"
                >
                  Upload your first PDF →
                </Link>
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

