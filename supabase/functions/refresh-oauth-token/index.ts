import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

interface RefreshTokenRequest {
  userEmail: string;
  forceRefresh?: boolean; // Add option to force refresh even if token seems valid
}

interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  expiresAt?: string;
  error?: string;
  requiresReauth?: boolean;
  debugInfo?: any;
}

Deno.serve(async (req: Request) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userEmail, forceRefresh = false }: RefreshTokenRequest = await req.json();

    if (!userEmail) {
      return new Response(JSON.stringify({ success: false, error: "Missing userEmail" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🔄 Refreshing OAuth token for user: ${userEmail} (force: ${forceRefresh})`);

    // Get user and current tokens
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail.toLowerCase())
      .single();

    if (userError || !user) {
      console.error("❌ User not found:", userError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "User not found",
          requiresReauth: true,
          debugInfo: { userError, searchedEmail: userEmail.toLowerCase() },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get current token data with detailed logging
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_auth_tokens")
      .select("gmail_refresh_token, gmail_access_token, token_expires_at, updated_at")
      .eq("user_id", user.id)
      .single();

    console.log("🔍 Token data query result:", {
      hasData: !!tokenData,
      error: tokenError,
      hasAccessToken: !!tokenData?.gmail_access_token,
      hasRefreshToken: !!tokenData?.gmail_refresh_token,
      expiresAt: tokenData?.token_expires_at,
      updatedAt: tokenData?.updated_at,
    });

    if (tokenError || !tokenData) {
      console.error("❌ No token data found:", tokenError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "No token data found",
          requiresReauth: true,
          debugInfo: { tokenError },
        }),
        {
          status: 404,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if this is a legacy Apps Script managed token
    if (tokenData.gmail_refresh_token?.startsWith("apps_script_managed_")) {
      console.log("📱 Legacy Apps Script token detected - requiring re-authentication");

      return new Response(
        JSON.stringify({
          success: false,
          error: "Legacy token requires re-authentication",
          requiresReauth: true,
          reason: "legacy_token",
          instructions: "Please sign in again to refresh your OAuth connection",
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if we have a refresh token
    if (!tokenData.gmail_refresh_token) {
      console.error("❌ No refresh token available");
      return new Response(
        JSON.stringify({
          success: false,
          error: "No refresh token available",
          requiresReauth: true,
          debugInfo: { hasAccessToken: !!tokenData.gmail_access_token },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if current token is still valid (unless force refresh)
    const now = new Date();
    const expiresAt = new Date(tokenData.token_expires_at);
    const minutesUntilExpiry = Math.floor((expiresAt.getTime() - now.getTime()) / (1000 * 60));

    console.log(`⏰ Token status: expires at ${expiresAt.toISOString()}, ${minutesUntilExpiry} minutes until expiry`);

    if (!forceRefresh && minutesUntilExpiry > 10) {
      console.log("✅ Token is still valid with sufficient buffer, no refresh needed");
      return new Response(
        JSON.stringify({
          success: true,
          accessToken: tokenData.gmail_access_token,
          expiresAt: tokenData.token_expires_at,
          message: "Token is still valid",
          debugInfo: { minutesUntilExpiry },
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate environment variables
    const clientId = Deno.env.get("GOOGLE_CLIENT_ID");
    const clientSecret = Deno.env.get("GOOGLE_CLIENT_SECRET");

    if (!clientId || !clientSecret) {
      console.error("❌ Missing Google OAuth credentials");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Server configuration error",
          requiresReauth: true,
          debugInfo: {
            hasClientId: !!clientId,
            hasClientSecret: !!clientSecret,
          },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🌐 Making refresh request to Google OAuth API...");

    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: tokenData.gmail_refresh_token,
        grant_type: "refresh_token",
      }),
      signal: AbortSignal.timeout(10000),
    });

    console.log(`📡 Google OAuth response status: ${refreshResponse.status}`);

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error("❌ Token refresh failed:", errorText);

      let errorDetails;
      try {
        errorDetails = JSON.parse(errorText);
      } catch {
        errorDetails = { raw: errorText };
      }

      let shouldRequireReauth = true;
      let errorMessage = "Token refresh failed";

      if (errorDetails.error === "invalid_grant") {
        errorMessage = "Refresh token is invalid or expired";
        shouldRequireReauth = true;
      } else if (errorDetails.error === "invalid_client") {
        errorMessage = "OAuth client configuration error";
        shouldRequireReauth = true;
      } else if (refreshResponse.status >= 500) {
        errorMessage = "Google OAuth service temporarily unavailable";
        shouldRequireReauth = false;
      }

      return new Response(
        JSON.stringify({
          success: false,
          error: errorMessage,
          requiresReauth: shouldRequireReauth,
          debugInfo: {
            status: refreshResponse.status,
            errorDetails,
            refreshTokenLength: tokenData.gmail_refresh_token?.length,
            googleError: errorDetails.error,
          },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 3600;

    console.log("🔑 Refresh response:", {
      hasAccessToken: !!newAccessToken,
      expiresIn,
      hasRefreshToken: !!refreshData.refresh_token,
    });

    if (!newAccessToken) {
      console.error("❌ No access token in refresh response");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid refresh response - no access token",
          requiresReauth: true,
          debugInfo: { refreshData },
        }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const newExpiresAt = new Date(Date.now() + (expiresIn - 120) * 1000).toISOString();

    console.log("💾 Updating token in database...");

    let updateAttempts = 0;
    let updateSuccess = false;
    let updateError;

    while (updateAttempts < 3 && !updateSuccess) {
      updateAttempts++;

      try {
        const { error } = await supabase
          .from("user_auth_tokens")
          .update({
            gmail_access_token: newAccessToken,
            ...(refreshData.refresh_token && {
              gmail_refresh_token: refreshData.refresh_token,
            }),
            token_expires_at: newExpiresAt,
            updated_at: new Date().toISOString(),
          })
          .eq("user_id", user.id)
          .select();

        if (!error) {
          updateSuccess = true;
          console.log(`✅ Token updated successfully on attempt ${updateAttempts}`);
        } else {
          updateError = error;
          console.error(`❌ Update attempt ${updateAttempts} failed:`, error);

          if (updateAttempts < 3) {
            console.log("⏳ Retrying in 200ms...");
            await new Promise((resolve) => setTimeout(resolve, 200));
          }
        }
      } catch (dbError) {
        updateError = dbError;
        console.error(`❌ Database exception on attempt ${updateAttempts}:`, dbError);

        if (updateAttempts < 3) {
          await new Promise((resolve) => setTimeout(resolve, 200));
        }
      }
    }

    if (!updateSuccess) {
      console.error("❌ Failed to update token after 3 attempts:", updateError);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Failed to update token in database",
          requiresReauth: false,
          debugInfo: { updateError, attempts: updateAttempts },
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ OAuth token refreshed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
        message: "Token refreshed successfully",
        debugInfo: {
          previousExpiry: tokenData.token_expires_at,
          newExpiry: newExpiresAt,
          expiresInSeconds: expiresIn,
          bufferMinutes: 2,
        },
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Error in refresh-oauth-token:", error);

    let requiresReauth = false;
    let errorMessage = "Internal server error";

    if (error.name === "AbortError") {
      errorMessage = "Request timeout";
      requiresReauth = false;
    } else if (error.message?.includes("fetch")) {
      errorMessage = "Network error";
      requiresReauth = false;
    } else {
      requiresReauth = true;
    }

    return new Response(
      JSON.stringify({
        success: false,
        error: errorMessage,
        requiresReauth,
        debugInfo: {
          errorMessage: error.message,
          errorName: error.name,
          errorStack: error.stack,
        },
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
