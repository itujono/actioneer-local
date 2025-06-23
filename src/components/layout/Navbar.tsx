import { Link, useNavigate } from "@tanstack/react-router";
import { supabase } from "../../supabase/client";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";

export default function Navbar() {
  const { isAuthenticated } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    try {
      await supabase.auth.signOut();
      toast.success("Signed out successfully");
      navigate({ to: "/" });
    } catch (error) {
      toast.error("Error signing out");
    }
  };

  return (
    <header className="bg-transparent">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <Link to="/" className="flex items-center">
                <img
                  src="/logo.png"
                  alt="Actioneer"
                  className="h-8 w-8 text-heliotrope"
                />
                <span className="ml-2 text-xl font-bold text-white">
                  Actioneer
                </span>
              </Link>
            </div>
          </div>
          <div className="flex items-center">
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
                  className="ml-4 inline-flex items-center px-4 py-2 border border-concrete text-sm font-medium rounded-md text-thunder bg-white hover:bg-concrete focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-heliotrope transition-colors duration-200"
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
        </div>
      </div>
    </header>
  );
}
