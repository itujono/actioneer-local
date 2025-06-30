import { CheckCircle, RefreshCw, AlertCircle, Mail, Zap, Shield, Clock, X } from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";
import Fling from "../illustrations/Fling";
import { Button } from "../ui";
import { GmailTokenManager } from "../../utils/gmailTokenManager";

interface GmailOAuthSetupProps {
  className?: string;
}

interface GmailSetupStatus {
  isSetup: boolean;
  hasTokens: boolean;
  watchActive: boolean;
  lastSetupAt?: string;
  error?: string;
}

export default function GmailOAuthSetup({ className = "" }: GmailOAuthSetupProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check localStorage for banner dismissal state (per user)
  const getBannerDismissalKey = () => `gmail-banner-dismissed-${user?.id}`;

  const [isSuccessBannerDismissed, setIsSuccessBannerDismissed] = useState(() => {
    if (!user?.id) return false;
    return localStorage.getItem(getBannerDismissalKey()) === "true";
  });

  // Update dismissal state when user changes
  useEffect(() => {
    if (!user?.id) {
      setIsSuccessBannerDismissed(false);
      return;
    }

    const isDismissed = localStorage.getItem(getBannerDismissalKey()) === "true";
    setIsSuccessBannerDismissed(isDismissed);
  }, [user?.id]);

  // Centralized Gmail OAuth setup status check using GmailTokenManager
  const {
    data: gmailOAuthStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["gmail-oauth-status", user?.id],
    queryFn: async (): Promise<GmailSetupStatus> => {
      console.log("🚀 Gmail OAuth status query starting...", {
        userId: user?.id,
        userEmail: user?.email,
      });

      if (!user) {
        console.log("❌ No user found, throwing error");
        throw new Error("User not authenticated");
      }

      // Use centralized token manager for consistent logic
      return await GmailTokenManager.getSetupStatus(user.id, user.email!, queryClient);
    },
    enabled: !!user,
    refetchInterval: false, // Disable automatic refetching to prevent conflicts
    retry: false, // Don't retry on failure to avoid loops
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    gcTime: 5 * 60 * 1000, // Keep in cache for 5 minutes
  });

  // Mutation to setup Gmail watch
  const setupGmailMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      // Step 1: Get fresh OAuth tokens via Supabase Auth
      const { data: session, error: sessionError } = await supabase.auth.getSession();

      if (sessionError || !session.session) {
        throw new Error("Please sign in again to set up Gmail access");
      }

      // Check if we have provider tokens from the current session
      const hasProviderTokens = session.session.provider_token && session.session.provider_refresh_token;

      if (!hasProviderTokens) {
        // Clear any existing invalid tokens first
        console.log("🧹 Clearing existing tokens before re-auth");
        await supabase.from("user_auth_tokens").delete().eq("user_id", user.id);

        // If no provider tokens, we need to redirect to re-authorize with Gmail scope
        const redirectUrl = `${window.location.origin}/dashboard`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            scopes: "email profile https://www.googleapis.com/auth/gmail.readonly",
            redirectTo: redirectUrl,
            queryParams: {
              access_type: "offline",
              prompt: "consent",
            },
          },
        });

        if (error) {
          throw new Error(`OAuth redirect failed: ${error.message}`);
        }
        // This will redirect, so we don't continue
        return { redirecting: true };
      }

      // Step 2: Call our setup function with the OAuth tokens
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-gmail-watch`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.session.access_token}`,
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          userEmail: user.email,
          accessToken: session.session.provider_token, // This is the Google OAuth token
          refreshToken: session.session.provider_refresh_token,
          expiresAt: new Date(Date.now() + 3600 * 1000).toISOString(), // 1 hour
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        console.error("❌ Setup Gmail Watch failed:", errorData);
        throw new Error(errorData.error || "Failed to setup Gmail watch");
      }

      const result = await response.json();
      console.log("✅ Setup Gmail Watch result:", result);
      return result;
    },
    onSuccess: (result) => {
      // Handle redirect case
      if (result?.redirecting) {
        console.log("🔄 Redirecting for OAuth authorization...");
        return;
      }

      console.log("✅ Gmail setup successful:", result);
      toast.success("Gmail access configured! Your emails will now be processed automatically.");

      // Refresh the status
      queryClient.invalidateQueries({ queryKey: ["gmail-oauth-status"] });
    },
    onError: (error) => {
      console.error("❌ Gmail setup failed:", error);

      if (error.message.includes("sign in again")) {
        toast.error("Please sign out and sign in again to grant Gmail permissions.");
      } else {
        toast.error(`Gmail setup failed: ${error.message}`);
      }
    },
  });

  const handleRefreshStatus = async () => {
    setIsRefreshing(true);
    await queryClient.invalidateQueries({ queryKey: ["gmail-oauth-status"] });
    setTimeout(() => setIsRefreshing(false), 1000);
  };

  // Force re-authentication helper
  const handleForceReauth = async () => {
    console.log("🔄 Forcing complete re-authorization");

    // Clear existing tokens
    if (user?.id) {
      await supabase.from("user_auth_tokens").delete().eq("user_id", user.id);
    }

    // Force OAuth re-authorization
    const redirectUrl = `${window.location.origin}/dashboard`;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        scopes: "email profile https://www.googleapis.com/auth/gmail.readonly",
        redirectTo: redirectUrl,
        queryParams: {
          access_type: "offline",
          prompt: "consent",
        },
      },
    });

    if (error) {
      console.error("❌ Force re-auth failed:", error);
      toast.error(`Re-authorization failed: ${error.message}`);
    }
  };

  const handleSetupGmail = () => {
    setupGmailMutation.mutate();
  };

  // If Gmail is already setup, show success state (unless dismissed)
  if (gmailOAuthStatus?.isSetup && !isSuccessBannerDismissed) {
    return (
      <div className={`bg-jade border-2 border-jade rounded-lg p-4 ${className}`}>
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-lime" />
          <div className="flex-1">
            <h3 className="font-semibold text-lime">Gmail access configured!</h3>
            <p className="text-sm text-white">
              Your emails are being processed automatically
              {gmailOAuthStatus.lastSetupAt && (
                <span className="ml-2">
                  • Last updated {new Date(gmailOAuthStatus.lastSetupAt).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
          <button
            onClick={() => {
              setIsSuccessBannerDismissed(true);
              if (user?.id) {
                localStorage.setItem(getBannerDismissalKey(), "true");
              }
            }}
            className="text-lime hover:text-white transition-colors"
            aria-label="Dismiss notification"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
      </div>
    );
  }

  // If Gmail is setup but banner is dismissed, don't show anything
  if (gmailOAuthStatus?.isSetup && isSuccessBannerDismissed) {
    return null;
  }

  // Loading state
  if (isLoading || isRefreshing) {
    return (
      <div className={`bg-gray-50 border-2 border-gray-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
          <span className="text-gray-600">Checking Gmail setup status...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error || gmailOAuthStatus?.error) {
    return (
      <div className={`bg-red-50 border-2 border-red-200 rounded-lg p-6 ${className}`}>
        <div className="flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">Unable to Check Gmail Status</h3>
            <p className="text-red-700 mb-3">We couldn't verify your Gmail setup. Please try refreshing.</p>
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`} />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Main setup flow
  return (
    <div className={`bg-daisy border-2 border-daisy rounded-xl p-6 relative overflow-hidden ${className}`}>
      <div className="absolute -bottom-40 -right-64 z-0">
        <Fling className="w-[32rem] h-[32rem] text-lavender stroke-[70px]" />
      </div>
      <div className="mb-6">
        <div className="flex items-center space-x-3 mb-3">
          <div className="w-10 h-10 rounded-full bg-heliotrope/20 flex items-center justify-center">
            <Mail className="w-5 h-5 text-lavender" />
          </div>
          <h3 className="text-xl font-bold text-white">Gmail Access Setup</h3>
        </div>
        <p className="text-white/90 text-sm">Enable automatic email processing with one simple step</p>
      </div>

      <div className="space-y-6 relative z-10">
        {/* Main content card */}
        <div>
          <div className="flex items-start space-x-4">
            {/* <div className="flex-shrink-0">
              <div className="w-8 h-8 rounded-full flex items-center justify-center bg-heliotrope text-white">
                <Zap className="w-4 h-4" />
              </div>
            </div> */}
            <div className="flex-1 max-w-2xl">
              {/* <h4 className="font-bold text-white mb-2 text-lg">
                Enable Gmail Processing
              </h4> */}
              <p className="text-sm text-concrete mb-4">
                We'll securely connect to your Gmail account to automatically process receipts, travel promotional
                emails, and job applications as they arrive.
              </p>

              {/* Privacy info with new styling */}
              <div className="bg-heliotrope/10 border border-heliotrope/20 rounded-lg p-4 mb-4">
                <div className="flex items-start space-x-3">
                  <Shield className="w-5 h-5 text-lavender flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-concrete">
                    <p className="font-semibold mb-2 text-lavender">Privacy & Security</p>
                    <ul className="text-xs space-y-1 text-concrete">
                      <li>• We only read emails relevant to supported categories</li>
                      <li>• No personal conversations or sensitive emails are accessed</li>
                      <li>• Your data is encrypted and stored securely</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Enhanced button */}
              <Button onClick={handleSetupGmail} disabled={setupGmailMutation.isPending}>
                {setupGmailMutation.isPending ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin mr-2" />
                    Setting up Gmail access...
                  </>
                ) : (
                  <>
                    <Zap className="w-4 h-4 mr-2" />
                    Enable Gmail Processing
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>

        {setupGmailMutation.isError && (
          <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
            <div className="text-sm text-red-600 mb-3">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              {setupGmailMutation.error?.message || "Setup failed. Please try again."}
            </div>

            <div className="text-xs text-red-500 mb-3">
              If you keep seeing this setup screen, your Gmail permissions may need to be refreshed:
            </div>

            <button
              onClick={handleForceReauth}
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-red-700 bg-red-100 border border-red-300 rounded-md hover:bg-red-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Force Fresh Authorization
            </button>
          </div>
        )}

        {/* Show additional help if tokens keep expiring */}
        {gmailOAuthStatus?.hasTokens && !gmailOAuthStatus?.isSetup && (
          <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
            <div className="text-sm text-yellow-800 mb-2">
              <AlertCircle className="w-4 h-4 inline mr-1" />
              Your Gmail tokens keep expiring. This usually means they need to be refreshed.
            </div>
            <button
              onClick={handleForceReauth}
              className="inline-flex items-center px-3 py-2 text-xs font-medium text-yellow-700 bg-yellow-100 border border-yellow-300 rounded-md hover:bg-yellow-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Get Fresh Permissions
            </button>
          </div>
        )}
      </div>

      {/* Info section - now with updated styling */}
      <div className="mt-6 pt-6 border-t border-white/20 relative z-10 max-w-2xl">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-white/70 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-white/90">
            <p className="font-semibold mb-1 text-white">What happens next?</p>
            <p>
              Once enabled, we'll start processing your incoming emails automatically. You'll see receipts, travel
              promotional emails, and job applications appear in your dashboard within seconds of receiving them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
