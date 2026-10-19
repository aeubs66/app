import Link from "next/link";
export default async function LegalPage({
  searchParams,
}: {
  searchParams: Promise<{ tab?: string }>;
}) {
  const { tab } = await searchParams;
  const terms = tab === "terms";
  return (
    <div className="info-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">YOUR SPACE, WITH CLARITY</span>
          <h1>{terms ? "Terms of use." : "Privacy & your data."}</h1>
          <p>How this reading workspace handles your documents.</p>
        </div>
      </div>
      <div className="filter-tabs" style={{ marginBottom: 25 }}>
        <Link href="/legal?tab=privacy" className="button secondary">
          Privacy
        </Link>
        <Link href="/legal?tab=terms" className="button secondary">
          Terms
        </Link>
      </div>
      <section className="info-card">
        {terms ? (
          <>
            <h2>A tool for thoughtful reading</h2>
            <p>
              Only upload documents you are allowed to use. Local results are
              retrieved passages; AI results may contain mistakes. Always check
              the original source before relying on an answer. This workspace is
              not a substitute for professional advice.
            </p>
            <h2>Your documents</h2>
            <p>
              You retain ownership of your documents. Keep original files and
              export conversations that matter to you. Browser storage can be
              removed by clearing site data or device settings. Connected
              service availability, account access, and usage limits depend on
              the service provider.
            </p>
          </>
        ) : (
          <>
            <h2>Reading on your device</h2>
            <p>
              In local mode, PDFs, extracted text, and conversations are saved
              in this browser using device storage. Document text is searched
              locally and is not sent to the AI service. Removing a document
              from your local library removes its stored PDF and conversation.
            </p>
            <h2>Your private cloud library</h2>
            <p>
              Choosing Cloud library uploads your PDF, extracted text, reading
              preferences, and saved conversation to private Vercel Blob storage.
              Sign in to the same account to open these on another device. Files
              are served through authenticated routes and are not public links.
              Removing a cloud document deletes its PDF and conversation across
              devices. Free storage has shared capacity and monthly usage limits.
              Existing local documents are not uploaded automatically.
            </p>
            <h2>Connected AI reading</h2>
            <p>
              When you choose AI answers, selected text passages, your question,
              the document title, and up to four recent messages are sent
              through this app’s server to Groq. The original PDF is not sent to
              Groq. Groq’s data policy applies to these requests. Clerk
              handles account authentication. Signing in does not automatically
              upload documents. If the optional legacy cloud backend is enabled,
              its separate upload and storage policies also apply.
            </p>
            <h2>Keeping a copy</h2>
            <p>
              Use Download PDF and Export chat to keep your own copies. Local
              data stays on this device and may be lost if site storage is
              cleared.
            </p>
          </>
        )}
      </section>
    </div>
  );
}
