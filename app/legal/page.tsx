"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";

function LegalContent() {
  const searchParams = useSearchParams();
  const tabParam = searchParams.get("tab");
  const [activeTab, setActiveTab] = useState<"privacy" | "terms">(
    tabParam === "terms" ? "terms" : "privacy"
  );

  useEffect(() => {
    if (tabParam === "terms") {
      setActiveTab("terms");
    } else if (tabParam === "privacy") {
      setActiveTab("privacy");
    }
  }, [tabParam]);

  const getCurrentDate = () => {
    return new Date().toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-white mb-4">Legal</h1>
          
          {/* Toggle Buttons */}
          <div className="flex justify-center gap-4 mb-8">
            <button
              onClick={() => setActiveTab("privacy")}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === "privacy"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
              }`}
            >
              Privacy Policy
            </button>
            <button
              onClick={() => setActiveTab("terms")}
              className={`px-6 py-3 rounded-lg font-semibold transition-colors ${
                activeTab === "terms"
                  ? "bg-emerald-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700 hover:text-gray-300"
              }`}
            >
              Terms of Service
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="bg-gray-800 border border-gray-700 rounded-xl p-6 md:p-8">
          {activeTab === "privacy" ? (
            <div className="prose prose-invert max-w-none">
              <h1 className="text-3xl font-bold text-white mb-4">
                Privacy Policy for LoomRead
              </h1>
              <p className="text-gray-400 mb-8">Last Updated: {getCurrentDate()}</p>

              <div className="text-gray-300 space-y-6">
                <section>
                  <p>
                    Welcome to LoomRead ("we," "our," or "us"). We operate the
                    LoomRead web application (the "Service"), which allows you to
                    chat with your PDF documents. Your privacy is critically
                    important to us.
                  </p>
                  <p>
                    This Privacy Policy explains how we collect, use, disclose, and
                    safeguard your information when you use our Service. Please read it
                    carefully.
                  </p>
                  <p>
                    By using our Service, you consent to the practices described in
                    this policy.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    1. Information We Collect
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        a. Personal Information:
                      </h3>
                      <ul className="list-disc list-inside space-y-2 ml-4">
                        <li>
                          <strong>Account Information:</strong> When you register, we
                          collect your name, email address, and password.
                        </li>
                        <li>
                          <strong>Billing Information:</strong> If you purchase a
                          premium plan, our third-party payment processors (e.g.,
                            Paddle) collect your payment details. We do not store
                          sensitive payment information on our servers.
                        </li>
                      </ul>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        b. PDF Documents and Content:
                      </h3>
                      <p>
                        This is the core of our service. We collect and process the
                        PDF files you upload and the text content extracted from them
                        to enable the chat functionality.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        c. Chat Data and Interactions:
                      </h3>
                      <p>
                        We collect the conversations you have with your documents,
                        including your questions and the AI-generated responses.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        d. Automatically Collected Information:
                      </h3>
                      <p>
                        We collect data like your IP address, browser type, pages
                        visited, and usage patterns through cookies and similar
                        technologies.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    2. How We Use Your Information
                  </h2>
                  <p>We use the information we collect to:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>Provide and Maintain the Service:</strong> To process
                      your PDFs, generate chat responses, and manage your account.
                    </li>
                    <li>
                      <strong>Improve the Service:</strong> To analyze usage to
                      improve our AI and user experience. We may use anonymized and
                      aggregated data (not personally identifiable) to train our AI
                      models.
                    </li>
                    <li>
                      <strong>Communicate with You:</strong> To send you
                      service-related notices, security alerts, and support messages.
                    </li>
                    <li>
                      <strong>Ensure Security:</strong> To monitor and prevent fraud
                      and abuse.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    3. How We Share Your Information
                  </h2>
                  <p>
                    We do not sell your personal information or the content of your
                    PDFs. We may share your information only in the following limited
                    circumstances:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      <strong>With Service Providers:</strong> Trusted third parties
                      who help us operate our Service (Supabase, OpenAI, Paddle, Clerk). These partners are bound by
                      strict data protection agreements.
                    </li>
                    <li>
                      <strong>For Legal Reasons:</strong> If required to do so by law
                      or in response to a valid legal request.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    4. AI and Data Processing
                  </h2>
                  <p>
                    To provide the chat functionality, the text from your PDFs and
                    your chat interactions are processed by our AI systems.
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      We use reputable AI providers who are contractually obligated to
                      protect your data.
                    </li>
                    <li>
                      We may use anonymized and aggregated data (where you cannot be
                      identified) to improve and train our AI models.
                    </li>
                    <li>
                      You can delete your PDFs and chat history at any time, which
                      removes this data from our active systems.
                    </li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    5. Data Retention
                  </h2>
                  <p>
                    We retain your personal information and PDF content for as long as
                    your account is active. If you delete your account, we will delete
                    your associated data from our active databases within a reasonable
                    timeframe. Some data may remain in backups for a limited period.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    6. Your Rights
                  </h2>
                  <p>
                    Depending on your location, you may have rights regarding your
                    personal data, including the right to access, correct, or delete
                    your data. You can manage much of this directly in your account
                    settings. To exercise other rights, please contact us at{" "}
                    <a
                      href="mailto:aeubs66@gmail.com"
                      className="text-emerald-400 hover:text-emerald-300 underline"
                    >
                      aeubs66@gmail.com
                    </a>
                    .
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    7. Data Security
                  </h2>
                  <p>
                    We implement industry-standard security measures to protect your
                    data. However, no method of electronic transmission or storage is
                    100% secure, and we cannot guarantee absolute security.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    8. International Transfers
                  </h2>
                  <p>
                    Your information may be processed in countries other than your own.
                    We ensure appropriate safeguards are in place to protect your data
                    in these cases.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    9. Children's Privacy
                  </h2>
                  <p>
                    Our Service is not directed to individuals under the age of 16. We
                    do not knowingly collect personal information from children.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    10. Changes to This Policy
                  </h2>
                  <p>
                    We may update this policy. We will notify you of any changes by
                    posting the new policy on this page and updating the "Last Updated"
                    date.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    11. Contact Us
                  </h2>
                  <p>
                    If you have any questions about this Privacy Policy, please contact
                    us at:{" "}
                    <a
                      href="mailto:aeubs66@gmail.com"
                      className="text-emerald-400 hover:text-emerald-300 underline"
                    >
                      aeubs66@gmail.com
                    </a>
                    .
                  </p>
                </section>
              </div>
            </div>
          ) : (
            <div className="prose prose-invert max-w-none">
              <h1 className="text-3xl font-bold text-white mb-4">
                Terms of Service for LoomRead
              </h1>
              <p className="text-gray-400 mb-8">Last Updated: {getCurrentDate()}</p>

              <div className="text-gray-300 space-y-6">
                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    1. Agreement to Terms
                  </h2>
                  <p>
                    By accessing or using the LoomRead service ("Service"), you agree
                    to be bound by these Terms of Service. If you disagree with any
                    part of the terms, you may not access the Service.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    2. Description of Service
                  </h2>
                  <p>
                    LoomRead is a Software-as-a-Service (SaaS) application that
                    allows users to upload PDF documents and interact with them through
                    a chat interface powered by artificial intelligence.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    3. User Accounts
                  </h2>
                  <p>
                    You are responsible for maintaining the confidentiality of your
                    account and password. You agree to accept responsibility for all
                    activities that occur under your account.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    4. Acceptable Use
                  </h2>
                  <p>
                    You agree not to use the Service to upload, post, or otherwise
                    transmit any content that:
                  </p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>
                      Is illegal, harmful, or infringes on any third party's
                      intellectual property rights.
                    </li>
                    <li>
                      Contains sensitive personal information (e.g., social security
                      numbers, financial data, health records) unless you have explicit
                      permission and accept the heightened risk.
                    </li>
                    <li>
                      Is spam, contains viruses, or is designed to disrupt the Service.
                    </li>
                  </ul>
                  <p className="mt-4">
                    You also agree not to misuse the Service by attempting to reverse
                    engineer, decompile, or extract the source code of our AI models.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    5. User Content
                  </h2>
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        a. Ownership:
                      </h3>
                      <p>
                        You retain all ownership rights to the PDF documents and other
                        content you upload to LoomRead ("User Content").
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        b. License to Us:
                      </h3>
                      <p>
                        By uploading User Content, you grant LoomRead a worldwide,
                        non-exclusive, royalty-free license to use, host, store, and
                        process that content solely for the purpose of providing and
                        improving the Service for you. This includes the right for our
                        AI systems to analyze the text of your PDFs to generate
                        responses to your queries.
                      </p>
                    </div>
                    <div>
                      <h3 className="text-xl font-semibold text-white mb-2">
                        c. Your Responsibility:
                      </h3>
                      <p>
                        You are solely responsible for your User Content and the
                        consequences of uploading it. You represent and warrant that
                        you own or have the necessary rights to all User Content you
                        upload.
                      </p>
                    </div>
                  </div>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    6. Our Intellectual Property
                  </h2>
                  <p>
                    The LoomRead service, including its underlying software, AI models,
                    design, and all related intellectual property, is and remains the
                    exclusive property of LoomRead and its licensors.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    7. Fees and Payment
                  </h2>
                  <p>For any paid subscription plans:</p>
                  <ul className="list-disc list-inside space-y-2 ml-4">
                    <li>You agree to pay all applicable fees.</li>
                    <li>
                      Fees are non-refundable, except as required by law or as stated
                      in our refund policy.
                    </li>
                    <li>We may change our fees with reasonable notice.</li>
                  </ul>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    8. Disclaimer of Warranties
                  </h2>
                  <p className="font-semibold">
                    THE SERVICE IS PROVIDED "AS IS" AND "AS AVAILABLE" WITHOUT
                    WARRANTIES OF ANY KIND, EITHER EXPRESS OR IMPLIED. WE DO NOT
                    GUARANTEE THAT THE SERVICE WILL BE UNINTERRUPTED, ERROR-FREE, OR
                    THAT THE AI-GENERATED RESPONSES WILL BE COMPLETELY ACCURATE.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    9. Limitation of Liability
                  </h2>
                  <p className="font-semibold">
                    TO THE FULLEST EXTENT PERMITTED BY LAW, STUDYLOM SHALL NOT BE
                    LIABLE FOR ANY INDIRECT, INCIDENTAL, SPECIAL, OR CONSEQUENTIAL
                    DAMAGES ARISING OUT OF OR IN CONNECTION WITH YOUR USE OF THE
                    SERVICE.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    10. Termination
                  </h2>
                  <p>
                    We may suspend or terminate your account and access to the Service
                    at our sole discretion if you violate these Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    11. Governing Law
                  </h2>
                  <p>
                    These Terms shall be governed by the laws of [Your Country/State],
                    without regard to its conflict of law provisions.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    12. Changes to Terms
                  </h2>
                  <p>
                    We reserve the right to modify these Terms at any time. We will
                    provide notice of changes by posting the updated Terms on our
                    website. Your continued use of the Service after such changes
                    constitutes your acceptance of the new Terms.
                  </p>
                </section>

                <section>
                  <h2 className="text-2xl font-semibold text-white mt-8 mb-4">
                    13. Contact Us
                  </h2>
                  <p>
                    If you have any questions about these Terms, please contact us at:{" "}
                    <a
                      href="mailto:aeubs66@gmail.com"
                      className="text-emerald-400 hover:text-emerald-300 underline"
                    >
                      aeubs66@gmail.com
                    </a>
                    .
                  </p>
                </section>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function LegalPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-gray-900 py-16"><div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8"><div className="text-center text-gray-400">Loading...</div></div></div>}>
      <LegalContent />
    </Suspense>
  );
}

