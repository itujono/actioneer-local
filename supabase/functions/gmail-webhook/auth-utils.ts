import { createClient } from "npm:@supabase/supabase-js@2";

// Initialize Supabase with service role key
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  }
);

export async function tryRefreshToken(
  user: any,
  emailAddress: string
): Promise<boolean> {
  try {
    console.log(`🔄 Attempting to refresh OAuth token for ${emailAddress}`);

    // Call our refresh token Edge Function
    const refreshResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/refresh-oauth-token`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          userEmail: emailAddress,
        }),
      }
    );

    if (!refreshResponse.ok) {
      const errorText = await refreshResponse.text();
      console.log(
        `❌ Token refresh failed: ${refreshResponse.status} - ${errorText}`
      );
      return false;
    }

    const refreshResult = await refreshResponse.json();

    if (refreshResult.success) {
      console.log(
        `✅ Token refreshed successfully using method: ${
          refreshResult.method || "standard"
        }`
      );
      return true;
    } else {
      console.log(`❌ Token refresh failed: ${refreshResult.error}`);

      // Check if re-authentication is required
      if (refreshResult.requiresReauth) {
        console.log("🔐 Re-authentication required via Gmail add-on");

        // For very old tokens, provide additional context
        if (refreshResult.daysSinceUpdate) {
          console.log(
            `📊 Token age: ${refreshResult.daysSinceUpdate} days (reason: ${refreshResult.reason})`
          );
        }
      }

      return false;
    }
  } catch (error) {
    console.error("💥 Error during token refresh:", error);
    return false;
  }
}

export async function getValidAccessToken(
  user: any,
  emailAddress: string
): Promise<string | null> {
  try {
    console.log("🔑 Fetching OAuth token for user...");
    const { data: authData, error: authError } = await supabase
      .from("user_auth_tokens")
      .select("gmail_access_token, token_expires_at")
      .eq("user_id", user.id)
      .single();

    console.log("🔍 Auth query result - Error:", authError);
    console.log("🔍 Auth query result - Data exists:", !!authData);

    if (authError || !authData?.gmail_access_token) {
      console.error(
        "❌ No valid access token found for user:",
        authError?.message || "Token not found"
      );

      // Try to find a recently stored token
      const { data: recentToken } = await supabase
        .from("user_auth_tokens")
        .select("gmail_access_token, token_expires_at, created_at")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(1)
        .single();

      if (!recentToken?.gmail_access_token) {
        console.log(
          "💡 No OAuth token available - user needs to use Gmail add-on first to authorize"
        );
        return null;
      }

      // Check if the recent token is expired
      const expiresAt = new Date(recentToken.token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        console.log(
          "⏰ Most recent OAuth token has expired - attempting automatic refresh..."
        );

        const refreshSuccess = await tryRefreshToken(user, emailAddress);
        if (refreshSuccess) {
          console.log(
            "✅ Token refreshed successfully, continuing with processing"
          );
          // Get the refreshed token
          const { data: refreshedAuth } = await supabase
            .from("user_auth_tokens")
            .select("gmail_access_token")
            .eq("user_id", user.id)
            .single();

          return refreshedAuth?.gmail_access_token || null;
        } else {
          console.log(
            "❌ Token refresh failed - user needs to re-authorize via Gmail add-on"
          );
          return null;
        }
      } else {
        console.log("✅ Found recent valid token, proceeding with that");
        return recentToken.gmail_access_token;
      }
    } else {
      // Check if current token is expired
      const expiresAt = new Date(authData.token_expires_at);
      const now = new Date();

      if (expiresAt <= now) {
        console.log(
          "⏰ OAuth token has expired - attempting automatic refresh..."
        );

        const refreshSuccess = await tryRefreshToken(user, emailAddress);
        if (refreshSuccess) {
          console.log(
            "✅ Token refreshed successfully, continuing with processing"
          );
          // Get the refreshed token
          const { data: refreshedAuth } = await supabase
            .from("user_auth_tokens")
            .select("gmail_access_token")
            .eq("user_id", user.id)
            .single();

          return refreshedAuth?.gmail_access_token || null;
        } else {
          console.log(
            "❌ Token refresh failed - user needs to re-authorize via Gmail add-on"
          );
          return null;
        }
      }

      return authData.gmail_access_token;
    }
  } catch (error) {
    console.error("Error getting valid access token:", error);
    return null;
  }
}

export { supabase };
