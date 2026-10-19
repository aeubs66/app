import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import { searchDocument, samplePages } from "../lib/documents.ts";

test("retrieval finds exact source words and preserves the page reference", () => {
  const result = searchDocument(samplePages, "What is the three-pass method?");
  assert.equal(result.citations.length, 1);
  assert.equal(result.citations[0].page, 2);
  assert.match(result.content, /skim headings/);
  assert.doesNotMatch(result.content, /Page 1/);
});
test("unknown topics do not invent an answer or citations", () => {
  const result = searchDocument(samplePages, "Tell me about astrophysics");
  assert.match(result.content, /couldn’t find/);
  assert.equal(result.citations, undefined);
});
test("an overview returns passages from distinct source pages", () => {
  const result = searchDocument(samplePages, "What are the key takeaways?");
  assert.deepEqual(
    result.citations.map((c) => c.page),
    [1, 2, 3],
  );
  assert.match(result.content, /opening passages/);
});
test("retrieval includes the final sentence after a long passage", () => {
  const result = searchDocument(
    [
      "An introductory sentence about reading and learning. ".repeat(30) +
        "The observatory is in Baghdad.",
    ],
    "Where is the observatory?",
  );
  assert.match(result.content, /observatory is in Baghdad/);
});
test("generated sample is a readable three-page PDF with matching source text", async () => {
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const data = new Uint8Array(
    await readFile(new URL("../public/sample.pdf", import.meta.url)),
  );
  const task = pdfjs.getDocument({ data, useSystemFonts: true });
  try {
    const pdf = await task.promise;
    assert.equal(pdf.numPages, 3);
    const page = await pdf.getPage(2);
    const content = await page.getTextContent();
    const text = content.items
      .map((item) => ("str" in item ? item.str : ""))
      .join(" ");
    assert.match(text, /three-pass method/);
    assert.match(text, /page number/);
  } finally {
    await task.destroy();
  }
});
