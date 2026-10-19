import { getAuth } from "@clerk/nextjs/server";
import type { NextRequest } from "next/server";
export const dynamic = "force-dynamic";
export function GET(request: NextRequest) {
  return Response.json({ configured: Boolean(process.env.BLOB_READ_WRITE_TOKEN?.trim()), signedIn: Boolean(getAuth(request).userId), maxFileBytes: 10 * 1024 * 1024 }, { headers: { "Cache-Control": "no-store" } });
}
