export const API_URL = (
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000"
).replace(/\/$/, "");
export async function apiRequest<T>(
  path: string,
  token: string,
  options: RequestInit = {},
): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_URL}${path}`, {
      ...options,
      headers: {
        ...Object.fromEntries(new Headers(options.headers)),
        Authorization: `Bearer ${token}`,
      },
      signal: options.signal || AbortSignal.timeout(60000),
    });
  } catch {
    throw new Error(
      "The reading service couldn’t be reached. Check your connection and try again. Your local documents are still available.",
    );
  }
  const data = await response.json().catch(() => null);
  if (!response.ok) {
    const message =
      typeof data?.detail === "string"
        ? data.detail
        : typeof data?.message === "string"
          ? data.message
          : null;
    throw new Error(
      response.status === 401
        ? "Your session couldn’t be verified. Sign in again to reconnect your AI workspace."
        : message ||
            `The reading service returned an error (${response.status}). Please try again.`,
    );
  }
  return data as T;
}
