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
    // Use AI for ALL classification - no pattern fallbacks
    console.log("🧠 Using AI classification...");
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

CRITICAL DISTINCTION - Receipt vs Revenue:
- RECEIPT: "Thank you for your purchase", "Your subscription was charged", "Order confirmation", "Bill paid"
- REVENUE: "Payment received", "Money deposited", "Refund issued", "You earned", "Funds added to your account"

Email to classify:
Subject: ${subject}
From: ${from}
Content: ${emailBody}

INSTRUCTIONS:
1. Focus on WHO is receiving money vs WHO is spending money
2. Look for directional language: "to you" = revenue, "from you" = receipt
3. Past tense completion language: "received", "deposited", "earned" = revenue
4. Payment confirmations for services YOU provided = revenue
5. Purchase confirmations for things YOU bought = receipt

Return ONLY a JSON object with:
{
  "type": "receipt|revenue|travel|job_application|other",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation of why this classification was chosen, including specific words/phrases that led to this decision"
}`;
}

/**
 * Direct classification using patterns (no external API calls)
 */
function classifyEmailDirect(subject: string, from: string, emailBody: string): ClassificationResult | null {
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
  const isFromTravelDomain = TRAVEL_PATTERNS.domains.some((pattern) => pattern.test(fromLower));

  // Calculate travel confidence
  let travelConfidence = 0;
  if (hasFlightPattern || hasHotelPattern) {
    travelConfidence = 0.9;
  } else if (hasGeneralTravelPattern) {
    travelConfidence = 0.8;
  } else if (hasDestinationPattern) {
    travelConfidence = 0.7;
  } else if (isFromTravelDomain && (bodyLower.includes("booking") || bodyLower.includes("travel"))) {
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

  // Receipt patterns - only completed transactions
  const RECEIPT_PATTERNS = [
    /receipt.*(?:purchase|order|payment|transaction)/i,
    /purchase\s+(?:confirmation|receipt|summary)/i,
    /order\s+(?:confirmation|receipt|summary|complete)/i,
    /transaction\s+(?:receipt|confirmation|summary|complete)/i,
    /payment\s+(?:confirmation|receipt|successful|processed)/i,
    /your\s+(?:receipt|purchase|order)/i,
    /thank\s+you\s+for\s+your\s+(?:purchase|order)/i,
    /invoice.*(?:payment|due|amount|billing)/i,
    /subscription\s+(?:payment|charge)\s+(?:successful|completed|processed|confirmed)/i,
    /billing\s+(?:statement|summary|notice)/i,
  ];

  // CRITICAL: Exclude promotional/marketing/administrative emails
  const PROMOTIONAL_EXCLUSIONS = [
    // Administrative and compliance exclusions
    /\[action\s+required\]/i,
    /(?:provide|verify|update|add|enter)\s+(?:your|tax|billing|payment)\s+(?:info|information|details|id|npwp)/i,
    /(?:tax\s+info|tax\s+information|tax\s+id|tax\s+matters|tax\s+adviser)/i,
    /(?:could\s+not\s+be\s+verified|verification|verify\s+your)/i,
    /(?:government\s+records|active\/?\s*valid|compliance|regulatory)/i,
    /(?:how\s+to\s+add|steps\s+to|in\s+order\s+for\s+you\s+to)/i,
    /(?:sign\s+in\s+to|console|navigation|click|pencil\s+icon)/i,
    /(?:may\s+take\s+up\s+to|can't\s+advise|consult\s+your)/i,
    /(?:billing\s+account|payment\s+settings|account\s+settings)/i,
    /google\s+payments.*(?:provide|verify|update|tax)/i,
    /(?:npwp|tax\s+id).*(?:could\s+not\s+be|verification|verify)/i,
    /(?:faktur\s+pajak|tax\s+documentation|tax\s+compliance)/i,
    /(?:fix\s+any\s+issues|make\s+sure\s+you|ensure\s+accurate)/i,
    // Free offers and promotions
    /(?:free|complimentary|no\s+cost|zero\s+cost)\s+(?:for|trial|offer|access|weekend|hours?|days?)/i,
    /(?:totally|completely|entirely)\s+free/i,
    /free\s+(?:to\s+use|for\s+the\s+next|this\s+weekend|starting\s+now)/i,
    /(?:is|are)\s+(?:officially\s+)?free\s+(?:for|starting|this)/i,
    // Marketing language
    /(?:run|hurry|limited\s+time|act\s+fast|don't\s+miss|countdown)/i,
    /(?:promotional|marketing|campaign|announcement|newsletter)/i,
    /(?:special\s+offer|limited\s+offer|exclusive\s+offer|weekend\s+offer)/i,
    /(?:giveaway|contest|competition|win\s+\$|chance\s+to\s+win)/i,
    /(?:bring\s+a\s+friend|share|tag\s+us|show\s+off)/i,
    // Product announcements and updates
    /(?:new\s+feature|product\s+update|announcement|launch)/i,
    /(?:we've\s+partnered|partnership|collaboration)/i,
    /(?:getting\s+started|walkthrough|tutorial|guide)/i,
    /(?:community|builders|creating|building)/i,
    // Unsubscribe and footer indicators
    /(?:unsubscribe|opt\s+out|email\s+preferences)/i,
  ];

  // CRITICAL: Exclude future billing notifications
  const FUTURE_BILLING_PATTERNS = [
    /(?:will|going\s+to|about\s+to)\s+(?:renew|charge|bill|auto-renew)/i,
    /subscription\s+(?:will|is\s+about\s+to)\s+renew/i,
    /(?:upcoming|next|future)\s+(?:billing|payment|charge|renewal)/i,
    /(?:reminder|notice|heads?\s*up).*(?:renewal|billing|payment)/i,
    /(?:renew|charge|bill).*(?:soon|tomorrow|next\s+\w+|on\s+\w+\s+\d+)/i,
    /(?:expir|renew).*(?:on|in)\s+\d+/i,
    /payment\s+method.*(?:update|change|expires?)/i,
    /billing\s+information.*(?:update|change|expires?)/i,
  ];

  // FIRST: Check for promotional/marketing/administrative patterns - EXCLUDE these immediately
  const isPromotionalEmail = PROMOTIONAL_EXCLUSIONS.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (isPromotionalEmail) {
    console.log("🚫 Gmail webhook: Excluded as promotional/administrative email");
    return null; // This is a promotional/administrative email, not a receipt
  }

  // SECOND: Check for future/reminder patterns - EXCLUDE these immediately
  const isFutureBilling = FUTURE_BILLING_PATTERNS.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (isFutureBilling) {
    console.log("🚫 Gmail webhook: Excluded as future billing notification");
    return null; // This is a future notification, not a receipt
  }

  // NUCLEAR OPTION: Force revenue classification for clear revenue language
  const FORCE_REVENUE_KEYWORDS = [
    /payment\s+deposited\s+to\s+your\s+account/i,
    /money\s+added\s+to\s+your\s+account/i,
    /your\s+earnings\s+id/i,
    /project\s+earnings\s+have\s+been\s+processed/i,
    /funds\s+are\s+now\s+available\s+in\s+your\s+bank/i,
    /freelance\s+payment\s+has\s+been\s+successfully\s+deposited/i,
  ];

  const hasForceRevenueKeywords = FORCE_REVENUE_KEYWORDS.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (hasForceRevenueKeywords) {
    console.log("🚨 Gmail webhook: FORCE REVENUE - Nuclear option triggered by clear revenue language");
    return {
      type: "revenue",
      confidence: 0.99,
      method: "force-revenue-keywords",
    };
  }

  // THIRD: Check for revenue patterns FIRST (higher priority than receipts)
  const REVENUE_PATTERNS = {
    // Payment received patterns (highest priority)
    paymentsReceived: [
      /payment\s+received/i,
      /money\s+received/i,
      /funds\s+received/i,
      /deposit\s+successful/i,
      /transfer\s+(?:received|completed)/i,
      /payout\s+processed/i,
      /freelance.*payment.*received/i,
      /project.*payment.*received/i,
      /payment.*freelance.*project/i,
      /invoice.*payment.*received/i,
      /consulting.*payment.*received/i,
      /payment.*processed.*invoice/i,
      /client\s+payment.*received/i,
      // NEW: Enhanced deposited/earnings language
      /payment\s+deposited/i,
      /money\s+(?:added|deposited)\s+to\s+your\s+account/i,
      /funds.*(?:added|deposited).*your\s+account/i,
      /deposited\s+to\s+your\s+(?:bank\s+)?account/i,
      /has\s+been\s+(?:added|deposited)\s+to/i,
      /your\s+earnings/i,
      /earnings.*processed/i,
      /project\s+earnings/i,
      /freelance.*earnings/i,
      /successfully\s+deposited/i,
      /payment.*deposited.*your\s+account/i,
      /funds\s+are\s+now\s+available/i,
      /money\s+added\s+to\s+your\s+account/i,
    ],
    // Indonesian refund patterns
    indonesianRefunds: [
      /pengembalian\s+(?:dana|uang)\s+(?:diproses|disetujui|berhasil|selesai)/i,
      /refund\s+diproses/i,
      /dana\s+(?:dikembalikan|ditransfer|telah\s+dikembalikan)/i,
      /uang\s+(?:dikembalikan|ditransfer|telah\s+dikembalikan)/i,
      /pembatalan.*(?:pengembalian|refund)/i,
      /layanan.*dibatalkan.*pengembalian/i,
    ],
    // English refund patterns
    refunds: [
      /refund\s+(?:issued|processed|completed|successful)/i,
      /reimbursement\s+(?:issued|processed|approved)/i,
      /credit\s+(?:issued|applied|processed)/i,
      /chargeback\s+(?:successful|completed)/i,
      /return\s+(?:processed|completed|successful)/i,
      /reversal\s+(?:completed|processed)/i,
      /money\s+back\s+guarantee/i,
      /cancelled\s+order.*refund/i,
      /dispute\s+resolved.*credit/i,
    ],
    // Revenue-issuing domains
    domains: [
      /hostinger/i,
      /coinbase/i,
      /binance/i,
      /paypal/i,
      /stripe/i,
      /square/i,
      /namecheap/i,
      /godaddy/i,
      /digitalocean/i,
    ],
  };

  // Check revenue patterns
  const hasPaymentReceived = REVENUE_PATTERNS.paymentsReceived.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );
  const hasIndonesianRefund = REVENUE_PATTERNS.indonesianRefunds.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );
  const hasEnglishRefund = REVENUE_PATTERNS.refunds.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );
  const isFromRevenueDomain = REVENUE_PATTERNS.domains.some((pattern) => pattern.test(fromLower));

  // DEBUG: Log what we're checking
  console.log("🔍 Gmail webhook revenue check:", {
    subject: subjectLower,
    hasPaymentReceived,
    hasIndonesianRefund,
    hasEnglishRefund,
    isFromRevenueDomain,
    bodySnippet: bodyLower.substring(0, 200),
  });

  // Calculate revenue confidence - LOWERED threshold for better catching
  let revenueConfidence = 0;
  if (hasPaymentReceived) {
    revenueConfidence = 0.95; // Highest priority for payment received
    console.log("💰 Gmail webhook: STRONG revenue signal detected - payment received patterns");
  } else if (hasIndonesianRefund || hasEnglishRefund) {
    revenueConfidence = 0.9;
    console.log("💰 Gmail webhook: STRONG revenue signal detected - refund patterns");
  } else if (isFromRevenueDomain && (bodyLower.includes("refund") || bodyLower.includes("pengembalian"))) {
    revenueConfidence = 0.8;
    console.log("💰 Gmail webhook: Medium revenue signal detected - domain + refund");
  }

  // LOWERED threshold from 0.7 to 0.5 to catch more revenue emails
  if (revenueConfidence > 0.5) {
    console.log(`💰 Gmail webhook: Revenue email CONFIRMED with confidence ${revenueConfidence}`);
    return {
      type: "revenue",
      confidence: revenueConfidence,
      method: "pattern-based",
    };
  } else {
    console.log("🚫 Gmail webhook: No revenue patterns matched");
  }

  // FOURTH: Check for receipt patterns (only after revenue check)
  const hasReceiptPattern = RECEIPT_PATTERNS.some((pattern) => pattern.test(subjectLower) || pattern.test(bodyLower));

  // Look for past-tense completion indicators (ONLY past tense, not future)
  const hasCompletionIndicators =
    /(?:thank\s+you|thanks).*(?:for\s+your\s+)?(?:payment|purchase|order|transaction)/i.test(bodyLower) ||
    /(?:successful|completed|processed|confirmed|received).*(?:payment|purchase|order|transaction)/i.test(bodyLower) ||
    /(?:payment|purchase|order|transaction).*(?:successful|completed|processed|confirmed|received)(?:\s+successfully)?/i.test(
      bodyLower
    ) ||
    /(?:was|has\s+been|have\s+been)\s+(?:charged|paid|processed|completed|confirmed)/i.test(bodyLower) ||
    /(?:successfully\s+)?(?:charged|paid)(?:\s+successfully)$/i.test(bodyLower);

  if (hasReceiptPattern && hasCompletionIndicators) {
    console.log("💰 Gmail webhook: Receipt email detected");
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

  const hasJobPattern = JOB_PATTERNS.some((pattern) => pattern.test(subjectLower) || pattern.test(bodyLower));

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
    - receipt (ONLY for completed purchases/payments - past tense only)
    - travel (for flight, hotel, or travel-related emails)
    - job_application (for job-related emails)
    - other (for emails that don't fit the above categories)
    
    CRITICAL RULES FOR RECEIPT CLASSIFICATION:
    - ONLY classify as "receipt" if the transaction has ALREADY HAPPENED (past tense)
    - Completed transactions: "thank you for your purchase", "payment processed", "order confirmed", "was charged"
    - Future billing notifications must be classified as "other": "will renew", "will be charged", "upcoming billing", "subscription will renew soon"
    - Administrative emails must be classified as "other": tax notices, billing updates, account settings
    - Marketing/promotional emails must be classified as "other": free offers, announcements, newsletters
    
    EXAMPLES OF "OTHER" (NOT RECEIPTS):
    - "Your subscription will renew soon" 
    - "Payment method will be charged"
    - "Billing reminder"
    - "Update your payment info"
    - "[Action required]" emails
    - Any email about FUTURE transactions
    
    EXAMPLES OF "RECEIPT":
    - "Thank you for your purchase"
    - "Payment successfully processed"
    - "Your order has been confirmed"
    - "Receipt for your subscription payment"
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 1000)}
    
    IMPORTANT: Be very conservative with receipt classification. When in doubt, classify as "other".
    Respond with ONLY valid JSON, no markdown formatting or code blocks.
    
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
