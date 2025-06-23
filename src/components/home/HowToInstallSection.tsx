export default function HowToInstallSection() {
  return (
    <div className="mx-auto max-w-7xl px-6 lg:px-8">
      <div className="text-center mb-16">
        <h2 className="text-4xl font-bold text-thunder mb-6">
          How to install?
        </h2>
        <p className="text-xl text-gray max-w-3xl mx-auto">
          Five ridiculously easy steps to email enlightenment. Seriously, your
          grandma could do this blindfolded! 👵✨
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
          or <strong className="text-jade">job update</strong> email. Don't have
          one? Order a coffee! ☕
        </HowToInstallItem>
        <HowToInstallItem number={3}>
          Spot the{" "}
          <strong className="text-gold">Actioneer logo in your sidebar</strong>,
          click it, then hit "View on Dashboard". This is where the magic
          happens! ✨
        </HowToInstallItem>
        <HowToInstallItem number={4}>
          <strong className="text-bittersweet">Sign in with Google</strong> -
          the same account you're already using. One click, done!
        </HowToInstallItem>
        <HowToInstallItem number={5}>
          You're officially set! Now grab your{" "}
          <strong className="text-lavender">apple juice</strong>, start that
          Netflix binge, and watch your emails organize themselves.
        </HowToInstallItem>
      </div>
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
