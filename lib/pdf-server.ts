import path from "node:path";
import { MAX_PDF_BYTES, MAX_METADATA_BYTES } from "./cloud-documents.ts";

export class PDFReadError extends Error {}

export async function extractPDFPages(bytes: Uint8Array) {
  if (!bytes.length || bytes.length > MAX_PDF_BYTES)
    throw new PDFReadError("Choose a non-empty PDF under 10 MB.");
  const signature = new TextDecoder().decode(bytes.subarray(0, 1024));
  if (!signature.includes("%PDF-"))
    throw new PDFReadError("This file is not a readable PDF. Choose another file.");
  const pdfjs = await import("pdfjs-dist/legacy/build/pdf.mjs");
  const task = pdfjs.getDocument({
    data: bytes,
    disableFontFace: true,
    standardFontDataUrl: path.join(process.cwd(), "node_modules/pdfjs-dist/standard_fonts") + "/",
  });
  try {
    const pdf = await task.promise;
    if (pdf.numPages > 500)
      throw new PDFReadError("Choose a PDF with 500 pages or fewer.");
    const pages: string[] = [];
    let textBytes = 0;
    for (let n = 1; n <= pdf.numPages; n++) {
      const page = await pdf.getPage(n);
      try {
        const content = await page.getTextContent();
        const text = content.items.map(item => "str" in item ? item.str + (item.hasEOL ? "\n" : " ") : "").join("");
        textBytes += new TextEncoder().encode(JSON.stringify(text)).length;
        if (textBytes > MAX_METADATA_BYTES - 10000)
          throw new PDFReadError("This PDF contains too much text for the free cloud library. Choose a smaller document.");
        pages.push(text);
      } finally { page.cleanup(); }
    }
    return pages;
  } catch (error) {
    if (error instanceof PDFReadError) throw error;
    if (error instanceof Error && error.name === "PasswordException")
      throw new PDFReadError("This PDF is password protected. Choose an unlocked copy.");
    throw new PDFReadError("This PDF couldn’t be read. It may be damaged or unsupported. Try exporting it as a new PDF.");
  } finally { await task.destroy(); }
}
