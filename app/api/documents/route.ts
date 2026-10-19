import { list } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { cloudAccess, cloudError, storedDocument, privateHeaders } from "@/lib/cloud-server";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest) {
  try {
    const userId = cloudAccess(request);
    const cursor = request.nextUrl.searchParams.get("cursor") || undefined;
    const page = await list({ prefix: `documents/${userId}/`, limit: 100, cursor });
    const paths = page.blobs.filter(blob => blob.pathname.endsWith("/document.json"));
    const documents = [];
    // Keep origin reads below the free plan's per-second operation limit.
    for (let i = 0; i < paths.length; i += 5) {
      const group = await Promise.all(paths.slice(i, i + 5).map(async blob => {
        const doc = await storedDocument(userId, blob.pathname.split("/")[2]);
        return { id: doc.id, title: doc.title, num_pages: doc.num_pages, created_at: doc.created_at,
          last_opened_at: doc.last_opened_at, status: doc.status, mode: doc.mode, storage: doc.storage,
          size: doc.size, questionCount: doc.messages?.filter(m => m.role === "user").length || 0 };
      }));
      documents.push(...group);
    }
    return Response.json({ documents, cursor: page.hasMore ? page.cursor : null }, { headers: privateHeaders });
  } catch (error) { return cloudError(error); }
}
