import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface RefreshTokenRequest {
  userEmail: string;
}

interface RefreshTokenResponse {
  success: boolean;
  accessToken?: string;
  expiresAt?: string;
  error?: string;
}

Deno.serve(async (req: Request) => {
  // Only allow POST requests
  if (req.method !== "POST") {
    return new Response("Method not allowed", { status: 405 });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    const { userEmail }: RefreshTokenRequest = await req.json();

    if (!userEmail) {
      return new Response(
        JSON.stringify({ success: false, error: "Missing userEmail" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔄 Refreshing OAuth token for user: ${userEmail}`);

    // Get user and current tokens
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail.toLowerCase())
      .single();

    if (userError || !user) {
      console.error("❌ User not found:", userError);
      return new Response(
        JSON.stringify({ success: false, error: "User not found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Get current token data
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_auth_tokens")
      .select("gmail_refresh_token, gmail_access_token")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      console.error("❌ No token data found:", tokenError);
      return new Response(
        JSON.stringify({ success: false, error: "No token data found" }),
        { status: 404, headers: { "Content-Type": "application/json" } }
      );
    }

    // Check if this is an Apps Script managed token
    if (tokenData.gmail_refresh_token?.startsWith("apps_script_managed_")) {
      console.log(
        "📱 Apps Script managed token detected - checking if recent activity exists"
      );

      // Check when the token was last updated
      const tokenDate = new Date(
        tokenData.gmail_refresh_token.split("_")[3] || "0"
      );
      const daysSinceUpdate =
        (Date.now() - tokenDate.getTime()) / (1000 * 60 * 60 * 24);

      console.log(
        `📊 Apps Script token age: ${daysSinceUpdate.toFixed(1)} days`
      );

      // If token is very old (>30 days), suggest re-authentication
      if (daysSinceUpdate > 30) {
        console.log(
          "⏰ Apps Script token is quite old (>30 days) - suggesting re-authentication"
        );

        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Apps Script token requires re-authentication via Gmail add-on",
            requiresReauth: true,
            reason: "token_too_old",
            daysSinceUpdate: Math.round(daysSinceUpdate),
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      } else {
        // For Apps Script tokens, we need to get a fresh access token from Apps Script
        // The issue is that we were only extending expiration time without getting a new token
        console.log(
          "🔄 Getting fresh access token from Apps Script OAuth service"
        );

        try {
          // For Apps Script managed tokens, we need a different approach
          // The token can only be refreshed by Apps Script itself using ScriptApp.getOAuthToken()
          // So we'll instruct the user to re-authenticate via the Gmail add-on
          console.log("📱 Apps Script token needs refresh via Gmail add-on");

          // Check if we have an Apps Script webhook configured for token refresh
          const appsScriptWebhookUrl = Deno.env.get("APPS_SCRIPT_WEBHOOK_URL");

          if (
            appsScriptWebhookUrl &&
            appsScriptWebhookUrl !== "placeholder_for_now"
          ) {
            console.log("🔄 Attempting to refresh via Apps Script webhook");

            const webhookResponse = await fetch(appsScriptWebhookUrl, {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                action: "refresh_token",
                userEmail: userEmail,
                triggeredAt: new Date().toISOString(),
              }),
            });

            if (webhookResponse.ok) {
              const webhookResult = await webhookResponse.json();

              if (webhookResult.success && webhookResult.accessToken) {
                console.log(
                  "✅ Got fresh access token from Apps Script webhook"
                );

                // Update with the fresh token
                const newExpiresAt = new Date(
                  Date.now() + 6 * 60 * 60 * 1000
                ).toISOString();

                const { error: updateError } = await supabase
                  .from("user_auth_tokens")
                  .update({
                    gmail_access_token: webhookResult.accessToken,
                    token_expires_at: newExpiresAt,
                    updated_at: new Date().toISOString(),
                  })
                  .eq("user_id", user.id);

                if (updateError) {
                  console.error("❌ Error updating fresh token:", updateError);
                  throw new Error("Failed to update fresh token");
                }

                return new Response(
                  JSON.stringify({
                    success: true,
                    accessToken: webhookResult.accessToken,
                    expiresAt: newExpiresAt,
                    method: "apps_script_webhook_refresh",
                  }),
                  {
                    status: 200,
                    headers: { "Content-Type": "application/json" },
                  }
                );
              }
            }

            console.log(
              "⚠️ Apps Script webhook refresh failed or returned no token"
            );
          } else {
            console.log(
              "⚠️ No Apps Script webhook configured for token refresh"
            );
          }
        } catch (freshTokenError) {
          console.error(
            "⚠️ Error refreshing via Apps Script:",
            freshTokenError
          );
        }

        // For Apps Script tokens that can't be refreshed, require re-authentication
        console.log(
          "🔐 Apps Script token cannot be automatically refreshed - requiring re-authentication"
        );

        return new Response(
          JSON.stringify({
            success: false,
            error:
              "Apps Script token requires re-authentication via Gmail add-on",
            requiresReauth: true,
            reason: "apps_script_token_expired",
            instructions:
              "Please open the Gmail add-on and re-authorize to refresh your token",
            daysSinceUpdate: Math.round(daysSinceUpdate),
          }),
          { status: 401, headers: { "Content-Type": "application/json" } }
        );
      }
    }

    // If we have a real refresh token, use it to get a new access token
    if (!tokenData.gmail_refresh_token) {
      console.error("❌ No refresh token available");
      return new Response(
        JSON.stringify({
          success: false,
          error: "No refresh token available",
          requiresReauth: true,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Make request to Google OAuth2 API to refresh the token
    const refreshResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: Deno.env.get("GOOGLE_CLIENT_ID") || "",
        client_secret: Deno.env.get("GOOGLE_CLIENT_SECRET") || "",
        refresh_token: tokenData.gmail_refresh_token,
        grant_type: "refresh_token",
      }),
    });

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.error("❌ Token refresh failed:", errorText);
      return new Response(
        JSON.stringify({
          success: false,
          error: "Token refresh failed",
          requiresReauth: true,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    const refreshData = await refreshResponse.json();
    const newAccessToken = refreshData.access_token;
    const expiresIn = refreshData.expires_in || 3600; // Default to 1 hour

    if (!newAccessToken) {
      console.error("❌ No access token in refresh response");
      return new Response(
        JSON.stringify({
          success: false,
          error: "Invalid refresh response",
          requiresReauth: true,
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
    }

    // Calculate new expiration time
    const newExpiresAt = new Date(Date.now() + expiresIn * 1000).toISOString();

    // Update the stored token
    const { error: updateError } = await supabase
      .from("user_auth_tokens")
      .update({
        gmail_access_token: newAccessToken,
        token_expires_at: newExpiresAt,
        updated_at: new Date().toISOString(),
      })
      .eq("user_id", user.id);

    if (updateError) {
      console.error("❌ Error updating token:", updateError);
      return new Response(
        JSON.stringify({ success: false, error: "Failed to update token" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log("✅ OAuth token refreshed successfully");

    return new Response(
      JSON.stringify({
        success: true,
        accessToken: newAccessToken,
        expiresAt: newExpiresAt,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Error in refresh-oauth-token:", error);
    return new Response(
      JSON.stringify({ success: false, error: "Internal server error" }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
});
