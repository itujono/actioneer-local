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

// Gmail API configuration
const GMAIL_API_BASE_URL = "https://gmail.googleapis.com/gmail/v1";

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

    // Log notification for manual processing via Gmail add-on
    console.log("📝 Logging notification - manual processing required");
    await logNotificationOnly(user, emailAddress);

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
    console.log(
      "📨 Starting webhook-based email processing for:",
      emailAddress
    );
    console.log("🚀 Triggering Apps Script processing...");

    // Get Apps Script webhook URL from environment
    const appsScriptWebhookUrl = Deno.env.get("APPS_SCRIPT_WEBHOOK_URL");

    if (
      !appsScriptWebhookUrl ||
      appsScriptWebhookUrl === "placeholder_for_now"
    ) {
      console.log(
        "⚠️ Apps Script webhook URL not configured yet, logging notification for manual processing"
      );
      console.log(
        "💡 You can manually run 'testProcessRecentEmails()' in Apps Script to process emails"
      );
      await logNotificationOnly(user, emailAddress);
      return;
    }

    // Trigger Apps Script to process recent emails
    const webhookPayload = {
      userEmail: emailAddress,
      historyId: historyId,
      action: "process_recent_emails",
      triggeredAt: new Date().toISOString(),
      userId: user.id,
    };

    console.log(
      "📤 Sending webhook to Apps Script:",
      JSON.stringify(webhookPayload, null, 2)
    );

    try {
      const response = await fetch(appsScriptWebhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(webhookPayload),
      });

      if (!response.ok) {
        throw new Error(
          `Apps Script webhook failed: ${response.status} ${response.statusText}`
        );
      }

      const result = await response.json();
      console.log("✅ Apps Script response:", JSON.stringify(result, null, 2));

      if (result.success && result.result) {
        const { processedCount, jobApplicationsFound } = result.result;

        if (processedCount < 1) {
          console.log("🔄 No emails processed, skipping");
          return;
        }

        console.log(
          `🎉 Apps Script processed ${processedCount} emails, found ${jobApplicationsFound} job applications`
        );

        // Update notification with processing results
        await supabase
          .from("email_notifications")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            processing_result: {
              success: true,
              processedCount: processedCount,
              jobApplicationsFound: jobApplicationsFound,
              triggeredByWebhook: true,
            },
          })
          .eq("user_id", user.id)
          .eq("email_address", emailAddress)
          .order("created_at", { ascending: false })
          .limit(1);
      } else {
        console.error("❌ Apps Script processing failed:", result);
        await supabase
          .from("email_notifications")
          .update({
            processed: true,
            processed_at: new Date().toISOString(),
            processing_result: {
              success: false,
              error: result.error || "Unknown error",
              triggeredByWebhook: true,
            },
          })
          .eq("user_id", user.id)
          .eq("email_address", emailAddress)
          .order("created_at", { ascending: false })
          .limit(1);
      }
    } catch (fetchError) {
      console.error("💥 Error calling Apps Script webhook:", fetchError);

      // Fall back to notification logging
      await logNotificationOnly(user, emailAddress);
    }

    console.log("✅ Webhook processing completed");
  } catch (error) {
    console.error("Error in webhook email processing:", error);
  }
}

async function processEmailsDirectly(
  user: any,
  emailAddress: string,
  historyId?: string
) {
  try {
    console.log("🔄 Processing emails directly via Supabase Edge Function");

    // Get access token for the user
    const { data: authData, error: authError } = await supabase
      .from("user_auth_tokens")
      .select("gmail_access_token")
      .eq("user_id", user.id)
      .single();

    if (authError || !authData?.gmail_access_token) {
      console.error("❌ No valid access token found for user:", authError);
      await logNotificationOnly(user, emailAddress);
      return;
    }

    // Fetch recent emails from Gmail
    const emailRefs = await fetchRecentEmails(
      authData.gmail_access_token,
      historyId
    );
    console.log(`📧 Found ${emailRefs.length} recent emails to process`);

    let processedCount = 0;
    let receiptsFound = 0;

    // Process each email
    for (const emailRef of emailRefs) {
      try {
        const emailContent = await fetchEmailContent(
          emailRef.id,
          authData.gmail_access_token
        );

        if (!emailContent) {
          console.log(`⚠️ Could not fetch content for email ${emailRef.id}`);
          continue;
        }

        // Check if we've already processed this email
        const { data: existingEmail, error: existingError } = await supabase
          .from("emails")
          .select("id, classification")
          .eq("message_id", emailRef.id)
          .eq("user_id", user.id)
          .single();

        if (existingEmail && !existingError) {
          console.log(`⏭️ Email ${emailRef.id} already processed, skipping`);
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

        // Store email in database
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

        console.log(`✅ Email stored with ID: ${storedEmail.id}`);
        processedCount++;

        // Process based on classification
        if (classification.type === "receipt") {
          await processReceiptEmail(user, emailContent, storedEmail.id);
          receiptsFound++;
          console.log("💰 Receipt processed successfully");
        } else if (classification.type === "job_application") {
          await processJobApplicationEmail(user, emailContent, storedEmail.id);
        } else if (classification.type === "travel") {
          await processTravelEmail(user, emailContent, storedEmail.id);
        }
      } catch (emailError) {
        console.error(`Error processing email ${emailRef.id}:`, emailError);
      }
    }

    // Update notification as processed with results
    await supabase
      .from("email_notifications")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        processing_result: {
          success: true,
          processedCount: processedCount,
          receiptsFound: receiptsFound,
          processedDirectly: true,
        },
      })
      .eq("user_id", user.id)
      .eq("email_address", emailAddress)
      .order("created_at", { ascending: false })
      .limit(1);

    console.log(
      `🎉 Direct processing completed: ${processedCount} emails processed, ${receiptsFound} receipts found`
    );
  } catch (error) {
    console.error("Error in direct email processing:", error);
    await logNotificationOnly(user, emailAddress);
  }
}

async function logNotificationOnly(user: any, emailAddress: string) {
  console.log("📝 Logging notification without processing");

  // Update the notification as processed (but without automatic processing)
  await supabase
    .from("email_notifications")
    .update({
      processed: true,
      processed_at: new Date().toISOString(),
      processing_result: {
        success: false,
        error: "Apps Script webhook not configured",
        manualProcessingRequired: true,
      },
    })
    .eq("user_id", user.id)
    .eq("email_address", emailAddress)
    .order("created_at", { ascending: false })
    .limit(1);

  console.log("👍 User can manually process new emails via Gmail add-on");
}

async function fetchRecentEmails(accessToken: string, historyId?: string) {
  try {
    let url = `${GMAIL_API_BASE_URL}/users/me/messages?maxResults=10&q=is:unread newer_than:1h`;

    // If we have a history ID, we can fetch only emails since that point
    if (historyId) {
      url = `${GMAIL_API_BASE_URL}/users/me/history?startHistoryId=${historyId}&maxResults=10`;
    }

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    if (!response.ok) {
      if (response.status === 401) {
        console.log("🔄 Access token expired, need to refresh");
        // TODO: Implement token refresh logic
        return [];
      }
      throw new Error(
        `Gmail API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();

    if (historyId && data.history) {
      // Extract message IDs from history
      const messageIds: { id: string }[] = [];
      for (const historyItem of data.history) {
        if (historyItem.messagesAdded) {
          for (const messageAdded of historyItem.messagesAdded) {
            messageIds.push({ id: messageAdded.message.id });
          }
        }
      }
      return messageIds;
    }

    return data.messages || [];
  } catch (error) {
    console.error("Error fetching recent emails:", error);
    return [];
  }
}

// async function processEmailForUser(
//   user: any,
//   emailRef: any,
//   accessToken: string
// ) {
//   try {
//     console.log(`📧 Processing email ${emailRef.id} for user ${user.email}`);

//     // Check if we've already processed this email
//     const { data: existingEmail, error: existingError } = await supabase
//       .from("emails")
//       .select("id")
//       .eq("message_id", emailRef.id)
//       .eq("user_id", user.id)
//       .single();

//     if (existingEmail && !existingError) {
//       console.log(`⏭️ Email ${emailRef.id} already processed, skipping`);
//       return;
//     }

//     // Fetch full email content
//     const emailContent = await fetchEmailContent(emailRef.id, accessToken);

//     if (!emailContent) {
//       console.log(`⚠️ Could not fetch content for email ${emailRef.id}`);
//       return;
//     }

//     console.log(`📄 Fetched email: ${emailContent.subject}`);

//     // Classify the email using our enhanced classification function
//     const classification = await classifyEmailWithEnhancedAI(
//       emailContent.subject,
//       emailContent.from,
//       emailContent.body
//     );

//     console.log(`🎯 Email classified as: ${classification.type}`);

//     // Store email in database
//     const { data: storedEmail, error: storeError } = await supabase
//       .from("emails")
//       .insert({
//         user_id: user.id,
//         message_id: emailRef.id,
//         subject: emailContent.subject,
//         from_email: emailContent.from,
//         date: emailContent.date,
//         classification: classification.type,
//       })
//       .select()
//       .single();

//     if (storeError) {
//       console.error("Error storing email:", storeError);
//       return;
//     }

//     console.log(`✅ Email stored with ID: ${storedEmail.id}`);

//     // Process based on classification
//     if (classification.type === "job_application") {
//       await processJobApplicationEmail(user, emailContent, storedEmail.id);
//     } else if (classification.type === "travel") {
//       await processTravelEmail(user, emailContent, storedEmail.id);
//     } else if (classification.type === "receipt") {
//       await processReceiptEmail(user, emailContent, storedEmail.id);
//     }
//   } catch (error) {
//     console.error(`Error processing email ${emailRef.id}:`, error);
//   }
// }

async function fetchEmailContent(messageId: string, accessToken: string) {
  try {
    const response = await fetch(
      `${GMAIL_API_BASE_URL}/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Gmail API error: ${response.status} ${response.statusText}`
      );
    }

    const message = await response.json();

    // Extract email data from Gmail API response
    const headers = message.payload.headers;
    const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
    const from = headers.find((h: any) => h.name === "From")?.value || "";
    const date = headers.find((h: any) => h.name === "Date")?.value || "";

    // Extract body content
    let body = "";
    if (message.payload.body?.data) {
      body = atob(
        message.payload.body.data.replace(/-/g, "+").replace(/_/g, "/")
      );
    } else if (message.payload.parts) {
      // Handle multipart messages
      for (const part of message.payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          body = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          break;
        }
      }
    }

    // Extract attachments
    const attachments = await extractAttachments(message, accessToken);

    return {
      messageId,
      subject,
      from,
      date: new Date(date).toISOString(),
      body,
      attachments,
    };
  } catch (error) {
    console.error("Error fetching email content:", error);
    return null;
  }
}

async function extractAttachments(message: any, accessToken: string) {
  const attachments: any[] = [];

  async function processMessageParts(parts: any[]) {
    for (const part of parts) {
      // Check if this part has nested parts (multipart)
      if (part.parts && part.parts.length > 0) {
        await processMessageParts(part.parts);
      }

      // Check if this is an attachment
      if (part.body?.attachmentId) {
        try {
          // Get attachment metadata
          const filename = part.filename || "unknown";
          const mimeType = part.mimeType || "application/octet-stream";
          const size = part.body.size || 0;

          console.log(
            `📎 Found attachment: ${filename} (${mimeType}, ${size} bytes)`
          );

          // Only process relevant file types for receipts
          const relevantTypes = [
            "application/pdf",
            "image/jpeg",
            "image/jpg",
            "image/png",
            "image/gif",
            "text/html",
            "text/plain",
          ];

          if (
            relevantTypes.some((type) =>
              mimeType.toLowerCase().includes(type.toLowerCase())
            )
          ) {
            // Fetch the actual attachment data
            const attachmentResponse = await fetch(
              `${GMAIL_API_BASE_URL}/users/me/messages/${message.id}/attachments/${part.body.attachmentId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (attachmentResponse.ok) {
              const attachmentData = await attachmentResponse.json();

              // For now, we'll store the attachment metadata and a flag that it exists
              // In a production environment, you'd want to upload to Supabase Storage
              attachments.push({
                filename,
                mimeType,
                size,
                attachmentId: part.body.attachmentId,
                // Note: In production, you'd upload the data to storage and store the URL
                hasData: true,
                downloadUrl: null, // Would be populated after uploading to storage
              });

              console.log(`✅ Attachment processed: ${filename}`);
            } else {
              console.log(
                `⚠️ Failed to fetch attachment data for: ${filename}`
              );
            }
          } else {
            console.log(
              `⏭️ Skipping non-receipt attachment: ${filename} (${mimeType})`
            );
          }
        } catch (error) {
          console.error(`Error processing attachment:`, error);
        }
      }
    }
  }

  // Process message parts if they exist
  if (message.payload.parts) {
    await processMessageParts(message.payload.parts);
  }

  console.log(`📎 Total attachments found: ${attachments.length}`);
  return attachments;
}

async function processJobApplicationEmail(
  user: any,
  emailContent: any,
  emailId: string
) {
  try {
    console.log("💼 Processing job application email");

    // Check if job application already exists for this email
    const { data: existingJob, error: existingError } = await supabase
      .from("job_applications")
      .select("*")
      .eq("email_id", emailContent.messageId)
      .eq("user_id", user.id)
      .single();

    if (existingJob && !existingError) {
      console.log("✅ Job application already exists for this email");
      return;
    }

    // Extract job application data using OpenAI
    const jobData = await extractJobDataWithAI(
      emailContent.subject,
      emailContent.from,
      emailContent.body
    );

    console.log("🤖 Extracted job data:", JSON.stringify(jobData, null, 2));

    // Store job application in database
    const { data: storedJob, error: storeError } = await supabase
      .from("job_applications")
      .insert({
        user_id: user.id,
        email_id: emailContent.messageId,
        company: jobData.company || "Unknown Company",
        position: jobData.position || "Unknown Position",
        status: jobData.status || "applied",
        applied_date:
          jobData.appliedDate || new Date().toISOString().split("T")[0],
        details: {
          ...jobData,
          originalEmail: {
            subject: emailContent.subject,
            from: emailContent.from,
            processedAt: new Date().toISOString(),
          },
        },
      })
      .select()
      .single();

    if (storeError) {
      console.error("Error storing job application:", storeError);
      return;
    }

    console.log(`✅ Job application stored with ID: ${storedJob.id}`);
    console.log(
      `📊 Company: ${storedJob.company}, Position: ${storedJob.position}`
    );
  } catch (error) {
    console.error("Error processing job application email:", error);
  }
}

async function processTravelEmail(
  user: any,
  emailContent: any,
  emailId: string
) {
  try {
    console.log("✈️ Processing travel email");
    // TODO: Implement travel email processing
    console.log("🚧 Travel processing not yet implemented");
  } catch (error) {
    console.error("Error processing travel email:", error);
  }
}

async function processReceiptEmail(
  user: any,
  emailContent: any,
  emailId: string
) {
  try {
    console.log("💰 Processing receipt email");

    // Check if receipt already exists for this email
    const { data: existingReceipt, error: existingError } = await supabase
      .from("receipts")
      .select("*")
      .eq("email_id", emailContent.messageId)
      .eq("user_id", user.id)
      .single();

    if (existingReceipt && !existingError) {
      console.log("✅ Receipt already exists for this email");
      return;
    }

    // Extract receipt data using AI
    const receiptData = await extractReceiptDataWithAI(
      emailContent.subject,
      emailContent.from,
      emailContent.body
    );

    console.log(
      "🤖 Extracted receipt data:",
      JSON.stringify(receiptData, null, 2)
    );

    // Process attachments for additional context
    const attachments = emailContent.attachments || [];
    console.log(`📎 Processing ${attachments.length} attachments for receipt`);

    // Store receipt in database with attachments
    const { data: storedReceipt, error: storeError } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        email_id: emailContent.messageId,
        merchant:
          receiptData.vendor || extractVendorFromEmail(emailContent.from),
        amount: receiptData.amount || null,
        currency: receiptData.currency || "USD",
        date: receiptData.receiptDate || new Date().toISOString().split("T")[0],
        category: receiptData.category || "other",
        attachments: attachments,
        attachment_count: attachments.length,
        items: {
          ...receiptData,
          originalEmail: {
            subject: emailContent.subject,
            from: emailContent.from,
            processedAt: new Date().toISOString(),
          },
        },
      })
      .select()
      .single();

    if (storeError) {
      console.error("Error storing receipt:", storeError);
      return;
    }

    console.log(`✅ Receipt stored with ID: ${storedReceipt.id}`);
    console.log(
      `📊 Merchant: ${storedReceipt.merchant}, Amount: ${storedReceipt.amount}, Attachments: ${storedReceipt.attachment_count}`
    );
  } catch (error) {
    console.error("Error processing receipt email:", error);
  }
}

// Enhanced classification using our improved classify-email function
async function classifyEmailWithEnhancedAI(
  subject: string,
  from: string,
  emailBody: string
) {
  try {
    // Call our enhanced classify-email function
    const classifyResponse = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/classify-email`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_ANON_KEY")}`,
        },
        body: JSON.stringify({
          emailData: {
            subject,
            from,
            body: emailBody,
          },
        }),
      }
    );

    if (classifyResponse.ok) {
      const classificationResult = await classifyResponse.json();
      console.log("🎯 Enhanced classification result:", classificationResult);
      return {
        type: classificationResult.classification?.type || "other",
        confidence: classificationResult.classification?.confidence || 0.5,
        method: classificationResult.classification?.method || "enhanced-ai",
      };
    } else {
      console.log("⚠️ Enhanced classification failed, using fallback");
      return await fallbackClassification(subject, from, emailBody);
    }
  } catch (error) {
    console.error("Enhanced classification error:", error);
    return await fallbackClassification(subject, from, emailBody);
  }
}

// Fallback classification for when enhanced classification fails
async function fallbackClassification(
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

async function extractReceiptDataWithAI(
  subject: string,
  from: string,
  emailBody: string
) {
  const prompt = `
    Analyze this receipt/invoice email and extract the following information:
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 2000)}
    
    Please extract and return a JSON object with:
    {
      "vendor": "Company/vendor name",
      "amount": "Numerical amount (no currency symbol)",
      "currency": "Currency code (USD, EUR, etc.)",
      "receiptDate": "Date in YYYY-MM-DD format",
      "category": "expense category (software, office_supplies, utilities, etc.)",
      "description": "Brief description of the purchase",
      "receiptType": "One of: purchase, invoice, subscription, digital",
      "invoiceNumber": "Invoice/receipt number if present",
      "confidence": "Your confidence level (0-1) in the extraction"
    }
    
    Category guidelines:
    - "software": SaaS subscriptions, software licenses, cloud services
    - "office_supplies": Business supplies, equipment
    - "utilities": Internet, phone, electricity bills
    - "travel": Transportation, hotels, meals during travel
    - "entertainment": Meals, events not related to travel
    - "other": General expenses that don't fit other categories
    
    Receipt type guidelines:
    - "purchase": One-time purchases
    - "invoice": Invoices requiring/confirming payment
    - "subscription": Recurring subscriptions or renewals
    - "digital": Digital purchases (apps, media, etc.)
    
    IMPORTANT: Respond with ONLY valid JSON, no markdown formatting or code blocks.
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

    console.log("🤖 OpenAI receipt response:", response);

    let receiptData;
    try {
      receiptData = JSON.parse(response);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", response);

      // Fallback extraction
      receiptData = fallbackReceiptExtraction(subject, from, emailBody);
    }

    // Validate and clean the data
    return {
      vendor: receiptData.vendor || extractVendorFromEmail(from),
      amount: parseFloat(receiptData.amount) || null,
      currency: receiptData.currency || "USD",
      receiptDate:
        validateDate(receiptData.receiptDate) ||
        new Date().toISOString().split("T")[0],
      category: receiptData.category || "other",
      description: receiptData.description || subject,
      receiptType: receiptData.receiptType || "purchase",
      invoiceNumber: receiptData.invoiceNumber || null,
      confidence: receiptData.confidence || 0.5,
    };
  } catch (error) {
    console.error("Error with OpenAI receipt extraction:", error);
    return fallbackReceiptExtraction(subject, from, emailBody);
  }
}

function fallbackReceiptExtraction(
  subject: string,
  from: string,
  emailBody: string
) {
  console.log("🔄 Using fallback receipt extraction");

  const vendor = extractVendorFromEmail(from) || extractVendorFromText(subject);
  const amount = extractAmountFromText(subject + " " + emailBody);
  const category = extractCategoryFromText(subject + " " + emailBody);

  return {
    vendor: vendor || "Unknown Vendor",
    amount: amount,
    currency: "USD",
    receiptDate: new Date().toISOString().split("T")[0],
    category: category || "other",
    description: subject,
    receiptType: "purchase",
    invoiceNumber: extractInvoiceNumber(subject + " " + emailBody),
    confidence: 0.3,
  };
}

function extractVendorFromEmail(from: string): string | null {
  // Extract vendor from email domain
  const emailMatch = from.match(/@([^.]+)/);
  if (emailMatch && emailMatch[1]) {
    const domain = emailMatch[1];
    // Clean up common domain patterns
    return domain
      .replace(/noreply|no-reply|billing|support|payments/gi, "")
      .replace(/[-_]/g, " ")
      .trim()
      .split(" ")[0]
      .toLowerCase();
  }
  return null;
}

function extractVendorFromText(text: string): string | null {
  // Look for common vendor patterns in text
  const patterns = [
    /(?:receipt from|invoice from|payment to|charged by)\s+([^\n,]+)/i,
    /(?:thank you for|purchase from|order from)\s+([^\n,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

function extractAmountFromText(text: string): number | null {
  // Look for monetary amounts
  const patterns = [
    /\$(\d+(?:\.\d{2})?)/,
    /(\d+\.\d{2})\s*USD/i,
    /total[:\s]*\$?(\d+(?:\.\d{2})?)/i,
    /amount[:\s]*\$?(\d+(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }
  return null;
}

function extractCategoryFromText(text: string): string {
  const textLower = text.toLowerCase();

  if (/software|saas|subscription|license|api|cloud|hosting/.test(textLower)) {
    return "software";
  }
  if (/office|supplies|equipment|desk|chair|computer/.test(textLower)) {
    return "office_supplies";
  }
  if (/internet|phone|cell|mobile|utility|electric|gas/.test(textLower)) {
    return "utilities";
  }
  if (/flight|hotel|travel|uber|lyft|taxi|car rental/.test(textLower)) {
    return "travel";
  }
  if (/restaurant|food|meal|coffee|lunch|dinner/.test(textLower)) {
    return "entertainment";
  }

  return "other";
}

function extractInvoiceNumber(text: string): string | null {
  // Look for invoice/receipt numbers
  const patterns = [
    /(?:invoice|receipt|bill|reference)?\s*[#:]?\s*([A-Z0-9-]{4,})/i,
    /\[#([A-Z0-9-]+)\]/i,
    /\(#([A-Z0-9-]+)\)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}

function validateDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  return date.toISOString().split("T")[0];
}

async function extractJobDataWithAI(
  subject: string,
  from: string,
  emailBody: string
) {
  const prompt = `
    Analyze this job-related email and extract the following information:
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 2000)}
    
    Please extract and return a JSON object with:
    {
      "company": "Company name (extracted from email domain, subject, or body)",
      "position": "Job position/title mentioned in the email",
      "status": "One of: applied, interview, offer, rejected, accepted",
      "appliedDate": "Date in YYYY-MM-DD format (use today's date if not found)",
      "confidence": "Your confidence level (0-1) in the extraction",
      "details": {
        "workLocation": "Remote/On-site/Hybrid if mentioned",
        "salary": "Salary range if mentioned",
        "department": "Department if mentioned",
        "applicationDeadline": "Deadline if mentioned",
        "nextSteps": "Next steps mentioned in the email"
      }
    }
    
    Status determination rules:
    - "applied": Initial application confirmation, acknowledgment
    - "interview": Interview invitation, scheduling, or confirmation
    - "offer": Job offer, contract, or acceptance letter
    - "rejected": Rejection, regret letter, or "not moving forward"
    - "accepted": Welcome messages, onboarding, or acceptance confirmation
    
    IMPORTANT: Respond with ONLY valid JSON, no markdown formatting or code blocks.
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

    console.log("🤖 OpenAI job response:", response);

    let jobData;
    try {
      jobData = JSON.parse(response);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", response);

      // Fallback extraction
      jobData = fallbackJobExtraction(subject, from, emailBody);
    }

    // Validate and clean the data
    return {
      company: jobData.company || extractCompanyFromEmail(from),
      position: jobData.position || "Unknown Position",
      status: validateStatus(jobData.status) || "applied",
      appliedDate:
        validateDate(jobData.appliedDate) ||
        new Date().toISOString().split("T")[0],
      confidence: jobData.confidence || 0.5,
      details: jobData.details || {},
    };
  } catch (error) {
    console.error("Error with OpenAI job extraction:", error);
    return fallbackJobExtraction(subject, from, emailBody);
  }
}

function fallbackJobExtraction(
  subject: string,
  from: string,
  emailBody: string
) {
  console.log("🔄 Using fallback job extraction");

  const company =
    extractCompanyFromEmail(from) ||
    extractCompanyFromText(subject + " " + emailBody);
  const position = extractPositionFromText(subject + " " + emailBody);
  const status = extractStatusFromText(subject + " " + emailBody);

  return {
    company: company || "Unknown Company",
    position: position || "Unknown Position",
    status: status || "applied",
    appliedDate: new Date().toISOString().split("T")[0],
    confidence: 0.3,
    details: {
      extractionMethod: "fallback",
      emailFrom: from,
      emailSubject: subject,
    },
  };
}

function extractCompanyFromEmail(from: string): string | null {
  // Extract company from email domain
  const emailMatch = from.match(/@([^.]+)/);
  if (emailMatch && emailMatch[1]) {
    const domain = emailMatch[1];
    // Skip common email providers
    const commonProviders = [
      "gmail",
      "yahoo",
      "outlook",
      "hotmail",
      "aol",
      "icloud",
    ];
    if (!commonProviders.includes(domain.toLowerCase())) {
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  }
  return null;
}

function extractCompanyFromText(text: string): string | null {
  const companyPatterns = [
    // Match "Company Name" at end of subject after dash
    /-\s*([A-Za-z\s&]+)\s*$/i,
    // Match "from Company Name team"
    /from\s+([A-Za-z\s&]+)(?:\s+team|\s+careers|\s+hr)/i,
    // Match "at Company Name"
    /at\s+([A-Za-z\s&]+)(?:\s+team|\s+careers|\s+hr)/i,
    // Match "Company Name team"
    /([A-Za-z\s&]+)\s+team/i,
    // Match "Company Name careers"
    /([A-Za-z\s&]+)\s+careers/i,
    // Match "Company Name hiring"
    /([A-Za-z\s&]+)\s+hiring/i,
    // Match company name before "and your interest"
    /to\s+the\s+([^,\n\.]+)\s+and\s+your\s+interest/i,
    // Match "Best Regards, Company Name"
    /best\s+regards,\s*([A-Za-z\s&]+)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      const company = match[1].trim();
      // Filter out common non-company words
      const skipWords = [
        "team",
        "careers",
        "hr",
        "hiring",
        "department",
        "position",
        "role",
        "application",
        "job",
      ];
      if (!skipWords.some((word) => company.toLowerCase().includes(word))) {
        return company;
      }
    }
  }
  return null;
}

function extractPositionFromText(text: string): string | null {
  const positionPatterns = [
    // Match "Position (Details) - Company" format
    /to\s+the\s+([^,\n\-]+?)(?:\s*\([^)]*\))?\s*-\s*[A-Za-z\s&]+\s+and/i,
    // Match "for the Position position"
    /for\s+the\s+([^,\n\.]+)\s+(?:position|role)/i,
    // Match "as a/an Position"
    /as\s+(?:a|an)\s+([^,\n\.]+)/i,
    // Match "Position:" format
    /(?:position|role):\s*([^,\n\.]+)/i,
    // Match "applying for Position"
    /applying\s+for\s+([^,\n\.]+)/i,
    // Match "application to the Position"
    /application\s+to\s+the\s+([^,\n\.]+)/i,
  ];

  for (const pattern of positionPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      const position = match[1].trim();
      // Clean up the position text
      const cleanPosition = position
        .replace(/\s*\([^)]*\)\s*/g, "") // Remove parenthetical content
        .replace(/\s*-\s*.*$/, "") // Remove everything after dash
        .trim();

      if (cleanPosition.length > 2) {
        return cleanPosition;
      }
    }
  }
  return null;
}

function extractStatusFromText(text: string): string {
  const lowerText = text.toLowerCase();

  const statusKeywords = {
    rejected: [
      "unfortunately",
      "regret",
      "not selected",
      "not moving forward",
      "decided not to",
      "proceed with another candidate",
      "decided to proceed with",
      "not be moving forward",
      "will not be proceeding",
    ],
    interview: [
      "interview",
      "scheduled",
      "meeting",
      "call",
      "zoom",
      "video call",
      "phone screen",
      "next round",
    ],
    offer: [
      "offer",
      "pleased to extend",
      "job offer",
      "congratulations",
      "excited to offer",
      "happy to offer",
    ],
    accepted: [
      "welcome to",
      "excited to have you",
      "looking forward to working",
      "onboarding",
      "start date",
    ],
  };

  for (const [status, keywords] of Object.entries(statusKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return status;
    }
  }

  return "applied";
}

function validateStatus(status: string): string | null {
  const validStatuses = [
    "applied",
    "interview",
    "offer",
    "rejected",
    "accepted",
  ];
  return validStatuses.includes(status?.toLowerCase())
    ? status.toLowerCase()
    : null;
}
