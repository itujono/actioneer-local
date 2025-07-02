import { createRoute, useNavigate, Link } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useState, useEffect } from "react";
import { useQuery, useMutation } from "@tanstack/react-query";
import { supabase } from "../supabase/client";
import { toast } from "sonner";
import { cn } from "../utils/cn";
import { WaitlistForm, GridIllustrations } from "../components/auth";

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
  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/auth/oauth-signin`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${session.access_token}`,
      apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error("❌ Auth endpoint error:", errorText);
    throw new Error(`HTTP error! status: ${response.status}, details: ${errorText}`);
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
      scopes: "email profile https://www.googleapis.com/auth/gmail.readonly", // Add Gmail scope
      queryParams: {
        access_type: "offline", // Request refresh token
        prompt: "consent", // Force consent screen to ensure refresh token
      },
    },
  });

  if (error) throw error;
  return data;
};

function Auth() {
  const navigate = useNavigate();
  const [authListenerSetup, setAuthListenerSetup] = useState(false);
  const [showLogin, setShowLogin] = useState(false);

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
      if (result.created) {
        toast.success("Welcome to Actioneer! Your account has been created.");
      } else {
        toast.success("Welcome back!");
      }

      // Show Gmail setup status
      if (result.gmail_setup_required) {
        console.log("📧 Gmail setup will be handled on dashboard");
        // We'll handle Gmail setup on the dashboard with a dedicated flow
      }

      navigate({ to: "/dashboard" });
    },
    onError: (error) => {
      console.error("❌ Failed to create user record:", error);
      console.error("❌ Full error details:", JSON.stringify(error, null, 2));
      toast.error("Failed to set up your account. Please try signing in again.");
      // DON'T navigate to dashboard on error - stay on auth page for retry
    },
    retry: 2, // Retry failed requests up to 2 times
    retryDelay: 1000, // Wait 1 second between retries
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
      navigate({ to: "/dashboard" });
    }
  }, [session, checkingAuth, navigate]);

  // Set up auth state listener AND check current session
  useEffect(() => {
    if (authListenerSetup) return;

    // Check current session immediately in case user just authenticated
    const checkCurrentSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();
      if (session?.user) {
        console.log("🔐 Existing session found on page load:", session.user.email);
        // Use the mutation to create public user record
        createUserMutation.mutate(session);
      }
    };

    // Check for existing session
    checkCurrentSession();

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
  // if (checkingAuth) {
  //   return <Loading message="Checking authentication..." />;
  // }

  // Show error state if auth check failed
  if (authError) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-concrete">
        <div className="text-center">
          <div className="text-red-500 mb-4">
            <svg className="h-8 w-8 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.268 18.5c-.77.833-.23 2.5 1.732 2.5z"
              />
            </svg>
          </div>
          <p className="text-sm text-thunder">Error checking authentication. Please refresh the page.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-concrete">
      <div className="grid grid-cols-1 lg:grid-cols-2 min-h-screen">
        {/* Left Column - Login Form */}
        <div className="flex flex-col justify-center py-12 px-6 lg:px-8">
          <div className="mx-auto w-full max-w-md lg:order-1">
            {!showLogin ? (
              <WaitlistForm onSwitchToLogin={() => setShowLogin(true)} />
            ) : (
              <div>
                <div className="text-center">
                  <img src="/logo.png" alt="Actioneer Logo" className="h-12 w-12 mx-auto" />
                  <h2 className="mt-6 text-3xl font-extrabold text-thunder">Sign in to Actioneer</h2>
                  <p className="mt-2 text-sm text-thunder">Transform your emails into actionable insights</p>
                </div>

                <div className="mt-8">
                  <div className="space-y-6">
                    <div>
                      <button
                        type="button"
                        onClick={handleGoogleSignIn}
                        disabled={googleSignInMutation.isPending || createUserMutation.isPending}
                        className={cn(
                          "w-full flex justify-center items-center px-4 py-3",
                          "border border-concrete rounded-md shadow-sm bg-thunder",
                          "text-sm font-medium text-white",
                          "hover:bg-thunder/80",
                          "focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-heliotrope",
                          "disabled:opacity-50 disabled:cursor-not-allowed",
                          "transition-colors duration-200"
                        )}
                      >
                        {googleSignInMutation.isPending || createUserMutation.isPending ? (
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
                            {createUserMutation.isPending ? "Setting up account..." : "Signing in..."}
                          </span>
                        ) : (
                          <>
                            <svg
                              width="20px"
                              height="20px"
                              viewBox="-3 0 262 262"
                              xmlns="http://www.w3.org/2000/svg"
                              preserveAspectRatio="xMidYMid"
                              className="mr-3"
                            >
                              <path
                                d="M255.878 133.451c0-10.734-.871-18.567-2.756-26.69H130.55v48.448h71.947c-1.45 12.04-9.283 30.172-26.90 42.356l-.244 1.622 38.755 30.023 2.685.268c24.659-22.774 38.875-56.282 38.875-96.027"
                                fill="#4285F4"
                              />
                              <path
                                d="M130.55 261.1c35.248 0 64.839-11.605 86.453-31.622l-41.196-31.913c-11.024 7.688-25.82 13.055-45.257 13.055-34.523 0-63.824-22.773-74.269-54.25l-1.531.13-40.298 31.187-.527 1.465C35.393 231.798 79.49 261.1 130.55 261.1"
                                fill="#34A853"
                              />
                              <path
                                d="M56.281 156.37c-2.756-8.123-4.351-16.827-4.351-25.82 0-8.994 1.595-17.697 4.206-25.82l-.073-1.73L15.26 71.312l-1.335.635C5.077 89.644 0 109.517 0 130.55s5.077 40.905 13.925 58.602l42.356-32.782"
                                fill="#FBBC05"
                              />
                              <path
                                d="M130.55 50.479c24.514 0 41.05 10.589 50.479 19.438l36.844-35.974C195.245 12.91 165.798 0 130.55 0 79.49 0 35.393 29.301 13.925 71.947l42.211 32.783c10.59-31.477 39.891-54.251 74.414-54.251"
                                fill="#EB4335"
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
                          <span className="px-2 bg-concrete text-thunder">Secure authentication powered by Google</span>
                        </div>
                      </div>
                    </div>

                    <div className="text-center">
                      <p className="text-xs text-thunder">
                        By signing in, you agree to our{" "}
                        <Link to="/privacy" className="font-medium text-heliotrope hover:text-heliotrope/80">
                          Privacy Policy
                        </Link>
                      </p>
                    </div>

                    <div className="text-center">
                      <button
                        onClick={() => setShowLogin(false)}
                        className="text-sm text-thunder/60 hover:text-thunder font-medium"
                      >
                        ← Back to waitlist
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Colorful Grid Illustration - Mobile & Desktop */}
        <div className="flex items-start lg:items-center justify-center bg-concrete p-4 sm:p-6 lg:p-8">
          <GridIllustrations />
        </div>
      </div>
    </div>
  );
}
