import { createRoute, Link } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { Sparkles, Clock, Heart } from "lucide-react";
import FAQSection from "../components/home/FaqSection";
import HowItWorksSection from "../components/home/HowItWorksSection";
import HowToInstallSection from "../components/home/HowToInstallSection";
import AutopilotSection from "../components/home/AutopilotSection";
import CTASection from "../components/home/CTASection";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Index,
});

function Index() {
  return (
    <div className="bg-concrete">
      <div className="relative overflow-hidden bg-heliotrope">
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute -top-40 -right-40 w-80 h-80 bg-lime opacity-20 rounded-full blob-animation"></div>
          <div className="absolute -bottom-40 -left-40 w-96 h-96 bg-jade opacity-20 rounded-full blob-animation-delay"></div>
          <div className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 w-64 h-64 bg-sandy opacity-15 rounded-full animate-pulse-slow"></div>
        </div>

        <div className="relative px-6 py-16 sm:py-20 lg:px-8">
          <div className="mx-auto max-w-4xl text-center">
            <div className="flex justify-center mb-6">
              <div className="inline-flex items-center px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-white font-medium">
                <Sparkles className="w-4 h-4 mr-2 animate-wiggle" />
                Install once, forget it
                <Sparkles className="w-4 h-4 ml-2 animate-wiggle" />
              </div>
            </div>

            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-white mb-6 text-balance">
              Your emails work for you,
              <span className="block text-lime">not the other way around</span>
            </h1>

            <p className="text-xl sm:text-2xl text-white/90 mb-8 max-w-3xl mx-auto text-balance">
              Stop drowning in receipts, travel bookings, and job applications.{" "}
              <strong className="text-gold">
                Actioneer transforms every email into instant, smart actions
              </strong>
              —automatically, without setting up a thing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <Link
                href="/auth"
                className="btn-primary bg-daisy text-lg px-8 py-4"
              >
                <Clock className="w-5 h-5 mr-2 inline" />
                Start in 30 seconds
              </Link>
              <Link href="#proof" className="btn-secondary text-lg px-8 py-4">
                <Heart className="w-5 h-5 mr-2 inline" />
                See the magic
              </Link>
            </div>

            <div className="flex flex-wrap justify-center gap-6 text-white/80 text-sm">
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

      <div className="section-spacing bg-bittersweet">
        <HowToInstallSection />
      </div>

      <div className="section-spacing bg-lavender">
        <FAQSection />
      </div>

      <div className="bg-jade text-white section-spacing">
        <CTASection />
      </div>
    </div>
  );
}
