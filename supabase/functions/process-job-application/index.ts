import { createClient } from "npm:@supabase/supabase-js@2";
import OpenAI from "npm:openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-api-key",
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
      return new Response(
        JSON.stringify({ error: "Missing user API key header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔍 Processing job application email:", {
      messageId,
      subject,
      from,
      userId: user.id,
    });

    // Check if this email has already been processed
    console.log(
      "🔍 Checking for existing job application with email_id:",
      messageId
    );
    const { data: existingJob, error: existingError } = await supabase
      .from("job_applications")
      .select("*")
      .eq("email_id", messageId)
      .eq("user_id", user.id)
      .single();

    if (existingJob && !existingError) {
      console.log(
        "✅ Job application already exists for this email:",
        existingJob.id
      );
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

    console.log(
      "🆕 No existing job application found, processing new email..."
    );

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
        applied_date:
          jobData.appliedDate || new Date().toISOString().split("T")[0],
        country_code: jobData.countryCode || null,
        country: jobData.countryCode
          ? getCountryName(jobData.countryCode)
          : null,
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
      return new Response(
        JSON.stringify({ error: "Failed to store job application" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
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
    console.log(
      "🔍 Starting user lookup with API key:",
      apiKey.substring(0, 10) + "..."
    );

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
      const { data: authUsers, error: authError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        console.log("⚠️ Auth users list error:", authError.message);
        console.log("⚠️ Falling back to custom user ID:", data.id);
        return data;
      }

      // Find user by email in the list
      const authUser = authUsers.users?.find(
        (user) => user.email === data.email
      );

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
      "status": "One of: applied, next_step, interview, offer, rejected, accepted",
      "appliedDate": "Date in YYYY-MM-DD format (use today's date if not found)",
      "confidence": "Your confidence level (0-1) in the extraction",
      "countryCode": "ISO 3166-1 alpha-2 country code if mentioned/determinable from company (e.g., US, GB, CA)",
      "details": {
        "workLocation": "Remote/On-site/Hybrid if mentioned",
        "salary": "Salary range if mentioned",
        "department": "Department if mentioned",
        "applicationDeadline": "Deadline if mentioned",
        "nextSteps": "Next steps mentioned in the email"
      }
    }
    
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
    - Company headquarters location if known
    - Domain TLD (.co.uk = GB, .ca = CA, etc.)
    - Explicit country mentions in email
    - Office locations mentioned
    
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

    console.log("🤖 OpenAI raw response:", response);

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
      countryCode: jobData.countryCode || extractCountryFromEmail(from) || null,
      details: jobData.details || {},
    };
  } catch (error) {
    console.error("Error with OpenAI extraction:", error);
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
    countryCode: extractCountryFromEmail(from) || null,
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
    "next_step",
    "interview",
    "offer",
    "rejected",
    "accepted",
  ];
  return validStatuses.includes(status?.toLowerCase())
    ? status.toLowerCase()
    : null;
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
    const { data: existingUser } =
      await supabaseAdmin.auth.admin.getUserByEmail(email);

    if (existingUser?.user?.id) {
      console.log("Found existing auth user:", existingUser.user.id);
      return existingUser.user.id;
    }

    // Create a new auth user with a random password (they'll sign in via Google OAuth)
    const { data: newUser, error } = await supabaseAdmin.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm since we trust Gmail addon
      user_metadata: {
        created_via: "gmail_addon",
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
