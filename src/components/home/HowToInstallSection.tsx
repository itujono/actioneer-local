export default function HowToInstallSection() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-gold mb-6">
          How to get started?
        </h2>
        <p className="text-xl text-white max-w-3xl mx-auto">
          Two ridiculously easy ways to email enlightenment. Choose your
          adventure! 🚀✨
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 lg:gap-12">
        <div className="text-center group p-8 bg-white rounded-2xl border-2 border-heliotrope/20 hover:border-heliotrope/40 transition-all duration-300 hover:shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-heliotrope rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
            🚀
          </div>
          <h3 className="text-2xl font-bold text-thunder mb-4">
            Instant Start
          </h3>
          <p className="text-gray-dark text-lg mb-6">
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
        </div>

        <div className="text-center group p-8 bg-white rounded-2xl border-2 border-jade/20 hover:border-jade/40 transition-all duration-300 hover:shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-jade rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
            ✨
          </div>
          <h3 className="text-2xl font-bold text-thunder mb-4">
            Enhanced Experience
          </h3>
          <p className="text-gray-dark text-lg mb-6">
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
        </div>

        <div className="text-center group p-8 bg-white rounded-2xl border-2 border-jade/20 hover:border-jade/40 transition-all duration-300 hover:shadow-lg">
          <div className="w-20 h-20 mx-auto mb-6 bg-bittersweet rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg group-hover:scale-110 transition-transform duration-300">
            ✨
          </div>
          <h3 className="text-2xl font-bold text-thunder mb-4">
            You're All Set!
          </h3>
          <p className="text-gray-dark text-lg mb-6">
            Now grab your <strong className="text-lavender">apple juice</strong>
            , start that Netflix binge, and watch your emails organize
            themselves.
            <span className="text-2xl ml-2">🍎📺✨</span>
          </p>
        </div>
      </div>
    </div>
  );
}
