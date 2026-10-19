export type AIAction = "answer" | "summary" | "quiz" | "explain";
export interface SourceExcerpt {
  page: number;
  text: string;
}
export interface AIPayload {
  question: string;
  title: string;
  action: AIAction;
  totalPages: number;
  excerpts: SourceExcerpt[];
  history: { role: "user" | "assistant"; content: string }[];
}
const ignored = new Set(
  "the and for are this that what how why with from about does have tell explain document please summarize summary main key points ideas can you your its was were of in to a an is it me".split(
    " ",
  ),
);
const tokens = (text: string) =>
  (text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || []).filter(
    (w) => !ignored.has(w),
  );
export function buildAIContext(
  pages: string[],
  question: string,
  history: AIPayload["history"] = [],
  action: AIAction = "answer",
): SourceExcerpt[] {
  if (!pages.length) return [];
  const terms = new Set(
    tokens(
      question +
        " " +
        history
          .filter((m) => m.role === "user")
          .slice(-1)
          .map((m) => m.content)
          .join(" "),
    ),
  );
  const chunks = pages.flatMap((page, index) => {
    const clean = page.replace(/\s+/g, " ").trim();
    const result: { page: number; text: string; score: number }[] = [];
    for (let start = 0; start < clean.length; start += 800) {
      const text = clean.slice(start, start + 1000);
      if (!text) continue;
      const words = new Set(tokens(text));
      result.push({
        page: index + 1,
        text,
        score: [...terms].reduce((n, t) => n + (words.has(t) ? 1 : 0), 0),
      });
    }
    return result;
  });
  const overview =
    action === "summary" ||
    action === "quiz" ||
    /summary|summari[sz]e|key takeaways|main (ideas|points)/i.test(question);
  const chosen: SourceExcerpt[] = [];
  if (overview || !chunks.some((c) => c.score > 0)) {
    const nonempty = pages
      .map((p, i) => ({ page: i + 1, text: p.replace(/\s+/g, " ").trim() }))
      .filter((p) => p.text);
    const count = Math.min(6, nonempty.length);
    for (let i = 0; i < count; i++) {
      const source =
        nonempty[
          count === 1
            ? 0
            : Math.round((i * (nonempty.length - 1)) / (count - 1))
        ];
      chosen.push({
        page: source.page,
        text: source.text.slice(0, Math.floor(6000 / count)),
      });
    }
  } else {
    for (const chunk of chunks.sort((a, b) => b.score - a.score)) {
      if (chosen.length >= 6 || !chunk.score) break;
      if (
        chosen.some(
          (p) =>
            p.page === chunk.page &&
            (p.text.includes(chunk.text.slice(0, 120)) ||
              chunk.text.includes(p.text.slice(-120))),
        )
      )
        continue;
      chosen.push({ page: chunk.page, text: chunk.text });
    }
  }
  return chosen.sort((a, b) => a.page - b.page);
}
export function validateAIPayload(value: unknown): AIPayload {
  if (!value || typeof value !== "object")
    throw new Error("Choose a document and enter a question.");
  const data = value as Record<string, unknown>;
  if (
    typeof data.question !== "string" ||
    !data.question.trim() ||
    data.question.length > 2000
  )
    throw new Error("Enter a question with 2,000 characters or fewer.");
  if (typeof data.title !== "string" || data.title.length > 250)
    throw new Error("The document title is too long.");
  if (
    !Number.isInteger(data.totalPages) ||
    (data.totalPages as number) < 1 ||
    (data.totalPages as number) > 500
  )
    throw new Error("This document needs a valid page count.");
  if (
    !Array.isArray(data.excerpts) ||
    !data.excerpts.length ||
    data.excerpts.length > 6
  )
    throw new Error("No readable document passages were selected.");
  const excerpts: SourceExcerpt[] = data.excerpts.map((source: unknown) => {
    if (!source || typeof source !== "object")
      throw new Error("Invalid source passage.");
    const s = source as Record<string, unknown>;
    if (
      !Number.isInteger(s.page) ||
      (s.page as number) < 1 ||
      (s.page as number) > (data.totalPages as number) ||
      typeof s.text !== "string" ||
      !s.text.trim() ||
      s.text.length > 6000
    )
      throw new Error("Invalid source passage.");
    return { page: s.page as number, text: s.text };
  });
  if (excerpts.reduce((n, e) => n + e.text.length, 0) > 6000)
    throw new Error(
      "Selected passages are too long. Try a more specific question.",
    );
  if (
    data.action !== undefined &&
    !["answer", "summary", "quiz", "explain"].includes(data.action as string)
  )
    throw new Error("Choose a supported reading action.");
  if (data.history !== undefined && !Array.isArray(data.history))
    throw new Error("Invalid conversation history.");
  const history = ((data.history || []) as unknown[]).slice(-4).map((m) => {
    if (!m || typeof m !== "object")
      throw new Error("Invalid conversation history.");
    const message = m as Record<string, unknown>;
    if (
      !["user", "assistant"].includes(message.role as string) ||
      typeof message.content !== "string"
    )
      throw new Error("Invalid conversation history.");
    return {
      role: message.role as "user" | "assistant",
      content: message.content.slice(0, 600),
    };
  });
  return {
    question: data.question.trim(),
    title: data.title,
    action: (data.action || "answer") as AIAction,
    totalPages: data.totalPages as number,
    excerpts,
    history,
  };
}
