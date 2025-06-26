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

export async function extractJobDataWithAI(
  subject: string,
  from: string,
  emailBody: string
): Promise<JobData> {
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
      countryCode:
        jobData.countryCode ||
        extractCountryFromEmail(from) ||
        extractCountryFromEmailBody(emailBody),
      website: jobData.website || extractWebsiteFromEmail(from, emailBody),
      details: jobData.details || {},
    };
  } catch (error) {
    console.error("Error with OpenAI job extraction:", error);
    return fallbackJobExtraction(subject, from, emailBody);
  }
}

export function fallbackJobExtraction(
  subject: string,
  from: string,
  emailBody: string
): JobData {
  console.log("🔄 Using fallback job extraction");

  const company =
    extractCompanyFromEmail(from) ||
    extractCompanyFromText(subject + " " + emailBody);
  const position = extractPositionFromText(subject + " " + emailBody);
  const status = extractStatusFromText(subject + " " + emailBody);
  const website = extractWebsiteFromEmail(from, emailBody);

  return {
    company: company || "Unknown Company",
    position: position || "Unknown Position",
    status: status || "applied",
    appliedDate: null,
    confidence: 0.3,
    countryCode:
      extractCountryFromEmail(from) || extractCountryFromEmailBody(emailBody),
    website: website,
    details: {
      extractionMethod: "fallback",
      emailFrom: from,
      emailSubject: subject,
    },
  };
}

export async function extractReceiptDataWithAI(
  subject: string,
  from: string,
  emailBody: string
): Promise<ReceiptData> {
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

export function fallbackReceiptExtraction(
  subject: string,
  from: string,
  emailBody: string
): ReceiptData {
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
  try {
    console.log("🎯 Classifying email directly in Gmail webhook");

    // Direct classification using patterns (no authentication needed)
    const classification = classifyEmailDirect(subject, from, emailBody);

    if (classification) {
      console.log(
        "✅ Pattern-based classification successful:",
        classification.type
      );
      return classification;
    }

    console.log("⚠️ Pattern-based classification failed, using AI fallback");
    return await fallbackClassification(subject, from, emailBody);
  } catch (error) {
    console.error("Enhanced classification error:", error);
    return await fallbackClassification(subject, from, emailBody);
  }
}

/**
 * Direct classification using patterns (no external API calls)
 */
function classifyEmailDirect(
  subject: string,
  from: string,
  emailBody: string
): ClassificationResult | null {
  const subjectLower = subject.toLowerCase();
  const fromLower = from.toLowerCase();
  const bodyLower = emailBody.toLowerCase();

  // Travel patterns
  const TRAVEL_PATTERNS = {
    flights: [
      /flight\s+(?:confirmation|booking|itinerary|ticket|receipt)/i,
      /boarding\s+pass/i,
      /e-ticket/i,
      /airline\s+(?:confirmation|booking)/i,
      /check-in\s+(?:reminder|now\s+available|opens)/i,
    ],
    hotels: [
      /hotel\s+(?:confirmation|booking|reservation|receipt)/i,
      /accommodation\s+(?:confirmation|booking)/i,
      /room\s+(?:confirmation|booking|reservation)/i,
      /booking\.com/i,
      /hotels\.com/i,
      /expedia/i,
      /airbnb/i,
    ],
    destinations: [
      /(?:trip|travel|adventure|vacation|holiday|getaway)\s+to\s+[\w\s]+/i,
      /(?:time\s+to|visit|explore|discover)\s+[\w\s]+[!🇹🇷🌍✈️🏖️]/i,
      /your\s+(?:next|upcoming)\s+(?:trip|adventure|vacation|getaway)/i,
      /🧳.*(?:adventure|trip|vacation|travel)/i,
      /✈️.*(?:adventure|trip|vacation|travel)/i,
      /🏨.*(?:stay|hotel|accommodation)/i,
    ],
    general: [
      /travel\s+(?:itinerary|confirmation|booking|receipt)/i,
      /trip\s+(?:confirmation|itinerary|summary)/i,
      /vacation\s+(?:booking|confirmation)/i,
      /travel\s+insurance/i,
      /visa\s+(?:application|confirmation|approval)/i,
    ],
    domains: [
      /booking\.com/i,
      /expedia/i,
      /priceline/i,
      /kayak/i,
      /tripadvisor/i,
      /hotels\.com/i,
      /airbnb/i,
      /delta\.com/i,
      /united\.com/i,
      /american\.com/i,
      // Enhanced travel sender domains
      /trip\.com/i,
      /agoda\.com/i,
      /trivago/i,
      /orbitz/i,
      /travelocity/i,
      /hotwire/i,
      /momondo/i,
      /skyscanner/i,
      /southwest\.com/i,
      /jetblue\.com/i,
      /spirit\.com/i,
      /frontier\.com/i,
      /alaska\.com/i,
      /hawaiian\.com/i,
      /emirates\.com/i,
      /lufthansa\.com/i,
      /britishairways\.com/i,
      /marriott\.com/i,
      /hilton\.com/i,
      /hyatt\.com/i,
      /ihg\.com/i,
      /accor\.com/i,
    ],
  };

  // Check travel patterns
  const hasFlightPattern = TRAVEL_PATTERNS.flights.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );
  const hasHotelPattern = TRAVEL_PATTERNS.hotels.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );
  const hasDestinationPattern = TRAVEL_PATTERNS.destinations.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );
  const hasGeneralTravelPattern = TRAVEL_PATTERNS.general.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );
  const isFromTravelDomain = TRAVEL_PATTERNS.domains.some((pattern) =>
    pattern.test(fromLower)
  );

  // Calculate travel confidence
  let travelConfidence = 0;
  if (hasFlightPattern || hasHotelPattern) {
    travelConfidence = 0.9;
  } else if (hasGeneralTravelPattern) {
    travelConfidence = 0.8;
  } else if (hasDestinationPattern) {
    travelConfidence = 0.7;
  } else if (
    isFromTravelDomain &&
    (bodyLower.includes("booking") || bodyLower.includes("travel"))
  ) {
    travelConfidence = 0.65;
  }

  if (travelConfidence > 0.6) {
    console.log(`🧳 Travel email detected with confidence ${travelConfidence}`);
    return {
      type: "travel",
      confidence: travelConfidence,
      method: "pattern-based",
    };
  }

  // Receipt patterns
  const RECEIPT_PATTERNS = [
    /receipt/i,
    /invoice/i,
    /payment\s+confirmation/i,
    /order\s+confirmation/i,
    /purchase/i,
    /subscription/i,
    /billing/i,
    /charged/i,
    /paid/i,
  ];

  const hasReceiptPattern = RECEIPT_PATTERNS.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  // Exclude future billing notifications
  const FUTURE_BILLING_PATTERNS = [
    /(?:will|going\s+to|about\s+to)\s+(?:renew|charge|bill)/i,
    /subscription\s+(?:will|is\s+about\s+to)\s+renew/i,
    /(?:reminder|notice|heads?\s*up).*(?:renewal|billing)/i,
  ];

  const isFutureBilling = FUTURE_BILLING_PATTERNS.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (hasReceiptPattern && !isFutureBilling) {
    console.log("💰 Receipt email detected");
    return {
      type: "receipt",
      confidence: 0.8,
      method: "pattern-based",
    };
  }

  // Job application patterns
  const JOB_PATTERNS = [
    /application/i,
    /interview/i,
    /position/i,
    /role\s+at/i,
    /job/i,
    /career/i,
    /hiring/i,
    /candidate/i,
  ];

  const hasJobPattern = JOB_PATTERNS.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (hasJobPattern) {
    console.log("💼 Job application email detected");
    return {
      type: "job_application",
      confidence: 0.75,
      method: "pattern-based",
    };
  }

  console.log("🤷 No specific category matched - will use AI fallback");
  return null;
}

export async function fallbackClassification(
  subject: string,
  from: string,
  emailBody: string
): Promise<ClassificationResult> {
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

    return {
      type: classification.type || "other",
      confidence: classification.confidence || 0.5,
      method: "fallback-ai",
    };
  } catch (error) {
    console.error("OpenAI classification error:", error);
    return {
      type: "other",
      confidence: 0.0,
      method: "error",
    };
  }
}
