import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useState, useEffect } from "react";
import Layout from "../components/layout/Layout";
import {
  DocsNavigation,
  DocsTableOfContents,
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
  const [activeSection, setActiveSection] = useState("introduction");

  // Auto-scroll navigation
  useEffect(() => {
    const handleScroll = () => {
      const sections = document.querySelectorAll("[data-section]");
      const scrollPosition = window.scrollY + 100;

      for (let i = sections.length - 1; i >= 0; i--) {
        const section = sections[i] as HTMLElement;
        if (section.offsetTop <= scrollPosition) {
          setActiveSection(section.dataset.section || "introduction");
          break;
        }
      }
    };

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
            <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <DocsHeader />
              <IntroductionSection />
              <SupportedCategoriesSection />
              <TechnicalArchitectureSection />
              <OtherSections />
            </div>
          </div>

          {/* Right Sidebar - Table of Contents */}
          <DocsTableOfContents
            activeSection={activeSection}
            onSectionClick={scrollToSection}
          />
        </div>
      </div>
    </Layout>
  );
}
