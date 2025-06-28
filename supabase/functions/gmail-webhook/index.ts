import { corsHeaders } from "./constants.ts";
import { supabase, getValidAccessToken } from "./auth-utils.ts";
import { fetchRecentEmails, fetchEmailContent } from "./gmail-api.ts";
import { classifyEmailWithEnhancedAI } from "./ai-processors.ts";
import {
  processJobApplicationEmail,
  processReceiptEmail,
  processTravelEmail,
  logNotificationOnly,
  updateNotificationResult,
} from "./email-processors.ts";

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    console.log("🔔 Gmail Push notification received");
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

    // Extract email address and history ID from the notification
    const emailAddress = gmailNotification.emailAddress;
    const historyId = gmailNotification.historyId;

    if (!emailAddress) {
      console.log("⚠️ No email address in notification");
      return new Response("OK", { headers: corsHeaders });
    }

    console.log("👤 Processing emails for:", emailAddress);
    console.log("📊 History ID:", historyId);

    // Find user by email address
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

    // Process emails directly via Supabase Edge Function
    console.log("🔄 Starting direct email processing...");
    await processNewEmailsForUser(user, emailAddress, historyId);

    console.log("📝 Logging email notification...");
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

async function processNewEmailsForUser(
  user: any,
  emailAddress: string,
  historyId?: string
) {
  try {
    console.log("📨 Starting direct email processing for:", emailAddress);

    // Get valid access token
    const accessToken = await getValidAccessToken(user, emailAddress);
    if (!accessToken) {
      console.log(
        "❌ No valid access token available - user needs to re-authorize via web OAuth"
      );
      await updateNotificationResult(user, emailAddress, {
        success: false,
        error: "Token refresh failed - re-authentication required",
        requiresReauth: true,
        instructions:
          "Please sign in again at actioneer.online to refresh your OAuth connection",
        method: "token_refresh_failed",
      });
      return;
    }

    console.log("🔑 Using valid OAuth token for Gmail API access");

    // Fetch recent emails from Gmail
    console.log("📮 Fetching recent emails from Gmail API...");
    const emailRefs = await fetchRecentEmails(
      accessToken,
      historyId,
      user,
      emailAddress
    );

    console.log(`📬 Found ${emailRefs.length} recent emails to process`);
    if (emailRefs.length === 0) {
      console.log("📭 No recent emails found to process");
      await updateNotificationResult(user, emailAddress, {
        success: true,
        processedCount: 0,
        method: "direct_processing",
      });
      return;
    }

    let processedCount = 0;
    let jobApplicationsFound = 0;
    let receiptsFound = 0;

    // Process each email
    for (const emailRef of emailRefs) {
      try {
        const emailContent = await fetchEmailContent(emailRef.id, accessToken);

        if (!emailContent) {
          console.log(`⚠️ Could not fetch content for email ${emailRef.id}`);
          continue;
        }

        // Check if we've already processed this email (by message_id or content similarity)
        const { data: existingEmails, error: existingError } = await supabase
          .from("emails")
          .select("id, classification, message_id")
          .eq("user_id", user.id)
          .or(
            `message_id.eq.${
              emailRef.id
            },and(subject.eq."${emailContent.subject.replace(
              /"/g,
              '\\"'
            )}",from_email.eq."${emailContent.from.replace(
              /"/g,
              '\\"'
            )}",date.eq."${emailContent.date}")`
          )
          .limit(5);

        if (existingEmails && existingEmails.length > 0 && !existingError) {
          console.log(
            `⏭️ Email already processed (found ${existingEmails.length} similar emails), skipping`
          );
          console.log(
            `📋 Existing message IDs: ${existingEmails
              .map((e) => e.message_id)
              .join(", ")}`
          );
          continue;
        }

        console.log(`📄 Processing email: ${emailContent.subject}`);

        // Classify the email using our enhanced classification function
        const classification = await classifyEmailWithEnhancedAI(
          emailContent.subject,
          emailContent.from,
          emailContent.body
        );

        console.log(`🎯 Email classified as: ${classification.type}`);

        // Early exit for "other" category - we don't store irrelevant emails
        if (classification.type === "other") {
          console.log(
            "🚫 Email classified as 'other' - skipping storage (not relevant to Actioneer)"
          );
          continue;
        }

        // Store only relevant emails in database
        const { data: storedEmail, error: storeError } = await supabase
          .from("emails")
          .insert({
            user_id: user.id,
            message_id: emailRef.id,
            subject: emailContent.subject,
            from_email: emailContent.from,
            date: emailContent.date,
            classification: classification.type,
          })
          .select()
          .single();

        if (storeError) {
          console.error("Error storing email:", storeError);
          continue;
        }

        console.log(`✅ Relevant email stored with ID: ${storedEmail.id}`);
        processedCount++;

        // Process based on classification
        if (classification.type === "receipt") {
          await processReceiptEmail(user, emailContent, storedEmail.id);
          receiptsFound++;
          console.log("💰 Receipt processed successfully");
        } else if (classification.type === "job_application") {
          await processJobApplicationEmail(user, emailContent, storedEmail.id);
          jobApplicationsFound++;
          console.log("💼 Job application processed successfully");
        } else if (classification.type === "travel") {
          await processTravelEmail(user, emailContent, storedEmail.id);
          console.log("✈️ Travel email processed successfully");
        }
      } catch (emailError) {
        console.error(`Error processing email ${emailRef.id}:`, emailError);
      }
    }

    // Update notification as processed with results
    await updateNotificationResult(user, emailAddress, {
      success: true,
      processedCount: processedCount,
      receiptsFound: receiptsFound,
      jobApplicationsFound: jobApplicationsFound,
      method: "direct_processing",
    });

    console.log(
      `🎉 Direct processing completed: ${processedCount} emails processed, ${receiptsFound} receipts found, ${jobApplicationsFound} job applications found`
    );
  } catch (error) {
    console.error("Error in direct email processing:", error);
    await logNotificationOnly(user, emailAddress);
  }
}
