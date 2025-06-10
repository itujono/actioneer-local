import { createClient } from "npm:@supabase/supabase-js@2";
import { OpenAI } from "npm:openai@4";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
});

// Initialize Supabase with service role key - bypass RLS for our custom auth
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate user API key
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const apiKey = authHeader.split(" ")[1];

    // Validate API key format
    if (!apiKey.startsWith("ak_") || apiKey.length !== 67) {
      return new Response(JSON.stringify({ error: "Invalid API key format" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Look up user by API key using service role (bypasses RLS)
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      console.error("User lookup error:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid or inactive API key" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ User authenticated:", user.email);

    // Parse request body
    const {
      messageId,
      subject,
      from,
      body: emailBody,
      date,
    } = await req.json();

    if (!messageId || !subject || !from || !emailBody) {
      return new Response(
        JSON.stringify({ error: "Missing required email data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("📧 Classifying email:", { subject, from });

    // Classify email with OpenAI
    const classification = await classifyEmailWithOpenAI(
      subject,
      from,
      emailBody
    );

    // Store email classification
    await storeEmailClassification(
      user.id,
      messageId,
      subject,
      from,
      date,
      classification.type
    );

    console.log("✅ Email classified as:", classification.type);

    return new Response(JSON.stringify(classification), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Classification error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to classify email",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function classifyEmailWithOpenAI(
  subject: string,
  from: string,
  emailBody: string
) {
  const prompt = `
    Analyze this email and classify it into one of these categories:
    - receipt (for purchase receipts or invoices)
    - travel (for flight, hotel, or travel-related emails)
    - job_application (for ANY job-related emails including applications, interviews, rejections, offers, status updates)
    - other (for emails that don't fit the above categories)
    
    Job application emails include:
    - Application confirmations
    - Interview invitations
    - Job rejection emails
    - Job offer emails
    - Application status updates
    - Thank you emails from companies
    - Emails from HR departments about positions
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 1000)}
    
    IMPORTANT: Respond with ONLY valid JSON, no markdown formatting or code blocks.
    
    Format: { "type": "category", "confidence": 0.95, "actions": [] }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Lower temperature for more consistent JSON output
    });

    let response = completion.choices[0].message.content;

    if (!response) {
      throw new Error("Empty response from OpenAI");
    }

    // Clean up the response - remove markdown code blocks if present
    response = response.trim();
    if (response.startsWith("```json")) {
      response = response.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (response.startsWith("```")) {
      response = response.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    console.log("🤖 OpenAI raw response:", response);

    let classification;
    try {
      classification = JSON.parse(response);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", response);

      // Fallback to pattern-based classification
      classification = classifyEmailWithPatterns(subject, from, emailBody);
    }

    // Ensure we have valid classification
    if (!classification.type) {
      classification = classifyEmailWithPatterns(subject, from, emailBody);
    }

    // Add action handlers based on type
    classification.actions = getActionsByType(classification.type);

    return classification;
  } catch (error) {
    console.error("OpenAI classification error:", error);

    // Fallback to pattern-based classification
    return classifyEmailWithPatterns(subject, from, emailBody);
  }
}

function classifyEmailWithPatterns(
  subject: string,
  from: string,
  emailBody: string
): any {
  console.log("🔄 Using pattern-based classification as fallback");

  const subjectLower = subject.toLowerCase();
  const fromLower = from.toLowerCase();
  const bodyLower = emailBody.toLowerCase();

  // Job application patterns
  const jobPatterns = [
    // Subject patterns
    /job\s+application/i,
    /application\s+update/i,
    /interview/i,
    /position/i,
    /career/i,
    /thank\s+you\s+for\s+your\s+application/i,
    /application\s+status/i,
    /job\s+offer/i,
    /recruitment/i,
    /hr\s+team/i,

    // Body patterns
    /applied\s+to/i,
    /your\s+application/i,
    /interview\s+invitation/i,
    /application\s+received/i,
    /thank\s+you\s+for\s+applying/i,
    /we\s+have\s+received\s+your\s+application/i,
    /application\s+for\s+the\s+position/i,
    /proceed\s+with\s+another\s+candidate/i,
    /decided\s+to\s+proceed\s+with/i,
    /job\s+search/i,
    /future\s+openings/i,
    /career\s+site/i,
    /recruitment\s+team/i,
  ];

  // Check if it matches job patterns
  const isJobEmail = jobPatterns.some(
    (pattern) =>
      pattern.test(subjectLower) ||
      pattern.test(bodyLower) ||
      pattern.test(fromLower)
  );

  if (isJobEmail) {
    console.log("✅ Pattern-based classification: job_application");
    return {
      type: "job_application",
      confidence: 0.8,
      actions: [],
      method: "pattern-based",
    };
  }

  // Travel patterns
  const travelPatterns = [
    /flight/i,
    /booking/i,
    /hotel/i,
    /reservation/i,
    /itinerary/i,
    /boarding\s+pass/i,
    /confirmation/i,
  ];

  const isTravelEmail = travelPatterns.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (isTravelEmail) {
    console.log("✅ Pattern-based classification: travel");
    return {
      type: "travel",
      confidence: 0.7,
      actions: [],
      method: "pattern-based",
    };
  }

  // Receipt patterns
  const receiptPatterns = [
    /receipt/i,
    /invoice/i,
    /payment/i,
    /purchase/i,
    /order/i,
    /transaction/i,
  ];

  const isReceiptEmail = receiptPatterns.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (isReceiptEmail) {
    console.log("✅ Pattern-based classification: receipt");
    return {
      type: "receipt",
      confidence: 0.7,
      actions: [],
      method: "pattern-based",
    };
  }

  console.log("✅ Pattern-based classification: other");
  return {
    type: "other",
    confidence: 0.5,
    actions: [],
    method: "pattern-based",
  };
}

function getActionsByType(type: string) {
  switch (type) {
    case "receipt":
      return [
        {
          type: "simple",
          label: "Track Expense",
          handler: "handleTrackExpense",
          data: {},
        },
        {
          type: "complex",
          label: "View Financial Dashboard",
          handler: "openFinancialDashboard",
          data: {},
        },
      ];
    case "travel":
      return [
        {
          type: "complex",
          label: "Compare Hotel Prices",
          handler: "openHotelComparison",
          data: {},
        },
        {
          type: "simple",
          label: "Add to Calendar",
          handler: "handleAddToCalendar",
          data: {},
        },
      ];
    case "job_application":
      return [
        {
          type: "complex",
          label: "Track Application",
          handler: "openJobTracker",
          data: {},
        },
      ];
    default:
      return [];
  }
}

async function storeEmailClassification(
  userId: string,
  messageId: string,
  subject: string,
  from: string,
  date: string,
  classification: string
) {
  try {
    // Use service role to insert directly, bypassing RLS
    const { error } = await supabase.from("emails").insert({
      user_id: userId,
      message_id: messageId,
      subject,
      from_email: from,
      date,
      classification,
    });

    if (error) {
      console.error("Error storing email classification:", error);
      // Don't throw - this is not critical for the user experience
    } else {
      console.log("✅ Email classification stored");
    }
  } catch (error) {
    console.error("Failed to store email classification:", error);
    // Don't throw - this is not critical for the user experience
  }
}
