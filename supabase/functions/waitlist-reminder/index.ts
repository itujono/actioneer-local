import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "jsr:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Utility function to format date in Jakarta timezone
function formatJakartaTime(dateString: string): string {
  const date = new Date(dateString);
  return date.toLocaleString("en-US", {
    timeZone: "Asia/Jakarta",
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
}

interface WaitlistUser {
  id: string;
  email: string;
  created_at: string;
  status: string;
}

const getOneHourReminderTemplate = (users: WaitlistUser[]) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>⏰ Waitlist 1-Hour Reminder</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
         .container { max-width: 600px; margin: 0 auto; padding: 20px 4px; }
     .header { text-align: center; margin-bottom: 30px; }
     .logo { font-size: 28px; font-weight: bold; color: #8B5CF6; margin-bottom: 10px; }
     .content { background: #f8fafc; padding: 4px; border-radius: 0; margin: 20px 0; }
    .user-card { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #F59E0B; }
    .reminder-badge { background: #F59E0B; color: white; padding: 4px 12px; border-radius: 16px; font-size: 12px; font-weight: bold; display: inline-block; margin-bottom: 15px; }
    .action-button { display: inline-block; background: #8B5CF6; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/itujono/test-widget/refs/heads/main/assets/images/actioneer-icon.png" alt="Actioneer" style="width: 48px; height: 48px; margin-bottom: 10px;">
      <div class="logo">Actioneer Admin</div>
      <h1>⏰ 1-Hour Waitlist Reminder</h1>
    </div>
    
    <div class="content">
      <div class="reminder-badge">Action Needed</div>
      
      <p><strong>The following ${users.length} user${users.length > 1 ? "s have" : " has"} been waiting for 1+ hour${
  users.length > 1 ? "s" : ""
}:</strong></p>
      
      ${users
        .map(
          (user) => `
        <div class="user-card">
          <strong>📧 ${user.email}</strong><br>
          <small>Joined: ${formatJakartaTime(user.created_at)} WIB</small><br>
          <small>Status: ${user.status}</small>
        </div>
      `
        )
        .join("")}
      
      <p><strong>💡 Recommended Actions:</strong></p>
      <ol>
        <li>Review each user for any red flags</li>
        <li>Send beta access emails to approved users</li>
        <li>Update status to 'invited' once processed</li>
      </ol>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://supabase.com/dashboard/project/whnvhuusxtnuvkhgfxnu/editor" class="action-button">🔧 Open Supabase Dashboard</a>
        <a href="https://actioneer.online/admin" class="action-button">📊 Admin Panel</a>
      </div>
      
      <p><em>This is a 1-hour reminder. You'll get another reminder at 1h45m if still pending.</em></p>
    </div>
    
    <div class="footer">
      <p>Actioneer Waitlist Management</p>
      <p>Automated reminder system</p>
    </div>
  </div>
</body>
</html>
`;

const getUrgentReminderTemplate = (users: WaitlistUser[]) => `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>🚨 URGENT: Waitlist 2-Hour Approaching</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; }
         .container { max-width: 600px; margin: 0 auto; padding: 20px 4px; }
     .header { text-align: center; margin-bottom: 30px; }
     .logo { font-size: 28px; font-weight: bold; color: #8B5CF6; margin-bottom: 10px; }
     .content { background: #fef2f2; padding: 4px; border-radius: 0; margin: 20px 0; border: 2px solid #EF4444; }
    .user-card { background: white; padding: 15px; border-radius: 8px; margin: 10px 0; border-left: 4px solid #EF4444; }
    .urgent-badge { background: #EF4444; color: white; padding: 6px 16px; border-radius: 16px; font-size: 14px; font-weight: bold; display: inline-block; margin-bottom: 15px; animation: pulse 2s infinite; }
    .action-button { display: inline-block; background: #EF4444; color: white; padding: 15px 30px; text-decoration: none; border-radius: 6px; font-weight: 600; margin: 10px 5px; box-shadow: 0 4px 8px rgba(239, 68, 68, 0.3); }
    .footer { text-align: center; margin-top: 30px; font-size: 14px; color: #6B7280; }
    @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: 0.7; } }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <img src="https://raw.githubusercontent.com/itujono/test-widget/refs/heads/main/assets/images/actioneer-icon.png" alt="Actioneer" style="width: 48px; height: 48px; margin-bottom: 10px;">
      <div class="logo">Actioneer Admin</div>
      <h1>🚨 URGENT: 2-Hour Deadline Approaching!</h1>
    </div>
    
    <div class="content">
      <div class="urgent-badge">🚨 URGENT ACTION NEEDED</div>
      
      <p><strong>⚠️ These ${users.length} user${
  users.length > 1 ? "s are" : " is"
} approaching the 2-hour deadline:</strong></p>
      
      ${users
        .map((user) => {
          const hoursSinceJoined = (Date.now() - new Date(user.created_at).getTime()) / (1000 * 60 * 60);
          const minutesLeft = Math.round((2 - hoursSinceJoined) * 60);
          return `
          <div class="user-card">
            <strong>📧 ${user.email}</strong><br>
            <small>Joined: ${formatJakartaTime(user.created_at)} WIB</small><br>
            <small>Status: ${user.status}</small><br>
            <strong style="color: #EF4444;">⏰ ${minutesLeft} minutes until 2-hour mark!</strong>
          </div>
        `;
        })
        .join("")}
      
      <p><strong>🎯 IMMEDIATE ACTION REQUIRED:</strong></p>
      <ol>
        <li><strong>Send beta access NOW</strong> if user is approved</li>
        <li><strong>Reject if needed</strong> to clear the queue</li>
        <li><strong>Don't let users wait 2+ hours</strong> - it looks unprofessional</li>
      </ol>
      
      <div style="text-align: center; margin: 20px 0;">
        <a href="https://supabase.com/dashboard/project/whnvhuusxtnuvkhgfxnu/editor" class="action-button">🚨 PROCESS NOW</a>
      </div>
      
      <p style="color: #EF4444;"><strong>This is your final reminder before the 2-hour deadline!</strong></p>
    </div>
    
    <div class="footer">
      <p>Actioneer Waitlist Management</p>
      <p>Urgent deadline notification system</p>
    </div>
  </div>
</body>
</html>
`;

async function sendEmail(to: string, subject: string, htmlContent: string, fromName: string = "Actioneer Admin") {
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
      from: `${fromName} <admin@actioneer.online>`,
      to: [to],
      subject: subject,
      html: htmlContent,
    };

    console.log("📧 Sending admin reminder to:", to);

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

    console.log("Admin reminder email sent successfully:", result);
    return true;
  } catch (error) {
    console.error("Error sending admin reminder email:", error);
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

    const adminEmail = "itujono@gmail.com";
    const now = new Date();
    const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000);
    const oneHour45MinAgo = new Date(now.getTime() - 105 * 60 * 1000); // 1h45m ago
    const twoHoursAgo = new Date(now.getTime() - 120 * 60 * 1000);

    console.log("🕐 Checking for waitlist reminders...");
    console.log("Current time:", now.toISOString());
    console.log("1-hour reminder window: 1h to 1h30m ago");
    console.log("Urgent reminder window: 1h30m to 2h ago");

    // Find users who have been pending for 1+ hours but less than 1h30m
    // This ensures we catch everyone in the 1-hour reminder window
    const oneHourMax = new Date(now.getTime() - 90 * 60 * 1000); // 1h30m ago
    const { data: oneHourUsers, error: oneHourError } = await supabaseClient
      .from("waitlist")
      .select("*")
      .eq("status", "pending")
      .gte("created_at", oneHourMax.toISOString())
      .lte("created_at", oneHourAgo.toISOString());

    if (oneHourError) {
      console.error("Error fetching 1-hour users:", oneHourError);
    }

    // Find users who have been pending for 1h30m+ but less than 2 hours - approaching deadline
    const urgentMin = new Date(now.getTime() - 120 * 60 * 1000); // 2 hours ago
    const urgentMax = new Date(now.getTime() - 90 * 60 * 1000); // 1h30m ago
    const { data: urgentUsers, error: urgentError } = await supabaseClient
      .from("waitlist")
      .select("*")
      .eq("status", "pending")
      .gte("created_at", urgentMin.toISOString())
      .lte("created_at", urgentMax.toISOString());

    if (urgentError) {
      console.error("Error fetching urgent users:", urgentError);
    }

    let emailsSent = 0;

    // Send 1-hour reminder
    if (oneHourUsers && oneHourUsers.length > 0) {
      console.log(`📧 Sending 1-hour reminder for ${oneHourUsers.length} users`);
      const subject = `⏰ Waitlist 1-Hour Reminder (${oneHourUsers.length} pending user${
        oneHourUsers.length > 1 ? "s" : ""
      })`;
      const htmlContent = getOneHourReminderTemplate(oneHourUsers);

      const emailSent = await sendEmail(adminEmail, subject, htmlContent);
      if (emailSent) emailsSent++;
    }

    // Send urgent reminder for users approaching 2-hour mark
    if (urgentUsers && urgentUsers.length > 0) {
      console.log(`🚨 Sending urgent reminder for ${urgentUsers.length} users`);
      const subject = `🚨 URGENT: Waitlist 2-Hour Deadline Approaching (${urgentUsers.length} user${
        urgentUsers.length > 1 ? "s" : ""
      })`;
      const htmlContent = getUrgentReminderTemplate(urgentUsers);

      const emailSent = await sendEmail(adminEmail, subject, htmlContent);
      if (emailSent) emailsSent++;
    }

    return new Response(
      JSON.stringify({
        message: "Waitlist reminder check completed",
        oneHourUsers: oneHourUsers?.length || 0,
        urgentUsers: urgentUsers?.length || 0,
        emailsSent,
        timestamp: now.toISOString(),
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
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
