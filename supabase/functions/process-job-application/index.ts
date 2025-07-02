import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Create Supabase client with service role for admin operations
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Regular client for normal operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for auth operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY"),
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract user API key from custom header
    const userApiKey = req.headers.get("x-user-api-key");
    if (!userApiKey) {
      return new Response(JSON.stringify({ error: "Missing user API key header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate user API key
    const user = await getUserByApiKey(userApiKey);
    if (!user) {
      console.log("❌ API key validation failed - no user found");
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { messageId, subject, from, emailBody } = body;

    if (!messageId || !subject || !from || !emailBody) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🔍 Processing job application email:", {
      messageId,
      subject,
      from,
      userId: user.id,
    });

    // Check if this email has already been processed
    console.log("🔍 Checking for existing job application with email_id:", messageId);
    const { data: existingJob, error: existingError } = await supabase
      .from("job_applications")
      .select("*")
      .eq("email_id", messageId)
      .eq("user_id", user.id)
      .single();

    if (existingJob && !existingError) {
      console.log("✅ Job application already exists for this email:", existingJob.id);
      return new Response(
        JSON.stringify({
          success: true,
          jobApplicationId: existingJob.id,
          extractedData: {
            company: existingJob.company,
            position: existingJob.position,
            status: existingJob.status,
            appliedDate: existingJob.applied_date,
          },
          message: "Job application already processed for this email",
          duplicate: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🆕 No existing job application found, processing new email...");

    // Extract job application data using OpenAI
    const jobData = await extractJobDataWithAI(subject, from, emailBody);

    // Store in database using the Supabase Auth user ID (mapped from custom user)
    console.log("🔄 Inserting job application for user:", user.email);
    console.log("🔍 User ID being used:", user.id);
    console.log("🔍 Auth user ID:", user.auth_user_id);
    console.log("🔍 Custom user ID:", user.custom_user_id);

    // Store in database using the user ID (should be Supabase Auth ID after mapping)
    // Use supabaseAdmin to bypass RLS policies
    const { data: storedData, error: storeError } = await supabaseAdmin
      .from("job_applications")
      .insert({
        user_id: user.id, // This should now be the Supabase Auth user ID
        email_id: messageId,
        company: jobData.company || "Unknown Company",
        position: jobData.position || "Unknown Position",
        status: jobData.status || "applied",
        applied_date: jobData.appliedDate || new Date().toISOString().split("T")[0],
        country_code: jobData.countryCode || null,
        country: jobData.countryCode ? getCountryName(jobData.countryCode) : null,
        website: jobData.website || "-",
        details: {
          ...jobData,
          originalEmail: {
            subject,
            from,
            processedAt: new Date().toISOString(),
          },
        },
      })
      .select()
      .single();

    if (storeError) {
      console.error("Error storing job application:", storeError);
      return new Response(JSON.stringify({ error: "Failed to store job application" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Job application stored successfully:", storedData.id);
    console.log("✅ Stored with user_id:", storedData.user_id);

    return new Response(
      JSON.stringify({
        success: true,
        jobApplicationId: storedData.id,
        extractedData: jobData,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing job application:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getUserByApiKey(apiKey: string) {
  try {
    console.log("🔍 Starting user lookup with API key:", apiKey.substring(0, 10) + "...");

    // Use admin client for users table access (has service role permissions)
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    if (error) {
      console.log("❌ User lookup error:", error.message);
      console.log("❌ Error details:", JSON.stringify(error, null, 2));
      return null;
    }

    if (!data) {
      console.log("❌ No user data returned");
      return null;
    }

    console.log("✅ Found custom user:", data.email, "with ID:", data.id);

    // If we found a custom user, try to find the corresponding Supabase Auth user by email
    console.log("🔍 Looking up Supabase Auth user for email:", data.email);

    try {
      // Use the correct method to get user by email
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        console.log("⚠️ Auth users list error:", authError.message);
        console.log("⚠️ Falling back to custom user ID:", data.id);
        return data;
      }

      // Find user by email in the list
      const authUser = authUsers.users?.find((user) => user.email === data.email);

      if (authUser?.id) {
        console.log("✅ Found Supabase Auth user:", authUser.id);
        // Return a modified user object with the Supabase Auth ID
        const modifiedUser = {
          ...data,
          id: authUser.id, // Use Supabase Auth ID instead of custom user ID
          auth_user_id: authUser.id,
          custom_user_id: data.id,
        };
        console.log("✅ Using Supabase Auth user ID:", modifiedUser.id);
        return modifiedUser;
      } else {
        console.log("⚠️ No Supabase Auth user found for email:", data.email);
        console.log("⚠️ Falling back to custom user ID:", data.id);
        return data;
      }
    } catch (authLookupError) {
      console.error("❌ Error during auth user lookup:", authLookupError);
      console.log("⚠️ Falling back to custom user ID:", data.id);
      return data;
    }
  } catch (error) {
    console.error("❌ Error validating API key:", error);
    return null;
  }
}

async function extractJobDataWithAI(subject: string, from: string, emailBody: string) {
  console.log("🤖 Starting 100% AI-first job application extraction...");

  const prompt = `Extract job application information from this email. Return a JSON object with the specified fields.

Email Details:
Subject: ${subject}
From: ${from}
Content: ${emailBody.substring(0, 3000)}

Extract the following information:
{
  "company": "Company name (from domain, signature, or content - prefer full company name over domain)",
  "position": "Job title/position mentioned in the email",
  "status": "One of: applied, next_step, interview, offer, rejected, accepted",
  "appliedDate": "Application date in YYYY-MM-DD format (extract from email content, not today's date)",
  "confidence": "Confidence level 0-1 for extraction quality",
  "countryCode": "ISO 3166-1 alpha-2 country code (e.g., US, GB, CA, DE) based on company location",
  "website": "Company website URL (from signature, footer, or domain)",
  "details": {
    "workLocation": "Work arrangement (Remote/On-site/Hybrid/Location name)",
    "salary": "Salary information if mentioned",
    "department": "Department or team name",
    "applicationDeadline": "Application deadline if mentioned",
    "nextSteps": "Next steps in the process",
    "contactPerson": "HR contact or recruiter name",
    "officeLocation": "Physical office location or address"
  }
}

Status Classification Rules:
- "applied": Application submitted/acknowledged, initial confirmation
- "next_step": Moving to next stage, tests, assessments, additional info requested
- "interview": Interview invitation, scheduling, or interview-related communication
- "offer": Job offer, contract, salary negotiation
- "rejected": Application declined, rejection notification
- "accepted": Offer accepted, welcome messages, onboarding

Company Extraction Priority:
1. Full company name from email signature or content
2. Company name from email domain (but ignore gmail.com, outlook.com etc.)
3. Company name mentioned in email body
4. Sender organization from signature

Country Detection Sources:
- Email signatures with addresses or location info
- Company location mentions in content
- Email domain TLD (.co.uk → GB, .ca → CA, .de → DE, .fr → FR)
- Office locations in signatures (📍 London, UK → GB)
- "Based in [Country]" or "Located in [Country]" mentions
- Address information in contact details

Website Extraction Sources:
- URLs in email signatures (www.company.com, https://company.com)
- Footer links and contact information
- Company career page or main website links
- Email domain (if corporate, not personal email providers)
- Prefer main company site over specific career/jobs pages

Return ONLY valid JSON, no code blocks or markdown.`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      console.log("⚠️ AI extraction failed, using intelligent fallback");
      return getIntelligentFallback(subject, from, emailBody);
    }

    const jobData = JSON.parse(result);
    console.log("✅ AI extracted job data:", JSON.stringify(jobData, null, 2));

    // Validate and enhance the extracted data
    return {
      company: jobData.company || extractCompanyFromEmail(from) || "Unknown Company",
      position: jobData.position || "Unknown Position",
      status: validateStatus(jobData.status) || "applied",
      appliedDate: validateDate(jobData.appliedDate) || null,
      confidence: Math.min(Math.max(jobData.confidence || 0.5, 0), 1),
      countryCode: validateCountryCode(jobData.countryCode),
      website: cleanWebsiteUrl(jobData.website),
      details: {
        workLocation: jobData.details?.workLocation || null,
        salary: jobData.details?.salary || null,
        department: jobData.details?.department || null,
        applicationDeadline: jobData.details?.applicationDeadline || null,
        nextSteps: jobData.details?.nextSteps || null,
        contactPerson: jobData.details?.contactPerson || null,
        officeLocation: jobData.details?.officeLocation || null,
        extractionMethod: "ai_first",
        processedAt: new Date().toISOString(),
      },
    };
  } catch (error) {
    console.error("AI extraction error:", error);
    console.log("🔄 Falling back to intelligent extraction");
    return getIntelligentFallback(subject, from, emailBody);
  }
}

function getIntelligentFallback(subject: string, from: string, emailBody: string) {
  console.log("🔄 Using intelligent fallback extraction");

  return {
    company: extractCompanyFromEmail(from) || "Unknown Company",
    position: "Unknown Position",
    status: "applied",
    appliedDate: null,
    confidence: 0.3,
    countryCode: extractCountryFromEmail(from) || extractCountryFromEmailBody(emailBody),
    website: extractWebsiteFromEmail(from, emailBody),
    details: {
      extractionMethod: "intelligent_fallback",
      emailFrom: from,
      emailSubject: subject,
    },
  };
}

function validateCountryCode(countryCode: string | null): string | null {
  if (!countryCode) return null;

  // List of valid ISO 3166-1 alpha-2 country codes
  const validCodes = [
    "US",
    "GB",
    "CA",
    "AU",
    "DE",
    "FR",
    "JP",
    "KR",
    "IN",
    "BR",
    "MX",
    "NL",
    "SE",
    "CH",
    "IT",
    "ES",
    "PL",
    "RU",
    "CN",
    "SG",
    "MY",
    "TH",
    "ID",
    "PH",
    "VN",
    "TR",
    "EG",
    "ZA",
    "NG",
    "KE",
    "AR",
    "CL",
    "CO",
    "PE",
    "UY",
  ];

  const upperCode = countryCode.toUpperCase();
  return validCodes.includes(upperCode) ? upperCode : null;
}

function cleanWebsiteUrl(website: string | null): string {
  if (!website || website === "-" || website === "null") return "-";

  // Remove common non-web protocols
  let cleaned = website.replace(/^(mailto:|tel:|fax:)/i, "");

  // Add https:// if no protocol is specified
  if (cleaned && !cleaned.match(/^https?:\/\//i)) {
    cleaned = "https://" + cleaned;
  }

  return cleaned || "-";
}

// function fallbackJobExtraction(subject: string, from: string, emailBody: string) {
//   console.log("🔄 Using fallback job extraction");

//   const company = extractCompanyFromEmail(from) || extractCompanyFromText(subject + " " + emailBody);
//   const position = extractPositionFromText(subject + " " + emailBody);
//   const status = extractStatusFromText(subject + " " + emailBody);
//   const website = extractWebsiteFromEmail(from, emailBody);

//   return {
//     company: company || "Unknown Company",
//     position: position || "Unknown Position",
//     status: status || "applied",
//     appliedDate: null,
//     confidence: 0.3,
//     countryCode: extractCountryFromEmail(from) || extractCountryFromEmailBody(emailBody),
//     website: website,
//     details: {
//       extractionMethod: "fallback",
//       emailFrom: from,
//       emailSubject: subject,
//     },
//   };
// }

function extractCompanyFromEmail(from: string): string | null {
  // Extract company from email domain
  const emailMatch = from.match(/@([^.]+)/);
  if (emailMatch && emailMatch[1]) {
    const domain = emailMatch[1];
    // Skip common email providers
    const commonProviders = ["gmail", "yahoo", "outlook", "hotmail", "aol", "icloud"];
    if (!commonProviders.includes(domain.toLowerCase())) {
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  }
  return null;
}

function extractCountryFromEmail(from: string): string | null {
  // Extract country from email domain TLD
  const tldMatch = from.match(/\.([a-zA-Z]{2})$/);
  if (tldMatch && tldMatch[1]) {
    const tld = tldMatch[1].toLowerCase();

    // Map common country TLDs to ISO country codes
    const tldToCountry: Record<string, string> = {
      uk: "GB", // .co.uk domains
      ca: "CA",
      au: "AU",
      de: "DE",
      fr: "FR",
      jp: "JP",
      kr: "KR",
      in: "IN",
      br: "BR",
      mx: "MX",
      nl: "NL",
      se: "SE",
      ch: "CH",
      it: "IT",
      es: "ES",
      id: "ID",
      nz: "NZ",
      sg: "SG",
      hk: "HK",
      tw: "TW",
      ph: "PH",
      za: "ZA",
      my: "MY",
      th: "TH",
      vn: "VN",
      ng: "NG",
    };

    return tldToCountry[tld] || null;
  }

  // Check for .co.uk pattern specifically
  if (from.includes(".co.uk")) {
    return "GB";
  }

  return null;
}

function extractCountryFromEmailBody(emailBody: string): string | null {
  // Extract country from email body content (signatures, addresses, etc.)
  const text = emailBody.toLowerCase();

  // Fast lookup for most common countries (90%+ of cases)
  const commonCountryMapping: Record<string, string> = {
    "united kingdom": "GB",
    "great britain": "GB",
    england: "GB",
    scotland: "GB",
    wales: "GB",
    uk: "GB",
    "united states": "US",
    usa: "US",
    america: "US",
    canada: "CA",
    australia: "AU",
    germany: "DE",
    france: "FR",
    japan: "JP",
    "south korea": "KR",
    korea: "KR",
    india: "IN",
    brazil: "BR",
    mexico: "MX",
    netherlands: "NL",
    sweden: "SE",
    switzerland: "CH",
    italy: "IT",
    spain: "ES",
    indonesia: "ID",
    "new zealand": "NZ",
    singapore: "SG",
    "hong kong": "HK",
    taiwan: "TW",
    philippines: "PH",
    "south africa": "ZA",
    malaysia: "MY",
    thailand: "TH",
    vietnam: "VN",
    nigeria: "NG",
  };

  // Patterns to look for country mentions
  const countryPatterns = [
    // Location pin emoji followed by location
    /📍\s*[^,\n]*,\s*([^,\n]+)/g,
    // Based in pattern
    /based\s+in\s+([^,\n\.]+)/gi,
    // Location patterns
    /location[:\s]+([^,\n\.]+)/gi,
    // Address patterns (City, Country)
    /,\s*([^,\n]{4,25})(?:\s|$)/g,
    // Office in pattern
    /office\s+in\s+([^,\n\.]+)/gi,
  ];

  for (const pattern of countryPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const location = match[1].trim().toLowerCase();

        // First, check common countries for fast lookup
        for (const [countryName, countryCode] of Object.entries(commonCountryMapping)) {
          if (location.includes(countryName)) {
            console.log(`🌍 Found country from common mapping: ${location} → ${countryCode}`);
            return countryCode;
          }
        }

        // For less common countries, we could use REST Countries API
        // But for now, let's keep it simple and fast
        // TODO: Consider adding REST Countries API fallback for comprehensive coverage
      }
    }
  }

  return null;
}

function getCountryName(countryCode: string): string | null {
  const countryNames: Record<string, string> = {
    US: "United States",
    GB: "United Kingdom",
    CA: "Canada",
    AU: "Australia",
    DE: "Germany",
    FR: "France",
    JP: "Japan",
    KR: "South Korea",
    IN: "India",
    BR: "Brazil",
    MX: "Mexico",
    NL: "Netherlands",
    SE: "Sweden",
    CH: "Switzerland",
    IT: "Italy",
    ES: "Spain",
    ID: "Indonesia",
    NZ: "New Zealand",
    SG: "Singapore",
    HK: "Hong Kong",
    TW: "Taiwan",
    PH: "Philippines",
    ZA: "South Africa",
    MY: "Malaysia",
    TH: "Thailand",
    VN: "Vietnam",
    NG: "Nigeria",
  };

  return countryNames[countryCode.toUpperCase()] || null;
}

// function extractCompanyFromText(text: string): string | null {
//   const companyPatterns = [
//     // Match "Company Name" at end of subject after dash
//     /-\s*([A-Za-z\s&]+)\s*$/i,
//     // Match "from Company Name team"
//     /from\s+([A-Za-z\s&]+)(?:\s+team|\s+careers|\s+hr)/i,
//     // Match "at Company Name"
//     /at\s+([A-Za-z\s&]+)(?:\s+team|\s+careers|\s+hr)/i,
//     // Match "Company Name team"
//     /([A-Za-z\s&]+)\s+team/i,
//     // Match "Company Name careers"
//     /([A-Za-z\s&]+)\s+careers/i,
//     // Match "Company Name hiring"
//     /([A-Za-z\s&]+)\s+hiring/i,
//     // Match company name before "and your interest"
//     /to\s+the\s+([^,\n\.]+)\s+and\s+your\s+interest/i,
//     // Match "Best Regards, Company Name"
//     /best\s+regards,\s*([A-Za-z\s&]+)/i,
//   ];

//   for (const pattern of companyPatterns) {
//     const match = text.match(pattern);
//     if (match && match[1] && match[1].trim().length > 2) {
//       const company = match[1].trim();
//       // Filter out common non-company words
//       const skipWords = ["team", "careers", "hr", "hiring", "department", "position", "role", "application", "job"];
//       if (!skipWords.some((word) => company.toLowerCase().includes(word))) {
//         return company;
//       }
//     }
//   }
//   return null;
// }

// function extractPositionFromText(text: string): string | null {
//   const positionPatterns = [
//     // Match "Position (Details) - Company" format
//     /to\s+the\s+([^,\n\-]+?)(?:\s*\([^)]*\))?\s*-\s*[A-Za-z\s&]+\s+and/i,
//     // Match "for the Position position"
//     /for\s+the\s+([^,\n\.]+)\s+(?:position|role)/i,
//     // Match "as a/an Position"
//     /as\s+(?:a|an)\s+([^,\n\.]+)/i,
//     // Match "Position:" format
//     /(?:position|role):\s*([^,\n\.]+)/i,
//     // Match "applying for Position"
//     /applying\s+for\s+([^,\n\.]+)/i,
//     // Match "application to the Position"
//     /application\s+to\s+the\s+([^,\n\.]+)/i,
//   ];

//   for (const pattern of positionPatterns) {
//     const match = text.match(pattern);
//     if (match && match[1] && match[1].trim().length > 2) {
//       const position = match[1].trim();
//       // Clean up the position text
//       const cleanPosition = position
//         .replace(/\s*\([^)]*\)\s*/g, "") // Remove parenthetical content
//         .replace(/\s*-\s*.*$/, "") // Remove everything after dash
//         .trim();

//       if (cleanPosition.length > 2) {
//         return cleanPosition;
//       }
//     }
//   }
//   return null;
// }

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
    interview: ["interview", "scheduled", "meeting", "call", "zoom", "video call", "phone screen", "next round"],
    next_step: [
      "move forward with your application",
      "next step in our process",
      "next stage",
      "proceed with your candidacy",
      "additional information",
      "assessment",
      "test",
      "coding challenge",
      "take-home assignment",
      "portfolio review",
      "technical review",
      "excited to proceed",
      "would like to proceed",
      "please complete",
      "technical challenge",
      "coding test",
      "skills assessment",
      "move to the next",
      "advance your application",
      "further consideration",
    ],
    offer: ["offer", "pleased to extend", "job offer", "congratulations", "excited to offer", "happy to offer"],
    accepted: ["welcome to", "excited to have you", "looking forward to working", "onboarding", "start date"],
  };

  for (const [status, keywords] of Object.entries(statusKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return status;
    }
  }

  return "applied";
}

function validateStatus(status: string): string | null {
  const validStatuses = ["applied", "next_step", "interview", "offer", "rejected", "accepted"];
  return validStatuses.includes(status?.toLowerCase()) ? status.toLowerCase() : null;
}

function validateDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  return date.toISOString().split("T")[0];
}

async function getOrCreateAuthUser(email: string): Promise<string | null> {
  try {
    // First, check if user exists in auth.users
    const { data: existingUser } = await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (existingUser?.user?.id) {
      console.log("Found existing auth user:", existingUser.user.id);
      return existingUser.user.id;
    }

    // Create a new auth user with a random password (they'll sign in via Google OAuth)
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm since we trust OAuth
      user_metadata: {
        created_via: "web_oauth",
        created_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("Error creating auth user:", error);
      return null;
    }

    if (newUser?.user?.id) {
      console.log("Created new auth user:", newUser.user.id);
      return newUser.user.id;
    }

    return null;
  } catch (error) {
    console.error("Error in getOrCreateAuthUser:", error);
    return null;
  }
}

function extractWebsiteFromEmail(from: string, emailBody: string): string {
  // Extract website from email signature, footer, or body
  const text = emailBody.toLowerCase();

  // Common website patterns in email signatures
  const websitePatterns = [
    // Full URLs with protocol
    /https?:\/\/(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    // URLs without protocol
    /(?:^|\s)(?:www\.)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\s|$|\/)/g,
    // Company website mentions
    /(?:website|site|visit us|learn more):\s*(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    // Globe emoji pattern (🌐 followed by website)
    /🌐\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    // Web/URL indicators followed by domain
    /(?:web|url|link):\s*(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    // Plain domain patterns in signatures (more flexible)
    /(?:^|\s)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\s|$)/g,
  ];

  const foundUrls = new Set<string>();

  // Extract URLs using patterns
  for (const pattern of websitePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const domain = match[1] || match[0];
      if (domain && !isFromCommonEmailProvider(domain) && !isCommonService(domain)) {
        // Clean up the domain
        const cleanDomain = domain
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .split("/")[0];
        if (cleanDomain.includes(".") && cleanDomain.length > 3) {
          foundUrls.add(cleanDomain);
        }
      }
    }
  }

  // Try to extract from email domain if no website found
  if (foundUrls.size === 0) {
    const emailDomain = extractDomainFromEmail(from);
    if (emailDomain && !isFromCommonEmailProvider(emailDomain)) {
      foundUrls.add(emailDomain);
    }
  }

  // Return the first valid website found, prefer shorter domains (likely main company site)
  if (foundUrls.size > 0) {
    const sortedUrls = Array.from(foundUrls).sort((a, b) => a.length - b.length);
    return `https://${sortedUrls[0]}`;
  }

  return "-";
}

function extractDomainFromEmail(email: string): string | null {
  const match = email.match(/@([^>]*)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

function isCommonService(domain: string): boolean {
  const commonServices = [
    "youtube.com",
    "linkedin.com",
    "facebook.com",
    "twitter.com",
    "instagram.com",
    "github.com",
    "stackoverflow.com",
    "medium.com",
    "amazonaws.com",
    "google.com",
    "microsoft.com",
    "apple.com",
    "calendly.com",
    "zoom.us",
    "dropbox.com",
    "slack.com",
    "notion.so",
    "figma.com",
    "canva.com",
  ];
  return commonServices.some((service) => domain.includes(service));
}

function isFromCommonEmailProvider(fromEmail: string): boolean {
  const commonProviders = ["gmail.com", "yahoo.com", "outlook.com", "hotmail.com", "aol.com", "icloud.com"];
  return commonProviders.some((provider) => fromEmail.includes(provider.toLowerCase()));
}

// Optional: REST Countries API helper for comprehensive country lookup
// This could be used as a fallback for countries not in our common mapping
async function lookupCountryFromAPI(countryName: string): Promise<string | null> {
  try {
    // Clean the country name for API lookup
    const cleanName = countryName.trim().replace(/[^a-zA-Z\s]/g, "");

    const response = await fetch(`https://restcountries.com/v3.1/name/${encodeURIComponent(cleanName)}?fields=cca2`);

    if (!response.ok) {
      return null;
    }

    const countries = await response.json();

    if (countries && countries.length > 0 && countries[0].cca2) {
      console.log(`🌐 REST Countries API: ${countryName} → ${countries[0].cca2}`);
      return countries[0].cca2;
    }

    return null;
  } catch (error) {
    console.warn(`⚠️ REST Countries API error for "${countryName}":`, error);
    return null;
  }
}
