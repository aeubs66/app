import type { ReadingDocument } from "./documents.ts";

export const MAX_PDF_BYTES = 10 * 1024 * 1024;
export const MAX_METADATA_BYTES = 2 * 1024 * 1024;
export function documentPath(userId: string, id: string, file = "document.json") {
  if (!/^user_[a-zA-Z0-9]+$/.test(userId) ||
      !/^cloud-[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/.test(id) ||
      !["document.json", "file.pdf"].includes(file)) {
    throw new Error("Invalid document location.");
  }
  return `documents/${userId}/${id}/${file}`;
}

// Whitelist fields: clients cannot supply storage URLs or another owner's paths.
export function cloudMetadata(value: unknown, id: string): ReadingDocument {
  const doc = value as Partial<ReadingDocument> | null;
  if (!doc || typeof doc.title !== "string" || !doc.title.trim() || doc.title.length > 250 ||
      !Number.isInteger(doc.num_pages) || doc.num_pages! < 1 || doc.num_pages! > 500 ||
      !Array.isArray(doc.pages) || doc.pages.length !== doc.num_pages ||
      doc.pages.some(p => typeof p !== "string") ||
      (doc.messages !== undefined && (!Array.isArray(doc.messages) || doc.messages.length > 200))) {
    throw new Error("Invalid document details. PDFs can contain up to 500 pages.");
  }
  const messages = (doc.messages || []).map(message => {
    if (!message || !["user", "assistant"].includes(message.role) ||
        typeof message.content !== "string" || message.content.length > 12000) {
      throw new Error("Invalid conversation details.");
    }
    return {
      role: message.role,
      content: message.content,
      ...(Array.isArray(message.citations) ? { citations: message.citations
        .filter(c => c && Number.isInteger(c.page) && c.page >= 1 && c.page <= doc.num_pages!)
        .slice(0, 6).map(c => ({ page: c.page })) } : {}),
      ...(message.engine && ["local", "groq", "cloud"].includes(message.engine) ? { engine: message.engine } : {}),
      ...(Array.isArray(message.sourcePages) ? { sourcePages: message.sourcePages.filter(p => Number.isInteger(p) && p >= 1 && p <= doc.num_pages!).slice(0, 6) } : {}),
    };
  });
  const date = (value: unknown) => typeof value === "string" && Number.isFinite(Date.parse(value)) ? value : new Date().toISOString();
  const result: ReadingDocument = {
    id, title: doc.title.trim(), num_pages: doc.num_pages!,
    created_at: date(doc.created_at), last_opened_at: date(doc.last_opened_at),
    status: "ready", mode: "cloud", storage: "vercel", pages: doc.pages,
    messages, aiEnabled: doc.aiEnabled === true,
  };
  if (new TextEncoder().encode(JSON.stringify(result)).length > MAX_METADATA_BYTES)
    throw new Error("This document and conversation contain too much text to sync. Try a smaller PDF or clear the conversation.");
  return result;
}
