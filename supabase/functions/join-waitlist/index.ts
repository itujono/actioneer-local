import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface WaitlistRequest {
  email: string;
}

const MAX_WAITLIST_SIZE = 50;

// Email templates
const getUserConfirmationTemplate = (email: string, position: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to Actioneer Beta!</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px 4px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #8B5CF6; margin-bottom: 10px; }
    .content { background: #f8fafc; padding: 4px; border-radius: 0; margin: 20px 0; }
    .highlight { background: #9767f9; -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #ffffff; font-weight: 600; }
    .features { list-style: none; padding: 0; }
    .features li { padding: 8px 0; }
    .features li:before { content: "✓"; color: #10B981; font-weight: bold; margin-right: 8px; }
    .position-badge { background: #8B5CF6; color: white; padding: 8px 16px; border-radius: 20px; font-weight: bold; display: inline-block; margin: 10px 0; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/itujono/test-widget/refs/heads/main/assets/images/actioneer-icon.png" alt="Actioneer" style="width: 48px; height: 48px; margin-bottom: 10px;">
      <h1>You're on the waitlist! 🎉</h1>
      <div class="position-badge">Position #${position} of ${MAX_WAITLIST_SIZE}</div>
    </div>
    
    <div class="content">
      <p>Hey there!</p>
      
      <p>Thanks for joining the <strong>Actioneer beta waitlist</strong>! We're excited to have you aboard.</p>
      
      <p><strong>What happens next?</strong></p>
      <p>You'll receive beta access within <strong>1-2 hours</strong>. Once approved, you'll get an email with instructions to get started.</p>
      
      <p><strong>What you'll get with Actioneer:</strong></p>
      <ul class="features">
        <li>Automatic receipt, expense, and income tracking</li>
        <li>Smart job application organization and follow-ups</li>
        <li>Travel deal alerts and booking insights</li>
        <li>All powered by AI that understands your emails. The best part? You don't have to do anything. Everything is fully automated and well organized.</li>
      </ul>
      
      <p>We can't wait to help you take control of your email chaos!</p>
      
      <p>Best,<br>The Actioneer Team</p>
    </div>
    
    <div class="footer">
      <p>Actioneer - Your AI-powered email assistant</p>
      <p>If you have any questions, just reply to this email.</p>
    </div>
  </div>
</body>
</html>
`;

const getAdminNotificationTemplate = (email: string, position: number, totalSignups: number) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>New Actioneer Beta Signup</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
    .container { max-width: 600px; margin: 0 auto; padding: 20px 4px; }
    .header { text-align: center; margin-bottom: 30px; }
    .logo { font-size: 28px; font-weight: bold; color: #8B5CF6; margin-bottom: 10px; }
    .content { background: #f8fafc; padding: 4px; border-radius: 0; margin: 20px 0; }
    .email-box { background: white; padding: 20px; border-radius: 8px; border-left: 4px solid #8B5CF6; margin: 15px 0; }
    .timestamp { color: #6B7280; font-size: 14px; }
    .action-needed { background: #FEF3C7; padding: 15px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F59E0B; }
    .stats { display: flex; gap: 20px; margin: 20px 0; }
    .stat { background: white; padding: 15px; border-radius: 8px; text-align: center; flex: 1; }
    .stat-number { font-size: 24px; font-weight: bold; color: #8B5CF6; }
    .stat-label { font-size: 12px; color: #6B7280; text-transform: uppercase; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/itujono/test-widget/refs/heads/main/assets/images/actioneer-icon.png" alt="Actioneer" style="width: 48px; height: 48px; margin-bottom: 10px;">
      <div class="logo">Actioneer Admin</div>
      <h1>🔔 New Beta Signup</h1>
    </div>
    
    <div class="content">
      <p>A new user has joined the Actioneer beta waitlist!</p>
      
      <div class="email-box">
        <strong>Email:</strong> ${email}<br>
        <strong>Position:</strong> #${position} of ${MAX_WAITLIST_SIZE}<br>
        <span class="timestamp">Signed up: ${new Date().toLocaleString()}</span>
      </div>

      <div class="stats">
        <div class="stat">
          <div class="stat-number">${totalSignups}</div>
          <div class="stat-label">Total Signups</div>
        </div>
        <div class="stat">
          <div class="stat-number">${MAX_WAITLIST_SIZE - totalSignups}</div>
          <div class="stat-label">Spots Left</div>
        </div>
      </div>
      
      <div class="action-needed">
        <strong>⏰ Action Needed:</strong> Please review and approve this user for beta access within 1-2 hours.
      </div>
      
      <p><strong>Next steps:</strong></p>
      <ol>
        <li>Review the email address for any obvious issues</li>
        <li>Send them beta access instructions</li>
        <li>Update their status in the admin panel</li>
      </ol>
      
      <p>You can manage waitlist users in your Supabase dashboard.</p>
    </div>
  </div>
</body>
</html>
`;

async function sendEmail(to: string, subject: string, htmlContent: string, fromName: string = "Actioneer") {
  const resendApiKey = Deno.env.get("RESEND_API_KEY");

  console.log("🔑 API Key Check:", resendApiKey ? `Key exists (${resendApiKey.length} chars)` : "Key missing");

  if (!resendApiKey) {
    console.error("RESEND_API_KEY environment variable not set");
    return false;
  }

  // Validate API key format
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

    console.log("📧 Sending email to:", to);
    console.log("📧 Request body:", JSON.stringify(requestBody, null, 2));

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
    console.log("📧 Response body:", JSON.stringify(result, null, 2));

    if (!response.ok) {
      console.error("Resend API error:", result);
      return false;
    }

    console.log("Email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending email:", error);
    return false;
  }
}

async function sendUserConfirmation(email: string, position: number) {
  const subject = "Welcome to Actioneer Beta! 🚀";
  const htmlContent = getUserConfirmationTemplate(email, position);

  return await sendEmail(email, subject, htmlContent);
}

async function sendAdminNotification(userEmail: string, position: number, totalSignups: number) {
  const adminEmail = "itujono@gmail.com";
  const subject = `New Actioneer Beta Signup: ${userEmail} (#${position})`;
  const htmlContent = getAdminNotificationTemplate(userEmail, position, totalSignups);

  return await sendEmail(adminEmail, subject, htmlContent, "Actioneer Admin");
}

Deno.serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_ANON_KEY") ?? "");

    // For checking existing users, we need service role permissions
    const supabaseServiceClient = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const { email }: WaitlistRequest = await req.json();

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

    // Check if email is Gmail or Google Workspace (more flexible)
    const emailDomain = email.toLowerCase().split("@")[1];
    if (!emailDomain.includes("gmail.") && !emailDomain.includes("google.")) {
      // Allow all domains for now, but could add validation later
      console.log(`Non-Gmail domain: ${emailDomain}`);
    }

    // Check if user already exists in the users table (existing users can't join waitlist)
    console.log(`🔍 Checking if user exists: ${email.toLowerCase()}`);

    const { data: existingActiveUser, error: existingUserError } = await supabaseServiceClient
      .from("users")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();

    console.log(`👤 Existing user check result:`, { existingActiveUser, existingUserError });

    if (existingUserError && existingUserError.code !== "PGRST116") {
      console.error("Database check error for existing users:", existingUserError);
      return new Response(
        JSON.stringify({
          error: "Database error occurred",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (existingActiveUser) {
      console.log(`🚫 Existing user found, blocking waitlist signup: ${existingActiveUser.email}`);
      return new Response(
        JSON.stringify({
          error: "You already have access to Actioneer! Please sign in instead.",
          isExistingUser: true,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ User not found in users table, proceeding with waitlist signup`);

    // Check current waitlist count to enforce MAX_WAITLIST_SIZE-user limit
    const { count: currentWaitlistCount, error: countError } = await supabaseClient
      .from("waitlist")
      .select("*", { count: "exact", head: true });

    if (countError) {
      console.error("Database count error:", countError);
      return new Response(
        JSON.stringify({
          error: "Database error occurred",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (currentWaitlistCount && currentWaitlistCount >= MAX_WAITLIST_SIZE) {
      return new Response(
        JSON.stringify({
          error: `Sorry, the beta waitlist is now full (${currentWaitlistCount}/${MAX_WAITLIST_SIZE}). Thank you for your interest!`,
          waitlistFull: true,
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Check if email already exists in waitlist
    const { data: existingWaitlistUser, error: checkError } = await supabaseClient
      .from("waitlist")
      .select("email")
      .eq("email", email.toLowerCase())
      .single();

    if (checkError && checkError.code !== "PGRST116") {
      console.error("Database check error:", checkError);
      return new Response(
        JSON.stringify({
          error: "Database error occurred",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (existingWaitlistUser) {
      return new Response(
        JSON.stringify({
          message: "Email already on waitlist",
          alreadyExists: true,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Insert new email into waitlist
    const { data, error } = await supabaseClient
      .from("waitlist")
      .insert([
        {
          email: email.toLowerCase(),
          status: "pending",
        },
      ])
      .select();

    if (error) {
      console.error("Database insert error:", error);
      return new Response(
        JSON.stringify({
          error: "Failed to join waitlist",
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Calculate position (current count + 1)
    const position = (currentWaitlistCount || 0) + 1;
    const totalSignups = position;

    // Send emails (don't block response on email failures)
    Promise.all([sendUserConfirmation(email, position), sendAdminNotification(email, position, totalSignups)])
      .then(([userEmailSent, adminEmailSent]) => {
        console.log(`Emails sent - User: ${userEmailSent}, Admin: ${adminEmailSent}`);
      })
      .catch((error) => {
        console.error("Error sending emails:", error);
      });

    return new Response(
      JSON.stringify({
        message: `Successfully joined waitlist! You're #${position} of ${MAX_WAITLIST_SIZE}.`,
        data: data?.[0],
        position,
        totalSignups,
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
