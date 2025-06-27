import { createRoute, useNavigate, Link } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { toast } from "sonner";
import { Mail } from "lucide-react";

export const authRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/auth",
  component: Auth,
});

// API functions
const checkAuthSession = async () => {
  const {
    data: { session },
    error,
  } = await supabase.auth.getSession();
  if (error) throw error;
  return session;
};

const createPublicUserRecord = async (session: any) => {
  const response = await fetch(
    `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/oauth-signin`,
    {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${session.access_token}`,
        apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
      },
    }
  );

  if (!response.ok) {
    throw new Error(`HTTP error! status: ${response.status}`);
  }

  const result = await response.json();

  if (!result.success) {
    throw new Error(result.error || "Failed to create user record");
  }

  return result;
};

const initiateGoogleOAuth = async () => {
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: "google",
    options: {
      redirectTo: `${window.location.origin}/dashboard`,
    },
  });

  if (error) throw error;
  return data;
};

function Auth() {
  const navigate = useNavigate();
  const [authListenerSetup, setAuthListenerSetup] = useState(false);

  // Check if user is already authenticated using TanStack Query
  const {
    data: session,
    isLoading: checkingAuth,
    error: authError,
  } = useQuery({
    queryKey: ["auth-session"],
    queryFn: checkAuthSession,
    retry: 1,
    refetchOnWindowFocus: false,
  });

  // Mutation for creating public user record
  const createUserMutation = useMutation({
    mutationFn: createPublicUserRecord,
    onSuccess: (result) => {
      console.log("✅ Public user record created/found:", result.user_id);
      toast.success(result.created ? "Welcome to Actioneer!" : "Welcome back!");
      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      console.error("❌ Failed to create user record:", error);
      toast.error(
        "Sign-in successful, but failed to set up your account. Please try again."
      );
      // Still navigate to dashboard as auth was successful
      navigate({ to: "/dashboard" });
    },
  });

  // Mutation for Google OAuth
  const googleSignInMutation = useMutation({
    mutationFn: initiateGoogleOAuth,
    onError: (error) => {
      console.error("❌ Google sign-in error:", error);
      if (error instanceof Error) {
        toast.error(error.message);
      } else {
        toast.error("An unexpected error occurred");
      }
    },
  });

  // Redirect if already authenticated
  useEffect(() => {
    if (session?.user && !checkingAuth) {
      console.log("🔐 User already authenticated, redirecting to dashboard");
      navigate({ to: "/dashboard" });
    }
  }, [session, checkingAuth, navigate]);

  // Set up auth state listener (this still needs useEffect as it's an event listener)
  useEffect(() => {
    if (authListenerSetup) return;

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === "SIGNED_IN" && session?.user) {
        console.log("🔐 User signed in via OAuth:", session.user.email);

        // Use the mutation to create public user record
        createUserMutation.mutate(session);
      }
    });

    setAuthListenerSetup(true);

    return () => {
      subscription.unsubscribe();
    };
  }, [authListenerSetup, createUserMutation]);

  // Handle Google sign-in button click
  const handleGoogleSignIn = () => {
    googleSignInMutation.mutate();
  };

  // Show loading spinner while checking authentication state
  if (checkingAuth) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-concrete">
        <div className="text-center">
          <svg
            className="animate-spin h-8 w-8 text-heliotrope mx-auto"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
          <p className="mt-2 text-sm text-thunder">
            Checking authentication...
          </p>
        </div>
      </div>
    );
  }

  // Show error state if auth check failed
  if (authError) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-concrete">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg
              className="h-8 w-8 mx-auto"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833-.23 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-sm text-thunder">
            Error checking authentication. Please refresh the page.
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-center py-12 sm:px-6 lg:px-8 bg-concrete">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="flex justify-center">
          <Mail className="h-12 w-12 text-heliotrope" />
        </div>
        <h2 className="mt-6 text-center text-3xl font-extrabold text-thunder">
          Sign in to Actioneer
        </h2>
        <p className="mt-2 text-center text-sm text-thunder">
          Transform your emails into actionable insights
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          <div className="space-y-6">
            <div>
              <button
                type="button"
                onClick={handleGoogleSignIn}
                disabled={
                  googleSignInMutation.isPending || createUserMutation.isPending
                }
                className="w-full flex justify-center items-center px-4 py-3 border border-concrete rounded-md shadow-sm bg-white text-sm font-medium text-thunder hover:bg-concrete focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-heliotrope disabled:opacity-50 disabled:cursor-not-allowed transition-colors duration-200"
              >
                {googleSignInMutation.isPending ||
                createUserMutation.isPending ? (
                  <span className="flex items-center">
                    <svg
                      className="animate-spin -ml-1 mr-3 h-5 w-5 text-thunder"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                    {createUserMutation.isPending
                      ? "Setting up account..."
                      : "Signing in..."}
                  </span>
                ) : (
                  <>
                    <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"
                      />
                    </svg>
                    Continue with Google
                  </>
                )}
              </button>
            </div>

            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-concrete"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="px-2 bg-white text-thunder">
                    Secure authentication powered by Google
                  </span>
                </div>
              </div>
            </div>

            <div className="text-center">
              <p className="text-xs text-thunder">
                By signing in, you agree to our{" "}
                <a
                  href="#"
                  className="font-medium text-heliotrope hover:text-heliotrope/80"
                >
                  Terms of Service
                </a>{" "}
                and{" "}
                <Link
                  to="/privacy"
                  className="font-medium text-heliotrope hover:text-heliotrope/80"
                >
                  Privacy Policy
                </Link>
              </p>
            </div>
          </div>
        </div>

        <div className="mt-8">
          <div className="bg-heliotrope/10 border border-heliotrope/20 rounded-md p-4">
            <div className="flex">
              <div className="flex-shrink-0">
                <Mail className="h-5 w-5 text-heliotrope" />
              </div>
              <div className="ml-3">
                <h3 className="text-sm font-medium text-heliotrope">
                  What happens next?
                </h3>
                <div className="mt-2 text-sm text-heliotrope/80">
                  <p>
                    After signing in, Actioneer will analyze your emails to help
                    you:
                  </p>
                  <ul className="mt-2 list-disc list-inside space-y-1">
                    <li>Track expenses from receipts</li>
                    <li>Manage travel bookings</li>
                    <li>Monitor job applications</li>
                    <li>Take smart actions on your emails</li>
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
