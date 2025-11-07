import Link from "next/link";

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      <main className="max-w-4xl mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            Chat with your PDFs
          </h1>
          <p className="text-xl text-gray-400 mb-8 max-w-2xl mx-auto">
            Upload PDFs and have conversations with them. Get answers with page citations.
          </p>
          <div className="flex gap-4 justify-center">
            <Link
              href="/sign-up"
              className="px-6 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-medium rounded-lg transition-colors"
            >
              Get started
            </Link>
            <Link
              href="/pricing"
              className="px-6 py-3 border border-gray-700 hover:border-gray-600 text-white font-medium rounded-lg transition-colors"
            >
              View pricing
            </Link>
          </div>
        </div>

        <div className="mt-20 space-y-4">
          <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
            <div className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-full bg-emerald-600 flex items-center justify-center flex-shrink-0">
                <span className="text-white text-sm font-semibold">AI</span>
              </div>
              <div className="flex-1">
                <p className="text-gray-300">
                  Welcome! Upload a PDF to get started. I can help you understand, summarize, and answer questions about your documents.
                </p>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

