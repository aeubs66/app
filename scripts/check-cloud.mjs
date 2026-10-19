// Explicit integration check against a running app; creates only disposable
// Clerk development users and a generated sample PDF, and cleans them up.
import assert from "node:assert/strict";
import fs from "node:fs";
import { createClerkClient } from "@clerk/backend";
import { upload } from "@vercel/blob/client";
import { del } from "@vercel/blob";
import { documentPath } from "../lib/cloud-documents.ts";
import { samplePages } from "../lib/documents.ts";
process.loadEnvFile(".env.local");
if (!process.env.CLERK_SECRET_KEY?.startsWith("sk_test_")) throw new Error("Use a Clerk development instance for this check.");
const base = process.argv[2] || "http://localhost:3000";
const clerk = createClerkClient({ secretKey: process.env.CLERK_SECRET_KEY });
const users = [];
const paths = [];
const id = `cloud-${crypto.randomUUID()}`;
const headers = token => ({ Authorization: `Bearer ${token}`, Origin: new URL(base).origin });
const call = (path, token, options = {}) => fetch(`${base}/api/documents${path}`, {
  ...options, headers: { ...headers(token), ...options.headers },
});
try {
  for (let i = 0; i < 2; i++) {
    const user = await clerk.users.createUser({ emailAddress: [`loomread-${crypto.randomUUID()}+clerk_test@example.com`], skipPasswordRequirement: true });
    users.push(user);
    const session = await clerk.sessions.createSession({ userId: user.id });
    user.testToken = (await clerk.sessions.getToken(session.id)).jwt;
  }
  const [owner, other] = users;
  const uploadPath = documentPath(owner.id, id, "file.pdf");
  paths.push(uploadPath, documentPath(owner.id, id));
  assert.equal((await fetch(`${base}/api/documents`)).status, 401);
  console.log("PASS: anonymous cloud access is blocked");
  const pdf = fs.readFileSync(new URL("../public/sample.pdf", import.meta.url));
  const blob = await upload(uploadPath, pdf, { access: "private", contentType: "application/pdf",
    handleUploadUrl: `${base}/api/documents/upload`, headers: headers(owner.testToken) });
  console.log("PASS: authenticated client uploads a real PDF directly to private storage");
  assert.equal((await fetch(blob.url)).status, 403);
  console.log("PASS: the raw storage URL cannot be read publicly");
  const metadata = { title: "Disposable cloud upload check.pdf", num_pages: 3, pages: samplePages,
    created_at: new Date().toISOString(), messages: [] };
  let response = await call(`/${id}`, owner.testToken, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(metadata) });
  if (!response.ok) console.log("Save response:", response.status, await response.text());
  assert.equal(response.status, 200);
  const library = await (await call("", owner.testToken)).json();
  assert.ok(library.documents.some(doc => doc.id === id));
  const restored = await (await call(`/${id}`, owner.testToken)).json();
  assert.deepEqual(restored.pages, samplePages);
  assert.deepEqual(Buffer.from(await (await call(`/${id}/file`, owner.testToken)).arrayBuffer()), pdf);
  console.log("PASS: library, extracted text and original PDF reopen without device storage");
  metadata.title = "Renamed cloud check.pdf";
  metadata.messages = [{ role: "user", content: "What are the key takeaways?" }, { role: "assistant", content: "Start with a question.", engine: "local", citations: [{ page: 1 }] }];
  assert.equal((await call(`/${id}`, owner.testToken, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(metadata) })).status, 200);
  const updated = await (await call(`/${id}`, owner.testToken)).json();
  assert.equal(updated.title, metadata.title);
  assert.equal(updated.messages.length, 2);
  console.log("PASS: rename and conversation sync survive a fresh read");
  for (const suffix of [`/${id}`, `/${id}/file`]) assert.equal((await call(suffix, other.testToken)).status, 404);
  assert.ok(!(await (await call("", other.testToken)).json()).documents.some(doc => doc.id === id));
  // A different account's delete can only target its own namespace.
  await call(`/${id}`, other.testToken, { method: "DELETE" });
  assert.equal((await call(`/${id}`, owner.testToken)).status, 200);
  console.log("PASS: another account cannot list, read or delete the owner's PDF");
  response = await call(`/${id}`, owner.testToken, { method: "PUT", headers: { "Content-Type": "application/json", Origin: "https://example.com" }, body: JSON.stringify(metadata) });
  assert.equal(response.status, 403);
  assert.equal((await call(`/${id}`, owner.testToken, { method: "DELETE" })).status, 200);
  assert.equal((await call(`/${id}`, owner.testToken)).status, 404, "deleted metadata is inaccessible");
  assert.equal((await call(`/${id}/file`, owner.testToken)).status, 404, "deleted PDF is inaccessible");
  console.log("PASS: cross-site writes are blocked and deletion removes both stored files");
} catch (error) {
  console.error("Cloud integration check failed:", error instanceof assert.AssertionError ? error.message : error?.errors?.map(e => e.code).join(", ") || error?.message);
  process.exitCode = 1;
} finally {
  if (paths.length) await del(paths);
  for (const user of users) await clerk.users.deleteUser(user.id);
  console.log("Disposable test accounts and files cleaned up.");
}
