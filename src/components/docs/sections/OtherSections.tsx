import { Link } from "@tanstack/react-router";
import { Shield, FileText, Mail, Users, ArrowUpRight, Target, Globe, Gauge } from "lucide-react";
import CopyButton from "../../CopyButton";

export function OtherSections() {
  return (
    <>
      {/* Gmail Integration */}
      <section className="pt-12 mb-12" data-section="gmail-integration">
        <h2 className="text-3xl font-bold text-thunder mb-6">Gmail Integration</h2>
        <p className="text-gray mb-8">
          Gmail OAuth integration is essential for enabling automatic email processing. Once connected, it provides
          secure access to your emails for processing:
        </p>

        <div className="space-y-8">
          <div data-section="core-functionality">
            <h3 className="text-2xl font-semibold text-thunder mb-4">Core Functionality</h3>
            <div className="bg-white p-6 rounded-lg border border-concrete">
              <ul className="space-y-3 text-gray">
                <li>
                  • <strong>Automatic Email Processing:</strong> Enables real-time classification and data extraction
                </li>
                <li>
                  • <strong>User Authentication:</strong> Creates your secure API key for system access
                </li>
                <li>
                  • <strong>Gmail Watch Setup:</strong> Activates push notifications for instant processing
                </li>
              </ul>
            </div>
          </div>

          <div data-section="enhanced-features">
            <h3 className="text-2xl font-semibold text-thunder mb-4">Enhanced Features</h3>
            <div className="bg-white p-6 rounded-lg border border-concrete">
              <ul className="space-y-3 text-gray">
                <li>
                  • <strong>Expense Details:</strong> View extracted receipt information in your dashboard
                </li>
                <li>
                  • <strong>Travel Insights:</strong> Get hotel comparisons and recommendations from booking emails
                </li>
                <li>
                  • <strong>Job Tracking:</strong> Update application status through your dashboard
                </li>
                <li>
                  • <strong>Quick Dashboard Access:</strong> One-click navigation to relevant dashboard sections
                </li>
              </ul>
            </div>
          </div>

          <div data-section="setup">
            <h3 className="text-2xl font-semibold text-thunder mb-4">Setup</h3>
            <div className="bg-daisy border border-daisy rounded-lg p-6">
              <p className="text-white">
                <span className="text-lavender">Gmail integration</span> is available directly through the web
                dashboard. Simply sign in and click <span className="text-lavender">Enable Gmail Processing</span> to
                securely connect your account and activate automatic email processing.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Getting Started */}
      <section className="pt-12 mb-12" data-section="getting-started">
        <h2 className="text-3xl font-bold text-thunder mb-6">Getting Started</h2>

        <div className="space-y-8">
          <div data-section="quick-start">
            <h3 className="text-2xl font-semibold text-thunder mb-4">Quick Start</h3>
            <p className="text-gray mb-6">
              Ready to transform your inbox? <em>The proof is in the pudding</em>—try Actioneer today:
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
                      <strong>{item.text.split(":")[0]}:</strong> {item.text.split(":")[1]}
                    </p>
                  </div>
                ))}
              </div>
              <div className="mt-10 text-center">
                <p className="text-white/90">
                  No credit card required. Simple one-time activation. Then instant email intelligence.
                </p>
              </div>
            </div>
          </div>

          <div data-section="testing">
            <h3 className="text-2xl font-semibold text-thunder mb-4">Testing Actioneer</h3>
            <p className="text-gray mb-6">
              Want to see Actioneer in action immediately? Here are the best ways to test the system:
            </p>

            <div className="bg-white rounded-lg border border-concrete p-6">
              <h4 className="font-semibold text-thunder mb-4">🧪 Quick Test Methods</h4>

              <div className="bg-sandy border border-gold/30 rounded-lg p-4 mb-6">
                <p className="text-thunder text-sm">
                  <strong>Pro tip:</strong> You'll also find convenient test email buttons on each category page within
                  the app when you're getting started.
                </p>
              </div>

              <div className="space-y-6">
                <div>
                  <h5 className="font-medium text-thunder mb-2">Option 1: Send Yourself Test Emails</h5>
                  <p className="text-gray text-sm mb-3">
                    The fastest way to see Actioneer work is to send yourself sample emails from another account (or the
                    same account):
                  </p>
                  <ul className="text-sm text-gray space-y-1 ml-4">
                    <li>
                      • <strong>Receipt Test:</strong> Forward yourself an old receipt email, or compose a new email
                      with subject like "Your Amazon order receipt - $29.99" with some purchase details
                    </li>
                    <li>
                      • <strong>Travel Test:</strong> Send an email with subject "Amazing travel deal - 50% off NYC
                      hotels" or "Flash sale: Flights to Tokyo starting at $299"
                    </li>
                    <li>
                      • <strong>Job Test:</strong> Create an email like "Application received - Software Engineer at
                      TechCorp" with application details
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-thunder mb-2">Option 2: Wait for Natural Emails</h5>
                  <p className="text-gray text-sm mb-3">If you prefer to see real-world processing:</p>
                  <ul className="text-sm text-gray space-y-1 ml-4">
                    <li>
                      • <strong>Make a Purchase:</strong> Buy something online and watch the receipt get automatically
                      categorized
                    </li>
                    <li>
                      • <strong>Book Travel:</strong> Reserve a hotel or flight and see it appear in your travel
                      dashboard
                    </li>
                    <li>
                      • <strong>Apply for Jobs:</strong> Submit job applications and track responses automatically
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-thunder mb-2">Sample Test Email Templates</h5>
                  <p className="text-gray text-sm mb-3">
                    While you can definitely create your own test emails, we've made it even easier by providing
                    ready-to-use templates below that you can copy and paste into Gmail.
                  </p>

                  <div className="space-y-4">
                    <div className="bg-concrete/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-medium text-thunder">Receipt Email:</h6>
                        <CopyButton
                          textToCopy={`Subject: Your Amazon Order Confirmation #123-4567890-1234567
From: auto-confirm@amazon.com

Thank you for your Amazon order!

Order Details:
- Order #: 123-4567890-1234567
- Order Date: [Today's date]
- Total: $89.99

Items Ordered:
• Wireless Bluetooth Headphones - $79.99
• USB-C Cable (3ft) - $9.99
• Shipping: FREE

Your order will be delivered by [Date in 2 days].

Track your package: https://amazon.com/track

Thanks for shopping with Amazon!
The Amazon Team`}
                        />
                      </div>
                      <div className="bg-white rounded p-3 text-xs font-mono border border-gray-light">
                        <div className="text-gray-600 mb-2">
                          Subject: Your Amazon Order Confirmation #123-4567890-1234567
                        </div>
                        <div className="text-gray-600 mb-2">From: auto-confirm@amazon.com</div>
                        <div className="text-gray-800">
                          Thank you for your Amazon order!
                          <br />
                          <br />
                          Order Details:
                          <br />
                          - Order #: 123-4567890-1234567
                          <br />
                          - Order Date: [Today's date]
                          <br />
                          - Total: $89.99
                          <br />
                          <br />
                          Items Ordered:
                          <br />
                          • Wireless Bluetooth Headphones - $79.99
                          <br />
                          • USB-C Cable (3ft) - $9.99
                          <br />
                          • Shipping: FREE
                          <br />
                          <br />
                          Your order will be delivered by [Date in 2 days].
                          <br />
                          <br />
                          Track your package: https://amazon.com/track
                          <br />
                          <br />
                          Thanks for shopping with Amazon!
                          <br />
                          The Amazon Team
                        </div>
                      </div>
                    </div>

                    <div className="bg-concrete/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-medium text-thunder">Travel Email:</h6>
                        <CopyButton
                          textToCopy={`Subject: 🌴 Amazing Travel Deal: 60% Off Miami Beach Hotels This Weekend!
From: deals@traveldeals.com

Don't miss this incredible travel opportunity!

FLASH SALE: Miami Beach Getaway
🏖️ Up to 60% off luxury hotels
📅 Valid for travel: [Next week dates] - [Two weeks from now]
⏰ Book by: [Three days from now] (Limited time!)

Featured Destinations:
• South Beach - Starting at $129/night (was $320)
• Downtown Miami - Starting at $89/night (was $220)
• Coral Gables - Starting at $159/night (was $380)

What's Included:
- Oceanview rooms with balcony
- Complimentary breakfast
- Pool and beach access
- Free WiFi

✈️ BONUS: Book now and get 25% off flights to Miami!
Flight deals from major cities starting at $199 roundtrip.

Ready for some sun and sand? This deal won't last long!

Book now: https://traveldeals.com/miami-flash-sale
Use code: MIAMI60

Happy travels!
The TravelDeals Team
deals@traveldeals.com`}
                        />
                      </div>
                      <div className="bg-white rounded p-3 text-xs font-mono border border-gray-light">
                        <div className="text-gray-600 mb-2">
                          Subject: 🌴 Amazing Travel Deal: 60% Off Miami Beach Hotels This Weekend!
                        </div>
                        <div className="text-gray-600 mb-2">From: deals@traveldeals.com</div>
                        <div className="text-gray-800">
                          Don't miss this incredible travel opportunity!
                          <br />
                          <br />
                          FLASH SALE: Miami Beach Getaway
                          <br />
                          🏖️ Up to 60% off luxury hotels
                          <br />
                          📅 Valid for travel: [Next week dates] - [Two weeks from now]
                          <br />
                          ⏰ Book by: [Three days from now] (Limited time!)
                          <br />
                          <br />
                          Featured Destinations:
                          <br />
                          • South Beach - Starting at $129/night (was $320)
                          <br />
                          • Downtown Miami - Starting at $89/night (was $220)
                          <br />
                          • Coral Gables - Starting at $159/night (was $380)
                          <br />
                          <br />
                          What's Included:
                          <br />
                          - Oceanview rooms with balcony
                          <br />
                          - Complimentary breakfast
                          <br />
                          - Pool and beach access
                          <br />
                          - Free WiFi
                          <br />
                          <br />
                          ✈️ BONUS: Book now and get 25% off flights to Miami!
                          <br />
                          Flight deals from major cities starting at $199 roundtrip.
                        </div>
                      </div>
                    </div>

                    <div className="bg-concrete/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-medium text-thunder">Job Application Email:</h6>
                        <CopyButton
                          textToCopy={`Subject: Application Received: Senior Software Engineer - TechCorp
From: careers@techcorp.com

Dear Candidate,

Thank you for applying to the Senior Software Engineer position at TechCorp!

Application Details:
• Position: Senior Software Engineer
• Department: Engineering
• Location: San Francisco, CA / Remote
• Application ID: TC-2024-ENG-001
• Submitted: [Today's date]

Next Steps:
Our recruiting team will review your application and reach out within 5-7 business days if your background aligns with our current needs.

In the meantime, feel free to explore our engineering blog at techcorp.com/blog to learn more about our technical culture and recent projects.

We appreciate your interest in joining our team!

Best regards,
Sarah Johnson
Senior Talent Acquisition Manager
TechCorp
careers@techcorp.com`}
                        />
                      </div>
                      <div className="bg-white rounded p-3 text-xs font-mono border border-gray-light">
                        <div className="text-gray-600 mb-2">
                          Subject: Application Received: Senior Software Engineer - TechCorp
                        </div>
                        <div className="text-gray-600 mb-2">From: careers@techcorp.com</div>
                        <div className="text-gray-800">
                          Dear Candidate,
                          <br />
                          <br />
                          Thank you for applying to the Senior Software Engineer position at TechCorp!
                          <br />
                          <br />
                          Application Details:
                          <br />
                          • Position: Senior Software Engineer
                          <br />
                          • Department: Engineering
                          <br />
                          • Location: San Francisco, CA / Remote
                          <br />
                          • Application ID: TC-2024-ENG-001
                          <br />
                          • Submitted: [Today's date]
                          <br />
                          <br />
                          Next Steps:
                          <br />
                          Our recruiting team will review your application and reach out within 5-7 business days if
                          your background aligns with our current needs.
                          <br />
                          <br />
                          In the meantime, feel free to explore our engineering blog at techcorp.com/blog to learn more
                          about our technical culture and recent projects.
                          <br />
                          <br />
                          We appreciate your interest in joining our team!
                          <br />
                          <br />
                          Best regards,
                          <br />
                          Sarah Johnson
                          <br />
                          Senior Talent Acquisition Manager
                          <br />
                          TechCorp
                        </div>
                      </div>
                    </div>

                    <div className="bg-concrete/30 rounded-lg p-4">
                      <div className="flex items-center justify-between mb-2">
                        <h6 className="font-medium text-thunder">Revenue/Payment Email:</h6>
                        <CopyButton
                          textToCopy={`Subject: Payment Received: Freelance Project Invoice #INV-2024-001
From: payments@startupx.com

Payment Confirmation

Dear Freelancer,

We're pleased to confirm that your payment has been processed successfully.

Payment Details:
• Invoice #: INV-2024-001
• Project: Website Development for StartupX
• Amount: $2,500.00
• Payment Date: [Today's date]
• Payment Method: Bank Transfer
• Reference: PAY-[6-digit number]

This payment covers:
- Frontend development (React/TypeScript)
- Backend API integration
- Mobile responsive design
- 2 rounds of revisions

The funds have been transferred to your account ending in ***1234 and should appear within 1-2 business days.

Thank you for your excellent work on this project! We look forward to collaborating again soon.

Best regards,
Alex Chen
Project Manager
StartupX Inc.
payments@startupx.com`}
                        />
                      </div>
                      <div className="bg-white rounded p-3 text-xs font-mono border border-gray-light">
                        <div className="text-gray-600 mb-2">
                          Subject: Payment Received: Freelance Project Invoice #INV-2024-001
                        </div>
                        <div className="text-gray-600 mb-2">From: payments@startupx.com</div>
                        <div className="text-gray-800">
                          Payment Confirmation
                          <br />
                          <br />
                          Dear Freelancer,
                          <br />
                          <br />
                          We're pleased to confirm that your payment has been processed successfully.
                          <br />
                          <br />
                          Payment Details:
                          <br />
                          • Invoice #: INV-2024-001
                          <br />
                          • Project: Website Development for StartupX
                          <br />
                          • Amount: $2,500.00
                          <br />
                          • Payment Date: [Today's date]
                          <br />
                          • Payment Method: Bank Transfer
                          <br />
                          • Reference: PAY-[6-digit number]
                          <br />
                          <br />
                          This payment covers:
                          <br />
                          - Frontend development (React/TypeScript)
                          <br />
                          - Backend API integration
                          <br />
                          - Mobile responsive design
                          <br />
                          - 2 rounds of revisions
                          <br />
                          <br />
                          The funds have been transferred to your account ending in ***1234 and should appear within 1-2
                          business days.
                          <br />
                          <br />
                          Thank you for your excellent work on this project! We look forward to collaborating again
                          soon.
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

                <div>
                  <h5 className="font-medium text-thunder mb-2">What to Expect</h5>
                  <ul className="text-sm text-gray space-y-1 ml-4">
                    <li>
                      • <strong>Processing Time:</strong> Emails are typically processed within 10-30 seconds of arrival
                    </li>
                    <li>
                      • <strong>Dashboard Updates:</strong> Check your dashboard categories (Finance, Travel, Jobs) for
                      new entries
                    </li>
                    <li>
                      • <strong>Real-time Magic:</strong> Watch as raw emails transform into organized, actionable data
                    </li>
                  </ul>
                </div>

                <div>
                  <h5 className="font-medium text-thunder mb-2">Pro Testing Tips</h5>
                  <ul className="text-sm text-gray space-y-1 ml-4">
                    <li>
                      • <strong>Use Realistic Content:</strong> The more realistic your test emails, the better the AI
                      extraction
                    </li>
                    <li>
                      • <strong>Try Different Formats:</strong> Test various email styles to see Actioneer's versatility
                    </li>
                    <li>
                      • <strong>Check All Categories:</strong> Send emails for finance, travel, and jobs to see the full
                      system
                    </li>
                    <li>
                      • <strong>Mobile Friendly:</strong> Test on different devices to see the responsive dashboard
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Privacy & Security */}
      <section className="pt-12 mb-12" data-section="privacy-security">
        <h2 className="text-3xl font-bold text-thunder mb-6">Privacy & Security</h2>
        <p className="text-gray mb-8">
          Your privacy is our top priority. Actioneer processes your emails with enterprise-grade security standards:
        </p>

        <div className="space-y-8">
          <div data-section="gmail-permissions">
            <h3 className="text-2xl font-semibold text-thunder mb-4">Gmail Permissions Required</h3>
            <p className="text-gray mb-4">
              For complete transparency, here are the specific Gmail permissions Actioneer requests:
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
                  description: "To link your processed data to your account and enable authentication",
                },
                {
                  permission: "profile",
                  title: "Basic profile",
                  description: "To display your name and profile picture in the dashboard",
                },
              ].map((item, index) => (
                <div key={index} className={`p-4 ${index > 0 ? "border-t border-concrete" : ""}`}>
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
                <strong className="text-gold">Important:</strong> We only access emails relevant to supported categories
                and never read personal conversations, drafts, or sensitive content.
              </p>
            </div>
          </div>

          <div data-section="zero-tracking">
            <h3 className="text-2xl font-semibold text-thunder mb-4">Zero Tracking Promise</h3>
            <div className="bg-bittersweet border border-bittersweet rounded-lg p-6">
              <div className="flex items-start gap-3">
                <Shield className="h-6 w-6 text-gold" />
                <div>
                  <h4 className="font-semibold text-gold mb-2">We don't track anything</h4>
                  <p className="text-white text-sm">
                    No analytics, no pageviews, no behavioral data collection. Your privacy is paramount - we only
                    process what's necessary to provide the email intelligence you signed up for.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing & Roadmap */}
      <section className="pt-12 mb-12" data-section="pricing-roadmap">
        <h2 className="text-3xl font-bold text-thunder mb-6">Pricing & Roadmap</h2>

        <div className="space-y-8">
          <div data-section="pricing">
            <h3 className="text-2xl font-semibold text-thunder mb-4">Pricing</h3>
            <div className="bg-daisy border-2 border-daisy rounded-lg p-6 text-lavender">
              <div className="text-center">
                <h4 className="text-2xl font-bold mb-4">Completely Free</h4>
                <p className="mb-4 text-white">
                  <span className="text-lavender">Actioneer</span> is{" "}
                  <span className="text-lavender">completely free</span> while in beta mode. You get full access to all
                  features, unlimited email processing, and the entire suite of automation tools without paying a dime.
                </p>
                <p className="text-white text-sm">
                  Future pricing will be designed with affordability in mind, ensuring that email automation remains
                  accessible to everyone.
                </p>
              </div>
            </div>
          </div>

          <div data-section="upcoming-features">
            <h3 className="text-2xl font-semibold text-thunder mb-4">Upcoming Features & Roadmap</h3>
            <p className="text-gray mb-6">Actioneer is just getting started. Here's what's on the horizon:</p>

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
                  description: "Calendar sync, accounting software, travel planning, and CRM systems integration.",
                },
                {
                  icon: Gauge,
                  title: "Advanced Analytics",
                  status: "Future",
                  description: "Spending insights, travel optimization, career tracking, and custom dashboards.",
                },
              ].map((feature, index) => (
                <div key={index} className="bg-white border border-concrete rounded-lg p-6">
                  <div className="flex items-start gap-4">
                    <feature.icon className="h-6 w-6 text-heliotrope mt-1" />
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h4 className="font-semibold text-thunder">{feature.title}</h4>
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
        <h2 className="text-3xl font-bold text-thunder mb-6">Support & Community</h2>
        <div className=" mb-8">
          <p className="text-thunder mb-4">
            As we're just getting started on this exciting journey, your feedback is <em>worth its weight in gold!</em>{" "}
            We're constantly improving Actioneer and your insights help us build exactly what you need. Whether you've
            spotted a bug, have a brilliant feature idea, or just want to share your experience, we'd love to hear from
            you.
          </p>
          <p className="text-thunder">
            <strong className="text-heliotrope">Share Your Thoughts:</strong> Visit our dedicated{" "}
            <Link to="/feedback" className="text-heliotrope underline hover:text-white transition-colors">
              feedback page
            </Link>{" "}
            to report issues, suggest improvements, or tell us what's working well. Every piece of feedback helps us
            make Actioneer better for everyone.
          </p>
        </div>
        <p className="text-thunder mb-6">Have questions or need help? We're here to support you:</p>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white border border-concrete rounded-lg p-6 text-center">
            <FileText className="h-8 w-8 text-heliotrope mx-auto mb-3" />
            <h3 className="font-semibold text-thunder mb-2">Documentation</h3>
            <p className="text-gray text-sm mb-4">Comprehensive guides and tutorials</p>
            <p className="text-heliotrope text-sm">You're already here! 📚</p>
          </div>

          <div className="bg-white border border-concrete rounded-lg p-6 text-center">
            <Mail className="h-8 w-8 text-heliotrope mx-auto mb-3" />
            <h3 className="font-semibold text-thunder mb-2">Email Support</h3>
            <p className="text-gray text-sm mb-4">Direct support from our team</p>
            <a href="mailto:itujono@gmail.com" className="text-heliotrope text-sm hover:underline">
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
          Transform your email chaos into organized clarity. Start your journey with Actioneer today—it's completely
          free while in beta!
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
