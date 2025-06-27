import { Link } from "@tanstack/react-router";
import { Sparkles } from "lucide-react";
import Heart from "../Heart";
import ThreeSplashes from "../ThreeSplashes";

export default function CTASection() {
  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center relative">
        <Heart className="w-8 h-8 sm:w-10 sm:h-10 -top-8 sm:-top-10 -left-8 sm:-left-10" />
        <Heart className="w-5 h-5 sm:w-6 sm:h-6 -top-4 sm:-top-4 left-8 sm:left-4" />
        <ThreeSplashes className="w-8 h-8 sm:w-10 sm:h-10 -top-6 sm:-top-4 right-8 sm:right-16" />
        <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 text-balance px-2">
          Ready to make your inbox work overtime{" "}
          <span className="text-lime">so you don't have to?</span>
        </h2>
        <p className="text-lg sm:text-xl text-white/90 mb-6 sm:mb-8 max-w-2xl mx-auto px-2">
          Install once, forget it exists, and watch as your email transforms
          from chaos to clarity. Your future self will thank you.
        </p>
        <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-6 sm:mb-8 px-4">
          <Link
            to="/auth"
            className="w-full sm:w-auto btn-primary bg-gold text-thunder text-lg px-6 sm:px-8 py-3 sm:py-4 text-center"
          >
            <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 mr-2 inline animate-wiggle" />
            Get started in 30 seconds
          </Link>
          {/* <a
            href="#proof"
            className="text-white/80 hover:text-white font-semibold"
          >
            Still not convinced?{" "}
            <span className="underline decoration-gold">See more proof →</span>
          </a> */}
        </div>
        <p className="text-white text-xs sm:text-sm mt-16 sm:mt-20 px-2">
          No credit card required • Works with Gmail • Cancel anytime (but you
          won't want to)
        </p>
      </div>
    </div>
  );
}
