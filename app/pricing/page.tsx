"use client";

import Link from "next/link";
import { SignedOut } from "@clerk/nextjs";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faCheck } from "@fortawesome/free-solid-svg-icons";

export default function PricingPage() {
  const plans = [
    {
      name: "Starter",
      price: "$7",
      period: "per month",
      description: "Perfect for students and individual learners",
      highlighted: false,
      features: [
        "AI Model: Powered by GPT-4Mini",
        "Document Uploads: 50 PDFs per month",
        "Questions: 500 queries per month",
        "File Size Limit: 10 MB per PDF",
        "Basic Support: Email support",
      ],
      cta: "Get Started",
    },
    {
      name: "Pro",
      price: "$14",
      period: "per month",
      description: "For power users and professionals who need the best",
      highlighted: true,
      features: [
        "AI Model: Powered by the advanced GPT-5 / 5.1 (Faster, more accurate)",
        "Document Uploads: 300 PDFs per month",
        "Questions: 2,000 queries per month",
        "File Size Limit: 50 MB per PDF",
        { header: "Priority Features:" },
        "• Priority processing for faster answers",
        "• Export chats to text files",
        "Priority Email & Chat Support",
      ],
      cta: "Get Started",
    },
    {
      name: "Team",
      price: "$25",
      period: "per month",
      description: "Collaborate and share insights with your team",
      highlighted: false,
      features: [
        "Includes 3 member seats",
        "Additional members: +$5 per month each",
        "AI Model: Powered by the advanced GPT-5 / 5.1",
        "Shared Document Library: A central space for team PDFs",
        "Team Management: Admin controls and usage analytics",
        { header: "All Pro Features Included:" },
        "• 300 shared PDF uploads per month",
        "• 2,000 shared queries per month",
        "• 50 MB file size limit",
        "Priority Support",
      ],
      cta: "Get Started",
    },
  ];

  return (
    <div className="min-h-screen bg-gray-900 py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h1 className="text-4xl md:text-5xl font-bold text-white mb-4">
            Plans & Pricing
          </h1>
          <p className="text-xl text-gray-400 max-w-2xl mx-auto">
            Choose the perfect plan for your needs. All plans include secure PDF
            processing and AI-powered chat.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-6">
          {plans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border-2 p-8 ${
                plan.highlighted
                  ? "border-emerald-500 bg-gray-800 shadow-2xl shadow-emerald-900/20 scale-105 md:scale-110"
                  : "border-gray-700 bg-gray-800/50"
              } transition-all duration-300 hover:border-emerald-500/50`}
            >

              <div className="text-center mb-8">
                <h3 className="text-2xl font-bold text-white mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-4xl font-bold text-white">
                    {plan.price}
                  </span>
                  <span className="text-gray-400">{plan.period}</span>
                </div>
                <p className="text-gray-400 text-sm">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-8">
                {plan.features.map((feature, featureIndex) => {
                  if (typeof feature === "object" && feature.header) {
                    return (
                      <li
                        key={featureIndex}
                        className="font-semibold text-white mt-4 mb-2"
                      >
                        {feature.header}
                      </li>
                    );
                  }
                  
                  const featureText = typeof feature === "string" ? feature : "";
                  const isNested = featureText.trim().startsWith("•");
                  
                  return (
                    <li
                      key={featureIndex}
                      className={`flex items-start gap-3 ${
                        isNested ? "ml-6" : ""
                      } text-gray-300`}
                    >
                      {!isNested && (
                        <span className="flex-shrink-0 mt-0.5">
                          <FontAwesomeIcon
                            icon={faCheck}
                            className="text-emerald-400 w-4 h-4"
                          />
                        </span>
                      )}
                      <span className={`${isNested ? "text-xs" : "text-sm"}`}>
                        {featureText}
                      </span>
                    </li>
                  );
                })}
              </ul>

              <Link
                href="/sign-up"
                className={`block w-full text-center py-3 px-6 rounded-lg font-semibold transition-colors ${
                  plan.highlighted
                    ? "bg-emerald-500 hover:bg-emerald-400 text-white"
                    : "bg-gray-700 hover:bg-gray-600 text-white border border-gray-600"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <SignedOut>
          <div className="text-center mt-12">
            <p className="text-gray-400 mb-4">
              Already have an account?{" "}
              <Link
                href="/sign-in"
                className="text-emerald-400 hover:text-emerald-300 underline"
              >
                Sign in
              </Link>
            </p>
          </div>
        </SignedOut>

        <div className="mt-16 text-center">
          <p className="text-gray-500 text-sm">
            All plans are billed monthly. Cancel anytime. No hidden fees.
          </p>
        </div>
      </div>
    </div>
  );
}
