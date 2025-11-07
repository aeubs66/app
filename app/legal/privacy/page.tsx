export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <h1 className="text-4xl font-bold text-white mb-8">Privacy Policy</h1>
        <div className="prose prose-invert max-w-none">
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-gray-300 space-y-4">
            <p className="text-gray-400">Last updated: January 2025</p>
            <p>
              This privacy policy describes how Chat with PDF collects, uses, and protects your information.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Information We Collect</h2>
            <p>
              We collect information you provide directly to us, including account information, uploaded PDFs, and chat interactions.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">How We Use Your Information</h2>
            <p>
              We use your information to provide, maintain, and improve our services, process payments, and communicate with you.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Data Security</h2>
            <p>
              We implement appropriate security measures to protect your data. However, no method of transmission over the internet is 100% secure.
            </p>
            <h2 className="text-2xl font-semibold text-white mt-8 mb-4">Contact Us</h2>
            <p>
              If you have questions about this privacy policy, please contact us at privacy@chatwithpdf.com
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

