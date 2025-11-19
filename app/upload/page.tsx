"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@clerk/nextjs";
import useGuestSessionId from "@/hooks/useGuestSessionId";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

export default function UploadPage() {
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [processingMessage, setProcessingMessage] = useState<string | null>(null);
  const router = useRouter();
  const { getToken, isSignedIn } = useAuth();
  const sessionId = useGuestSessionId();

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      if (selectedFile.type !== "application/pdf") {
        setError("Please select a PDF file");
        return;
      }
      if (selectedFile.size > 10 * 1024 * 1024) {
        setError("File size must be less than 10MB");
        return;
      }
      setFile(selectedFile);
      setError(null);
    }
  };

  const buildAuthHeaders = async () => {
    const headers: Record<string, string> = {};
    if (isSignedIn) {
      const token = await getToken({ template: "pdfs" });
      if (!token) {
        throw new Error("Unable to authenticate your account.");
      }
      headers.Authorization = `Bearer ${token}`;
    } else {
      if (!sessionId) {
        throw new Error("Preparing a secure guest session. Please try again in a moment.");
      }
      headers["X-Guest-Session"] = sessionId;
    }
    return headers;
  };

  const handleUpload = async () => {
    if (!file) {
      setError("Please select a file");
      return;
    }
    if (!isSignedIn && !sessionId) {
      setError("Setting up your chat session. Please wait a moment and try again.");
      return;
    }

    setUploading(true);
    setError(null);
    setProcessingMessage("Uploading and processing your PDF...");

    try {
      const headers = await buildAuthHeaders();

      const formData = new FormData();
      formData.append("file", file);

      const response = await fetch(`${API_URL}/api/documents/upload`, {
        method: "POST",
        headers,
        body: formData,
      });

      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        
        try {
          console.error("=== UPLOAD ERROR DEBUG ===");
          console.error("Response status:", response.status);
          console.error("Response statusText:", response.statusText);
          console.error("Response ok:", response.ok);
          
          const contentType = response.headers.get("content-type");
          console.error("Content-Type:", contentType);
          
          try {
            const headersObj = Object.fromEntries(response.headers.entries());
            console.error("All headers:", headersObj);
          } catch (headerError) {
            console.error("Could not read headers:", headerError);
          }
          
          // Try to read the response body
          let responseText = "";
          try {
            responseText = await response.text();
            console.error("Response text length:", responseText.length);
            console.error("Response text:", responseText);
          } catch (textError) {
            console.error("Failed to read response text:", textError);
          }
          
          if (responseText) {
            try {
              const errorData = JSON.parse(responseText);
              console.error("Parsed error data:", errorData);
              console.error("Error data keys:", Object.keys(errorData));
              errorMessage = errorData.detail || errorData.message || JSON.stringify(errorData) || errorMessage;
            } catch (parseError) {
              console.error("Failed to parse as JSON, using text:", parseError);
              errorMessage = responseText || errorMessage;
            }
          } else {
            console.error("Response body is empty!");
            errorMessage = `Upload failed: ${response.status} ${response.statusText}. Response body is empty.`;
          }
          
          console.error("Final error message:", errorMessage);
          console.error("=== END DEBUG ===");
        } catch (debugError) {
          console.error("Error during debug logging:", debugError);
          errorMessage = `Upload failed: ${response.status} ${response.statusText}`;
        }
        
        setError(errorMessage);
        setUploading(false);
        return; // Don't throw, just set error state
      }

      const data = await response.json();
      if (!data?.document_id) {
        throw new Error("Upload succeeded but no document ID was returned.");
      }

      if (typeof window !== "undefined") {
        sessionStorage.setItem(
          "cw_last_upload",
          JSON.stringify({
            documentId: data.document_id,
            title: file.name ?? "Untitled PDF",
            uploadedAt: Date.now(),
          })
        );
      }

      if (response.status === 202) {
        setProcessingMessage("PDF uploaded. Finishing up processing...");
      } else {
        setProcessingMessage("PDF ready! Opening chat...");
      }

      router.push(`/doc/${data.document_id}?welcome=1`);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
      setTimeout(() => setProcessingMessage(null), 4000);
    }
  };

  return (
    <div className="min-h-screen bg-gray-900 py-8">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Upload PDF</h1>
          <p className="text-gray-400">Upload a PDF to start chatting with it</p>
        </div>

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-8">
          <div className="border-2 border-dashed border-gray-600 rounded-lg p-12 text-center hover:border-emerald-600 transition-colors">
            <div className="mb-4">
              <svg
                className="mx-auto h-12 w-12 text-gray-400"
                stroke="currentColor"
                fill="none"
                viewBox="0 0 48 48"
              >
                <path
                  d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                  strokeWidth={2}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            
            {file ? (
              <div className="space-y-4">
                <p className="text-gray-300">{file.name}</p>
                <p className="text-gray-500 text-sm">{(file.size / 1024 / 1024).toFixed(2)} MB</p>
                <div className="flex gap-4 justify-center">
                  <button
                    onClick={() => setFile(null)}
                    className="px-4 py-2 border border-gray-600 hover:border-gray-500 text-gray-300 rounded-lg transition-colors"
                  >
                    Change file
                  </button>
                  <button
                    onClick={handleUpload}
                    disabled={uploading}
                    className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-600 disabled:cursor-not-allowed text-white font-medium rounded-lg transition-colors"
                  >
                    {uploading ? "Uploading..." : "Upload PDF"}
                  </button>
                </div>
              </div>
            ) : (
              <>
                <p className="text-gray-300 mb-2">Drag and drop your PDF here</p>
                <p className="text-gray-500 text-sm mb-4">or</p>
                <label className="cursor-pointer">
                  <span className="px-6 py-2 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors inline-block">
                    Browse files
                  </span>
                  <input
                    type="file"
                    accept=".pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                  />
                </label>
                <p className="text-gray-500 text-sm mt-4">Maximum file size: 10MB</p>
              </>
            )}

            {(error || processingMessage) && (
              <div
                className={`mt-4 rounded-lg border p-3 text-sm ${
                  error ? "border-red-700 bg-red-900/20 text-red-400" : "border-emerald-500/30 bg-emerald-500/10 text-emerald-200"
                }`}
              >
                {error ?? processingMessage}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

