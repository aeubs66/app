import { del, head, put } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { cloudAccess, cloudError, CloudError, storedDocument, privateHeaders } from "@/lib/cloud-server";
import { cloudMetadata, documentPath, MAX_METADATA_BYTES, MAX_PDF_BYTES } from "@/lib/cloud-documents";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
type Context = { params: Promise<{ id: string }> };
export async function GET(request: NextRequest, { params }: Context) {
  try {
    const userId = cloudAccess(request);
    return Response.json(await storedDocument(userId, (await params).id), { headers: privateHeaders });
  } catch (error) { return cloudError(error); }
}
export async function PUT(request: NextRequest, { params }: Context) {
  try {
    const userId = cloudAccess(request, true);
    const { id } = await params;
    const path = documentPath(userId, id);
    // Enforce the body limit while streaming, including requests without Content-Length.
    const reader = request.body?.getReader();
    if (!reader) throw new CloudError("Missing document details.");
    const chunks: Uint8Array[] = [];
    let size = 0;
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.length;
      if (size > MAX_METADATA_BYTES) { await reader.cancel(); throw new CloudError("Too much document text to sync. Try a smaller PDF or clear the conversation.", 413); }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length; }
    let doc;
    try { doc = cloudMetadata(JSON.parse(new TextDecoder().decode(bytes)), id); }
    catch (error) { throw new CloudError(error instanceof Error ? error.message : "Invalid document details."); }
    const pdf = await head(documentPath(userId, id, "file.pdf"));
    if (pdf.size > MAX_PDF_BYTES || pdf.contentType !== "application/pdf") throw new CloudError("Choose a PDF under 10 MB.");
    doc.size = pdf.size;
    await put(path, JSON.stringify(doc), { access: "private", contentType: "application/json", addRandomSuffix: false, allowOverwrite: true, cacheControlMaxAge: 0 });
    return Response.json({ document: doc }, { headers: privateHeaders });
  } catch (error) { return cloudError(error); }
}
export async function DELETE(request: NextRequest, { params }: Context) {
  try {
    const userId = cloudAccess(request, true);
    const { id } = await params;
    await del([documentPath(userId, id), documentPath(userId, id, "file.pdf")]);
    return Response.json({ deleted: true }, { headers: privateHeaders });
  } catch (error) { return cloudError(error); }
}
