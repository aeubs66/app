export interface ReadingMessage {
  role: "user" | "assistant";
  content: string;
  citations?: { page: number; text?: string }[];
  engine?: "local" | "groq" | "cloud";
  sourcePages?: number[];
}
export interface ReadingDocument {
  id: string;
  title: string;
  num_pages: number;
  created_at: string;
  last_opened_at?: string;
  status: "ready" | "processing" | "failed";
  mode: "local" | "cloud";
  storage?: "vercel";
  questionCount?: number;
  pages?: string[];
  file?: Blob;
  messages?: ReadingMessage[];
  size?: number;
  sample?: boolean;
  aiEnabled?: boolean;
}
function database(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open("loomread-workspace", 1);
    request.onupgradeneeded = () =>
      request.result.createObjectStore("documents", { keyPath: "id" });
    request.onsuccess = () => resolve(request.result);
    request.onerror = () =>
      reject(
        new Error(
          "Device storage is unavailable. Allow site storage to save your PDFs.",
        ),
      );
  });
}
async function transaction<T>(
  mode: IDBTransactionMode,
  operation: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  const db = await database();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("documents", mode);
    const request = operation(tx.objectStore("documents"));
    tx.oncomplete = () => {
      db.close();
      resolve(request.result);
    };
    tx.onerror = () => {
      db.close();
      reject(
        new Error(
          "Could not save this document. Check available device storage.",
        ),
      );
    };
    tx.onabort = () => {
      db.close();
      reject(new Error("Document storage was interrupted. Please try again."));
    };
  });
}
export const listDocuments = () =>
  transaction("readonly", (s) => s.getAll()) as Promise<ReadingDocument[]>;
export async function cloudRequest<T>(path: string, options: RequestInit = {}): Promise<T> {
  let response: Response;
  try { response = await fetch(`/api/documents${path}`, { ...options, cache: "no-store" }); }
  catch { throw new Error("Couldn’t connect to your cloud library. Check your internet connection and try again."); }
  const result = await response.json().catch(() => null);
  if (!response.ok) throw new Error(result?.error || "Your cloud library couldn’t be opened. Please try again.");
  return result as T;
}
export async function listCloudDocuments() {
  const documents: ReadingDocument[] = [];
  let cursor: string | null = null;
  do {
    const page: { documents: ReadingDocument[]; cursor: string | null } = await cloudRequest(cursor ? `?cursor=${encodeURIComponent(cursor)}` : "");
    documents.push(...page.documents);
    cursor = page.cursor;
  } while (cursor);
  return documents;
}
export async function getDocument(id: string): Promise<ReadingDocument | undefined> {
  if (id.startsWith("cloud-")) {
    const doc = await cloudRequest<ReadingDocument>(`/${encodeURIComponent(id)}`);
    const response = await fetch(`/api/documents/${encodeURIComponent(id)}/file`, { cache: "no-store" });
    if (!response.ok) throw new Error("The saved PDF couldn’t be downloaded. Please try opening it again.");
    return { ...doc, file: await response.blob() };
  }
  return transaction("readonly", (s) => s.get(id)) as Promise<ReadingDocument | undefined>;
}
export async function saveDocument(doc: ReadingDocument, options = { sync: true }) {
  if (doc.storage === "vercel") {
    if (options.sync) {
      const { file: _file, ...metadata } = doc;
      void _file;
      await cloudRequest(`/${encodeURIComponent(doc.id)}`, {
        method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(metadata),
      });
    }
    window.dispatchEvent(new Event("loomread:documents"));
    return;
  }
  await transaction("readwrite", (s) => s.put(doc));
  window.dispatchEvent(new Event("loomread:documents"));
}
export async function removeDocument(id: string) {
  if (id.startsWith("cloud-")) {
    await cloudRequest(`/${encodeURIComponent(id)}`, { method: "DELETE" });
    window.dispatchEvent(new Event("loomread:documents"));
    return;
  }
  await transaction("readwrite", (s) => s.delete(id));
  window.dispatchEvent(new Event("loomread:documents"));
}
export async function readPdf(
  file: File,
  onProgress: (page: number, total: number) => void,
) {
  const { installPDFCompatibility } = await import("./pdf-compat.mjs");
  installPDFCompatibility();
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  pdfjs.GlobalWorkerOptions.workerSrc = "/pdf.worker.min.mjs?v=6.4.299-legacy";
  const task = pdfjs.getDocument({ data: await file.arrayBuffer() });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 500)
      throw new Error("Please choose a PDF with 500 pages or fewer.");
    const pages: string[] = [];
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      const content = await page.getTextContent();
      pages.push(
        content.items
          .map((item) =>
            "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "",
          )
          .join(""),
      );
      page.cleanup();
      onProgress(n, pdf.numPages);
    }
    return pages;
  } catch (error) {
    if (error instanceof Error && error.name === "PasswordException")
      throw new Error(
        "This PDF is password protected. Upload an unlocked copy.",
      );
    throw error;
  } finally {
    await task.destroy();
  }
}
const stopwords = new Set(
  "a an the is are was were what which who how why do does can could would should this that in on at to for of and or me my it its about tell give please document pdf summarize summary key main takeaways".split(
    " ",
  ),
);
export function searchDocument(
  pages: string[],
  question: string,
): ReadingMessage {
  const words = [
    ...new Set(question.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || []),
  ].filter((w) => !stopwords.has(w));
  const summary =
    /summari[sz]e|summary|key (points|takeaways)|main (ideas|points)/i.test(
      question,
    );
  const passages = pages.flatMap((page, index) => {
    const sentences = page.replace(/\s+/g, " ").split(/(?<=[.!?])\s+/);
    const chunks: string[] = [];
    let chunk = "";
    for (const sentence of sentences) {
      if (chunk && chunk.length + sentence.length > 650) {
        chunks.push(chunk);
        chunk = "";
      }
      chunk += (chunk ? " " : "") + sentence;
    }
    if (chunk) chunks.push(chunk);
    return chunks
      .filter((t) => t.trim().length > 25)
      .map((text) => {
        const terms = new Set(
          text.toLowerCase().match(/[\p{L}\p{N}]{2,}/gu) || [],
        );
        return {
          page: index + 1,
          text: text.trim(),
          score: words.reduce(
            (score, word) => score + (terms.has(word) ? 1 : 0),
            0,
          ),
        };
      });
  });
  const bestScore = Math.max(0, ...passages.map((p) => p.score));
  const matches = (
    summary
      ? passages.filter(
          (p, i, all) => all.findIndex((x) => x.page === p.page) === i,
        )
      : passages
          .filter((p) => p.score > 0 && p.score >= bestScore * 0.6)
          .sort((a, b) => b.score - a.score)
  ).slice(0, 3);
  if (!matches.length)
    return {
      role: "assistant",
      content:
        "I couldn’t find a matching passage in this document. Try a specific name, phrase, or topic from the PDF. For a broader overview, ask for key takeaways.",
    };
  return {
    role: "assistant",
    content:
      (summary
        ? "Here are opening passages from the document to help you get oriented:"
        : "I found these passages related to your question:") +
      "\n\n" +
      matches.map((p) => `“${p.text}”\n— Page ${p.page}`).join("\n\n"),
    citations: matches.map((p) => ({ page: p.page, text: p.text })),
  };
}
export async function openSample() {
  const existing = await getDocument("local-field-notes");
  if (existing) return existing.id;
  const response = await fetch("/sample.pdf");
  if (!response.ok)
    throw new Error("The sample couldn’t be loaded. Please try again.");
  const doc: ReadingDocument = {
    id: "local-field-notes",
    title: "The art of focused reading.pdf",
    num_pages: 3,
    created_at: new Date().toISOString(),
    status: "ready",
    mode: "local",
    sample: true,
    file: await response.blob(),
    pages: samplePages,
  };
  await saveDocument(doc);
  return doc.id;
}
export const samplePages = [
  "THE ART OF FOCUSED READING\nA field guide for curious minds\n\n01 / Make room for attention\nDeep reading is a practice of giving a text your undivided attention. Rather than measuring progress by pages finished, measure it by ideas understood. Begin with a question: what do I hope to learn from this document? A clear intention makes it easier to recognize the passages that matter.\n\nDesign your reading environment. Put notifications on pause, clear your desk, and choose a comfortable place. Work in 25-minute sessions with a short break between them. The goal is not to read faster, but to notice more.\n\nKey takeaway: Start with one question and a small, distraction-free block of time.",
  "02 / Have a conversation with the page\nActive readers ask questions while they read. What is the author claiming? What evidence supports the claim? Where does this connect to something I already know? Write short notes in your own words instead of copying entire paragraphs.\n\nUse a three-pass method. First, skim headings and the introduction to build a map. Second, read the sections that answer your question. Third, revisit difficult passages and check your interpretation against the original text.\n\nCitations are a path back to context. Save the page number alongside every useful idea. A quotation can mean something different when separated from the paragraph around it.\n\nKey takeaway: Ask, connect, and return to the source.",
  "03 / Turn understanding into something useful\nAfter reading, close the document and explain its main ideas in a few sentences. This retrieval practice reveals gaps that rereading can hide. Return to the text to correct those gaps, then choose one idea to apply.\n\nOrganize notes around questions and themes rather than just filenames. Connect new ideas to previous reading. A personal library becomes useful when you can find and revisit the thinking inside it.\n\nA simple reading ritual: set an intention, read for 25 minutes, record three ideas, and choose one next action. Revisit your notes a week later to strengthen recall.\n\nKey takeaway: Understanding grows when you retrieve, connect, and apply what you read.\n\nLoomRead / Sample document / Original educational content",
];
