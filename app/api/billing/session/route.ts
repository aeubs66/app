export async function POST() {
  return Response.json(
    {
      error:
        "This workspace has no paid subscription checkout. AI uses the workspace owner’s Groq account; no payment is taken by this app.",
    },
    { status: 410 },
  );
}
