import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import {
  Mail,
  ZapIcon,
  BarChart4,
  Briefcase,
  Sparkles,
  Clock,
  Heart,
} from "lucide-react";

export const indexRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/",
  component: Index,
});

function Index() {
  return (
    <div className="bg-concrete/10">
      {/* Condensed Hero Section */}
      <div className="relative overflow-hidden bg-heliotrope">
        {/* Animated background blobs */}
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
              Stop drowning in receipts, travel bookings, and job applications.
              <strong className="text-gold">
                Actioneer transforms every email into instant, smart actions
              </strong>
              while you focus on what actually matters.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-8">
              <a href="/auth" className="btn-primary text-lg px-8 py-4">
                <Clock className="w-5 h-5 mr-2 inline" />
                Start in 30 seconds
              </a>
              <a href="#proof" className="btn-secondary text-lg px-8 py-4">
                <Heart className="w-5 h-5 mr-2 inline" />
                See the magic
              </a>
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

      <div className="bg-concrete/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8 py-16 pb-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-thunder mb-6">
              Your personal email autopilot
            </h2>
            <p className="text-xl text-gray max-w-3xl mx-auto">
              While you sleep, eat, or binge-watch Netflix, Actioneer is busy
              turning your messy inbox into organized, actionable insights. It's
              like having a super-efficient assistant who never takes a day off.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            <section className="card-playful bg-heliotrope/10 border-heliotrope/20">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-heliotrope rounded-2xl flex items-center justify-center mr-4">
                  <Mail className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-thunder">
                  Receipt Wizardry
                </h3>
              </div>
              <p className="text-gray-dark text-lg mb-4">
                <strong className="text-heliotrope">
                  Never manually enter another expense.
                </strong>
                Every receipt email becomes a perfectly categorized expense
                entry, complete with merchant details, amounts, and smart
                categorization.
              </p>
              <div className="text-sm text-gray bg-white/50 rounded-lg p-3">
                💡 "I used to spend Sunday mornings sorting receipts. Now I
                spend them sleeping in!" - Sarah M.
              </div>
            </section>
            <section className="card-playful bg-gold/10 border-gold/20">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-gold rounded-2xl flex items-center justify-center mr-4">
                  <BarChart4 className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-thunder">
                  Travel Genius
                </h3>
              </div>
              <p className="text-gray-dark text-lg mb-4">
                <strong className="text-gold">
                  Stop juggling 47 browser tabs.
                </strong>
                Compare hotel prices, flight options, and attractions instantly.
                Add trips to your calendar with one click.
              </p>
              <div className="text-sm text-gray bg-white/50 rounded-lg p-3">
                ✈️ "Saved $400 on my last trip just by seeing all options in one
                place!" - Mike T.
              </div>
            </section>
            <section className="card-playful bg-jade/10 border-jade/20">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-jade rounded-2xl flex items-center justify-center mr-4">
                  <Briefcase className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-thunder">
                  Job Hunt Hero
                </h3>
              </div>
              <p className="text-gray-dark text-lg mb-4">
                <strong className="text-jade">
                  Turn job hunting chaos into zen.
                </strong>
                Every application email gets organized, tracked, and followed up
                automatically. No more "Did I apply there already?" moments.
              </p>
              <div className="text-sm text-gray bg-white/50 rounded-lg p-3">
                🎯 "Landed my dream job because I never missed a follow-up!" -
                Alex R.
              </div>
            </section>
            <section className="card-playful bg-bittersweet/10 border-bittersweet/20">
              <div className="flex items-center mb-6">
                <div className="w-12 h-12 bg-bittersweet rounded-2xl flex items-center justify-center mr-4">
                  <ZapIcon className="h-6 w-6 text-white" />
                </div>
                <h3 className="text-2xl font-bold text-thunder">
                  Smart Actions
                </h3>
              </div>
              <p className="text-gray-dark text-lg mb-4">
                <strong className="text-bittersweet">
                  Skip the copy-paste dance.
                </strong>
                Interactive buttons appear right in your emails - add expenses,
                book flights, schedule interviews. It's like your inbox got
                superpowers.
              </p>
              <div className="text-sm text-gray bg-white/50 rounded-lg p-3">
                ⚡ "Feels like magic every single time!" - Jennifer L.
              </div>
            </section>
          </div>
        </div>
      </div>

      {/* How It Works Section */}
      <div id="proof" className="section-spacing bg-concrete/10">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-thunder mb-6">
              How it works
            </h2>
            <p className="text-xl text-gray max-w-3xl mx-auto">
              Three simple steps to transform your inbox from chaos to clarity.
              Set it up once, then sit back and watch the magic happen.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
            <HowItWorksItem title="Install & Forget" number={1}>
              Add the Gmail add-on in 30 seconds. Our intelligent agent
              immediately starts
              <strong className="text-heliotrope">
                {" "}
                monitoring your incoming emails
              </strong>{" "}
              - no setup, no configuration, no headaches.
            </HowItWorksItem>
            <HowItWorksItem title="Agent Takes Over" number={2}>
              Like having a super-smart assistant working 24/7. The agent
              <strong className="text-jade">
                {" "}
                automatically parses receipts, travel bookings, and job
                applications
              </strong>
              , then organizes everything in your personal dashboard.
            </HowItWorksItem>
            <HowItWorksItem title="Enjoy the Results" number={3}>
              Your dashboard fills up with
              <strong className="text-gold">
                {" "}
                perfectly structured, actionable data
              </strong>
              . Expense tracking, travel comparisons, job application status -
              all updated automatically without you lifting a finger.
            </HowItWorksItem>
          </div>

          <div className="text-center mt-16">
            <div className="inline-flex items-center px-6 py-3 bg-white rounded-2xl shadow-lg border border-gray-light">
              <div className="flex items-center space-x-2 text-gray-dark">
                <span className="text-2xl">⚡</span>
                <span className="font-semibold">Result:</span>
                <span className="text-heliotrope font-bold">
                  2.5 hours saved weekly
                </span>
                <span>•</span>
                <span className="text-jade font-bold">98% user retention</span>
                <span>•</span>
                <span className="text-gold font-bold">Zero manual work</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* How to Install Section */}
      <div className="section-spacing bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-thunder mb-6">
              How to install?
            </h2>
            <p className="text-xl text-gray max-w-3xl mx-auto">
              Five ridiculously easy steps to email enlightenment. Seriously,
              your grandma could do this blindfolded! 👵✨
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-5 gap-6 lg:gap-8">
            <HowToInstallItem number={1}>
              <a
                href="https://workspace.google.com/marketplace"
                target="_blank"
                rel="noopener noreferrer"
                className="text-heliotrope hover:text-heliotrope font-semibold underline"
              >
                Install Actioneer from Gmail Add-ons
              </a>{" "}
              in 10 seconds flat. No credit card, no drama.
            </HowToInstallItem>
            <HowToInstallItem number={2}>
              Open any{" "}
              <strong className="text-jade">
                travel booking, shopping receipt,
              </strong>{" "}
              or <strong className="text-jade">job update</strong> email. Don't
              have one? Order a coffee! ☕
            </HowToInstallItem>
            <HowToInstallItem number={3}>
              Spot the{" "}
              <strong className="text-gold">
                Actioneer logo in your sidebar
              </strong>
              , click it, then hit "View on Dashboard". This is where the magic
              happens! ✨
            </HowToInstallItem>
            <HowToInstallItem number={4}>
              <strong className="text-bittersweet">Sign in with Google</strong>{" "}
              - the same account you're already using. One click, done!
            </HowToInstallItem>
            <HowToInstallItem number={5}>
              You're officially set! Now grab your{" "}
              <strong className="text-lavender">apple juice</strong>, start that
              Netflix binge, and watch your emails organize themselves.
            </HowToInstallItem>
          </div>

          {/* <div className="text-center mt-16">
            <div className="inline-flex items-center px-6 py-4 bg-heliotrope/5 rounded-2xl border border-heliotrope/20">
              <div className="flex items-center space-x-3 text-gray-dark">
                <span className="text-2xl">🚀</span>
                <span className="font-semibold">Total time needed:</span>
                <span className="text-heliotrope font-bold text-lg">
                  Less than 2 minutes
                </span>
                <span>•</span>
                <span className="text-jade font-bold">
                  Zero technical skills required
                </span>
              </div>
            </div>
          </div> */}
        </div>
      </div>

      {/* CTA Section */}
      <div className="bg-thunder text-white section-spacing">
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
                <span className="underline decoration-gold">
                  See more proof →
                </span>
              </a>
            </div>
            <p className="text-white/60 text-sm">
              No credit card required • Works with Gmail, Outlook, and more •
              Cancel anytime (but you won't want to)
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

function HowItWorksItem({
  title,
  children,
  number,
}: {
  title: string;
  children: React.ReactNode;
  number: number;
}) {
  const colors = {
    1: {
      bg: "bg-heliotrope",
      text: "text-lavender",
    },
    2: {
      bg: "bg-lime",
      text: "text-jade",
    },
    3: {
      bg: "bg-lavender",
      text: "text-heliotrope",
    },
  };

  return (
    <div className="text-center group">
      <div className="relative mb-8">
        <div
          className={`w-20 h-20 mx-auto rounded-xl flex items-center justify-center text-white text-5xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300 ${
            colors[number as keyof typeof colors].bg
          }`}
        >
          {number}
          <span
            className={`text-[5rem] leading-9 ${
              colors[number as keyof typeof colors].text
            }`}
          >
            .
          </span>
        </div>
        {/* <div className="absolute -top-2 -right-2 w-6 h-6 bg-gold rounded-full animate-pulse"></div> */}
      </div>
      <h3 className="text-2xl font-bold text-thunder mb-4">{title}</h3>
      <p className="text-gray-dark text-lg">{children}</p>
    </div>
  );
}

function HowToInstallItem({
  children,
  number,
}: {
  children: React.ReactNode;
  number: number;
}) {
  const bgColors = {
    1: "bg-heliotrope",
    2: "bg-jade",
    3: "bg-gold",
    4: "bg-bittersweet",
    5: "bg-lavender",
  };

  return (
    <section className="text-center group">
      <div className="relative mb-6">
        <div
          className={`w-16 h-16 mx-auto rounded-2xl flex items-center justify-center text-white text-xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300 ${
            bgColors[number as keyof typeof bgColors]
          }`}
        >
          {number}
        </div>
        <div className="absolute -top-1 -right-1 w-4 h-4 bg-gold rounded-full animate-pulse"></div>
      </div>
      <p className="text-gray-dark text-sm mb-4">{children}</p>
    </section>
  );
}
