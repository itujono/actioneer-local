import {
  BookOpen,
  Target,
  Settings,
  Mail,
  Zap,
  Shield,
  CreditCard,
  Users,
} from "lucide-react";
import { NavButton } from "./NavButton";

interface DocsNavigationProps {
  activeSection: string;
  onSectionClick: (sectionId: string) => void;
}

export function DocsNavigation({
  activeSection,
  onSectionClick,
}: DocsNavigationProps) {
  const navigationItems = [
    { id: "what-is-actioneer", title: "Introduction", icon: BookOpen },
    { id: "supported-categories", title: "Supported Categories", icon: Target },
    {
      id: "technical-architecture",
      title: "Technical Architecture",
      icon: Settings,
    },
    { id: "gmail-integration", title: "Gmail Integration", icon: Mail },
    { id: "getting-started", title: "Getting Started", icon: Zap },
    { id: "privacy-security", title: "Privacy & Security", icon: Shield },
    { id: "pricing-roadmap", title: "Pricing & Roadmap", icon: CreditCard },
    { id: "support", title: "Support & Community", icon: Users },
  ];

  return (
    <div className="hidden lg:block w-64 flex-shrink-0">
      <div className="fixed top-0 left-0 w-64 h-full bg-white border-r border-concrete overflow-y-auto pt-16">
        <div className="p-6">
          <div className="flex items-center gap-2 mb-6">
            <img src="/logo.png" alt="Logo" className="h-6 w-6" />
            <h2 className="text-lg font-semibold text-thunder">
              Documentation
            </h2>
          </div>
          <nav className="space-y-1">
            {navigationItems.map((item) => (
              <NavButton
                key={item.id}
                id={item.id}
                title={item.title}
                icon={item.icon}
                isActive={activeSection === item.id}
                onClick={onSectionClick}
              />
            ))}
          </nav>
        </div>
      </div>
    </div>
  );
}
