import { useState } from "react";
import { ChevronDown } from "lucide-react";

const renderAnswerWithLinks = (text: string) => {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);
  return parts.map((part, index) => {
    if (urlRegex.test(part)) {
      return (
        <a
          key={index}
          href={part}
          target="_blank"
          rel="noopener noreferrer"
          className="text-heliotrope font-semibold hover:text-heliotrope/80 transition-colors duration-200 underline decoration-heliotrope/30 hover:decoration-heliotrope/60"
        >
          {part}
        </a>
      );
    }
    return part;
  });
};

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
        "Actioneer is your personal email autopilot that automatically transforms incoming emails into actionable insights. Whether it's receipts, travel promotional emails, or job applications, our intelligent agent parses and organizes everything in your personal dashboard—no manual work required. Think of it as having a super-smart assistant working 24/7 in your inbox.",
    },
    {
      id: "how-agent-works",
      question: 'How does the "agent" work?',
      answer:
        "Our AI-powered agent monitors your Gmail inbox in real-time once you connect your Gmail account. When a relevant email arrives (like a receipt, booking confirmation, or job update), it automatically extracts key information, categorizes it, and stores it in your dashboard. The agent learns from patterns and gets smarter over time, ensuring accurate data extraction and organization.",
    },
    {
      id: "what-to-install",
      question: "Do I need to install anything?",
      answer:
        "Nope! Actioneer is a pure web application - no installations required. Simply visit https://actioneer.online/, sign in with your Google account, and connect your Gmail. That's it! Your email processing begins immediately after connecting your Gmail account. Everything works seamlessly through your browser.",
    },
    {
      id: "dashboard-access",
      question: "How do I access the dashboard?",
      answer:
        "Simply go to https://actioneer.online/dashboard and sign in with your Google account. Your dashboard is where all the magic happens—organized data, insights, and smart recommendations from your automatically processed emails.",
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
        "Right now, Actioneer works exclusively with Gmail through secure OAuth integration. We chose to perfect the Gmail experience first since it's the most widely used email platform. Support for other email clients like Outlook and Apple Mail is on our roadmap. You can access your dashboard by visiting https://actioneer.online/dashboard and signing in with your Google account.",
    },
    {
      id: "multiple-accounts",
      question: "Can I connect multiple Gmail accounts?",
      answer:
        "Great question! We're currently working on multi-account support that will allow you to connect up to 2 Gmail accounts (like your personal and work emails) for a truly unified dashboard experience. This feature is coming soon and will let you see all your email insights in one centralized location. For now, Actioneer works with your primary Gmail account, but stay tuned for this game-changing update.",
    },
    {
      id: "pricing",
      question: "Is Actioneer free to use?",
      answer:
        "Yes! Actioneer is completely free while we're in beta mode. You get full access to all features, unlimited email processing, and our entire suite of automation tools without paying a dime. We'll be introducing pricing plans in the future once we hit general availability, but early adopters like you will get special consideration. For now, just focus on enjoying the magic of automated email organization!",
    },
    {
      id: "privacy-permissions",
      question:
        "What Gmail permissions does Actioneer need and how is my privacy protected?",
      answer:
        "Complete transparency: Actioneer needs to read emails (to analyze receipts, travel, jobs) and access your email address (for account linking). We only process emails relevant to supported categories—never personal conversations or sensitive content. Most importantly: we don't track anything. No analytics, no pageviews, no behavioral data collection. Your privacy is paramount. For full details, see our Privacy Policy at https://actioneer.online/privacy.",
    },
  ];

  return (
    <div className="mx-auto max-w-4xl px-4 sm:px-6 lg:px-8 relative">
      <div className="text-center mb-12 sm:mb-16">
        <h2 className="text-3xl sm:text-4xl font-bold text-heliotrope mb-4 sm:mb-6">
          Frequently Asked Questions
        </h2>
        <p className="text-lg sm:text-xl max-w-3xl mx-auto px-2">
          Everything you need to know about Actioneer. Can't find the answer
          you're looking for? Drop us a line and we'll get back to you faster
          than you can say "email automation"!
        </p>
      </div>
      <div className="space-y-3 sm:space-y-4">
        {faqItems.map((item) => (
          <div
            key={item.id}
            className="border border-gray-light rounded-xl sm:rounded-2xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow duration-200"
          >
            <button
              onClick={() => toggleItem(item.id)}
              className="w-full px-4 sm:px-8 py-4 sm:py-6 text-left flex items-center justify-between hover:bg-concrete/50 transition-colors duration-200 group focus:ring-0 focus:outline-none min-h-[60px] touch-manipulation"
            >
              <h3 className="text-base sm:text-lg font-semibold text-thunder group-hover:text-heliotrope transition-colors duration-200 pr-4">
                {item.question}
              </h3>
              <ChevronDown
                className={`w-5 h-5 sm:w-6 sm:h-6 text-gray transition-transform duration-300 group-hover:text-heliotrope flex-shrink-0 ${
                  openItems.includes(item.id) ? "rotate-180" : ""
                }`}
              />
            </button>
            {openItems.includes(item.id) && (
              <div className="px-4 sm:px-8 pb-4 sm:pb-6 pt-2 sm:pt-4">
                <p className="text-gray-dark leading-relaxed text-sm sm:text-base">
                  {renderAnswerWithLinks(item.answer)}
                </p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
