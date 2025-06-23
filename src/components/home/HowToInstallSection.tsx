import CurlyArrow from "../CurlyArrow";

export default function HowToInstallSection() {
  return (
    <div className="mx-auto max-w-7xl px-6 grid lg:grid-cols-2 lg:px-16">
      <div className="mb-16">
        <h2 className="text-7xl font-bold text-gold mb-6">
          How to <br /> get <br /> started?
        </h2>
        <p className="text-3xl text-white max-w-3xl mx-auto">
          Two ridiculously easy ways to email enlightenment. <br />
          Choose your adventure! 🚀✨
        </p>
      </div>

      <div className="gap-8 lg:gap-12">
        <section className="group p-4 rounded-2xl transition-all duration-300 relative">
          {/* <div className="w-20 h-20 mx-auto mb-6 bg-heliotrope rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
            🚀
          </div> */}
          <h3 className="text-2xl font-bold text-white mb-4">Instant Start</h3>
          <CurlyArrow />
          <p className="text-white text-lg mb-6">
            Visit{" "}
            <a
              href="https://actioneer.online/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-heliotrope hover:text-heliotrope/80 font-semibold underline"
            >
              https://actioneer.online/dashboard
            </a>{" "}
            and sign in with Google. Your emails are already being monitored and
            processed automatically!
          </p>
        </section>
        <section className="group p-4 rounded-2xl transition-all duration-300 relative">
          {/* <div className="w-20 h-20 mx-auto mb-6 bg-jade rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
            ✨
          </div> */}
          <h3 className="text-2xl font-bold text-white mb-4">
            Enhanced Experience
          </h3>
          {/* <CurlyArrow /> */}
          <p className="text-white text-lg mb-6">
            Get the dashboard <em>plus</em> install the{" "}
            <a
              href="https://workspace.google.com/marketplace"
              target="_blank"
              rel="noopener noreferrer"
              className="text-jade hover:text-jade/80 font-semibold underline"
            >
              Gmail add-on
            </a>{" "}
            for smart actions directly in your inbox. See expense details and
            travel comparisons right when you open emails!
          </p>
        </section>
        <section className="group p-4 rounded-2xl transition-all duration-300">
          {/* <div className="w-20 h-20 mx-auto mb-6 bg-bittersweet rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
            ✨
          </div> */}
          <h3 className="text-2xl font-bold text-white mb-4">
            You're All Set!
          </h3>
          <p className="text-white text-lg mb-6">
            Now grab your <strong className="text-lavender">apple juice</strong>
            , start that Netflix binge, and watch your emails organize
            themselves.
            <span className="text-2xl ml-2">🍎📺✨</span>
          </p>
        </section>
      </div>
    </div>
  );
}
