# LoomRead

A responsive PDF reading workspace with private cloud storage, local passage search and Groq AI answers.

## Run locally

Use Node.js 24 and npm:

```powershell
npm ci
Copy-Item .env.example .env.local
```

Set a matching Clerk publishable key and secret key in `.env.local`. Create a Groq key at [Groq Console](https://console.groq.com/keys), keep the account on its free plan, and add:

```dotenv
GROQ_API_KEY="your_groq_key"
```

Never prefix the Groq key with `NEXT_PUBLIC_`. It is read only by the server and never included in browser bundles or returned by status endpoints.

```powershell
npm run dev
```

Open [localhost:3000](http://localhost:3000). The PDF worker and original sample document are prepared automatically after installation.

## Read and ask

1. Import a text-based PDF up to 10 MB and 500 pages, or open the sample.
2. Read the extracted text or the original PDF. Jump to any page with the page selector.
3. Choose **Local search** for on-device passage retrieval, or **AI answers** for Groq.
4. Ask a question, summarize, explain simply, or create a study quiz. Click source citations to inspect the cited page.
5. Rename the document, copy answers, download the PDF, export the chat, clear a conversation, or remove a local document from the library.

Local PDFs, text, preferences, and conversations are stored in IndexedDB on this device. Clearing browser site data removes them. Scanned PDFs can be stored and previewed; text questions require OCR first. Password-protected PDFs must be unlocked.

## Private cloud library

Connect a **private Vercel Blob store** to the Vercel project, including production, preview, and development. Vercel supplies `BLOB_READ_WRITE_TOKEN`; keep it server-only. Download development variables with `vercel env pull .env.local`.

Choose **Cloud library**, sign in, and import a PDF (10 MB / 500 pages maximum). The PDF uploads directly to private storage, avoiding Vercel's function upload body limit. Its extracted text, preferences, title, and conversation are stored in a private JSON companion (2 MB maximum; 200 conversation messages). The library automatically lists the signed-in account's saved documents. Opening a document on another device restores the original PDF, extracted text and conversation without IndexedDB. Existing local PDFs stay local.

Every list, read, write, download, and delete route verifies Clerk authentication. Object paths are derived from the authenticated account and validated document ID; client-provided URLs and owner IDs are discarded. Upload tokens allow only PDFs up to 10 MB at a single account-scoped path. Mutations reject cross-site browser requests. Responses are private and uncached. Deletion removes both the PDF and its JSON companion; origin reads prevent deleted content being served from the storage CDN cache.

[Vercel Hobby Blob limits](https://vercel.com/docs/vercel-blob/usage-and-pricing) include 1 GB storage, 10 GB transfer, 10,000 simple operations and 2,000 advanced operations monthly, shared across the account's applicable resources. Hobby stops Blob access at the quota instead of charging overages. This is limited free storage, not unlimited backup. Listing reads one metadata object per document; opening reads metadata plus the PDF; saving a conversation or rename writes the metadata again. Monitor usage in Vercel.

The PDF parser and worker use the compatibility build, with a `Promise.withResolvers` shim in both environments for older phones. Postinstall generates the matching worker and shim; the worker URL is versioned to avoid using an older cached file.

For an explicit live integration check with disposable Clerk development users and the generated sample PDF, run `node scripts/check-cloud.mjs [app-url]`. This uploads, reopens, renames, syncs a conversation, verifies cross-account isolation and deletes its test data. It requires `.env.local` and refuses production Clerk keys. It does not run as part of the unit tests.

## AI connection

The app calls Groq's `openai/gpt-oss-20b` model through `/api/ai/chat`. Each request sends selected excerpts (at most 6,000 characters), the document title, a question, and at most four shortened recent conversation messages. The original PDF is not uploaded to Groq. Long-document summaries sample pages across the document and display source coverage; they are not exhaustive reviews.

Answers use a strict JSON schema. Page citations are filtered against the supplied source pages. The model is instructed to treat source text as untrusted data, avoid unsupported claims, and admit missing evidence. AI may still make mistakes; citations are navigation aids, not proof of correctness.

The connection screen reports whether a key is configured. Provider validation occurs when asking a question. Missing keys, rejected credentials, timeouts, invalid output, and free-tier quota failures produce actionable errors. Local search remains available. Requests can be cancelled; cancellation may not prevent the provider from counting a request already received.

[Groq's published free limits](https://console.groq.com/docs/rate-limits) currently list GPT-OSS 20B at 30 requests/minute, 1,000 requests/day, 8,000 tokens/minute, and 200,000 tokens/day. Actual account limits may differ. Stay on the free plan: a model's availability in a free tier does not prevent charges if the connected account is upgraded to paid service. This app never creates a subscription or silently switches providers.

See [Groq's data policy](https://console.groq.com/docs/your-data) for retention exceptions and optional zero-data-retention controls.

## Access and limits

- Local development permits guest AI requests for testing.
- Production requires a Clerk sign-in by default. `AI_ALLOW_GUESTS=true` explicitly allows anonymous production AI access; use only with appropriate public-service controls.
- Same-origin checks reject cross-site browser requests. Request bodies, sources, history, and output are bounded and validated.
- Best-effort in-memory throttling caps requests at 3/minute and 30/day per user, and 4/minute and 100/day per server process. For multi-instance or public production deployments, use a shared durable limiter rather than relying on these process-local counters. Groq independently applies account quotas.
- Provider errors and API keys are never echoed into client responses. Document content is not written to server logs by this integration.

## Optional legacy document service

Older document IDs from the previous remote service still use `NEXT_PUBLIC_API_URL` and a Clerk JWT template named `pdfs`. That separate service must validate the same Clerk application and permit the frontend origin through CORS. New cloud uploads use private Vercel Blob, and do not need this backend or a JWT template.

It must provide bearer-authenticated upload, document listing, metadata, and question endpoints under `/api/documents/`. Legacy cloud documents have a separate retention policy. Signing in or enabling Groq does not automatically upload any local PDF to this backend.

## Validation

```powershell
npm run lint
npx tsc --noEmit --incremental false
npm test
npm run build
```

Tests cover real sample PDF parsing, passage retrieval, bounded AI context selection, page coverage, request validation, provider request construction, citation filtering, invalid responses, quota handling, and throttling. Live Groq verification should use the non-sensitive sample document; no production user document is needed.
