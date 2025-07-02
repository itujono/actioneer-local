import { OpenAI } from "npm:openai@4";
import { JobData, ReceiptData, ClassificationResult } from "./types.ts";
import {
  extractCompanyFromEmail,
  extractCompanyFromText,
  extractPositionFromText,
  extractStatusFromText,
  extractWebsiteFromEmail,
  extractCountryFromEmail,
  extractCountryFromEmailBody,
  validateStatus,
  validateDate,
  extractVendorFromEmail,
  extractVendorFromText,
  extractAmountFromText,
  extractCategoryFromText,
  extractInvoiceNumber,
} from "./extraction-utils.ts";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
});

export async function extractJobDataWithAI(subject: string, from: string, emailBody: string): Promise<JobData> {
  const prompt = `
    Analyze this job-related email and extract the following information:
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 2000)}
    
    Please extract and return a JSON object with:
    {
      "company": "Company name (extracted from email domain, subject, or body)",
      "position": "Job position/title mentioned in the email",
      "status": "One of: applied, next_step, interview, offer, rejected, accepted",
      "appliedDate": "ACTUAL date when the application was submitted or email was sent in YYYY-MM-DD format (DO NOT use today's date - extract from email content or leave null)",
      "confidence": "Your confidence level (0-1) in the extraction",
      "countryCode": "ISO 3166-1 alpha-2 country code ONLY if explicitly mentioned or determinable from company location (e.g., US, GB, CA) - leave null if uncertain",
      "website": "Company website URL if found in email signature, footer, or body (extract from signatures, contact info, or explicit mentions) - use '-' if not found",
      "details": {
        "workLocation": "Remote/On-site/Hybrid if mentioned",
        "salary": "Salary range if mentioned",
        "department": "Department if mentioned",
        "applicationDeadline": "Deadline if mentioned",
        "nextSteps": "Next steps mentioned in the email"
      }
    }
    
    EXTRACTION GUIDELINES:
    
    Company Name:
    - Look for patterns like "Role at Company Name", "Position Role at Company Name"
    - Check email signatures (company name often appears there)
    - Look after "at", "from", "with", or before "team/careers/hiring"
    - Extract from email domain if not from common providers (gmail, yahoo, etc.)
    - Examples: "Senior Developer Role at The Puzzlers" → company: "The Puzzlers"
    
    Position/Role:
    - Look for job titles like "Senior Developer", "Software Engineer", "Product Manager", etc.
    - Check subject lines for patterns like "Final Step for Name - Position Role"
    - Look for titles before "at Company" or "role/position"
    - Examples: "Senior Developer Role at Company" → position: "Senior Developer"
    
    Status determination rules:
    - "applied": Initial application confirmation, acknowledgment only
    - "next_step": Email mentions moving to next stage, additional information requested, assessment/test invitation, portfolio review, or progression beyond initial application
    - "interview": Explicit interview invitation, scheduling, or confirmation
    - "offer": Job offer, contract, or acceptance letter
    - "rejected": Rejection, regret letter, or "not moving forward"
    - "accepted": Welcome messages, onboarding, or acceptance confirmation
    
    Pay special attention to "next_step" status for emails that indicate:
    - "We'd like to move forward with your application"
    - "Please complete this assessment/test"
    - "We need additional information"
    - "Next step in our process"
    - "We're excited to proceed with your candidacy"
    - "Take-home assignment" or coding challenge
    - "Portfolio review" or "technical review"
    - Any progression beyond initial application receipt
    
    For country detection, consider:
    - Company headquarters location if explicitly mentioned
    - Domain TLD (.co.uk = GB, .ca = CA, etc.)
    - Explicit country mentions in email signatures or content
    - Office locations mentioned in email signatures
    - Location pin emoji (📍) followed by city and country (e.g., "📍 Beth, United Kingdom" → GB)
    - Address information in signatures
    - Country names in contact information
    - Company location mentions (e.g., "London-based", "based in Germany")
    - IMPORTANT: Look for patterns like "📍 City, Country", "Location: Country", "Based in Country"
    
    For website extraction, look for:
    - URLs in email signatures (like www.company.com, https://company.com)
    - Company website mentions in contact information
    - Email footer links
    - Company domain from email address (if not from common providers like gmail.com)
    - Links to company careers pages or main site
    - Remove mailto:, tel:, and other non-web protocols
    - Prefer main company website over specific career page URLs
    
    For appliedDate:
    - Look for actual dates mentioned in the email (application submission dates, dates referenced in email content)
    - Check email headers or timestamps if available
    - If no specific application date is found, leave as null - DO NOT use current/today's date
    
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
      return fallbackJobExtraction(subject, from, emailBody);
    }

    // Validate and clean the data
    return {
      company: jobData.company || extractCompanyFromEmail(from),
      position: jobData.position || "Unknown Position",
      status: validateStatus(jobData.status) || "applied",
      appliedDate: jobData.appliedDate || null,
      confidence: jobData.confidence || 0.5,
      countryCode: jobData.countryCode || extractCountryFromEmail(from) || extractCountryFromEmailBody(emailBody),
      website: jobData.website || extractWebsiteFromEmail(from, emailBody),
      details: jobData.details || {},
    };
  } catch (error) {
    console.error("Error with OpenAI job extraction:", error);
    return fallbackJobExtraction(subject, from, emailBody);
  }
}

export function fallbackJobExtraction(subject: string, from: string, emailBody: string): JobData {
  console.log("🔄 Using fallback job extraction");

  const company = extractCompanyFromEmail(from) || extractCompanyFromText(subject + " " + emailBody);
  const position = extractPositionFromText(subject + " " + emailBody);
  const status = extractStatusFromText(subject + " " + emailBody);
  const website = extractWebsiteFromEmail(from, emailBody);

  return {
    company: company || "Unknown Company",
    position: position || "Unknown Position",
    status: status || "applied",
    appliedDate: null,
    confidence: 0.3,
    countryCode: extractCountryFromEmail(from) || extractCountryFromEmailBody(emailBody),
    website: website,
    details: {
      extractionMethod: "fallback",
      emailFrom: from,
      emailSubject: subject,
    },
  };
}

export async function extractReceiptDataWithAI(subject: string, from: string, emailBody: string): Promise<ReceiptData> {
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
      return fallbackReceiptExtraction(subject, from, emailBody);
    }

    // Validate and clean the data
    return {
      vendor: receiptData.vendor || extractVendorFromEmail(from),
      amount: parseFloat(receiptData.amount) || null,
      currency: receiptData.currency || "USD",
      receiptDate: validateDate(receiptData.receiptDate) || new Date().toISOString().split("T")[0],
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

export function fallbackReceiptExtraction(subject: string, from: string, emailBody: string): ReceiptData {
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

export async function classifyEmailWithEnhancedAI(
  subject: string,
  from: string,
  emailBody: string
): Promise<ClassificationResult> {
  console.log("🤖 Starting AI-FIRST email classification in Gmail webhook...");
  console.log("📧 Email preview:", {
    subject,
    from,
    bodyPreview: emailBody.substring(0, 200) + "...",
  });

  try {
    // Use AI for ALL classification with enhanced prompts
    console.log("🧠 Using enhanced AI classification...");
    const prompt = buildAdvancedClassificationPrompt(subject, from, emailBody);

    // Use the existing OpenAI instance from the top of the file
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use latest and most capable model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Lower temperature for more consistent results
      response_format: { type: "json_object" },
    });

    let response = completion.choices[0].message.content;
    if (!response) throw new Error("Empty response from OpenAI");

    console.log("🤖 AI raw response:", response);

    const classification = JSON.parse(response);

    // Validate AI response
    if (!classification.type || !classification.confidence || !classification.reasoning) {
      throw new Error("Invalid AI response format");
    }

    console.log("✅ AI classification successful:", {
      type: classification.type,
      confidence: classification.confidence,
      reasoning: classification.reasoning.substring(0, 100) + "...",
    });

    return {
      type: classification.type,
      confidence: classification.confidence,
      reasoning: classification.reasoning,
      method: "ai-primary",
    };
  } catch (error) {
    console.error("❌ AI classification failed:", error);
    // Only if AI completely fails, fall back to 'other'
    return {
      type: "other",
      confidence: 0.1,
      reasoning: `AI classification error: ${error.message}`,
      method: "ai-fallback",
    };
  }
}

function buildAdvancedClassificationPrompt(subject: string, from: string, emailBody: string): string {
  return `You are an expert email classifier. Analyze this email and classify it into ONE of these categories:

CATEGORIES:
1. "receipt" - Money you SPENT (purchases, bills, subscriptions you paid for)
2. "revenue" - Money you RECEIVED (payments to you, refunds, income, earnings)  
3. "travel" - Travel deals, promotions, booking offers (NOT confirmations)
4. "job_application" - Job applications, career opportunities, employment
5. "other" - Everything else

⚠️ CRITICAL: REVENUE vs PROMOTIONAL OFFERS - This is the most important distinction!

REVENUE (money already in your account):
- "Payment received" - money already arrived
- "Refund processed" - money already returned
- "Funds deposited to your account" - money already there
- "Your earnings have been processed" - money already credited
- "Withdrawal successful" - money already transferred to bank
- "Invoice paid" - client already paid you
- "Commission earned" - you already earned commission

PROMOTIONAL OFFERS (classify as "other" - these are marketing, not actual money):
- "Get bonus worth $X" - offering potential money
- "Earn rewards up to $X" - promising potential earnings
- "Claim your prize" - invitation to claim, not actual receipt
- "Dapatkan hadiah" (Indonesian: "Get reward") - offering reward
- "Bonus senilai" (Indonesian: "Bonus worth") - promotional offer
- "First time bonus" - promotional incentive
- "Sign up and get" - registration incentive
- "Trade and earn" - conditional earning opportunity
- "Swap crypto and receive" - activity-based reward offer
- ANY email with call-to-action buttons like "Claim Now", "Get Started", "Join Now"
- ANY email with terms like "minimum deposit", "requirements", "valid until"

🔍 KEY DETECTION PATTERNS FOR PROMOTIONAL OFFERS:
- Future conditional language: "IF you do X, THEN you get Y"
- Action required: "Click here", "Sign up", "Complete your first trade"
- Conditional rewards: "When you deposit", "After you swap", "Once you complete"
- Marketing language: "Limited time", "Special offer", "Exclusive deal"
- Indonesian promotional terms: "dapatkan", "klaim", "hadiah", "bonus", "promosi"

Email to classify:
Subject: ${subject}
From: ${from}
Content: ${emailBody}

DECISION FRAMEWORK:
1. Is this about money ALREADY received/deposited? → "revenue"
2. Is this about money ALREADY spent/charged? → "receipt" 
3. Is this offering/promising money IF you do something? → "other" (promotional)
4. Is this about travel bookings/deals? → "travel"
5. Is this about job applications/employment? → "job_application"
6. Everything else → "other"

EXAMPLES TO HELP YOU:
❌ WRONG: "Earn SOL worth $50 when you trade" → This is promotional (offering conditional reward)
✅ CORRECT: "Your SOL reward has been deposited" → This would be revenue (already received)

❌ WRONG: "Get bonus Rp50,000 for first swap" → This is promotional (conditional offer)
✅ CORRECT: "Bonus Rp50,000 credited to your account" → This would be revenue (already received)

Return ONLY a JSON object with:
{
  "type": "receipt|revenue|travel|job_application|other",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation focusing on whether this is actual money movement vs promotional offer"
}`;
}
