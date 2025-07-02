import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BetaAccessRequest {
  email: string;
}

const getBetaAccessTemplate = (email: string) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Actioneer Beta - You're In! 🚀</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px 4px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #8B5CF6; margin-bottom: 10px; }
    .content { background: #f8fafc; padding: 4px; border-radius: 0; margin: 20px 0; }
    .highlight { background: #9767f9; -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #ffffff; font-weight: 600; }
    .steps { counter-reset: step-counter; list-style: none; padding: 0; margin: 20px 0; }
    .steps li { position: relative; padding: 15px 0; }
    .steps li:last-child { border-left: none; }
    .steps li::before { content: counter(step-counter); counter-increment: step-counter; position: absolute; left: -12px; top: 15px; background: #8B5CF6; color: white; width: 24px; height: 24px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 12px; font-weight: bold; }
    .cta-button { display: inline-block; background: #8B5CF6; color: white; padding: 15px 30px; text-decoration: none; border-radius: 8px; font-weight: 600; margin: 20px 0; }
    .cta-button:hover { background: #7C3AED; }
    .orange-juice { background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B; }
    .test-categories { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border: 1px solid #E5E7EB; }
    .category-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-top: 10px; }
    .category-item { padding: 8px 0; font-size: 14px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/itujono/test-widget/refs/heads/main/assets/images/actioneer-icon.png" alt="Actioneer" style="width: 48px; height: 48px; margin-bottom: 10px;">
      <h1>🎉 You're officially in the beta!</h1>
      <p style="color: #6B7280; margin: 0;">Time to put your email chaos on autopilot</p>
    </div>
    
    <div class="content">
      <p>Hey ${email.split("@")[0]}! 👋</p>
      
      <p>Your beta access is now <strong>live and ready to roll</strong>! Here's how to get started in just 3 simple steps:</p>
      
      <ol class="steps">
        <li>
          <strong>Sign in to Actioneer</strong><br>
          Head over to <a href="https://actioneer.online/auth" style="color: #8B5CF6;">actioneer.online/auth</a> and sign in with your Google account
        </li>
        <li>
          <strong>Enable Gmail Processing</strong><br>
          Once inside, click the <strong>"Enable Gmail Processing"</strong> button to connect your email
        </li>
        <li>
          <strong>Sit back and relax!</strong><br>
          That's it! Your emails will start getting processed automatically
        </li>
      </ol>

      <div style="text-align: center;">
        <a href="https://actioneer.online/auth" class="cta-button">🚀 Get Started Now</a>
      </div>

      <div class="orange-juice">
        <strong>🍊 Pro tip:</strong> After setup, you can literally sip orange juice while watching your emails get organized automatically. It's that hands-off!
      </div>

      <div class="test-categories">
        <strong>Want to see it in action immediately?</strong><br>
        Each category page has test email buttons to send sample emails:
        <div class="category-grid">
          <div class="category-item">- Finance (Expenses and Income)</div>
          <div class="category-item">- Travel</div>
          <div class="category-item">- Jobs</div>
        </div>
        <p style="font-size: 14px; color: #6B7280; margin-top: 10px;">
          Click the "Send Test Email" buttons on each category page to see the magic happen in real-time!
        </p>
      </div>
      
      <p>Welcome to the future of email management! 🎯</p>
      
      <p>Best,<br>The Actioneer Team</p>
    </div>
    
    <div class="footer">
      <p>Actioneer - Your AI-powered email assistant</p>
      <p>Questions? Just reply to this email - we're here to help!</p>
    </div>
  </div>
</body>
</html>
`;

async function sendEmail(to: string, subject: string, htmlContent: string, fromName: string = "Actioneer") {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  if (!resendApiKey) {
    console.error("RESEND_API_KEY environment variable not set");
    return false;
  }

  if (!resendApiKey.startsWith("re_")) {
    console.error("Invalid API key format - should start with 're_'");
    return false;
  }

  try {
    const requestBody = {
      from: `${fromName} <noreply@actioneer.online>`,
      to: [to],
      subject: subject,
      html: htmlContent,
    };

    console.log("📧 Sending beta access email to:", to);

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${resendApiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(requestBody),
    });

    const result = await response.json();
    console.log("📧 Response status:", response.status);

    if (!response.ok) {
      console.error("Resend API error:", result);
      return false;
    }

    console.log("Beta access email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending beta access email:", error);
    return false;
  }
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email }: BetaAccessRequest = await req.json();

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(
        JSON.stringify({
          error: "Invalid email format",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if user exists in waitlist with pending status
    const { data: waitlistUser, error: waitlistError } = await supabaseClient
      .from("waitlist")
      .select("*")
      .eq("email", email.toLowerCase())
      .eq("status", "pending")
      .single();

    if (waitlistError || !waitlistUser) {
      if (waitlistError?.code === "PGRST116") {
        // Check if user exists but with different status
        const { data: existingUser } = await supabaseClient
          .from("waitlist")
          .select("status")
          .eq("email", email.toLowerCase())
          .single();

        if (existingUser) {
          return new Response(
            JSON.stringify({
              error: `User found in waitlist but status is '${existingUser.status}', not 'pending'. Only pending users can receive beta access.`,
            }),
            {
              status: 400,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        } else {
          return new Response(
            JSON.stringify({
              error: "User not found in waitlist. Only waitlisted users with 'pending' status can receive beta access.",
            }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
      } else {
        console.error("Database error checking waitlist:", waitlistError);
        return new Response(
          JSON.stringify({
            error: "Database error occurred while checking waitlist",
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }
    }

    // Send beta access email
    const subject = "🎉 Your Actioneer Beta Access is Live!";
    const htmlContent = getBetaAccessTemplate(email);

    const emailSent = await sendEmail(email, subject, htmlContent);

    if (!emailSent) {
      return new Response(
        JSON.stringify({
          error: "Failed to send beta access email",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Update waitlist status to 'invited'
    const { error: updateError } = await supabaseClient
      .from("waitlist")
      .update({
        status: "invited",
        invited_at: new Date().toISOString(),
      })
      .eq("email", email.toLowerCase());

    if (updateError) {
      console.error("Failed to update waitlist status:", updateError);
      // Don't fail the request since email was sent successfully
    }

    return new Response(
      JSON.stringify({
        message: "Beta access email sent successfully!",
        email: email,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Unexpected error:", error);
    return new Response(
      JSON.stringify({
        error: "An unexpected error occurred",
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
