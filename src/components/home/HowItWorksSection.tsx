import CircleJot from "../CircleJot";

export default function HowItWorksSection() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="text-center mb-16">
        <div className="relative inline-block">
          <h2 className="text-4xl font-bold text-thunder mb-6">How it works</h2>
          {/* Circle jot SVG with dynamic color control */}
          <CircleJot />
        </div>
        <p className="text-xl text-gray max-w-3xl mx-auto">
          Three simple steps to transform your inbox from chaos to clarity. Set
          it up once, then sit back and watch the magic happen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        <HowItWorksItem title="Sign In & Start" number={1}>
          Simply visit{" "}
          <a
            href="https://actioneer.online/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-heliotrope font-semibold hover:text-heliotrope/80 underline"
          >
            https://actioneer.online/dashboard
          </a>{" "}
          and sign in with Google. Our intelligent agent immediately starts
          <strong className="text-heliotrope">
            {" "}
            monitoring your incoming emails
          </strong>{" "}
          - no installation, no setup, no configuration, no headaches.
        </HowItWorksItem>
        <HowItWorksItem title="Agent Takes Over" number={2}>
          Like having a super-smart assistant working 24/7. In every incoming
          email, the agent
          <strong className="text-jade">
            {" "}
            automatically parses receipts, travel bookings, and job applications
          </strong>
          , then organizes everything in your personal dashboard.
        </HowItWorksItem>
        <HowItWorksItem title="Enjoy the Results" number={3}>
          Your dashboard fills up with
          <strong className="text-gold">
            {" "}
            perfectly structured, actionable data
          </strong>
          . Expense tracking, travel comparisons, job application status - all
          updated automatically without you lifting a finger.
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
  );

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
}
