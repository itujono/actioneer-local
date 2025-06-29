import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import {
  DocsNavigation,
  // DocsTableOfContents,
  DocsHeader,
  IntroductionSection,
  SupportedCategoriesSection,
  TechnicalArchitectureSection,
  OtherSections,
} from "../components/docs";

export const docsRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/docs",
  component: DocsPage,
});

function DocsPage() {
  const [activeSection, setActiveSection] = useState("what-is-actioneer");

  // Auto-scroll navigation
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-section]");
      const scrollPosition = window.scrollY + 200; // Increased offset for better detection

      let currentSection = "what-is-actioneer";

      // Get only the main sections (not nested subsections)
      const mainSections = Array.from(sections).filter((section) => {
        const sectionId = section.getAttribute("data-section");
        return [
          "what-is-actioneer",
          "supported-categories",
          "technical-architecture",
          "gmail-integration",
          "getting-started",
          "privacy-security",
          "pricing-roadmap",
          "support",
        ].includes(sectionId || "");
      });

      // Find which section we're currently in
      for (let i = 0; i < mainSections.length; i++) {
        const section = mainSections[i] as HTMLElement;
        const nextSection = mainSections[i + 1] as HTMLElement;

        const sectionTop = section.offsetTop;
        const sectionBottom = nextSection
          ? nextSection.offsetTop
          : document.documentElement.scrollHeight;

        // Check if scroll position is within this section's bounds
        if (scrollPosition >= sectionTop && scrollPosition < sectionBottom) {
          currentSection = section.dataset.section || "what-is-actioneer";
          break;
        }
      }

      setActiveSection(currentSection);
    };

    // Initial call to set correct active section
    handleScroll();

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToSection = (sectionId: string) => {
    const element = document.querySelector(`[data-section="${sectionId}"]`);
    if (element) {
      element.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <Layout isAuthenticated={false}>
      <div className="min-h-screen bg-concrete">
        <div className="max-w-7xl mx-auto flex">
          {/* Left Sidebar Navigation */}
          <DocsNavigation
            activeSection={activeSection}
            onSectionClick={scrollToSection}
          />

          {/* Main Content */}
          <div className="flex-1">
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 divide-gray-light divide-y">
              <DocsHeader />
              <IntroductionSection />
              <SupportedCategoriesSection />
              <TechnicalArchitectureSection />
              <OtherSections />
            </div>
          </div>

          {/* Right Sidebar - Table of Contents */}
          {/* <DocsTableOfContents
            activeSection={activeSection}
            onSectionClick={scrollToSection}
          /> */}
        </div>
      </div>
    </Layout>
  );
}
