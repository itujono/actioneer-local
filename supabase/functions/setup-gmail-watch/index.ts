import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

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

interface GmailWatchRequest {
  userEmail: string;
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (req.method !== "POST") {
    return new Response("Method not allowed", {
      status: 405,
      headers: corsHeaders,
    });
  }

  try {
    const body: GmailWatchRequest = await req.json();
    const { userEmail, accessToken, refreshToken, expiresAt } = body;

    if (!userEmail || !accessToken) {
      return new Response(
        JSON.stringify({
          error: "Missing required fields: userEmail and accessToken",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`🔔 Setting up Gmail watch for OAuth user: ${userEmail}`);

    // 1. Get user from database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail.toLowerCase())
      .single();

    if (userError || !user) {
      console.error("❌ User not found:", userError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // 2. Store OAuth tokens
    console.log("💾 Storing OAuth tokens...");
    const tokenExpiresAt =
      expiresAt || new Date(Date.now() + 3600 * 1000).toISOString();

    const { error: tokenError } = await supabase
      .from("user_auth_tokens")
      .upsert(
        {
          user_id: user.id,
          gmail_access_token: accessToken,
          gmail_refresh_token: refreshToken || null,
          token_expires_at: tokenExpiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (tokenError) {
      console.error("❌ Error storing tokens:", tokenError);
      return new Response(
        JSON.stringify({ error: "Failed to store OAuth tokens" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // 3. Set up Gmail watch
    console.log("📡 Setting up Gmail push notifications...");
    const watchResult = await setupGmailWatch(accessToken, userEmail);

    if (!watchResult.success) {
      console.warn("⚠️ Gmail watch setup failed:", watchResult.error);
      // Still return success for token storage, but note the watch failure
      return new Response(
        JSON.stringify({
          success: true,
          tokensStored: true,
          gmailWatch: {
            success: false,
            error: watchResult.error,
          },
          message: "OAuth tokens stored, but Gmail watch setup failed",
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Gmail watch setup successful");

    return new Response(
      JSON.stringify({
        success: true,
        tokensStored: true,
        gmailWatch: {
          success: true,
          historyId: watchResult.historyId,
        },
        message: "OAuth tokens stored and Gmail watch setup successful",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Error in setup-gmail-watch:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function setupGmailWatch(accessToken: string, userEmail: string) {
  try {
    console.log("🔔 Creating Gmail watch with access token...");

    // Use Gmail API directly to set up watch
    const watchUrl = "https://gmail.googleapis.com/gmail/v1/users/me/watch";

    const payload = {
      topicName: "projects/actioneer-464218/topics/gmail-notifications",
      labelIds: ["INBOX"], // Only watch inbox
    };

    const response = await fetch(watchUrl, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("❌ Gmail watch API error:", response.status, errorText);
      return {
        success: false,
        error: `Gmail API error: ${response.status} - ${errorText}`,
      };
    }

    const watchResponse = await response.json();
    console.log("✅ Gmail watch created:", watchResponse);

    return {
      success: true,
      historyId: watchResponse.historyId,
      expiration: watchResponse.expiration,
    };
  } catch (error) {
    console.error("💥 Error setting up Gmail watch:", error);
    return {
      success: false,
      error: error.message,
    };
  }
}
