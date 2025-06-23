import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FAQSection() {
  const [openItems, setOpenItems] = useState<string[]>([]);

  const toggleItem = (id: string) => {
    setOpenItems((prev) =>
      prev.includes(id) ? prev.filter((item) => item !== id) : [...prev, id]
    );
  };

  const faqItems = [
    {
      id: "what-is-actioneer",
      question: "What is Actioneer?",
      answer:
        "Actioneer is your personal email autopilot that automatically transforms incoming emails into actionable insights. Whether it's receipts, travel bookings, or job applications, our intelligent agent parses and organizes everything in your personal dashboard—no manual work required. Think of it as having a super-smart assistant working 24/7 in your inbox.",
    },
    {
      id: "how-agent-works",
      question: 'How does the "agent" work?',
      answer:
        "Our AI-powered agent monitors your Gmail inbox in real-time. When a relevant email arrives (like a receipt, booking confirmation, or job update), it automatically extracts key information, categorizes it, and stores it in your dashboard. The agent learns from patterns and gets smarter over time, ensuring accurate data extraction and organization without any setup or configuration from you.",
    },
    {
      id: "what-to-install",
      question: "What should I install?",
      answer:
        "Just the Actioneer Gmail add-on from the Google Workspace Marketplace! It takes literally 30 seconds to install. No complex software, no browser extensions, no additional apps. Once installed, you'll see the Actioneer logo in your Gmail sidebar whenever you open relevant emails. That's it—you're all set!",
    },
    {
      id: "dashboard-access",
      question: "How do I access the dashboard?",
      answer:
        'After installing the Gmail add-on, open any relevant email (receipt, travel booking, etc.) and click the Actioneer logo in your Gmail sidebar. Then click "View on Dashboard" and sign in with your Google account. You can also directly visit the dashboard anytime through your personalized link. Your dashboard is where all the magic happens—organized data, insights, and smart recommendations.',
    },
    {
      id: "supported-categories",
      question: "What categories does Actioneer support?",
      answer:
        "Currently, Actioneer excels at Finance (receipts, invoices, refunds), Travel (flights, hotels, attractions), and Job Applications (applications, responses, interviews). We're actively working on expanding to medical appointments, package deliveries, subscription renewals, event tickets, and much more. Your inbox will become the ultimate command center for your digital life!",
    },
    {
      id: "email-clients",
      question: "Which email clients does Actioneer support?",
      answer:
        "Right now, Actioneer works exclusively with Gmail through our Gmail add-on. We chose to perfect the Gmail experience first since it's the most widely used email platform. Support for other email clients like Outlook and Apple Mail is on our roadmap, but we want to make sure we get Gmail absolutely right before expanding.",
    },
    {
      id: "pricing",
      question: "Is Actioneer free to use?",
      answer:
        "Yes! Actioneer is completely free while we're in beta mode. You get full access to all features, unlimited email processing, and our entire suite of automation tools without paying a dime. We'll be introducing pricing plans in the future once we hit general availability, but early adopters like you will get special consideration. For now, just focus on enjoying the magic of automated email organization!",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-thunder mb-6">
          Frequently Asked Questions
        </h2>
        <p className="text-xl text-gray max-w-3xl mx-auto">
          Everything you need to know about Actioneer. Can't find the answer
          you're looking for? Drop us a line and we'll get back to you faster
          than you can say "email automation"!
        </p>
      </div>
      <div className="space-y-4">
        {faqItems.map((item) => (
          <div
            key={item.id}
            className="border border-gray-light rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-8 py-6 text-left flex items-center justify-between hover:bg-concrete/50 transition-colors duration-200 group focus:ring-0 focus:outline-none"
            >
              <h3 className="text-lg font-semibold text-thunder group-hover:text-heliotrope transition-colors duration-200">
                {item.question}
              </h3>
              <ChevronDown
                className={`w-5 h-5 text-gray transition-transform duration-300 group-hover:text-heliotrope ${
                  openItems.includes(item.id) ? "rotate-180" : ""
                }`}
              />
            </button>
            {openItems.includes(item.id) && (
              <div className="px-8 pb-6 pt-6">
                <p className="text-gray-dark leading-relaxed">{item.answer}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
