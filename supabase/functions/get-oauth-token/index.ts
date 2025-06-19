import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface TokenRequest {
  userEmail: string;
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

    const { userEmail }: TokenRequest = await req.json();

    if (!userEmail) {
      return new Response(JSON.stringify({ error: "Missing userEmail" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log(`🔍 Getting OAuth token for user: ${userEmail}`);

    // Get user ID first
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail.toLowerCase())
      .single();

    if (userError || !user) {
      console.log("❌ User not found");
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Get token for user
    const { data: tokenData, error: tokenError } = await supabase
      .from("user_auth_tokens")
      .select("gmail_access_token, token_expires_at")
      .eq("user_id", user.id)
      .single();

    if (tokenError || !tokenData) {
      console.log("❌ No OAuth token found for user");
      return new Response(JSON.stringify({ error: "No token found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Check if token is expired
    const expiresAt = new Date(tokenData.token_expires_at);
    const now = new Date();

    if (expiresAt <= now) {
      console.log("⏰ OAuth token has expired");
      return new Response(JSON.stringify({ error: "Token expired" }), {
        status: 401,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("✅ Valid OAuth token found");

    return new Response(
      JSON.stringify({
        success: true,
        accessToken: tokenData.gmail_access_token,
        expiresAt: tokenData.token_expires_at,
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Error in get-oauth-token:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
