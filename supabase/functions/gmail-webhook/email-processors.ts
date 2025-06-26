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
    console.log("✈️ Processing travel email (simplified approach)");

    // Check if travel data already exists for this email
    const { data: existingTravel, error: existingError } = await supabase
      .from("travel")
      .select("*")
      .eq("email_id", emailContent.messageId)
      .eq("user_id", user.id)
      .single();

    if (existingTravel && !existingError) {
      console.log("✅ Travel data already exists for this email");
      return;
    }

    // Extract basic travel info locally (lightweight)
    const travelData = extractBasicTravelInfo(emailContent);

    console.log(
      "🧳 Extracted travel data:",
      JSON.stringify(travelData, null, 2)
    );

    // Store travel data in database (simplified)
    const { data: storedTravel, error: storeError } = await supabase
      .from("travel")
      .insert({
        user_id: user.id,
        email_id: emailContent.messageId,
        destination: travelData.destination || null,
        subject: emailContent.subject,
        start_date: travelData.startDate || null,
        end_date: travelData.endDate || null,
        details: {
          travelers: travelData.travelers || 1,
          origin: travelData.origin || null,
          from_email: emailContent.from,
          email_date: emailContent.date,
          preferences: "Extracted from email",
          booking_reference: travelData.bookingReference || null,
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
      console.error("Error storing travel data:", storeError);
      return;
    }

    console.log(`✅ Travel data stored with ID: ${storedTravel.id}`);
    console.log(`🏖️ Destination: ${storedTravel.destination || "Unknown"}`);
  } catch (error) {
    console.error("Error processing travel email:", error);
  }
}

/**
 * Extract basic travel information from email content (local processing)
 * This is much faster than AI processing and good enough for our needs
 */
function extractBasicTravelInfo(emailContent: EmailContent) {
  const subject = emailContent.subject || "";
  const body = emailContent.body || "";
  const from = emailContent.from || "";

  // Simple destination extraction patterns
  const destinationPatterns = [
    // Direct mentions in subject line
    /(?:to|in|visit|destination|traveling to|flying to|trip to|booking in|hotel in|flight to)\s+([A-Z][a-zA-Z\s]{2,25})/gi,
    // City, Country format
    /([A-Z][a-zA-Z\s]{2,15}),\s*([A-Z][a-zA-Z\s]{2,15})/g,
    // Airport codes (common in travel emails)
    /\b([A-Z]{3})\s*(?:airport|to|from|-)/gi,
    // Hotel/booking specific patterns
    /(?:hotel|accommodation|stay|booking).*(?:in|at|near)\s+([A-Z][a-zA-Z\s]{2,25})/gi,
    // Flight specific patterns
    /(?:flight|ticket|booking).*(?:to|destination)\s+([A-Z][a-zA-Z\s]{2,25})/gi,
  ];

  let destination: string | null = null;

  // Try to extract destination from subject first (most reliable)
  for (const pattern of destinationPatterns) {
    const matches = subject.match(pattern);
    if (matches && matches.length > 0) {
      let match = matches[0];

      // Clean up the match
      match = match
        .replace(
          /^(to|in|visit|destination|traveling to|flying to|trip to|booking in|hotel in|flight to|hotel|accommodation|stay|booking|flight|ticket)\s*/i,
          ""
        )
        .replace(/\s*(airport|to|from|-).*$/i, "")
        .trim();

      if (
        match.length > 2 &&
        match.length < 50 &&
        !match.match(/^(and|or|the|of|at|in|on)$/i)
      ) {
        destination = match;
        console.log("🎯 Found destination in subject:", destination);
        break;
      }
    }
  }

  // Extract traveler count
  const travelerPatterns = [
    /(\d+)\s*(?:traveler|passenger|guest|adult|person)/gi,
    /(?:for|party of)\s*(\d+)/gi,
    /(\d+)\s*(?:people|individuals)/gi,
  ];

  let travelers = 1;
  const emailText = `${subject} ${body}`.toLowerCase();

  for (const pattern of travelerPatterns) {
    const matches = emailText.match(pattern);
    if (matches && matches.length > 0) {
      const numberMatch = matches[0].match(/(\d+)/);
      if (numberMatch) {
        const count = parseInt(numberMatch[1]);
        if (count > 0 && count <= 20) {
          travelers = count;
          break;
        }
      }
    }
  }

  // Simple date extraction (basic patterns)
  const datePatterns = [
    /(\d{1,2}[\/\-]\d{1,2}[\/\-]\d{2,4})/g,
    /(\d{4}-\d{2}-\d{2})/g,
  ];

  const foundDates: string[] = [];
  for (const pattern of datePatterns) {
    const matches = emailText.match(pattern);
    if (matches) {
      foundDates.push(...matches.slice(0, 2)); // Max 2 dates
    }
  }

  // Extract booking reference
  const refPatterns = [
    /(?:confirmation|booking|reference).*?([A-Z0-9]{6,})/gi,
    /([A-Z0-9]{6,})/g,
  ];

  let bookingReference: string | null = null;
  for (const pattern of refPatterns) {
    const matches = emailText.match(pattern);
    if (matches && matches.length > 0) {
      const ref = matches[0].replace(/.*?([A-Z0-9]{6,}).*/, "$1");
      if (ref.length >= 6 && ref.length <= 15) {
        bookingReference = ref;
        break;
      }
    }
  }

  return {
    destination: destination,
    travelers: travelers,
    startDate: foundDates.length > 0 ? foundDates[0] : null,
    endDate: foundDates.length > 1 ? foundDates[1] : null,
    bookingReference: bookingReference,
    origin: null, // We'll keep this simple for now
  };
}

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

  console.log("👍 User can manually process new emails via Gmail add-on");
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
