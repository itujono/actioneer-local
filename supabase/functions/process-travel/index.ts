import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-api-key",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

// Initialize Supabase with service role key
const supabase = createClient(Deno.env.get("SUPABASE_URL") ?? "", Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "", {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
  db: {
    schema: "public",
  },
});

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Validate user API key from header
    const userApiKey = req.headers.get("x-user-api-key");
    if (!userApiKey || !(userApiKey.startsWith("ak_") || userApiKey.startsWith("api_"))) {
      return new Response(JSON.stringify({ error: "Missing or invalid user API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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
      return new Response(JSON.stringify({ error: "Invalid or inactive API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ User authenticated:", user.email);

    // Parse request body
    const { messageId, subject, from, emailBody } = await req.json();

    if (!messageId || !subject || !from || !emailBody) {
      return new Response(JSON.stringify({ error: "Missing required email data" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
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

    // Extract travel info using AI (100% AI-first approach)
    const travelData = await extractTravelInfoWithAI({
      subject,
      from,
      body: emailBody,
      messageId,
      date: new Date().toISOString(),
    });

    console.log("🧳 Extracted travel data:", JSON.stringify(travelData, null, 2));

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
 * Extract travel information using AI (100% AI-first approach)
 */
async function extractTravelInfoWithAI(emailContent: any) {
  const subject = emailContent.subject || "";
  const body = emailContent.body || "";

  console.log("🤖 Using AI for travel data extraction...");

  try {
    const { OpenAI } = await import("npm:openai@4");
    const openai = new OpenAI({
      apiKey: Deno.env.get("OPENAI_API_KEY") || "",
    });

    const prompt = `Extract travel information from this email. Return a JSON object with these fields:
- destination: The main travel destination (CITY NAME ONLY - no neighborhoods, districts, or regions, e.g., "Miami", "Paris", "Tokyo")
- travelers: Number of travelers (default 1 if not specified)
- startDate: Start/departure date in format MM/DD/YYYY or YYYY-MM-DD (null if not found)
- endDate: End/return date in format MM/DD/YYYY or YYYY-MM-DD (null if not found)
- bookingReference: Booking/confirmation code (null if not found)
- origin: Origin city/location (null if not found)

Email to analyze:
Subject: ${subject}
Content: ${body}

Examples:
- "Miami Beach Hotels" → destination: "Miami" (city, not neighborhood)
- "South Beach Resort" → destination: "Miami" (city, not district)
- "Paris Flight Deals" → destination: "Paris"
- "Tokyo Vacation Package" → destination: "Tokyo"
- "Downtown Barcelona Hotel" → destination: "Barcelona" (city, not district)
- "Manhattan Hotels" → destination: "New York" (city, not borough)

IMPORTANT: Always extract the CITY name only, ignoring neighborhoods, districts, boroughs, or specific areas within cities.

Return only valid JSON, no other text.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      response_format: { type: "json_object" },
      temperature: 0.1,
    });

    const result = completion.choices[0]?.message?.content;
    if (!result) {
      console.log("⚠️ AI extraction failed, using fallback");
      return getFallbackTravelData();
    }

    const extractedData = JSON.parse(result);
    console.log("✅ AI extracted travel data:", JSON.stringify(extractedData, null, 2));

    return {
      destination: extractedData.destination || null,
      travelers: extractedData.travelers || 1,
      startDate: extractedData.startDate || null,
      endDate: extractedData.endDate || null,
      bookingReference: extractedData.bookingReference || null,
      origin: extractedData.origin || null,
    };
  } catch (error) {
    console.error("AI travel extraction error:", error);
    console.log("🔄 Falling back to basic extraction");
    return getFallbackTravelData();
  }
}

/**
 * Fallback travel data when AI extraction fails
 */
function getFallbackTravelData() {
  return {
    destination: null,
    travelers: 1,
    startDate: null,
    endDate: null,
    bookingReference: null,
    origin: null,
  };
}

// Note: determineTravelType function removed since type field is now optional
// and we treat all travel emails uniformly in the simplified dashboard approach
