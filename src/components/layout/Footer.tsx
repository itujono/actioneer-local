import { Link } from "@tanstack/react-router";

export default function Footer() {
  return (
    <footer className="bg-thunder border-t border-concrete/20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand */}
          <div className="md:col-span-1">
            <div className="flex items-center mb-4">
              <img src="/logo.png" alt="Actioneer" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-white">
                Actioneer
              </span>
            </div>
            <p className="text-sm text-white/80">
              Making your emails work for you, not the other way around.
            </p>
          </div>

          {/* Product */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Product</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/dashboard"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Dashboard
                </Link>
              </li>
              <li>
                <a
                  href="/#how"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  How it Works
                </a>
              </li>
              <li>
                <a
                  href="https://workspace.google.com/marketplace"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Gmail Add-on
                </a>
              </li>
            </ul>
          </div>

          {/* Support */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Support</h3>
            <ul className="space-y-2">
              <li>
                <a
                  href="mailto:itujono@gmail.com"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Contact Support
                </a>
              </li>
              <li>
                <a
                  href="https://docs.actioneer.online"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Documentation
                </a>
              </li>
              <li>
                <a
                  href="/#faq"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  FAQ
                </a>
              </li>
            </ul>
          </div>

          {/* Legal */}
          <div>
            <h3 className="text-sm font-semibold text-white mb-3">Legal</h3>
            <ul className="space-y-2">
              <li>
                <Link
                  to="/privacy"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Privacy Policy
                </Link>
              </li>
              <li>
                <a
                  href="#"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Terms of Service
                </a>
              </li>
              {/* <li>
                <a
                  href="mailto:privacy@actioneer.online"
                  className="text-sm text-white/70 hover:text-white transition-colors"
                >
                  Privacy Questions
                </a>
              </li> */}
            </ul>
          </div>
        </div>

        {/* Bottom section */}
        <div className="mt-8 pt-8 border-t border-concrete/20">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-white/60">
              © {new Date().getFullYear()} Actioneer. All rights reserved.
            </p>
            <div className="flex items-center space-x-4 mt-4 md:mt-0">
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-jade rounded-full"></div>
                <span className="text-xs text-white/60">
                  Free while in beta
                </span>
              </div>
              <div className="flex items-center space-x-2">
                <div className="w-2 h-2 bg-sandy rounded-full"></div>
                <span className="text-xs text-white/60">
                  Zero tracking policy
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
}
