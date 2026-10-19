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
          "Choose a PDF under 10 MB, with up to 500 pages. On a phone, tap Choose a PDF and select it from Files or Downloads. Unlock password-protected files first. Scanned PDFs can be saved and viewed; questions require selectable text.",
        ],
        [
          "02",
          "Choose your reading space",
          "Sign in and choose Cloud library before importing to save your PDF privately across devices. Choose On this device for a browser-only copy. In the document, choose Local search for passage matching, or AI answers to send selected excerpts and recent messages to Groq.",
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
          "Cloud PDFs and conversations are available when you sign into the same account on another device. Removing a cloud document deletes it across devices. PDFs saved On this device stay in that browser; clearing site data removes them. Download PDFs and export chats to keep your own copies. Free cloud storage and AI have shared usage limits.",
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
