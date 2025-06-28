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

    // Check if this is a legacy Apps Script managed token
    if (tokenData.gmail_refresh_token?.startsWith("apps_script_managed_")) {
      console.log(
        "📱 Legacy Apps Script token detected - requiring re-authentication"
      );

      return new Response(
        JSON.stringify({
          success: false,
          error: "Legacy token requires re-authentication",
          requiresReauth: true,
          reason: "legacy_token",
          instructions: "Please sign in again to refresh your OAuth connection",
        }),
        { status: 401, headers: { "Content-Type": "application/json" } }
      );
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
