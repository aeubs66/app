"use client";
import { useCallback, useEffect, useState } from "react";
export interface AIStatus {
  configured: boolean;
  provider: string;
  model: string;
  requiresSignIn: boolean;
}
export default function useAIStatus() {
  const [status, setStatus] = useState<AIStatus | null>(null);
  const [error, setError] = useState("");
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/ai/status", { cache: "no-store" });
      if (!response.ok) throw new Error("AI connection status is unavailable.");
      setStatus(await response.json());
      setError("");
    } catch {
      setError(
        "Couldn’t check the AI connection. You can still use local search.",
      );
    }
  }, []);
  useEffect(() => {
    queueMicrotask(() => {
      void refresh();
    });
  }, [refresh]);
  return { status, error, refresh };
}
