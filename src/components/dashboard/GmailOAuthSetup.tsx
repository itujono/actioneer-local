import {
  CheckCircle,
  RefreshCw,
  AlertCircle,
  Mail,
  Zap,
  Check,
  Shield,
  Clock,
  X,
} from "lucide-react";
import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "../../supabase/client";
import { toast } from "sonner";
import { useAuth } from "../../hooks/useAuth";

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

export default function GmailOAuthSetup({
  className = "",
}: GmailOAuthSetupProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [isRefreshing, setIsRefreshing] = useState(false);

  // Check localStorage for banner dismissal state (per user)
  const getBannerDismissalKey = () => `gmail-banner-dismissed-${user?.id}`;

  const [isSuccessBannerDismissed, setIsSuccessBannerDismissed] = useState(
    () => {
      if (!user?.id) return false;
      return localStorage.getItem(getBannerDismissalKey()) === "true";
    }
  );

  // Update dismissal state when user changes
  useEffect(() => {
    if (!user?.id) {
      setIsSuccessBannerDismissed(false);
      return;
    }

    const isDismissed =
      localStorage.getItem(getBannerDismissalKey()) === "true";
    setIsSuccessBannerDismissed(isDismissed);
  }, [user?.id]);

  // Check Gmail setup status
  const {
    data: setupStatus,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["gmail-oauth-status", user?.id],
    queryFn: async (): Promise<GmailSetupStatus> => {
      if (!user) throw new Error("User not authenticated");

      // Check if user has OAuth tokens stored
      const { data: tokens, error: tokenError } = await supabase
        .from("user_auth_tokens")
        .select(
          "gmail_access_token, gmail_refresh_token, token_expires_at, updated_at"
        )
        .eq("user_id", user.id)
        .single();

      if (tokenError && tokenError.code !== "PGRST116") {
        // PGRST116 is "not found" - that's ok, means no tokens yet
        throw tokenError;
      }

      const hasTokens = !!tokens?.gmail_access_token;
      const hasRefreshToken = !!tokens?.gmail_refresh_token;
      const isTokenValid =
        hasTokens && tokens.token_expires_at
          ? new Date(tokens.token_expires_at) > new Date()
          : false;

      // If we have tokens but they're expired, and we have a refresh token, try to refresh automatically
      if (
        hasTokens &&
        !isTokenValid &&
        hasRefreshToken &&
        !tokens.gmail_refresh_token?.startsWith("apps_script_managed_")
      ) {
        console.log("🔄 Token expired, attempting automatic refresh...");

        try {
          const response = await fetch(
            `${
              import.meta.env.VITE_SUPABASE_URL
            }/functions/v1/refresh-oauth-token`,
            {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${
                  import.meta.env.VITE_SUPABASE_ANON_KEY
                }`,
              },
              body: JSON.stringify({
                userEmail: user.email,
              }),
            }
          );

          if (response.ok) {
            const refreshResult = await response.json();
            if (refreshResult.success) {
              console.log("✅ Token refreshed automatically");
              return {
                isSetup: true,
                hasTokens: true,
                watchActive: false,
                lastSetupAt: new Date().toISOString(),
              };
            }
          } else {
            const errorData = await response.json();
            console.log("⚠️ Refresh failed, will require re-auth:", errorData);

            // If refresh fails, clear the invalid tokens to force clean re-auth
            if (errorData.requiresReauth) {
              console.log("🧹 Clearing invalid tokens to force clean setup");
              await supabase
                .from("user_auth_tokens")
                .delete()
                .eq("user_id", user.id);
            }
          }
        } catch (error) {
          console.log("⚠️ Automatic token refresh failed:", error);
        }
      }

      return {
        isSetup: hasTokens && isTokenValid,
        hasTokens,
        watchActive: false, // We'll enhance this later to check actual watch status
        lastSetupAt: tokens?.updated_at,
      };
    },
    enabled: !!user,
    refetchInterval: false,
  });

  // Mutation to setup Gmail watch
  const setupGmailMutation = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("User not authenticated");

      // Step 1: Get fresh OAuth tokens via Supabase Auth
      const { data: session, error: sessionError } =
        await supabase.auth.getSession();

      if (sessionError || !session.session) {
        throw new Error("Please sign in again to set up Gmail access");
      }

      // Check if we have provider tokens from the current session
      const hasProviderTokens =
        session.session.provider_token &&
        session.session.provider_refresh_token;

      if (!hasProviderTokens) {
        // Clear any existing invalid tokens first
        console.log("🧹 Clearing existing tokens before re-auth");
        await supabase.from("user_auth_tokens").delete().eq("user_id", user.id);

        // If no provider tokens, we need to redirect to re-authorize with Gmail scope
        const redirectUrl = `${window.location.origin}/dashboard`;

        const { error } = await supabase.auth.signInWithOAuth({
          provider: "google",
          options: {
            scopes:
              "email profile https://www.googleapis.com/auth/gmail.readonly",
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
      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/setup-gmail-watch`,
        {
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
        }
      );

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
      toast.success(
        "Gmail access configured! Your emails will now be processed automatically."
      );

      // Refresh the status
      queryClient.invalidateQueries({ queryKey: ["gmail-oauth-status"] });
    },
    onError: (error) => {
      console.error("❌ Gmail setup failed:", error);

      if (error.message.includes("sign in again")) {
        toast.error(
          "Please sign out and sign in again to grant Gmail permissions."
        );
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

  const handleSetupGmail = () => {
    setupGmailMutation.mutate();
  };

  // If Gmail is already setup, show success state (unless dismissed)
  if (setupStatus?.isSetup && !isSuccessBannerDismissed) {
    return (
      <div
        className={`bg-jade border-2 border-jade rounded-lg p-4 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <CheckCircle className="w-6 h-6 text-lime" />
          <div className="flex-1">
            <h3 className="font-semibold text-lime">
              Gmail access configured!
            </h3>
            <p className="text-sm text-white">
              Your emails are being processed automatically
              {setupStatus.lastSetupAt && (
                <span className="ml-2">
                  • Last updated{" "}
                  {new Date(setupStatus.lastSetupAt).toLocaleDateString()}
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
  if (setupStatus?.isSetup && isSuccessBannerDismissed) {
    return null;
  }

  // Loading state
  if (isLoading) {
    return (
      <div
        className={`bg-gray-50 border-2 border-gray-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-center space-x-3">
          <RefreshCw className="w-5 h-5 animate-spin text-gray-500" />
          <span className="text-gray-600">Checking Gmail setup status...</span>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div
        className={`bg-red-50 border-2 border-red-200 rounded-lg p-6 ${className}`}
      >
        <div className="flex items-start space-x-4">
          <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-red-800 mb-2">
              Unable to Check Gmail Status
            </h3>
            <p className="text-red-700 mb-3">
              We couldn't verify your Gmail setup. Please try refreshing.
            </p>
            <button
              onClick={handleRefreshStatus}
              disabled={isRefreshing}
              className="flex items-center space-x-2 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
            >
              <RefreshCw
                className={`w-4 h-4 ${isRefreshing ? "animate-spin" : ""}`}
              />
              <span>Retry</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

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

  const handleForceReauthOriginal = async () => {
    try {
      // Sign out first
      await supabase.auth.signOut();

      // Clear any cached queries
      queryClient.clear();

      // Redirect to auth page
      window.location.href = "/auth";
    } catch (error) {
      console.error("Error during forced re-auth:", error);
      toast.error("Failed to sign out. Please try manually.");
    }
  };

  // Main setup flow
  return (
    <div
      className={`bg-gradient-to-r from-heliotrope/10 to-purple-50 border-2 border-heliotrope/30 rounded-lg p-6 ${className}`}
    >
      <div className="mb-6">
        <h3 className="text-xl font-semibold text-gray-800 mb-2">
          Gmail Access Setup
        </h3>
        <p className="text-gray-600">
          Enable automatic email processing with one simple step
        </p>
      </div>

      <div className="space-y-6">
        {/* Step 1: Grant Gmail Access */}
        <div className="flex items-start space-x-4">
          <div className="flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center bg-heliotrope text-white">
              <Mail className="w-4 h-4" />
            </div>
          </div>
          <div className="flex-1">
            <h4 className="font-semibold text-gray-800 mb-2">
              Enable Gmail Processing
            </h4>
            <p className="text-sm text-gray-600 mb-4">
              We'll securely connect to your Gmail account to automatically
              process receipts, travel bookings, and job applications as they
              arrive.
            </p>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
              <div className="flex items-start space-x-3">
                <Shield className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                <div className="text-sm text-blue-800">
                  <p className="font-medium mb-1">Privacy & Security</p>
                  <ul className="text-xs space-y-1">
                    <li>
                      • We only read emails relevant to supported categories
                    </li>
                    <li>
                      • No personal conversations or sensitive emails are
                      accessed
                    </li>
                    <li>• Your data is encrypted and stored securely</li>
                  </ul>
                </div>
              </div>
            </div>

            <button
              onClick={handleSetupGmail}
              disabled={setupGmailMutation.isPending}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-heliotrope hover:bg-heliotrope/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-heliotrope disabled:opacity-50 disabled:cursor-not-allowed"
            >
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
            </button>

            {setupGmailMutation.isError && (
              <div className="mt-3 p-4 bg-red-50 border border-red-200 rounded-lg">
                <div className="text-sm text-red-600 mb-3">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  {setupGmailMutation.error?.message ||
                    "Setup failed. Please try again."}
                </div>

                <div className="text-xs text-red-500 mb-3">
                  If you keep seeing this setup screen, your Gmail permissions
                  may need to be refreshed:
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
            {setupStatus?.hasTokens && !setupStatus?.isSetup && (
              <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800 mb-2">
                  <AlertCircle className="w-4 h-4 inline mr-1" />
                  Your Gmail tokens keep expiring. This usually means they need
                  to be refreshed.
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
        </div>
      </div>

      {/* Info section */}
      <div className="mt-6 pt-6 border-t border-gray-200">
        <div className="flex items-start space-x-3">
          <Clock className="w-5 h-5 text-gray-400 flex-shrink-0 mt-0.5" />
          <div className="text-sm text-gray-600">
            <p className="font-medium mb-1">What happens next?</p>
            <p>
              Once enabled, we'll start processing your incoming emails
              automatically. You'll see receipts, travel bookings, and job
              applications appear in your dashboard within seconds of receiving
              them.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
