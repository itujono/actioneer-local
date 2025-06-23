import CurlyArrow from "../CurlyArrow";

export default function HowToInstallSection() {
  return (
    <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8 grid lg:grid-cols-2 gap-8 lg:gap-16">
      <div className="mb-12 lg:mb-16">
        <h2 className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold text-gold mb-4 sm:mb-6 leading-tight">
          How to <br /> get <br /> started?
        </h2>
        <p className="text-lg sm:text-xl md:text-2xl lg:text-3xl text-white max-w-3xl">
          Two ridiculously easy ways to email enlightenment.{" "}
          <br className="hidden sm:block" />
          Choose your adventure! 🚀✨
        </p>
      </div>

      <div className="space-y-0">
        <section className="group p-4 sm:p-3 rounded-2xl transition-all duration-300 relative">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            Instant Start
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
              https://actioneer.online/dashboard
            </a>{" "}
            and sign in with Google. Your emails are already being monitored and
            processed automatically!
          </p>
        </section>

        <section className="group p-4 sm:p-3 rounded-2xl transition-all duration-300 relative">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            Enhanced Experience
          </h3>
          <p className="text-white text-base sm:text-lg mb-4 sm:mb-6 leading-relaxed">
            Get the dashboard <em>plus</em> install the{" "}
            <a
              href="https://workspace.google.com/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-lime hover:text-lime/80 font-semibold underline"
            >
              Gmail add-on
            </a>{" "}
            for smart actions directly in your inbox. See expense details and
            travel comparisons right when you open emails!
          </p>
        </section>

        <section className="group p-4 sm:p-3 rounded-2xl transition-all duration-300">
          <h3 className="text-xl sm:text-2xl font-bold text-white mb-3 sm:mb-4">
            You're All Set!
          </h3>
          <p className="text-white text-base sm:text-lg mb-4 sm:mb-6 leading-relaxed">
            Now grab your <strong className="text-gold">apple juice</strong>,
            start that Netflix binge, and watch your emails organize themselves.
            <span className="text-xl sm:text-2xl ml-2">🍎📺✨</span>
          </p>
        </section>
      </div>
    </div>
  );
}
