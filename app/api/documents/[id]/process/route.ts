import { BlobNotFoundError, get, head, put } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { cloudAccess, cloudError, CloudError, privateHeaders, storedDocument } from "@/lib/cloud-server";
import { cloudMetadata, documentPath, MAX_PDF_BYTES } from "@/lib/cloud-documents";
import { extractPDFPages, PDFReadError } from "@/lib/pdf-server";

export const runtime = "nodejs";
export const maxDuration = 60;

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = cloudAccess(request, true);
    const { id } = await params;
    const metadataPath = documentPath(userId, id);
    if (Number(request.headers.get("content-length")) > 2048)
      throw new CloudError("The document title is too long.", 413);
    const { title } = await request.json();
    if (typeof title !== "string" || !title.trim() || title.length > 250)
      throw new CloudError("Choose a document name of 250 characters or fewer.");
    // Retrying finalization must not erase an existing conversation.
    try {
      await head(metadataPath);
      return Response.json({ document: await storedDocument(userId, id) }, { headers: privateHeaders });
    } catch (error) { if (!(error instanceof BlobNotFoundError)) throw error; }
    const file = await get(documentPath(userId, id, "file.pdf"), { access: "private", useCache: false });
    if (file?.statusCode !== 200) throw new CloudError("Upload your PDF before opening it.", 404);
    if (file.blob.size > MAX_PDF_BYTES || file.blob.contentType !== "application/pdf") {
      await file.stream.cancel();
      throw new CloudError("Choose a PDF under 10 MB.");
    }
    const bytes = new Uint8Array(await new Response(file.stream).arrayBuffer());
    const pages = await extractPDFPages(bytes);
    const document = cloudMetadata({ title, pages, num_pages: pages.length,
      created_at: new Date().toISOString(), messages: [] }, id);
    document.size = file.blob.size;
    await put(metadataPath, JSON.stringify(document), { access: "private", contentType: "application/json",
      addRandomSuffix: false, allowOverwrite: false, cacheControlMaxAge: 0 });
    return Response.json({ document }, { headers: privateHeaders });
  } catch (error) {
    if (error instanceof PDFReadError) return Response.json({ error: error.message }, { status: 422, headers: privateHeaders });
    return cloudError(error);
  }
}
