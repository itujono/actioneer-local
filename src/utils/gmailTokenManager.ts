import { supabase } from "../supabase/client";
import type { QueryClient } from "@tanstack/react-query";

export interface TokenStatus {
  isValid: boolean;
  hasTokens: boolean;
  expiresAt?: string;
  minutesUntilExpiry?: number;
  needsRefresh: boolean;
  needsReauth: boolean;
}

export interface RefreshResult {
  success: boolean;
  error?: string;
  requiresReauth?: boolean;
}

/**
 * Centralized Gmail token management utility
 * Provides consistent token validation and refresh logic across all components
 */
export class GmailTokenManager {
  private static readonly TOKEN_BUFFER_MINUTES = 10;
  private static readonly MAX_EXPIRED_MINUTES = 60;
  private static readonly REFRESH_TIMEOUT = 20000;

  /**
   * Check the current status of Gmail tokens for a user
   */
  static async checkTokenStatus(userId: string): Promise<TokenStatus> {
    console.log("🔍 GmailTokenManager.checkTokenStatus called for userId:", userId);

    const { data: tokens, error } = await supabase
      .from("user_auth_tokens")
      .select("gmail_access_token, gmail_refresh_token, token_expires_at")
      .eq("user_id", userId)
      .single();

    console.log("📊 Token query result:", {
      tokens: tokens
        ? {
            hasAccessToken: !!tokens.gmail_access_token,
            hasRefreshToken: !!tokens.gmail_refresh_token,
            expiresAt: tokens.token_expires_at,
          }
        : null,
      error: error,
    });

    if (error && error.code !== "PGRST116") {
      console.error("❌ Database error in checkTokenStatus:", error);
      throw error;
    }

    const hasTokens = !!tokens?.gmail_access_token;
    const hasRefreshToken = !!tokens?.gmail_refresh_token;
    const expiresAt = tokens?.token_expires_at;

    console.log("🔍 Token analysis:", {
      hasTokens,
      hasRefreshToken,
      expiresAt,
    });

    if (!hasTokens) {
      console.log("❌ No access tokens found - needs reauth");
      return {
        isValid: false,
        hasTokens: false,
        needsRefresh: false,
        needsReauth: true,
      };
    }

    if (!expiresAt) {
      console.log("⚠️ No expiry date found - needs reauth");
      return {
        isValid: false,
        hasTokens: true,
        needsRefresh: false,
        needsReauth: true,
      };
    }

    const now = new Date();
    const expiry = new Date(expiresAt);
    const bufferTime = this.TOKEN_BUFFER_MINUTES * 60 * 1000;
    const isValid = expiry.getTime() > now.getTime() + bufferTime;

    const minutesUntilExpiry = Math.floor((expiry.getTime() - now.getTime()) / (1000 * 60));

    const expiredMinutesAgo = minutesUntilExpiry < 0 ? Math.abs(minutesUntilExpiry) : 0;
    const isLegacyToken = tokens.gmail_refresh_token?.startsWith("apps_script_managed_");

    console.log("⏰ Token validation:", {
      now: now.toISOString(),
      expiry: expiry.toISOString(),
      isValid,
      minutesUntilExpiry,
      expiredMinutesAgo,
      isLegacyToken,
    });

    const result = {
      isValid,
      hasTokens,
      expiresAt,
      minutesUntilExpiry,
      needsRefresh: !isValid && hasRefreshToken && !isLegacyToken && expiredMinutesAgo <= this.MAX_EXPIRED_MINUTES,
      needsReauth: !hasRefreshToken || isLegacyToken || expiredMinutesAgo > this.MAX_EXPIRED_MINUTES,
    };

    console.log("✅ Final token status result:", result);
    return result;
  }

  /**
   * Attempt to refresh Gmail tokens for a user
   */
  static async refreshTokens(userEmail: string): Promise<RefreshResult> {
    try {
      console.log(`🔄 Refreshing Gmail tokens for ${userEmail}`);

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/refresh-oauth-token`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
        },
        body: JSON.stringify({
          userEmail,
          forceRefresh: true,
        }),
        signal: AbortSignal.timeout(this.REFRESH_TIMEOUT),
      });

      console.log("📡 Refresh response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
        console.error("❌ Token refresh request failed:", response.status, errorData);

        const requiresReauth = response.status === 401 || response.status === 404 || errorData.requiresReauth;

        return {
          success: false,
          error: `Refresh request failed: ${errorData.error || "Unknown error"}`,
          requiresReauth,
        };
      }

      const result = await response.json();
      console.log("📊 Refresh result:", {
        success: result.success,
        hasAccessToken: !!result.accessToken,
        hasError: !!result.error,
        requiresReauth: result.requiresReauth,
      });

      if (result.success) {
        console.log("✅ Gmail tokens refreshed successfully");
        return { success: true };
      } else {
        console.error("❌ Token refresh failed:", result.error);
        return {
          success: false,
          error: result.error,
          requiresReauth: result.requiresReauth,
        };
      }
    } catch (error) {
      console.error("💥 Error during token refresh:", error);

      const requiresReauth = !(
        error instanceof Error &&
        (error.name === "AbortError" || error.message.includes("fetch"))
      );

      return {
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
        requiresReauth,
      };
    }
  }

  /**
   * Clear invalid tokens from the database
   */
  static async clearTokens(userId: string): Promise<void> {
    try {
      const { error } = await supabase.from("user_auth_tokens").delete().eq("user_id", userId);

      if (error) {
        console.error("❌ Failed to clear tokens:", error);
        throw error;
      }

      console.log("✅ Cleared Gmail tokens for user");
    } catch (error) {
      console.error("❌ Failed to clear tokens:", error);
      throw error;
    }
  }

  /**
   * Invalidate all related queries after token changes
   */
  static invalidateQueries(queryClient: QueryClient): void {
    queryClient.invalidateQueries({ queryKey: ["gmail-oauth-status"] });
    queryClient.invalidateQueries({ queryKey: ["recent-emails"] });
    queryClient.invalidateQueries({ queryKey: ["receipts-summary"] });
    queryClient.invalidateQueries({ queryKey: ["travel-summary"] });
    queryClient.invalidateQueries({ queryKey: ["jobs-summary"] });
  }

  /**
   * Get a comprehensive Gmail setup status for a user
   */
  static async getSetupStatus(userId: string, userEmail: string, queryClient: QueryClient) {
    console.log("🚀 GmailTokenManager.getSetupStatus started for:", {
      userId,
      userEmail,
    });

    try {
      const tokenStatus = await this.checkTokenStatus(userId);
      console.log("🔍 Token status from checkTokenStatus:", tokenStatus);

      if (tokenStatus.isValid) {
        console.log("✅ Tokens are valid - returning setup complete");
        return {
          isSetup: true,
          hasTokens: true,
          watchActive: false,
          lastSetupAt: new Date().toISOString(),
        };
      }

      if (tokenStatus.needsRefresh) {
        console.log("🔄 Tokens need refresh - attempting automatic refresh...");

        const refreshResult = await this.refreshTokens(userEmail);
        console.log("🔄 Refresh result:", refreshResult);

        if (refreshResult.success) {
          console.log("✅ Refresh successful - waiting for DB propagation...");
          await new Promise((resolve) => setTimeout(resolve, 1000));

          const updatedStatus = await this.checkTokenStatus(userId);
          console.log("🔍 Updated status after refresh:", updatedStatus);

          if (updatedStatus.isValid) {
            console.log("✅ Token refresh successful and verified");
            this.invalidateQueries(queryClient);

            return {
              isSetup: true,
              hasTokens: true,
              watchActive: false,
              lastSetupAt: new Date().toISOString(),
            };
          } else {
            console.log("⚠️ Token refresh verification failed");
            if (updatedStatus.needsRefresh) {
              console.log("🔄 Attempting secondary refresh...");
              const secondRefresh = await this.refreshTokens(userEmail);

              if (secondRefresh.success) {
                await new Promise((resolve) => setTimeout(resolve, 500));
                const finalStatus = await this.checkTokenStatus(userId);

                if (finalStatus.isValid) {
                  console.log("✅ Secondary refresh successful");
                  this.invalidateQueries(queryClient);
                  return {
                    isSetup: true,
                    hasTokens: true,
                    watchActive: false,
                    lastSetupAt: new Date().toISOString(),
                  };
                }
              }
            }

            if (updatedStatus.needsReauth || refreshResult.requiresReauth) {
              console.log("🧹 Clearing tokens after failed refresh verification");
              await this.clearTokens(userId);
              this.invalidateQueries(queryClient);
            }
          }
        } else if (refreshResult.requiresReauth) {
          console.log("⚠️ Token refresh failed requiring re-auth - clearing tokens");
          await this.clearTokens(userId);
          this.invalidateQueries(queryClient);
        } else {
          console.log("⚠️ Token refresh failed but may be temporary - not clearing tokens");
        }
      } else if (tokenStatus.needsReauth) {
        console.log("🧹 Tokens need re-authorization - clearing old tokens");
        await this.clearTokens(userId);
        this.invalidateQueries(queryClient);
      }

      const finalResult = {
        isSetup: false,
        hasTokens: tokenStatus.hasTokens,
        watchActive: false,
        lastSetupAt: undefined,
        error: tokenStatus.needsReauth ? "Please re-authorize Gmail access" : "Token refresh failed",
      };

      console.log("❌ Setup not complete - final result:", finalResult);
      return finalResult;
    } catch (error) {
      console.error("💥 Error getting Gmail setup status:", error);
      throw error;
    }
  }
}
