import { GROQ_MODEL } from "@/lib/ai-provider";
export const dynamic = "force-dynamic";
export async function GET() {
  return Response.json(
    {
      configured: !!process.env.GROQ_API_KEY?.trim(),
      provider: "Groq",
      model: GROQ_MODEL,
      requiresSignIn:
        process.env.NODE_ENV === "production" &&
        process.env.AI_ALLOW_GUESTS !== "true",
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}
