import { readFile, writeFile, copyFile, mkdir } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import path from "node:path";
const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
await mkdir(path.join(root, "public"), { recursive: true });
await copyFile(path.join(root, "lib/pdf-compat.mjs"), path.join(root, "public/pdf-compat.mjs"));
const worker = await readFile(path.join(root, "node_modules/pdfjs-dist/legacy/build/pdf.worker.min.mjs"), "utf8");
await writeFile(path.join(root, "public/pdf.worker.min.mjs"),
  'import { installPDFCompatibility } from "./pdf-compat.mjs"; installPDFCompatibility();\n' + worker);
const source = await readFile(path.join(root, "lib/documents.ts"), "utf8");
const pages = JSON.parse(
  source
    .match(/export const samplePages = (\[[\s\S]*?\n\]);/)[1]
    .replace(/,\s*]$/, "]"),
);
const escape = (value) =>
  value.replace(/\\/g, "\\\\").replace(/\(/g, "\\(").replace(/\)/g, "\\)");
const objects = [
  "<< /Type /Catalog /Pages 2 0 R >>",
  "",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>",
  "<< /Type /Font /Subtype /Type1 /BaseFont /Times-Roman >>",
];
const kids = [];
for (const [index, text] of pages.entries()) {
  const pageNumber = objects.length + 1;
  const streamNumber = pageNumber + 1;
  kids.push(`${pageNumber} 0 R`);
  const lines = text.split("\n").flatMap((line) => {
    if (!line.trim()) return [""];
    const words = line.split(" ");
    const result = [];
    let current = "";
    for (const word of words) {
      if (current.length + word.length > 76) {
        result.push(current);
        current = "";
      }
      current += (current ? " " : "") + word;
    }
    if (current) result.push(current);
    return result;
  });
  const stream = `0.98 0.99 0.96 rg 0 0 612 792 re f\n0.43 0.51 0.33 rg BT /F1 8 Tf 54 745 Td (LOOMREAD / FIELD NOTES) Tj ET\n0.84 0.88 0.78 RG 54 728 m 558 728 l S\n0.28 0.34 0.23 rg BT /F2 12 Tf 18 TL 54 695 Td\n${lines.map((line, i) => `${i ? "T* " : ""}(${escape(line)}) Tj`).join("\n")}\nET\nBT /F1 9 Tf 300 40 Td (${index + 1}) Tj ET`;
  objects.push(
    `<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 3 0 R /F2 4 0 R >> >> /Contents ${streamNumber} 0 R >>`,
  );
  objects.push(
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  );
}
objects[1] = `<< /Type /Pages /Count ${pages.length} /Kids [${kids.join(" ")}] >>`;
let pdf = "%PDF-1.4\n";
const offsets = [0];
objects.forEach((object, index) => {
  offsets.push(Buffer.byteLength(pdf));
  pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
});
const xref = Buffer.byteLength(pdf);
pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n${offsets
  .slice(1)
  .map((offset) => String(offset).padStart(10, "0") + " 00000 n ")
  .join(
    "\n",
  )}\ntrailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xref}\n%%EOF\n`;
await writeFile(path.join(root, "public/sample.pdf"), pdf);
console.log("PDF worker and sample document are ready.");
