import { getAuth } from "@clerk/nextjs/server";
import { NextRequest } from "next/server";

export async function POST(request: NextRequest) {
  const { userId } = getAuth(request);

  if (!userId) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const response = await fetch("https://api.clerk.dev/v1/billing/sessions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ user_id: userId }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      return Response.json({ error: errorText }, { status: response.status });
    }

    const session = await response.json();
    return Response.json({ url: session.url });
  } catch (error) {
    console.error("Failed to create billing session:", error);
    return Response.json({ error: "Unable to create billing session" }, { status: 500 });
  }
}

