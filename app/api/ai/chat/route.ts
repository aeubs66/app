import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";
import { createHash } from "node:crypto";
import { validateAIPayload } from "@/lib/ai-context";
import { generateDocumentAnswer, AIProviderError } from "@/lib/ai-provider";
import { consumeAILimit } from "@/lib/ai-limits";
export const runtime = "nodejs";
export const maxDuration = 60;
export async function POST(request: NextRequest) {
  const origin = request.headers.get("origin");
  if (
    (origin && origin !== request.nextUrl.origin) ||
    request.headers.get("sec-fetch-site") === "cross-site"
  )
    return Response.json(
      { error: "Open the app directly to ask a question." },
      { status: 403 },
    );
  const { userId } = getAuth(request);
  if (
    !userId &&
    process.env.NODE_ENV === "production" &&
    process.env.AI_ALLOW_GUESTS !== "true"
  )
    return Response.json(
      {
        error:
          "Sign in to use the AI workspace. Local search is available without an account.",
      },
      { status: 401 },
    );
  if (!process.env.GROQ_API_KEY?.trim())
    return Response.json(
      {
        error:
          "AI isn’t connected yet. Add GROQ_API_KEY to the server environment.",
      },
      { status: 503 },
    );
  if (!request.headers.get("content-type")?.includes("application/json"))
    return Response.json(
      { error: "Send a JSON document question." },
      { status: 415 },
    );
  const reader = request.body?.getReader();
  if (!reader)
    return Response.json(
      { error: "Choose a document and enter a question." },
      { status: 400 },
    );
  const chunks: Uint8Array[] = [];
  let size = 0;
  try {
    while (true) {
      const { done, value } = await reader.read();
      if (done) break;
      size += value.byteLength;
      if (size > 48000) {
        await reader.cancel();
        return Response.json(
          {
            error:
              "This question includes too much text. Try a shorter question.",
          },
          { status: 413 },
        );
      }
      chunks.push(value);
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.byteLength;
    }
    let payload;
    try {
      payload = validateAIPayload(JSON.parse(new TextDecoder().decode(bytes)));
    } catch (e) {
      return Response.json(
        {
          error:
            e instanceof SyntaxError
              ? "The question could not be read."
              : e instanceof Error
                ? e.message
                : "Invalid question.",
        },
        { status: 400 },
      );
    }
    const identity =
      userId ||
      "guest:" +
        createHash("sha256")
          .update(
            request.headers.get("x-vercel-forwarded-for") ||
              request.headers.get("x-forwarded-for")?.split(",")[0] ||
              "local",
          )
          .digest("hex");
    const limit = consumeAILimit(identity);
    if (!limit.allowed)
      return Response.json(
        {
          error:
            "The workspace’s free AI allowance is resting. Try again later, or switch to local search.",
          retryAfter: limit.retryAfter,
        },
        { status: 429, headers: { "Retry-After": String(limit.retryAfter) } },
      );
    const result = await generateDocumentAnswer(
      payload,
      process.env.GROQ_API_KEY,
      fetch,
      request.signal,
    );
    return Response.json(result, { headers: { "Cache-Control": "no-store" } });
  } catch (e) {
    if (e instanceof AIProviderError)
      return Response.json(
        { error: e.message, retryAfter: e.retryAfter },
        {
          status: e.status,
          headers: e.retryAfter
            ? { "Retry-After": String(e.retryAfter) }
            : undefined,
        },
      );
    return Response.json(
      {
        error:
          "The answer could not be completed. Try again, or use local search.",
      },
      { status: 500 },
    );
  } finally {
    reader.releaseLock();
  }
}
