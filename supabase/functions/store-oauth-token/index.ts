import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

interface TokenRequest {
  userEmail: string;
  accessToken: string;
  expiresAt: string;
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

    const { userEmail, accessToken, expiresAt }: TokenRequest =
      await req.json();

    if (!userEmail || !accessToken || !expiresAt) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    console.log(`🔑 Storing OAuth token for user: ${userEmail}`);

    // Get user ID from email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", userEmail.toLowerCase())
      .single();

    if (userError || !user) {
      console.error("❌ User not found:", userError);
      return new Response(JSON.stringify({ error: "User not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Upsert the OAuth token
    const { error: tokenError } = await supabase
      .from("user_auth_tokens")
      .upsert(
        {
          user_id: user.id,
          gmail_access_token: accessToken,
          token_expires_at: expiresAt,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: "user_id",
        }
      );

    if (tokenError) {
      console.error("❌ Error storing token:", tokenError);
      return new Response(JSON.stringify({ error: "Failed to store token" }), {
        status: 500,
        headers: { "Content-Type": "application/json" },
      });
    }

    console.log("✅ OAuth token stored successfully");

    return new Response(
      JSON.stringify({
        success: true,
        message: "OAuth token stored successfully",
      }),
      {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Error in store-oauth-token:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
});
