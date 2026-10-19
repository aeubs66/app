"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cw_guest_session_id";

function createSessionId() {
  if (
    typeof crypto !== "undefined" &&
    typeof crypto.randomUUID === "function"
  ) {
    return crypto.randomUUID();
  }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

export default function useGuestSessionId() {
  const [sessionId, setSessionId] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }
    let existing = sessionStorage.getItem(STORAGE_KEY);
    if (!existing) {
      existing = createSessionId();
      sessionStorage.setItem(STORAGE_KEY, existing);
    }
    const session = existing;
    queueMicrotask(() => setSessionId(session));
  }, []);

  return sessionId;
}
