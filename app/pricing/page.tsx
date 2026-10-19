import Link from "next/link";
import Icon from "@/components/Icon";
import AIConnection from "@/components/AIConnection";
export default function AIWorkspacePage() {
  return (
    <div className="info-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">YOUR DOCUMENTS. REAL AI ANSWERS.</span>
          <h1>
            From information
            <br />
            to <em>understanding.</em>
          </h1>
          <p>
            Groq powers document Q&A, grounded summaries, and study questions.
            Your PDFs stay in your browser.
          </p>
        </div>
      </div>
      <AIConnection />
      <div className="info-cards ai-feature-cards">
        <section className="info-card">
          <Icon name="search" size={26} />
          <h2>Local search</h2>
          <p>
            Private passage search runs on this device. No API key, no network
            request, no AI quota.
          </p>
          <ul>
            <li>Search document text and open source pages</li>
            <li>Keep PDFs and conversations in this browser</li>
            <li>Export a conversation or download your PDF</li>
          </ul>
          <Link className="button secondary" href="/upload">
            Import a PDF
            <Icon name="arrow" size={16} />
          </Link>
        </section>
        <section className="info-card accent-card">
          <Icon name="spark" size={26} />
          <h2>AI answers</h2>
          <p>
            Open a document and select AI answers. Only selected excerpts and
            recent chat context go to Groq.
          </p>
          <ul>
            <li>Ask questions and follow page citations</li>
            <li>Summarize, simplify, or create a study quiz</li>
            <li>See source coverage and cancel a request</li>
          </ul>
          <Link className="button primary" href="/dashboard">
            Explore your documents
            <Icon name="arrow" size={16} />
          </Link>
        </section>
      </div>
      <div className="notice">
        <Icon name="help" size={18} />
        Free-plan quotas apply across the connected Groq account. The app adds
        conservative per-user and shared limits. Stay on Groq’s free plan to
        avoid paid usage.
      </div>
    </div>
  );
}
