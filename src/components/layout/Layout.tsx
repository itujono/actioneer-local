import React from "react";
import { Link, useRouterState } from "@tanstack/react-router";
import { supabase } from "../../supabase/client";
import { toast } from "sonner";
import {
  LayoutDashboard,
  Receipt,
  Plane,
  Briefcase,
  LogOut,
  Menu,
  X,
  Mail,
} from "lucide-react";

interface LayoutProps {
  children: React.ReactNode;
  isAuthenticated: boolean;
}

export default function Layout({ children, isAuthenticated }: LayoutProps) {
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const { location } = useRouterState();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      // Redirect to home page after sign out
      window.location.href = "/";
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  // If on landing page or auth page, don't show sidebar
  const isPublicPage =
    location.pathname === "/" || location.pathname === "/auth";

  if (isPublicPage) {
    return (
      <div className="min-h-screen">
        <main>{children}</main>
      </div>
    );
  }

  // Dashboard layout with sidebar
  return (
    <div className="min-h-screen bg-concrete">
      {/* Mobile sidebar */}
      <div
        className={`fixed inset-0 flex z-40 md:hidden ${
          sidebarOpen ? "" : "hidden"
        }`}
      >
        {/* Backdrop */}
        <div
          className="fixed inset-0 bg-thunder bg-opacity-75"
          aria-hidden="true"
          onClick={() => setSidebarOpen(false)}
        ></div>

        {/* Sidebar */}
        <div className="relative flex-1 flex flex-col max-w-xs w-full bg-white">
          <div className="absolute top-0 right-0 -mr-12 pt-2">
            <button
              type="button"
              className="ml-1 flex items-center justify-center h-10 w-10 rounded-full focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sr-only">Close sidebar</span>
              <X className="h-6 w-6 text-white" />
            </button>
          </div>

          <div className="flex-1 h-0 pt-5 pb-4 overflow-y-auto">
            <div className="flex-shrink-0 flex items-center px-4">
              <img src="/logo.png" alt="Actioneer" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-thunder">
                actioneer
              </span>
            </div>
            <nav className="mt-5 px-2 space-y-1">
              <Link
                to="/dashboard"
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  location.pathname === "/dashboard"
                    ? "bg-heliotrope/10 text-heliotrope"
                    : "text-thunder hover:bg-concrete hover:text-thunder"
                }`}
              >
                <LayoutDashboard className="mr-4 h-6 w-6 text-heliotrope" />
                Dashboard
              </Link>

              <Link
                to="/finance"
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  location.pathname === "/finance"
                    ? "bg-gold/10 text-gold"
                    : "text-thunder hover:bg-concrete hover:text-thunder"
                }`}
              >
                <Receipt className="mr-4 h-6 w-6 text-gold" />
                Finance
              </Link>

              <Link
                to="/travel"
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  location.pathname === "/travel"
                    ? "bg-jade/10 text-jade"
                    : "text-thunder hover:bg-concrete hover:text-thunder"
                }`}
              >
                <Plane className="mr-4 h-6 w-6 text-jade" />
                Travel
              </Link>

              <Link
                to="/jobs"
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  location.pathname === "/jobs"
                    ? "bg-bittersweet/10 text-bittersweet"
                    : "text-thunder hover:bg-concrete hover:text-thunder"
                }`}
              >
                <Briefcase className="mr-4 h-6 w-6 text-bittersweet" />
                Job Applications
              </Link>

              <Link
                to="/settings"
                className={`group flex items-center px-2 py-2 text-base font-medium rounded-md transition-colors duration-200 ${
                  location.pathname === "/settings"
                    ? "bg-lavender/10 text-lavender"
                    : "text-thunder hover:bg-concrete hover:text-thunder"
                }`}
              >
                {/* <Settings className="mr-4 h-6 w-6 text-lavender" /> */}
                Settings
              </Link>
            </nav>
          </div>

          <div className="flex-shrink-0 flex border-t border-concrete p-4">
            <button
              onClick={handleSignOut}
              className="flex-shrink-0 group block w-full"
            >
              <div className="flex items-center">
                <div className="ml-3">
                  <p className="text-base font-medium text-thunder group-hover:text-thunder">
                    Sign out
                  </p>
                </div>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex-1 flex flex-col min-h-0 border-r border-concrete bg-white">
          <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
            <div className="flex items-center flex-shrink-0 px-4">
              <img src="/logo.png" alt="actioneer" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-black">
                actioneer
              </span>
            </div>
            <nav className="mt-5 flex-1 px-2 bg-white space-y-1">
              <Link
                to="/dashboard"
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  location.pathname === "/dashboard"
                    ? "bg-heliotrope/10 text-heliotrope"
                    : "text-thunder hover:bg-concrete hover:text-thunder"
                }`}
              >
                <LayoutDashboard className="mr-3 h-6 w-6 text-heliotrope" />
                Dashboard
              </Link>

              <Link
                to="/finance"
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  location.pathname === "/finance"
                    ? "bg-gold/10 text-gold"
                    : "text-thunder hover:bg-concrete hover:text-thunder"
                }`}
              >
                <Receipt className="mr-3 h-6 w-6 text-gold" />
                Finance
              </Link>

              <Link
                to="/travel"
                className={`group flex items-center px-2 py-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  location.pathname === "/travel"
                    ? "bg-jade/10 text-jade"
                    : "text-thunder hover:bg-concrete hover:text-thunder"
                }`}
              >
                <Plane className="mr-3 h-6 w-6 text-jade" />
                Travel
              </Link>

              <Link
                to="/jobs"
                className={`group flex items-center px-2 py-2 pb-4 mb-2 text-sm font-medium rounded-md transition-colors duration-200 ${
                  location.pathname === "/jobs"
                    ? "bg-bittersweet/10 text-bittersweet"
                    : "text-thunder hover:bg-concrete hover:text-thunder"
                }`}
              >
                <Briefcase className="mr-3 h-6 w-6 text-bittersweet" />
                Job Applications
              </Link>

              <Link
                to="/settings"
                className={`group flex items-center px-2 py-4 mt-4 text-sm font-medium transition-colors duration-200 border-t border-bittersweet ${
                  location.pathname === "/settings"
                    ? "bg-lavender/10 text-lavender"
                    : "text-thunder hover:bg-concrete hover:text-thunder"
                }`}
              >
                {/* <Settings className="mr-3 h-6 w-6 text-lavender" /> */}
                Settings
              </Link>
            </nav>
          </div>
          <div className="flex-shrink-0 flex border-t border-concrete p-4">
            <button
              onClick={handleSignOut}
              className="flex items-center text-thunder hover:text-thunder transition-colors duration-200"
            >
              <LogOut className="h-5 w-5 mr-2" />
              <span>Sign out</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 md:hidden pl-1 pt-1 sm:pl-3 sm:pt-3 bg-concrete">
          <button
            type="button"
            className="-ml-0.5 -mt-0.5 h-12 w-12 inline-flex items-center justify-center rounded-md text-thunder hover:text-thunder focus:outline-none focus:ring-2 focus:ring-inset focus:ring-heliotrope"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <Menu className="h-6 w-6" />
          </button>
        </div>
        <main className="flex-1">{children}</main>
      </div>
    </div>
  );
}
