import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import { cloudMetadata, documentPath } from "../lib/cloud-documents.ts";
const id = "cloud-12345678-1234-4234-8234-123456789abc";
const doc = () => ({ title: "Reading.pdf", num_pages: 1, pages: ["A short text."], messages: [] });

test("cloud paths isolate accounts and reject traversal and client-supplied filenames", () => {
  assert.notEqual(documentPath("user_readerA", id), documentPath("user_readerB", id));
  assert.throws(() => documentPath("user_readerA/../user_readerB", id));
  assert.throws(() => documentPath("user_readerA", "../../other"));
  assert.throws(() => documentPath("user_readerA", id, "../../file.pdf"));
});
test("cloud metadata strips injected storage paths and restricts conversations and citations", () => {
  const saved = cloudMetadata({ ...doc(), id: "another", ownerId: "another", fileUrl: "https://example.com", file: "private",
    messages: [{ role: "assistant", content: "An answer", citations: [{ page: 1, text: "unnecessary copy" }, { page: 99 }] }] }, id);
  assert.equal(saved.id, id);
  assert.equal(saved.storage, "vercel");
  assert.equal(saved.mode, "cloud");
  assert.equal(saved.fileUrl, undefined);
  assert.equal(saved.ownerId, undefined);
  assert.equal(saved.file, undefined);
  assert.deepEqual(saved.messages[0].citations, [{ page: 1 }]);
});
test("cloud rejects malformed or oversized document and conversation data", () => {
  assert.throws(() => cloudMetadata({ ...doc(), pages: [] }, id));
  assert.throws(() => cloudMetadata({ ...doc(), messages: [{ role: "system", content: "inject" }] }, id));
  assert.throws(() => cloudMetadata({ ...doc(), pages: ["x".repeat(2 * 1024 * 1024)] }, id));
  assert.throws(() => cloudMetadata({ ...doc(), messages: Array.from({ length: 201 }, () => ({ role: "user", content: "hello" })) }, id));
});
test("PDF compatibility supports phones missing Promise.withResolvers in both page and worker", async () => {
  const original = Promise.withResolvers;
  try {
    Promise.withResolvers = undefined;
    const { installPDFCompatibility } = await import("../lib/pdf-compat.mjs");
    installPDFCompatibility();
    const pending = Promise.withResolvers();
    pending.resolve("ready");
    assert.equal(await pending.promise, "ready");
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(new URL("../public/sample.pdf", import.meta.url))) });
    try {
      const pdf = await task.promise;
      assert.equal(pdf.numPages, 3);
      const text = await (await pdf.getPage(1)).getTextContent();
      assert.ok(text.items.some(item => "str" in item && item.str.includes("FOCUSED READING")));
      const worker = fs.readFileSync(new URL("../public/pdf.worker.min.mjs", import.meta.url), "utf8");
      assert.ok(worker.startsWith('import { installPDFCompatibility } from "./pdf-compat.mjs?v=safari-stream-v2"; installPDFCompatibility();'));
    } finally { await task.destroy(); }
  } finally { Promise.withResolvers = original; }
});

test("Safari without async stream iteration can extract PDF text and release stream locks", async () => {
  const original = Object.getOwnPropertyDescriptor(ReadableStream.prototype, Symbol.asyncIterator);
  try {
    delete ReadableStream.prototype[Symbol.asyncIterator];
    const { installPDFCompatibility } = await import("../lib/pdf-compat.mjs");
    installPDFCompatibility();
    const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
    const task = pdfjs.getDocument({ data: new Uint8Array(fs.readFileSync(new URL("../public/sample.pdf", import.meta.url))) });
    try {
      const pdf = await task.promise;
      for (let page = 1; page <= pdf.numPages; page++) {
        const text = await (await pdf.getPage(page)).getTextContent();
        assert.ok(text.items.some(item => "str" in item && item.str.trim().length > 5));
      }
    } finally { await task.destroy(); }
    let cancelled = false;
    const stream = new ReadableStream({ start(controller) { controller.enqueue("a"); }, cancel() { cancelled = true; } });
    for await (const chunk of stream) { assert.equal(chunk, "a"); break; }
    assert.equal(cancelled, true);
    assert.equal(stream.locked, false);
    const broken = new ReadableStream({ start(controller) { controller.error(new Error("stream failed")); } });
    await assert.rejects(async () => { for await (const chunk of broken) void chunk; }, /stream failed/);
    assert.equal(broken.locked, false);
  } finally {
    if (original) Object.defineProperty(ReadableStream.prototype, Symbol.asyncIterator, original);
    else delete ReadableStream.prototype[Symbol.asyncIterator];
  }
});

test("server PDF extraction reads real pages and rejects non-PDF files", async () => {
  const { extractPDFPages, PDFReadError } = await import("../lib/pdf-server.ts");
  const pages = await extractPDFPages(new Uint8Array(fs.readFileSync(new URL("../public/sample.pdf", import.meta.url))));
  assert.equal(pages.length, 3);
  assert.ok(pages[0].includes("FOCUSED READING"));
  await assert.rejects(() => extractPDFPages(new TextEncoder().encode("not a PDF")), PDFReadError);
});
