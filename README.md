# LoomRead

A responsive PDF reading workspace with local passage search and real Groq AI answers.

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

Local PDFs, text, preferences, and conversations are stored in IndexedDB on this device. Clearing browser site data removes them. Scanned PDFs require OCR before import; password-protected PDFs must be unlocked.

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

The older cloud-upload integration is disabled in the interface by default. To enable it, set `NEXT_PUBLIC_ENABLE_LEGACY_BACKEND=true` and configure `NEXT_PUBLIC_API_URL` and a Clerk JWT template named `pdfs`. That separate service must validate the same Clerk application and permit the frontend origin through CORS.

It must provide bearer-authenticated upload, document listing, metadata, and question endpoints under `/api/documents/`. Legacy cloud documents have a separate retention policy. Signing in or enabling Groq does not automatically upload any local PDF to this backend.

## Validation

```powershell
npm run lint
npx tsc --noEmit --incremental false
npm test
npm run build
```

Tests cover real sample PDF parsing, passage retrieval, bounded AI context selection, page coverage, request validation, provider request construction, citation filtering, invalid responses, quota handling, and throttling. Live Groq verification should use the non-sensitive sample document; no production user document is needed.
