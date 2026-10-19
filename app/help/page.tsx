import Link from "next/link";
import Icon from "@/components/Icon";
export default function HelpPage() {
  return (
    <div className="info-page">
      <div className="page-intro">
        <div>
          <span className="eyebrow">A SMALL GUIDE TO GETTING STARTED</span>
          <h1>
            Follow your <em>curiosity.</em>
          </h1>
          <p>Everything you need for a more thoughtful reading session.</p>
        </div>
      </div>
      {[
        [
          "01",
          "Bring a document",
          "Upload a text-based PDF under 10 MB, with up to 500 pages. Drag it into the upload area or choose it from your files. Password-protected files must be unlocked first; scanned images need OCR before uploading.",
        ],
        [
          "02",
          "Choose your reading space",
          "Import your PDF to save it in this browser. In the document, choose Local search to find passages entirely on your device, or AI answers to send selected excerpts and recent conversation messages to Groq. Deployed workspaces require sign-in for AI by default.",
        ],
        [
          "03",
          "Ask a good question",
          "Use a specific word, phrase, or topic for local search. In AI mode, ask a question or use Summarize, Explain simply, and Quiz me. AI responses show page citations and how many pages supplied their excerpts. Long-document overviews sample pages rather than reading every page.",
        ],
        [
          "04",
          "Find your way back",
          "Select a page citation to read its original context. Switch between extracted text and PDF preview, browse pages, download your PDF, or export your conversation as a text file.",
        ],
        [
          "05",
          "Keep your library close",
          "Your PDFs and conversations stay in this browser on this device after a refresh. Clearing site data removes them. Rename a document from its reading room, remove it from your library, or clear its chat. Download and export anything you want to keep. The free AI tier has shared usage limits; local search remains available when limits are reached.",
        ],
      ].map(([n, title, text]) => (
        <section key={n} className="guide-step">
          <span>{n}</span>
          <div>
            <h2>{title}</h2>
            <p>{text}</p>
          </div>
        </section>
      ))}
      <Link href="/upload" className="button primary">
        Start a new read
        <Icon name="arrow" size={16} />
      </Link>
    </div>
  );
}
