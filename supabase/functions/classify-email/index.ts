import { createClient } from "npm:@supabase/supabase-js@2";
import type { EmailData } from "./types.ts";
import { classifyEmail } from "./classifiers.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Initialize Supabase with service role key - bypass RLS for our custom auth
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate user API key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = authHeader.split(" ")[1];

    // Validate API key format
    if (!apiKey.startsWith("ak_") || apiKey.length !== 67) {
      return new Response(JSON.stringify({ error: "Invalid API key format" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up user by API key using service role (bypasses RLS)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      console.error("User lookup error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ User authenticated:", user.email);

    // Parse request body
    const {
      messageId,
      subject,
      from,
      body: emailBody,
      date,
    } = await req.json();

    if (!messageId || !subject || !from || !emailBody) {
      return new Response(
        JSON.stringify({ error: "Missing required email data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("📧 Classifying email:", { subject, from });

    // Prepare email data
    const emailData: EmailData = {
      subject,
      from,
      body: emailBody,
      messageId,
      date,
    };

    // Classify email with comprehensive classification
    const classification = await classifyEmail(emailData);

    console.log("✅ Email classified as:", classification.type);

    // Early exit for "other" category - we don't care about these emails
    if (classification.type === "other") {
      console.log(
        "🚫 Email classified as 'other' - skipping storage and returning early"
      );
      return new Response(
        JSON.stringify({
          type: "other",
          confidence: classification.confidence,
          actions: [],
          message: "Email not relevant to tracked categories",
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Only store and process emails that matter to us
    await storeEmailClassification(
      user.id,
      messageId,
      subject,
      from,
      emailBody,
      date,
      classification.type
    );

    console.log("💾 Stored classification for relevant email");

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Classification error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to classify email",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function storeEmailClassification(
  userId: string,
  messageId: string,
  subject: string,
  from: string,
  emailBody: string,
  date: string,
  classification: string
) {
  try {
    // Use service role to insert directly, bypassing RLS
    const { error } = await supabase.from("emails").insert({
      user_id: userId,
      message_id: messageId,
      subject,
      from_email: from,
      email_body: emailBody,
      date,
      classification,
    });

    if (error) {
      console.error("Error storing email classification:", error);
      // Don't throw - this is not critical for the user experience
    } else {
      console.log("✅ Email classification stored");
    }
  } catch (error) {
    console.error("Failed to store email classification:", error);
    // Don't throw - this is not critical for the user experience
  }
}
