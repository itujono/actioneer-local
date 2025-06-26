import CircleJot from "../CircleJot";

export default function HowItWorksSection() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
      <div className="text-center mb-12 sm:mb-16">
        <div className="relative inline-block">
          <h2 className="text-3xl sm:text-4xl font-bold text-thunder mb-4 sm:mb-6">
            How it works
          </h2>
          {/* Circle jot SVG with dynamic color control */}
          <CircleJot />
        </div>
        <p className="text-lg sm:text-xl text-gray max-w-3xl mx-auto px-2">
          Three simple steps to transform your inbox from chaos to clarity. Set
          it up once, then sit back and watch the magic happen.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 sm:gap-10 lg:gap-12">
        <HowItWorksItem title="Sign In & Activate" number={1}>
          Visit{" "}
          <a
            href="https://actioneer.online/dashboard"
            target="_blank"
            rel="noopener noreferrer"
            className="text-heliotrope font-semibold hover:text-heliotrope/80 underline break-all"
          >
            https://actioneer.online/dashboard
          </a>{" "}
          and sign in with Google. Then install the Gmail add-on and open it
          once in any email to
          <strong className="text-heliotrope">
            {" "}
            activate automatic email monitoring
          </strong>{" "}
          - simple one-time setup, then you're done forever.
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
        <div className="relative mb-6 sm:mb-8">
          <div
            className={`w-16 h-16 sm:w-20 sm:h-20 mx-auto rounded-xl flex items-center justify-center text-white text-3xl sm:text-4xl lg:text-5xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300 ${
              colors[number as keyof typeof colors].bg
            }`}
          >
            {number}
            <span
              className={`text-[3rem] sm:text-[4rem] lg:text-[5rem] leading-9 ${
                colors[number as keyof typeof colors].text
              }`}
            >
              .
            </span>
          </div>
        </div>
        <h3 className="text-xl sm:text-2xl font-bold text-thunder mb-3 sm:mb-4 px-2">
          {title}
        </h3>
        <p className="text-gray-dark text-base sm:text-lg leading-relaxed px-2">
          {children}
        </p>
      </div>
    );
  }
}
