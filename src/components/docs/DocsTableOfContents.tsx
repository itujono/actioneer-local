interface DocsTableOfContentsProps {
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export function DocsTableOfContents({
  activeSection,
  onSectionClick,
}: DocsTableOfContentsProps) {
  const tableOfContentsItems = [
    { id: "introduction", title: "Introduction" },
    { id: "what-is-actioneer", title: "What is Actioneer?" },
    { id: "key-benefits", title: "Key Benefits" },
    { id: "how-it-works", title: "How It Works" },
    { id: "supported-categories", title: "Supported Categories" },
    { id: "technical-architecture", title: "Technical Architecture" },
    { id: "gmail-integration", title: "Gmail Integration" },
    { id: "getting-started", title: "Getting Started" },
    { id: "privacy-security", title: "Privacy & Security" },
    { id: "pricing-roadmap", title: "Pricing & Roadmap" },
    { id: "support", title: "Support & Community" },
  ];

  return (
    <div className="hidden xl:block w-64 flex-shrink-0">
      <div className="fixed top-0 right-0 w-64 h-full overflow-y-auto pt-16">
        <div className="p-6">
          <h3 className="text-sm font-semibold text-thunder mb-4">
            On This Page
          </h3>
          <nav className="space-y-1">
            {tableOfContentsItems.map((item) => (
              <button
                key={item.id}
                onClick={() => onSectionClick(item.id)}
                className={`block w-full text-left px-2 pl-0 py-1 text-sm rounded transition-colors ${
                  activeSection === item.id
                    ? "text-heliotrope font-medium"
                    : "text-gray hover:text-thunder"
                }`}
              >
                {item.title}
              </button>
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
