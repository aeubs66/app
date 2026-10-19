import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import type { NextRequest } from "next/server";
import { cloudAccess, cloudError, CloudError } from "@/lib/cloud-server";
import { documentPath, MAX_PDF_BYTES } from "@/lib/cloud-documents";
export const runtime = "nodejs";
export async function POST(request: NextRequest) {
  try {
    const body = await request.json() as HandleUploadBody;
    const result = await handleUpload({ body, request,
      onBeforeGenerateToken: async (pathname) => {
        const userId = cloudAccess(request, true);
        const id = pathname.split("/")[2];
        if (pathname !== documentPath(userId, id, "file.pdf")) throw new CloudError("Invalid upload location.", 403);
        return { allowedContentTypes: ["application/pdf"], maximumSizeInBytes: MAX_PDF_BYTES,
          addRandomSuffix: false, allowOverwrite: false, validUntil: Date.now() + 10 * 60 * 1000 };
      },
    });
    return Response.json(result);
  } catch (error) { return cloudError(error); }
}
