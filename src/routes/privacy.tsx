import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./root";
import Layout from "../components/layout/Layout";
import { Button } from "../components/ui";
import { ArrowLeftIcon } from "lucide-react";

export const privacyRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/privacy",
  component: PrivacyPage,
});

function PrivacyPage() {
  const navigate = useNavigate();
  return (
    <Layout isAuthenticated={false}>
      <div className="min-h-screen bg-concrete">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <Button
            variant="outline"
            className="bg-white text-thunder mb-4 sm:mb-6"
            onClick={() => navigate({ to: "/" })}
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back
          </Button>
          <div className="bg-white rounded-lg shadow-sm border border-gray-light p-4 sm:p-6 lg:p-8">
            {/* Header */}
            <img
              src="/public/logo.png"
              alt="Logo"
              className="w-16 sm:w-20 mb-4 sm:mb-6"
            />
            <div className="border-b border-gray-light pb-4 sm:pb-6 mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-thunder mb-2">
                Privacy Policy
              </h1>
              <div className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-2 text-xs sm:text-sm text-thunder">
                <span>
                  <strong>Effective Date:</strong> June 27, 2025
                </span>
                <span className="hidden sm:inline">•</span>
                <span>
                  <strong>Last Updated:</strong> June 27, 2025
                </span>
              </div>
            </div>

            {/* Introduction */}
            <section className="prose prose-gray max-w-none mb-6 sm:mb-8">
              <p className="text-base sm:text-lg text-thunder leading-relaxed">
                Welcome to Actioneer ("we," "our," or "us"). This Privacy Policy
                explains how we collect, use, protect, and share your
                information when you use our email intelligence platform and
                Gmail add-on (collectively, the "Service").
              </p>
              <p className="text-gray mt-3 sm:mt-4 text-sm sm:text-base">
                We believe that privacy isn't just a feature—it's a fundamental
                right. This policy is written in plain English because
                transparency should never be hidden behind legal jargon. When it
                comes to your data, we practice what we preach: minimal
                collection, maximum protection.
              </p>
            </section>

            {/* Information We Collect */}
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-heliotrope mb-3 sm:mb-4">
                Information We Collect
              </h2>

              <div className="space-y-4 sm:space-y-6">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-thunder mb-3">
                    Email Data
                  </h3>

                  <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                    <div className="bg-green-50 border-2 border-gray-light rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-green-900 mb-2 text-sm sm:text-base">
                        ✅ What We Access
                      </h4>
                      <ul className="text-xs sm:text-sm text-green-800 space-y-1">
                        <li>
                          • Email content from specific categories only
                          (receipts, travel bookings, job applications)
                        </li>
                        <li>
                          • Email metadata (sender, subject, date, message ID)
                        </li>
                        <li>• Attachments related to supported categories</li>
                      </ul>
                    </div>

                    <div className="bg-red-50 border-2 border-gray-light rounded-lg p-3 sm:p-4">
                      <h4 className="font-semibold text-red-900 mb-2 text-sm sm:text-base">
                        ❌ What We Don't Access
                      </h4>
                      <ul className="text-xs sm:text-sm text-red-800 space-y-1">
                        <li>• Personal conversations or correspondence</li>
                        <li>• Draft emails</li>
                        <li>• Sent emails (unless relevant category data)</li>
                        <li>• Emails outside our supported categories</li>
                      </ul>
                    </div>
                  </div>

                  <div className="mt-4 bg-blue-50 border-2 border-gray-light rounded-lg p-3 sm:p-4">
                    <h4 className="font-semibold text-blue-900 mb-2 text-sm sm:text-base">
                      🔐 How We Access It
                    </h4>
                    <ul className="text-xs sm:text-sm text-blue-800 space-y-1">
                      <li>• Through Gmail API with explicit user consent</li>
                      <li>• Via Gmail add-on integration when activated</li>
                      <li>
                        • Real-time processing through Gmail push notifications
                      </li>
                      <li>
                        • OAuth 2.0 authentication with refresh token management
                      </li>
                    </ul>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-thunder mb-3">
                    Account Information
                  </h3>
                  <ul className="text-thunder space-y-1 text-sm sm:text-base">
                    <li>
                      • <strong>Google Account Details:</strong> Email address,
                      profile information
                    </li>
                    <li>
                      • <strong>Authentication Data:</strong> OAuth tokens, API
                      keys, session information
                    </li>
                    <li>
                      • <strong>Usage Data:</strong> Dashboard interactions,
                      feature usage patterns (aggregated only)
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-thunder mb-3">
                    Extracted Data
                  </h3>
                  <p className="text-thunder mb-2 text-sm sm:text-base">
                    From processed emails, we extract and store:
                  </p>
                  <ul className="text-thunder space-y-1 text-sm sm:text-base">
                    <li>
                      • <strong>Financial Data:</strong> Transaction amounts,
                      merchants, categories, dates
                    </li>
                    <li>
                      • <strong>Travel Information:</strong> Destinations,
                      dates, booking references, accommodation details
                    </li>
                    <li>
                      • <strong>Job Application Data:</strong> Company names,
                      positions, application status, interview dates
                    </li>
                  </ul>
                </div>
              </div>
            </section>

            {/* How We Use Your Information */}
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-heliotrope mb-3 sm:mb-4">
                How We Use Your Information
              </h2>

              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-thunder mb-3">
                    Primary Functions
                  </h3>
                  <ol className="text-thunder space-y-2 text-sm sm:text-base">
                    <li>
                      <strong>1. Email Classification:</strong> AI-powered
                      categorization of incoming emails
                    </li>
                    <li>
                      <strong>2. Data Extraction:</strong> Intelligent parsing
                      of relevant information from emails
                    </li>
                    <li>
                      <strong>3. Dashboard Population:</strong> Organizing
                      extracted data in your personal dashboard
                    </li>
                    <li>
                      <strong>4. Insights Generation:</strong> Creating
                      analytics and recommendations based on your data
                    </li>
                  </ol>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-thunder mb-3">
                    Secondary Functions
                  </h3>
                  <ol className="text-thunder space-y-2 text-sm sm:text-base">
                    <li>
                      <strong>1. Service Improvement:</strong> Analyzing usage
                      patterns to enhance features
                    </li>
                    <li>
                      <strong>2. Security Monitoring:</strong> Detecting and
                      preventing unauthorized access
                    </li>
                    <li>
                      <strong>3. Technical Support:</strong> Troubleshooting
                      issues and providing customer assistance
                    </li>
                    <li>
                      <strong>4. Legal Compliance:</strong> Meeting regulatory
                      requirements and legal obligations
                    </li>
                  </ol>
                </div>
              </div>

              <div className="mt-4 sm:mt-6 bg-purple-50 border-2 border-gray-light rounded-lg p-3 sm:p-4">
                <h3 className="text-lg sm:text-xl font-semibold text-thunder mb-3">
                  AI Processing
                </h3>
                <p className="text-thunder mb-2 text-sm sm:text-base">
                  We use OpenAI GPT-4 for:
                </p>
                <ul className="text-thunder space-y-1 text-sm sm:text-base">
                  <li>• Email content analysis and classification</li>
                  <li>• Data extraction from various email formats</li>
                  <li>• Travel recommendations and insights generation</li>
                  <li>• Financial categorization and analytics</li>
                </ul>
                <div className="text-xs sm:text-sm text-gray mt-3 font-medium bg-gold/10 border-2 border-gold rounded-lg p-3 sm:p-4">
                  <strong>Important:</strong> All AI processing is conducted
                  with strict privacy controls. Your email content is processed
                  only for the specific purpose of data extraction and is not
                  used to train AI models or shared with third parties.
                </div>
              </div>
            </section>

            {/* Gmail Add-on Permissions */}
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-heliotrope mb-3 sm:mb-4">
                Gmail Add-on and Permissions
              </h2>

              <p className="text-thunder mb-4 text-sm sm:text-base">
                For complete transparency, here are the specific Gmail
                permissions we request:
              </p>

              <div className="border-2 border-gray-light rounded-lg overflow-hidden">
                {[
                  {
                    permission: "gmail.readonly",
                    title: "Read emails for analysis",
                    purpose:
                      "Analyze incoming emails for receipts, travel bookings, and job applications",
                    scope: "Only emails relevant to supported categories",
                  },
                  {
                    permission: "gmail.addons.execute",
                    title: "Add-on execution",
                    purpose: "Display smart actions within Gmail interface",
                    scope: "Gmail sidebar integration only",
                  },
                  {
                    permission: "userinfo.email",
                    title: "User email address",
                    purpose: "Link processed data to your account",
                    scope: "Email address only, no additional profile data",
                  },
                  {
                    permission: "script.external_request",
                    title: "External requests",
                    purpose: "Communicate with our secure processing servers",
                    scope: "Actioneer servers only",
                  },
                ].map((item, index, array) => (
                  <div key={index}>
                    <div className="flex flex-col sm:grid sm:grid-cols-12 gap-2 sm:gap-3 py-3 sm:py-4 px-3 sm:px-4">
                      <div className="sm:col-span-4 lg:col-span-3">
                        <span className="text-xs font-mono px-2 py-1 rounded bg-concrete text-thunder inline-block">
                          {item.permission}
                        </span>
                      </div>
                      <div className="sm:col-span-8 lg:col-span-9">
                        <h4 className="font-semibold text-gray-900 text-sm sm:text-base">
                          {item.title}
                        </h4>
                        <p className="text-xs sm:text-sm text-gray-600 mt-1">
                          <strong>Purpose:</strong> {item.purpose}
                        </p>
                        <p className="text-xs sm:text-sm text-gray-600">
                          <strong>Scope:</strong> {item.scope}
                        </p>
                      </div>
                    </div>
                    {index < array.length - 1 && (
                      <hr className="border-concrete" />
                    )}
                  </div>
                ))}
              </div>
            </section>

            {/* Zero Tracking Promise */}
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-heliotrope mb-3 sm:mb-4">
                Our Zero-Tracking Promise
              </h2>

              <div className="bg-gold/10 border-2 border-gold rounded-lg p-4 sm:p-6">
                <h3 className="text-lg sm:text-xl font-semibold text-thunder mb-3">
                  We don't track you. Period.
                </h3>
                <p className="text-thunder mb-3 text-sm sm:text-base">
                  Here's what we <strong>don't</strong> collect:
                </p>
                <div className="grid gap-2 sm:gap-4 sm:grid-cols-2">
                  <ul className="text-thunder space-y-1 text-sm sm:text-base">
                    <li>❌ Analytics or pageview data</li>
                    <li>❌ Behavioral tracking information</li>
                    <li>❌ Marketing or advertising data</li>
                  </ul>
                  <ul className="text-thunder space-y-1 text-sm sm:text-base">
                    <li>❌ Cross-site tracking cookies</li>
                    <li>❌ Third-party tracking pixels</li>
                    <li>❌ User profiling or targeting</li>
                  </ul>
                </div>
              </div>

              <div className="mt-4 bg-gold/10 border-2 border-gold rounded-lg p-3 sm:p-4">
                <h4 className="font-semibold text-thunder mb-2 text-sm sm:text-base">
                  Essential Cookies Only
                </h4>
                <p className="text-thunder text-xs sm:text-sm mb-2">
                  We use minimal, essential cookies for:
                </p>
                <ul className="text-thunder text-xs sm:text-sm space-y-1">
                  <li>
                    • <strong>Authentication:</strong> Keeping you logged in
                    securely
                  </li>
                  <li>
                    • <strong>Preferences:</strong> Remembering your dashboard
                    settings
                  </li>
                  <li>
                    • <strong>Security:</strong> Preventing fraud and
                    unauthorized access
                  </li>
                </ul>
              </div>
            </section>

            {/* Your Privacy Rights */}
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-heliotrope mb-3 sm:mb-4">
                Your Privacy Rights
              </h2>

              <div className="grid gap-4 sm:gap-6 lg:grid-cols-2">
                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-thunder mb-3">
                    Access and Control
                  </h3>
                  <ul className="text-thunder space-y-2 text-sm sm:text-base">
                    <li>
                      • <strong>Data Export:</strong> Download all your
                      processed data
                    </li>
                    <li>
                      • <strong>Correction Rights:</strong> Update inaccurate
                      information
                    </li>
                    <li>
                      • <strong>Deletion Rights:</strong> Delete your account
                      and all data
                    </li>
                    <li>
                      • <strong>Processing Control:</strong> Pause or resume
                      email processing
                    </li>
                  </ul>
                </div>

                <div>
                  <h3 className="text-lg sm:text-xl font-semibold text-thunder mb-3">
                    Regional Rights
                  </h3>
                  <div className="space-y-3">
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                        GDPR (EU Users)
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Full access, rectification, erasure, and portability
                        rights
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                        CCPA (California)
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        Right to know, delete, and opt-out (we don't sell data)
                      </p>
                    </div>
                    <div>
                      <h4 className="font-medium text-gray-900 text-sm sm:text-base">
                        Global Standards
                      </h4>
                      <p className="text-xs sm:text-sm text-gray-600">
                        We apply the highest privacy standards worldwide
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Data Security */}
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-heliotrope mb-3 sm:mb-4">
                Data Security
              </h2>

              <div className="bg-white border-2 border-gray-light rounded-lg p-4 sm:p-6">
                <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:divide-x lg:divide-concrete">
                  <div className="lg:flex-1 lg:pr-6">
                    <h3 className="font-semibold text-thunder mb-2 text-sm sm:text-base">
                      Technical Safeguards
                    </h3>
                    <ul className="text-xs sm:text-sm text-thunder space-y-1">
                      <li>• End-to-end encryption</li>
                      <li>• PostgreSQL with RLS</li>
                      <li>• User-specific API keys</li>
                      <li>• SOC 2 compliance</li>
                    </ul>
                  </div>

                  <div className="lg:flex-1 lg:px-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-concrete">
                    <h3 className="font-semibold text-thunder mb-2 text-sm sm:text-base">
                      Operational Security
                    </h3>
                    <ul className="text-xs sm:text-sm text-thunder space-y-1">
                      <li>• Minimal access controls</li>
                      <li>• Complete audit logs</li>
                      <li>• Regular security reviews</li>
                      <li>• Incident response plan</li>
                    </ul>
                  </div>

                  <div className="lg:flex-1 lg:pl-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-concrete">
                    <h3 className="font-semibold text-thunder mb-2 text-sm sm:text-base">
                      Data Retention
                    </h3>
                    <ul className="text-xs sm:text-sm text-thunder space-y-1">
                      <li>• Minimal retention policy</li>
                      <li>• Automatic data purging</li>
                      <li>• User deletion control</li>
                      <li>• Encrypted backups</li>
                    </ul>
                  </div>
                </div>
              </div>
            </section>

            {/* Contact Information */}
            <section className="mb-6 sm:mb-8">
              <h2 className="text-xl sm:text-2xl lg:text-3xl font-bold text-heliotrope mb-3 sm:mb-4">
                Contact and Support
              </h2>

              <div className="bg-white border-2 border-gray-light rounded-lg p-4 sm:p-6">
                <div className="flex flex-col space-y-4 lg:space-y-0 lg:flex-row lg:divide-x lg:divide-concrete">
                  <div className="lg:flex-1 lg:pr-6">
                    <h3 className="font-semibold text-thunder mb-2 text-sm sm:text-base">
                      Privacy Questions
                    </h3>
                    <p className="text-xs sm:text-sm text-thunder mb-2">
                      <strong>Email:</strong>{" "}
                      <a
                        href="mailto:itujono@gmail.com"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        itujono@gmail.com
                      </a>
                    </p>
                    <p className="text-xs text-gray">
                      Response within 48 hours
                    </p>
                  </div>

                  <div className="lg:flex-1 lg:px-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-concrete">
                    <h3 className="font-semibold text-thunder mb-2 text-sm sm:text-base">
                      Data Rights Requests
                    </h3>
                    <p className="text-xs sm:text-sm text-thunder mb-2">
                      <strong>Email:</strong>{" "}
                      <a
                        href="mailto:itujono@gmail.com"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        itujono@gmail.com
                      </a>
                    </p>
                    <p className="text-xs text-gray">
                      Processing within 30 days
                    </p>
                  </div>

                  <div className="lg:flex-1 lg:pl-6 pt-4 lg:pt-0 border-t lg:border-t-0 border-concrete">
                    <h3 className="font-semibold text-thunder mb-2 text-sm sm:text-base">
                      General Support
                    </h3>
                    <p className="text-xs sm:text-sm text-thunder mb-2">
                      <strong>Email:</strong>{" "}
                      <a
                        href="mailto:itujono@gmail.com"
                        className="text-blue-600 hover:text-blue-800 underline break-all"
                      >
                        itujono@gmail.com
                      </a>
                    </p>
                    <p className="text-xs text-gray">
                      Community Discord coming soon
                    </p>
                  </div>
                </div>
              </div>
            </section>

            {/* Footer */}
          </div>
          <section className="border-t border-concrete pt-6 sm:pt-10 mt-6 sm:mt-8">
            <div className="text-center px-4">
              <img
                src="/public/logo.png"
                alt="Logo"
                className="w-16 sm:w-20 mx-auto mb-3 sm:mb-4"
              />
              <h3 className="text-lg sm:text-xl font-bold text-thunder mb-2">
                Your Privacy, Our Priority
              </h3>
              <p className="text-thunder mb-3 sm:mb-4 text-sm sm:text-base max-w-3xl mx-auto">
                At Actioneer, we believe that email intelligence shouldn't come
                at the cost of your privacy. We're committed to building trust
                through transparency, giving you control over your data, and
                protecting your information with the highest standards of
                security.
              </p>
              <p className="text-xs sm:text-sm text-heliotrope italic font-semibold">
                Making your emails work for you, not the other way
                around—privately and securely.
              </p>
            </div>
          </section>
        </div>
      </div>
    </Layout>
  );
}
