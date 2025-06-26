import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate user API key from header
    const userApiKey = req.headers.get("x-user-api-key");
    if (!userApiKey || !userApiKey.startsWith("ak_")) {
      return new Response(
        JSON.stringify({ error: "Missing or invalid user API key" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Look up user by API key
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("api_key", userApiKey)
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
    const { messageId, subject, from, emailBody } = await req.json();

    if (!messageId || !subject || !from || !emailBody) {
      return new Response(
        JSON.stringify({ error: "Missing required email data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✈️ Processing travel email:", { subject, from });

    // Check if travel data already exists for this email
    const { data: existingTravel, error: existingError } = await supabase
      .from("travel")
      .select("*")
      .eq("email_id", messageId)
      .eq("user_id", user.id)
      .single();

    if (existingTravel && !existingError) {
      console.log("✅ Travel data already exists for this email");
      return new Response(
        JSON.stringify({
          success: true,
          message: "Travel data already exists",
          travelId: existingTravel.id,
          extractedData: existingTravel.details,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Extract basic travel info locally (lightweight)
    const travelData = extractBasicTravelInfo({
      subject,
      from,
      body: emailBody,
      messageId,
      date: new Date().toISOString(),
    });

    console.log(
      "🧳 Extracted travel data:",
      JSON.stringify(travelData, null, 2)
    );

    // Note: type field is now optional since we treat all travel emails uniformly
    // We can skip the type classification entirely for simplicity

    // Store travel data in database
    const { data: storedTravel, error: storeError } = await supabase
      .from("travel")
      .insert({
        user_id: user.id,
        email_id: messageId,
        // type field omitted - now nullable and not needed for unified approach
        destination: travelData.destination || null,
        subject: subject,
        start_date: travelData.startDate || null,
        end_date: travelData.endDate || null,
        details: {
          travelers: travelData.travelers || 1,
          origin: travelData.origin || null,
          from_email: from,
          email_date: new Date().toISOString(),
          preferences: "Extracted from email",
          booking_reference: travelData.bookingReference || null,
          originalEmail: {
            subject: subject,
            from: from,
            processedAt: new Date().toISOString(),
          },
        },
      })
      .select()
      .single();

    if (storeError) {
      console.error("Error storing travel data:", storeError);
      return new Response(
        JSON.stringify({
          error: "Failed to store travel data",
          details: storeError.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(`✅ Travel data stored with ID: ${storedTravel.id}`);
    console.log(`🏖️ Destination: ${storedTravel.destination || "Unknown"}`);

    return new Response(
      JSON.stringify({
        success: true,
        travelId: storedTravel.id,
        extractedData: {
          destination: storedTravel.destination,
          travelers: travelData.travelers,
          startDate: travelData.startDate,
          endDate: travelData.endDate,
          bookingReference: travelData.bookingReference,
        },
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Travel processing error:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to process travel email",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

/**
 * Extract basic travel information from email content (local processing)
 */
function extractBasicTravelInfo(emailContent: any) {
  const subject = emailContent.subject || "";
  const body = emailContent.body || "";
  const from = emailContent.from || "";

  // Simple destination extraction patterns (including "time to" pattern)
  const destinationPatterns = [
    // Direct mentions in subject line (including "time to" pattern)
    /(?:to|in|visit|destination|traveling to|flying to|trip to|time to|booking in|hotel in|flight to)\s+([A-Z][a-zA-Z\s]{2,25})/gi,
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
          /^(to|in|visit|destination|traveling to|flying to|trip to|time to|booking in|hotel in|flight to|hotel|accommodation|stay|booking|flight|ticket)\s*/i,
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

// Note: determineTravelType function removed since type field is now optional
// and we treat all travel emails uniformly in the simplified dashboard approach
