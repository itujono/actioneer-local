import { Zap, Clock, Shield, Globe, Sparkles, Target } from "lucide-react";

export function IntroductionSection() {
  return (
    <>
      {/* What is Actioneer */}
      <section className="mb-12 pt-12" data-section="what-is-actioneer">
        <h2 className="text-3xl font-bold text-thunder mb-6">
          What is Actioneer?
        </h2>
        <div className="prose prose-lg max-w-none">
          <p className="text-gray leading-relaxed mb-4">
            Actioneer is an intelligent email processing platform that
            automatically monitors your Gmail inbox, extracts meaningful data
            from incoming emails, and organizes everything in a beautiful
            dashboard. Think of it as having a super-smart assistant working
            24/7 in your inbox, turning email chaos into organized clarity.
          </p>
          <p className="text-gray leading-relaxed">
            Whether it's expense tracking from receipts, travel planning from
            booking confirmations, or job application management, Actioneer
            handles it all seamlessly in the background.
          </p>
        </div>
      </section>

      {/* Key Benefits */}
      <section className="mb-12 pt-12" data-section="key-benefits">
        <h2 className="text-3xl font-bold text-thunder mb-6">Key Benefits</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[
            {
              icon: Zap,
              title: "Minimal Setup Required",
              description:
                "Connect your Gmail account with one click and start immediately—no complex configuration or technical headaches",
            },
            {
              icon: Clock,
              title: "Real-time Processing",
              description:
                "Emails are processed the moment they arrive in your inbox",
            },
            {
              icon: Shield,
              title: "Privacy-First",
              description:
                "Your email data is processed securely with enterprise-grade encryption",
            },
            {
              icon: Globe,
              title: "Universal Compatibility",
              description:
                "Works with any email, from any sender, in any format",
            },
            {
              icon: Sparkles,
              title: "Intelligent Classification",
              description:
                "Advanced AI accurately categorizes and extracts data from diverse email types",
            },
            {
              icon: Target,
              title: "Actionable Insights",
              description:
                "Transform raw email data into meaningful, organized information",
            },
          ].map((benefit, index) => (
            <div
              key={index}
              className="bg-white p-6 rounded-lg border border-concrete"
            >
              <div className="flex items-start gap-3">
                <benefit.icon className="h-6 w-6 text-heliotrope mt-1 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-thunder mb-2">
                    {benefit.title}
                  </h3>
                  <p className="text-gray text-sm">{benefit.description}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* How It Works */}
      <section className="mb-12 pt-12" data-section="how-it-works">
        <h2 className="text-3xl font-bold text-thunder mb-6">How It Works</h2>
        <p className="text-gray mb-6">
          Actioneer operates on a simple three-step process that requires zero
          intervention from you:
        </p>

        <div className="space-y-6">
          {[
            {
              step: "1",
              title: "Sign In & Activate",
              description:
                "Visit the dashboard and sign in with your Google account to see your dashboard. To enable automatic email processing, connect your Gmail account through the web dashboard—this activates the intelligent agent that monitors your incoming emails.",
              color: "bg-jade",
            },
            {
              step: "2",
              title: "Agent Takes Over",
              description:
                "Like having a super-smart assistant working 24/7, the agent automatically parses receipts, travel promotional emails, and job applications in every incoming email, then organizes everything in your personal dashboard.",
              color: "bg-jade",
            },
            {
              step: "3",
              title: "Enjoy the Results",
              description:
                "Your dashboard fills up with perfectly structured, actionable data. Expense tracking, travel comparisons, job application status—all updated automatically without you lifting a finger.",
              color: "bg-jade",
            },
          ].map((step, index) => (
            <div key={index} className="flex gap-4">
              <div
                className={`${step.color} text-lime rounded-full w-8 h-8 flex items-center justify-center font-bold text-sm flex-shrink-0 mt-1`}
              >
                {step.step}
              </div>
              <div>
                <h3 className="text-xl font-semibold text-thunder mb-2">
                  {step.title}
                </h3>
                <p className="text-gray">{step.description}</p>
              </div>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
