import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { Sparkles, Clock } from "lucide-react";
import Navbar from "../components/layout/Navbar";
import FAQSection from "../components/home/FaqSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import HowToInstallSection from "../components/home/HowToInstallSection";
import AutopilotSection from "../components/home/AutopilotSection";
import CTASection from "../components/home/CTASection";
import Fling from "../components/Fling";
import Spiral from "../components/Spiral";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Index,
});

function Index() {
  return (
    <div className="bg-concrete">
      <div className="min-h-screen bg-concrete/10">
        {/* Hero Section */}
        <div className="relative overflow-hidden bg-heliotrope">
          <Navbar />
          <div className="px-4 py-12 sm:px-6 sm:py-16 lg:px-8 lg:py-20">
            <div className="relative mx-auto max-w-4xl text-center">
              <Spiral className="absolute -top-44 sm:top-20 -left-1/3 w-1/3 h-1/3 z-0 text-lime" />
              <div className="flex justify-center mb-4 sm:mb-6">
                <div className="inline-flex items-center px-3 py-2 sm:px-4 sm:py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium text-sm sm:text-base">
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 mr-2 animate-wiggle" />
                  Install once, forget it
                  <Sparkles className="w-3 h-3 sm:w-4 sm:h-4 ml-2 animate-wiggle" />
                </div>
              </div>

              <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-white mb-4 sm:mb-6 text-balance leading-tight">
                Your emails work for you,
                <span className="block text-lime">
                  not the other way around
                </span>
              </h1>

              <p className="text-lg sm:text-xl lg:text-2xl text-white/90 mb-6 sm:mb-8 max-w-3xl mx-auto text-balance px-2">
                Stop drowning in receipts, travel bookings, and job
                applications.{" "}
                <strong className="text-gold">
                  Actioneer transforms every email into instant, smart actions
                </strong>
                —automatically, without setting up a thing.
              </p>

              <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 px-4">
                <Link
                  to="/auth"
                  className="w-full sm:w-auto btn-primary bg-daisy text-lg px-6 sm:px-8 py-3 sm:py-4 text-center"
                >
                  <Clock className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
                  Start in 30 seconds
                </Link>
                {/* <Link
                  to="/proof"
                  className="w-full sm:w-auto btn-secondary text-lg px-6 sm:px-8 py-3 sm:py-4 text-center"
                >
                  <Heart className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline" />
                  See the magic
                </Link> */}
              </div>

              <div className="flex flex-wrap justify-center gap-4 sm:gap-6 text-white/80 text-sm px-4">
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-jade rounded-full mr-2"></div>
                  No monthly fees
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-lime rounded-full mr-2"></div>
                  Works with any email
                </div>
                <div className="flex items-center">
                  <div className="w-2 h-2 bg-sandy rounded-full mr-2"></div>
                  Privacy-first design
                </div>
              </div>
            </div>
          </div>
        </div>

        <AutopilotSection />

        <div id="proof" className="section-spacing">
          <HowItWorksSection />
        </div>

        <div className="section-spacing bg-bittersweet relative z-10">
          <HowToInstallSection />
        </div>

        <div className="section-spacing relative">
          <Fling className="absolute -top-44 sm:-top-20 right-[70%] w-1/2 h-1/2 scale-x-[-1] rotate-90 sm:rotate-45 z-0 text-lime" />
          <FAQSection />
        </div>

        <div className="bg-jade text-white section-spacing">
          <CTASection />
        </div>
      </div>
    </div>
  );
}
