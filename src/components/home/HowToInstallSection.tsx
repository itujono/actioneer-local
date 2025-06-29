import CurlyArrow from "../illustrations/CurlyArrow";

export default function HowToInstallSection() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-16">
      <div className="mb-12 lg:mb-16">
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gold mb-4 sm:mb-6 leading-tight">
          How to <br /> get <br /> started?
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white max-w-3xl">
          Three (well, two actually) ridiculously easy steps to email
          enlightenment.
        </p>
      </div>

      <div className="space-y-0">
        <section className="group p-4 sm:p-3 rounded-2xl transition-all duration-300 relative">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            Step 1: Sign In
          </h3>
          <CurlyArrow />
          <p className="text-white text-base sm:text-lg mb-4 sm:mb-6 leading-relaxed">
            Visit{" "}
            <a
              href="https://actioneer.online/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sandy hover:text-sandy/80 font-semibold underline break-all"
            >
              actioneer.online
            </a>{" "}
            and sign in with Google.
          </p>
        </section>
        <section className="group p-4 sm:p-3 rounded-2xl transition-all duration-300 relative">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            Step 2: Connect Gmail
          </h3>
          <p className="text-white text-base sm:text-lg mb-4 sm:mb-6 leading-relaxed">
            Click the "Enable Gmail Processing" button in the dashboard and
            you're good to go!
          </p>
        </section>

        <section className="group p-4 sm:p-3 rounded-2xl transition-all duration-300 relative">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            Step 2: Enjoy Automation!
          </h3>
          <p className="text-white text-base sm:text-lg mb-4 sm:mb-6 leading-relaxed">
            That's literally it! Your dashboard starts populating with data as
            emails arrive. Receipts become expense reports, travel emails become
            trip planners, job applications become opportunity trackers - all
            automatically.
            <span className="text-xl sm:text-2xl ml-2">⚡✨</span>
          </p>
        </section>
      </div>
    </div>
  );
}
