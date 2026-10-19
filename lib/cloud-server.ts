import "server-only";
import { getAuth } from "@clerk/nextjs/server";
import { BlobNotFoundError, get } from "@vercel/blob";
import type { NextRequest } from "next/server";
import type { ReadingDocument } from "./documents";
import { documentPath } from "./cloud-documents";

export function cloudAccess(request: NextRequest, mutation = false) {
  const { userId } = getAuth(request);
  if (!userId) throw new CloudError("Sign in to save and open your cloud library.", 401);
  if (mutation && ((request.headers.get("origin") && request.headers.get("origin") !== request.nextUrl.origin) || request.headers.get("sec-fetch-site") === "cross-site"))
    throw new CloudError("Open LoomRead directly to change your library.", 403);
  if (!process.env.BLOB_READ_WRITE_TOKEN?.trim())
    throw new CloudError("Cloud storage is not connected yet. Local reading is still available.", 503);
  return userId;
}
export class CloudError extends Error {
  constructor(message: string, public status = 400) { super(message); }
}
export function cloudError(error: unknown) {
  if (error instanceof CloudError) return Response.json({ error: error.message }, { status: error.status });
  if (error instanceof BlobNotFoundError) return Response.json({ error: "This document was not found in your cloud library." }, { status: 404 });
  console.error("Cloud storage request failed", { type: error instanceof Error ? error.name : "unknown" });
  return Response.json({ error: "Cloud storage is unavailable. Check your connection and try again; your original PDF is unchanged." }, { status: 503 });
}
export async function storedDocument(userId: string, id: string) {
  let path: string;
  try { path = documentPath(userId, id); } catch { throw new CloudError("Document not found.", 404); }
  const result = await get(path, { access: "private", useCache: false });
  if (result?.statusCode !== 200) throw new CloudError("Document not found.", 404);
  return new Response(result.stream).json() as Promise<ReadingDocument>;
}
export const privateHeaders = { "Cache-Control": "private, no-store", "X-Content-Type-Options": "nosniff" };
