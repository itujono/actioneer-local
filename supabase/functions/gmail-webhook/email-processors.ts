import { EmailContent, ProcessingResult } from "./types.ts";
import { supabase } from "./auth-utils.ts";
import { getCountryName } from "./extraction-utils.ts";
import {
  extractJobDataWithAI,
  extractReceiptDataWithAI,
} from "./ai-processors.ts";

export async function processJobApplicationEmail(
  user: any,
  emailContent: EmailContent,
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
        applied_date: (() => {
          // Ensure we always have a valid date - never allow null
          if (jobData.appliedDate && jobData.appliedDate !== null) {
            return jobData.appliedDate;
          }

          // Fallback to email date
          try {
            return new Date(emailContent.date).toISOString().split("T")[0];
          } catch (dateError) {
            console.warn(
              "⚠️ Invalid email date, using current date:",
              emailContent.date
            );
            return new Date().toISOString().split("T")[0];
          }
        })(),
        country_code: jobData.countryCode || null,
        country: jobData.countryCode
          ? getCountryName(jobData.countryCode)
          : null,
        website: jobData.website || "-",
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

export async function processReceiptEmail(
  user: any,
  emailContent: EmailContent,
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
        merchant: receiptData.vendor || "Unknown Vendor",
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

export async function processTravelEmail(
  user: any,
  emailContent: EmailContent,
  emailId: string
) {
  try {
    console.log(
      "✈️ Processing travel email via process-travel Edge Function:",
      emailContent.subject
    );

    // Call the same process-travel Edge Function that Apps Script uses
    // This ensures consistent processing between manual and automatic flows
    const payload = {
      messageId: emailContent.messageId,
      subject: emailContent.subject,
      from: emailContent.from,
      emailBody: emailContent.body,
    };

    const response = await fetch(
      `${Deno.env.get("SUPABASE_URL")}/functions/v1/process-travel`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: Deno.env.get("SUPABASE_ANON_KEY") || "",
          Authorization: `Bearer ${Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")}`,
          "x-user-api-key": user.api_key,
        },
        body: JSON.stringify(payload),
      }
    );

    if (response.ok) {
      const result = await response.json();
      console.log(
        "✅ Travel email processed successfully via Edge Function:",
        result.travelId
      );
      console.log(
        "🏖️ Extracted data:",
        JSON.stringify(result.extractedData, null, 2)
      );
    } else {
      const errorText = await response.text();
      console.error("❌ Travel processing failed:", errorText);
    }
  } catch (error) {
    console.error("Error processing travel email:", error);
  }
}

// Note: extractBasicTravelInfo function moved to process-travel Edge Function
// to centralize travel processing logic and avoid duplication

export async function logNotificationOnly(user: any, emailAddress: string) {
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

  console.log("👍 User can manually process new emails via dashboard");
}

export async function updateNotificationResult(
  user: any,
  emailAddress: string,
  result: ProcessingResult
) {
  try {
    await supabase
      .from("email_notifications")
      .update({
        processed: true,
        processed_at: new Date().toISOString(),
        processing_result: result,
      })
      .eq("user_id", user.id)
      .eq("email_address", emailAddress)
      .order("created_at", { ascending: false })
      .limit(1);
  } catch (error) {
    console.error("Error updating notification result:", error);
  }
}
