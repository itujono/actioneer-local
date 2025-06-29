import { Link } from "@tanstack/react-router";
import {
  Shield,
  FileText,
  Mail,
  Users,
  ArrowUpRight,
  Target,
  Globe,
  Gauge,
} from "lucide-react";

export function OtherSections() {
  return (
    <>
      {/* Gmail Integration */}
      <section className="pt-12 mb-12" data-section="gmail-integration">
        <h2 className="text-3xl font-bold text-thunder mb-6">
          Gmail Integration
        </h2>
        <p className="text-gray mb-8">
          Gmail OAuth integration is essential for enabling automatic email
          processing. Once connected, it provides secure access to your emails
          for processing:
        </p>

        <div className="space-y-8">
          <div data-section="core-functionality">
            <h3 className="text-2xl font-semibold text-thunder mb-4">
              Core Functionality
            </h3>
            <div className="bg-white p-6 rounded-lg border border-concrete">
              <ul className="space-y-3 text-gray">
                <li>
                  • <strong>Automatic Email Processing:</strong> Enables
                  real-time classification and data extraction
                </li>
                <li>
                  • <strong>User Authentication:</strong> Creates your secure
                  API key for system access
                </li>
                <li>
                  • <strong>Gmail Watch Setup:</strong> Activates push
                  notifications for instant processing
                </li>
              </ul>
            </div>
          </div>

          <div data-section="enhanced-features">
            <h3 className="text-2xl font-semibold text-thunder mb-4">
              Enhanced Features
            </h3>
            <div className="bg-white p-6 rounded-lg border border-concrete">
              <ul className="space-y-3 text-gray">
                <li>
                  • <strong>Expense Details:</strong> View extracted receipt
                  information in your dashboard
                </li>
                <li>
                  • <strong>Travel Insights:</strong> Get hotel comparisons and
                  recommendations from booking emails
                </li>
                <li>
                  • <strong>Job Tracking:</strong> Update application status
                  through your dashboard
                </li>
                <li>
                  • <strong>Quick Dashboard Access:</strong> One-click
                  navigation to relevant dashboard sections
                </li>
              </ul>
            </div>
          </div>

          <div data-section="setup">
            <h3 className="text-2xl font-semibold text-thunder mb-4">Setup</h3>
            <div className="bg-daisy border border-daisy rounded-lg p-6">
              <p className="text-white">
                <span className="text-lavender">Gmail integration</span> is
                available directly through the web dashboard. Simply sign in and
                click{" "}
                <span className="text-lavender">Enable Gmail Processing</span>{" "}
                to securely connect your account and activate automatic email
                processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="pt-12 mb-12" data-section="getting-started">
        <h2 className="text-3xl font-bold text-thunder mb-6">
          Getting Started
        </h2>

        <div className="space-y-8">
          <div data-section="quick-start">
            <h3 className="text-2xl font-semibold text-thunder mb-4">
              Quick Start
            </h3>
            <p className="text-gray mb-6">
              Ready to transform your inbox?{" "}
              <em>The proof is in the pudding</em>—try Actioneer today:
            </p>

            <div className="bg-daisy rounded-lg p-6 text-lavender">
              <div className="space-y-4">
                {[
                  { step: "1", text: "Visit: /dashboard" },
                  {
                    step: "2",
                    text: "Sign In: Use your Google account (takes 30 seconds)",
                  },
                  {
                    step: "3",
                    text: "Activate: Connect your Gmail account through the dashboard",
                  },
                  {
                    step: "4",
                    text: "Watch the Magic: Your emails start getting processed automatically",
                  },
                ].map((item, index) => (
                  <div key={index} className="flex items-start gap-3">
                    <div className="bg-lavender/20 rounded-full w-6 h-6 flex items-center justify-center text-sm font-bold">
                      {item.step}
                    </div>
                    <p className="text-white">
                      <strong>{item.text.split(":")[0]}:</strong>{" "}
                      {item.text.split(":")[1]}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-10 text-center">
                <p className="text-white/90">
                  No credit card required. Simple one-time activation. Then
                  instant email intelligence.
                </p>
              </div>
            </div>
          </div>

          <div data-section="testing">
            <h3 className="text-2xl font-semibold text-thunder mb-4">
              Testing Actioneer
            </h3>
            <p className="text-gray mb-6">
              Want to see Actioneer in action immediately? Here are the best
              ways to test the system:
            </p>

            <div className="bg-white rounded-lg border border-concrete p-6">
              <h4 className="font-semibold text-thunder mb-4">
                🧪 Quick Test Methods
              </h4>

              <div className="space-y-6">
                <div>
                  <h5 className="font-medium text-thunder mb-2">
                    Option 1: Send Yourself Test Emails
                  </h5>
                  <p className="text-gray text-sm mb-3">
                    The fastest way to see Actioneer work is to send yourself
                    sample emails from another account:
                  </p>
                  <ul className="text-sm text-gray space-y-1 ml-4">
                    <li>
                      • <strong>Receipt Test:</strong> Forward yourself an old
                      receipt email, or compose a new email with subject like
                      "Your Amazon order receipt - $29.99"
                    </li>
                    <li>
                      • <strong>Travel Test:</strong> Send an email with subject
                      "Flight deal - 50% off to NYC" or "Hotel promotion
                    </li>
                    <li>
                      • <strong>Job Test:</strong> Create an email like
                      "Application received - Software Engineer at TechCorp"
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-thunder mb-2">
                    Option 2: Wait for Natural Emails
                  </h5>
                  <p className="text-gray text-sm">
                    If you prefer to see real-world processing, make a purchase
                    online, book travel, or apply for jobs and watch the emails
                    get automatically categorized.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="pt-12 mb-12" data-section="privacy-security">
        <h2 className="text-3xl font-bold text-thunder mb-6">
          Privacy & Security
        </h2>
        <p className="text-gray mb-8">
          Your privacy is our top priority. Actioneer processes your emails with
          enterprise-grade security standards:
        </p>

        <div className="space-y-8">
          <div data-section="gmail-permissions">
            <h3 className="text-2xl font-semibold text-thunder mb-4">
              Gmail Permissions Required
            </h3>
            <p className="text-gray mb-4">
              For complete transparency, here are the specific Gmail permissions
              Actioneer requests:
            </p>

            <div className="bg-white rounded-lg border border-concrete overflow-hidden">
              {[
                {
                  permission: "gmail.readonly",
                  title: "Read emails",
                  description:
                    "To analyze incoming emails for receipts, travel promotional emails, and job applications",
                },
                {
                  permission: "email",
                  title: "Email address",
                  description:
                    "To link your processed data to your account and enable authentication",
                },
                {
                  permission: "profile",
                  title: "Basic profile",
                  description:
                    "To display your name and profile picture in the dashboard",
                },
              ].map((item, index) => (
                <div
                  key={index}
                  className={`p-4 ${
                    index > 0 ? "border-t border-concrete" : ""
                  }`}
                >
                  <div className="grid grid-cols-3 items-start gap-3">
                    <code className="text-xs bg-concrete px-2 py-1 rounded font-mono text-thunder w-fit">
                      {item.permission}
                    </code>
                    <div className="col-span-2">
                      <h4 className="font-medium text-thunder">{item.title}</h4>
                      <p className="text-sm text-gray">{item.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-4 p-4 bg-bittersweet border border-bittersweet rounded-lg">
              <p className="text-white text-sm">
                <strong className="text-gold">Important:</strong> We only access
                emails relevant to supported categories and never read personal
                conversations, drafts, or sensitive content.
              </p>
            </div>
          </div>

          <div data-section="zero-tracking">
            <h3 className="text-2xl font-semibold text-thunder mb-4">
              Zero Tracking Promise
            </h3>
            <div className="bg-bittersweet border border-bittersweet rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-gold" />
                <div>
                  <h4 className="font-semibold text-gold mb-2">
                    We don't track anything
                  </h4>
                  <p className="text-white text-sm">
                    No analytics, no pageviews, no behavioral data collection.
                    Your privacy is paramount - we only process what's necessary
                    to provide the email intelligence you signed up for.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Roadmap */}
      <section className="pt-12 mb-12" data-section="pricing-roadmap">
        <h2 className="text-3xl font-bold text-thunder mb-6">
          Pricing & Roadmap
        </h2>

        <div className="space-y-8">
          <div data-section="pricing">
            <h3 className="text-2xl font-semibold text-thunder mb-4">
              Pricing
            </h3>
            <div className="bg-daisy border-2 border-daisy rounded-lg p-6 text-lavender">
              <div className="text-center">
                <h4 className="text-2xl font-bold mb-4">Completely Free</h4>
                <p className="mb-4 text-white">
                  <span className="text-lavender">Actioneer</span> is{" "}
                  <span className="text-lavender">completely free</span> while
                  in beta mode. You get full access to all features, unlimited
                  email processing, and the entire suite of automation tools
                  without paying a dime.
                </p>
                <p className="text-white text-sm">
                  Future pricing will be designed with affordability in mind,
                  ensuring that email automation remains accessible to everyone.
                </p>
              </div>
            </div>
          </div>

          <div data-section="upcoming-features">
            <h3 className="text-2xl font-semibold text-thunder mb-4">
              Upcoming Features & Roadmap
            </h3>
            <p className="text-gray mb-6">
              Actioneer is just getting started. Here's what's on the horizon:
            </p>

            <div className="space-y-6">
              {[
                {
                  icon: Users,
                  title: "Multi-Account Support",
                  status: "Coming Soon",
                  description:
                    "Connect up to 2 Gmail accounts (personal + work) for a truly unified dashboard experience.",
                },
                {
                  icon: Target,
                  title: "Expanded Categories",
                  status: "Planned",
                  description:
                    "Medical appointments, package deliveries, subscription management, event tickets, and financial services.",
                },
                {
                  icon: Globe,
                  title: "Platform Integrations",
                  status: "Future",
                  description:
                    "Calendar sync, accounting software, travel planning, and CRM systems integration.",
                },
                {
                  icon: Gauge,
                  title: "Advanced Analytics",
                  status: "Future",
                  description:
                    "Spending insights, travel optimization, career tracking, and custom dashboards.",
                },
              ].map((feature, index) => (
                <div
                  key={index}
                  className="bg-white border border-concrete rounded-lg p-6"
                >
                  <div className="flex items-start gap-4">
                    <feature.icon className="h-6 w-6 text-heliotrope mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-thunder">
                          {feature.title}
                        </h4>
                        <span
                          className={`text-xs px-2 py-1 rounded-full font-medium ${
                            feature.status === "Coming Soon"
                              ? "bg-jade text-lime"
                              : feature.status === "Planned"
                              ? "bg-daisy text-lavender"
                              : "bg-concrete text-thunder"
                          }`}
                        >
                          {feature.status}
                        </span>
                      </div>
                      <p className="text-gray text-sm">{feature.description}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Support & Community */}
      <section className="pt-12 mb-12" data-section="support">
        <h2 className="text-3xl font-bold text-thunder mb-6">
          Support & Community
        </h2>
        <p className="text-gray mb-6">
          Have questions or need help? We're here to support you:
        </p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-concrete rounded-lg p-6 text-center">
            <FileText className="h-8 w-8 text-heliotrope mx-auto mb-3" />
            <h3 className="font-semibold text-thunder mb-2">Documentation</h3>
            <p className="text-gray text-sm mb-4">
              Comprehensive guides and tutorials
            </p>
            <p className="text-heliotrope text-sm">You're already here! 📚</p>
          </div>

          <div className="bg-white border border-concrete rounded-lg p-6 text-center">
            <Mail className="h-8 w-8 text-heliotrope mx-auto mb-3" />
            <h3 className="font-semibold text-thunder mb-2">Email Support</h3>
            <p className="text-gray text-sm mb-4">
              Direct support from our team
            </p>
            <a
              href="mailto:itujono@gmail.com"
              className="text-heliotrope text-sm hover:underline"
            >
              itujono@gmail.com
            </a>
          </div>

          <div className="bg-white border border-concrete rounded-lg p-6 text-center">
            <Users className="h-8 w-8 text-heliotrope mx-auto mb-3" />
            <h3 className="font-semibold text-thunder mb-2">Community</h3>
            <p className="text-gray text-sm mb-4">Join our Discord community</p>
            <p className="text-gray-light text-sm">Coming soon!</p>
          </div>
        </div>
      </section>

      {/* Footer CTA */}
      <div className="bg-daisy rounded-lg p-8 text-lavender text-center">
        <h3 className="text-2xl font-bold mb-4">Ready to Get Started?</h3>
        <p className="text-white mb-6 max-w-2xl mx-auto">
          Transform your email chaos into organized clarity. Start your journey
          with Actioneer today—it's completely free while in beta!
        </p>
        <Link
          to="/dashboard"
          className="inline-flex items-center gap-2 bg-white text-heliotrope px-6 py-3 rounded-lg font-semibold hover:bg-concrete transition-colors"
        >
          Watch the magic now
          <ArrowUpRight className="h-4 w-4" />
        </Link>
      </div>
    </>
  );
}
