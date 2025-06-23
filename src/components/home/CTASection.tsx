import { Sparkles } from "lucide-react";

export default function CTASection() {
  return (
    <div className="px-6 lg:px-8">
      <div className="mx-auto max-w-4xl text-center">
        <h2 className="text-4xl sm:text-5xl font-bold mb-6 text-balance">
          Ready to make your inbox work overtime
          <span className="text-gold">so you don't have to?</span>
        </h2>
        <p className="text-xl text-white/90 mb-8 max-w-2xl mx-auto">
          Install once, forget it exists, and watch as your email transforms
          from chaos to clarity. Your future self will thank you.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
          <a href="/auth" className="btn-primary text-lg px-8 py-4">
            <Sparkles className="w-5 h-5 mr-2 inline animate-wiggle" />
            Get started in 30 seconds
          </a>
          <a
            href="#proof"
            className="text-white/80 hover:text-white font-semibold"
          >
            Still not convinced?{" "}
            <span className="underline decoration-gold">See more proof →</span>
          </a>
        </div>
        <p className="text-white/60 text-sm">
          No credit card required • Works with Gmail • Cancel anytime (but you
          won't want to)
        </p>
      </div>
    </div>
  );
}
