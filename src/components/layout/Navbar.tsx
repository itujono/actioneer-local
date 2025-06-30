import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "../../supabase/client";
import { toast } from "sonner";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Menu, X } from "lucide-react";

export default function Navbar() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Simple auth check for navbar - doesn't trigger redirects
  const { data: isAuthenticated } = useQuery({
    queryKey: ["navbar-auth"],
    queryFn: async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      return !!session?.user;
    },
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry on error
  });

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      // Immediately invalidate auth cache for instant UI update
      queryClient.invalidateQueries({ queryKey: ["auth"] });
      queryClient.invalidateQueries({ queryKey: ["navbar-auth"] });
      toast.success("Signed out successfully");
      navigate({ to: "/" });
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  return (
    <header className="bg-transparent relative z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Desktop Navigation */}
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <img src="/logo.png" alt="Actioneer" className="h-8 w-8" />
              <span className="ml-2 text-xl font-bold text-white">Actioneer</span>
            </Link>
          </div>

          {/* Desktop menu */}
          <div className="hidden md:flex items-center space-x-4">
            {isAuthenticated ? (
              <>
                <Link
                  to="/dashboard"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-lime bg-lime/10 hover:bg-lime/20 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jade transition-colors duration-200"
                >
                  Dashboard
                </Link>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="inline-flex items-center px-4 py-2 border border-concrete text-sm font-medium rounded-md text-thunder bg-white hover:bg-concrete focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-heliotrope transition-colors duration-200"
                >
                  Sign out
                </button>
              </>
            ) : (
              <Link
                to="/auth"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-heliotrope hover:bg-heliotrope/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-heliotrope transition-colors duration-200"
              >
                Sign in with Google
              </Link>
            )}
          </div>

          {/* Mobile menu button */}
          <div className="md:hidden">
            <button
              onClick={toggleMobileMenu}
              className="inline-flex items-center justify-center p-2 rounded-md text-white hover:text-white/80 hover:bg-white/10 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white transition-colors duration-200"
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
            </button>
          </div>
        </div>

        {/* Mobile menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden">
            <div className="px-2 pt-2 pb-3 space-y-1 bg-white/95 backdrop-blur-sm rounded-lg mt-2 shadow-lg border border-white/20">
              {isAuthenticated ? (
                <>
                  <Link
                    to="/dashboard"
                    className="block px-3 py-2 rounded-md text-base font-medium text-heliotrope hover:text-heliotrope/80 hover:bg-heliotrope/10 transition-colors duration-200"
                    onClick={() => setIsMobileMenuOpen(false)}
                  >
                    Dashboard
                  </Link>
                  <button
                    onClick={() => {
                      handleSignOut();
                      setIsMobileMenuOpen(false);
                    }}
                    className="block w-full text-left px-3 py-2 rounded-md text-base font-medium text-thunder hover:text-thunder/80 hover:bg-gray/10 transition-colors duration-200"
                  >
                    Sign out
                  </button>
                </>
              ) : (
                <Link
                  to="/auth"
                  className="block px-3 py-2 rounded-md text-base font-medium text-white bg-heliotrope hover:bg-heliotrope/90 transition-colors duration-200 text-center"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  Sign in with Google
                </Link>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
}
