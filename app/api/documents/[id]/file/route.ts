import { get } from "@vercel/blob";
import type { NextRequest } from "next/server";
import { cloudAccess, cloudError, CloudError, privateHeaders } from "@/lib/cloud-server";
import { documentPath } from "@/lib/cloud-documents";
export const runtime = "nodejs";
export const dynamic = "force-dynamic";
export async function GET(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    const userId = cloudAccess(request);
    const file = await get(documentPath(userId, (await params).id, "file.pdf"), { access: "private", useCache: false });
    if (file?.statusCode !== 200) throw new CloudError("PDF not found.", 404);
    return new Response(file.stream, { headers: { ...privateHeaders, "Content-Type": "application/pdf", "Content-Disposition": "inline; filename=document.pdf" } });
  } catch (error) { return cloudError(error); }
}
