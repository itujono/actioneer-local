import { createClient } from "npm:@supabase/supabase-js@2";
import { OpenAI } from "npm:openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, GET, OPTIONS",
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
});

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔔 Gmail Push notification received (simplified)");
    console.log("📋 Method:", req.method);

    // Handle Gmail Push notification
    if (req.method === "POST") {
      return await handleGmailPushNotification(req);
    }

    // Handle verification requests
    if (req.method === "GET") {
      const url = new URL(req.url);
      const challenge = url.searchParams.get("hub.challenge");
      if (challenge) {
        console.log("✅ Webhook verification challenge received");
        return new Response(challenge, {
          headers: { ...corsHeaders, "Content-Type": "text/plain" },
        });
      }
    }

    return new Response("OK", {
      headers: { ...corsHeaders, "Content-Type": "text/plain" },
    });
  } catch (error) {
    console.error("💥 Gmail webhook error:", error);
    return new Response(
      JSON.stringify({
        error: "Webhook processing failed",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function handleGmailPushNotification(req: Request) {
  try {
    // Parse the push notification
    const body = await req.text();
    console.log("📦 Push notification body:", body);

    let pushData;
    try {
      pushData = JSON.parse(body);
    } catch (parseError) {
      console.log("📝 Non-JSON body, treating as Pub/Sub message");
      // Gmail sends Pub/Sub messages in base64 format
      if (body) {
        try {
          const decodedData = atob(body);
          pushData = JSON.parse(decodedData);
        } catch (decodeError) {
          console.error("Failed to decode Pub/Sub message:", decodeError);
          return new Response("OK", { headers: corsHeaders });
        }
      }
    }

    if (!pushData || !pushData.message) {
      console.log("⚠️ No message data in push notification");
      return new Response("OK", { headers: corsHeaders });
    }

    // Decode the Pub/Sub message
    const messageData = pushData.message.data;
    if (!messageData) {
      console.log("⚠️ No message data found");
      return new Response("OK", { headers: corsHeaders });
    }

    let gmailNotification;
    try {
      const decodedMessage = atob(messageData);
      gmailNotification = JSON.parse(decodedMessage);
      console.log(
        "📧 Gmail notification:",
        JSON.stringify(gmailNotification, null, 2)
      );
    } catch (decodeError) {
      console.error("Failed to decode Gmail notification:", decodeError);
      return new Response("OK", { headers: corsHeaders });
    }

    // Extract email address from the notification
    const emailAddress = gmailNotification.emailAddress;
    if (!emailAddress) {
      console.log("⚠️ No email address in notification");
      return new Response("OK", { headers: corsHeaders });
    }

    console.log("👤 Processing emails for:", emailAddress);

    // Find user by email address using your existing auth system
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("email", emailAddress)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      console.log("⚠️ User not found or inactive:", emailAddress);
      return new Response("OK", { headers: corsHeaders });
    }

    console.log("✅ User found:", user.email);

    // For now, just log that we received a notification for this user
    // The actual email processing will happen when they open the email in the add-on
    // This creates a foundation for future auto-processing features

    console.log("📝 Logging email notification for future processing...");
    await logEmailNotification(user.id, emailAddress, gmailNotification);

    return new Response("OK", { headers: corsHeaders });
  } catch (error) {
    console.error("Error handling Gmail push notification:", error);
    return new Response("OK", { headers: corsHeaders });
  }
}

async function logEmailNotification(
  userId: string,
  emailAddress: string,
  notification: any
) {
  try {
    // Store notification for potential future processing
    // This could be used for analytics, user engagement tracking, etc.

    const { error } = await supabase.from("email_notifications").insert({
      user_id: userId,
      email_address: emailAddress,
      notification_data: notification,
      processed: false,
      created_at: new Date().toISOString(),
    });

    if (error) {
      console.error("Error logging email notification:", error);
    } else {
      console.log("✅ Email notification logged");
    }
  } catch (error) {
    console.error("Failed to log email notification:", error);
  }
}

// Reuse classification logic from classify-email function
async function classifyEmailWithOpenAI(
  subject: string,
  from: string,
  emailBody: string
) {
  const prompt = `
    Analyze this email and classify it into one of these categories:
    - receipt (for purchase receipts or invoices)
    - travel (for flight, hotel, or travel-related emails)
    - job_application (for job-related emails)
    - other (for emails that don't fit the above categories)
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 1000)}
    
    IMPORTANT: Respond with ONLY valid JSON, no markdown formatting or code blocks.
    
    Format: { "type": "category", "confidence": 0.95 }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    let response = completion.choices[0].message.content;

    if (!response) {
      throw new Error("Empty response from OpenAI");
    }

    // Clean up the response
    response = response.trim();
    if (response.startsWith("```json")) {
      response = response.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (response.startsWith("```")) {
      response = response.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    let classification;
    try {
      classification = JSON.parse(response);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      classification = {
        type: "other",
        confidence: 0.5,
      };
    }

    return classification;
  } catch (error) {
    console.error("OpenAI classification error:", error);
    return {
      type: "other",
      confidence: 0.0,
      error: "AI classification failed",
    };
  }
}
