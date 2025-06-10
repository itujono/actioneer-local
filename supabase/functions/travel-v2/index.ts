import { createClient } from "npm:@supabase/supabase-js@2";
import { OpenAI } from "npm:openai@4";
import { getFlightComparisons } from "./flights.ts";
import { getHotelComparisons } from "./hotels.ts";
import {
  getAttractionComparisons,
  getGenericTravelComparisons,
} from "./attractions.ts";
import { detectUserLocation } from "./utils.ts";

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

// Initialize Supabase with anon key (consistent with other Edge Functions)
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_ANON_KEY") ?? "",
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

// Service role client for user lookup (bypasses RLS)
const supabaseAdmin = createClient(
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

  // Add a simple test endpoint for Amadeus API (bypass auth)
  const url = new URL(req.url);
  if (url.pathname.endsWith("/test-amadeus")) {
    try {
      const { getAmadeusAccessToken } = await import("./utils.ts");
      const token = await getAmadeusAccessToken();
      return new Response(
        JSON.stringify({
          success: true,
          message: "Amadeus API credentials working",
          tokenLength: token.length,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    } catch (error) {
      return new Response(
        JSON.stringify({
          success: false,
          error: error.message,
        }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }
  }

  try {
    console.log("🚀 Travel comparison function called!");
    console.log("📋 Method:", req.method);
    console.log("🌐 URL:", req.url);

    // Extract user API key from custom header (since Authorization header needs anon key)
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
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ User authenticated:", user.email);

    // Parse request body
    let requestBody;
    try {
      requestBody = await req.json();
      console.log(
        "📦 Request body received:",
        JSON.stringify(requestBody, null, 2)
      );
    } catch (parseError) {
      console.error("❌ Failed to parse request body:", parseError);
      return new Response(
        JSON.stringify({ error: "Invalid JSON in request body" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { emailId, messageId, emailBody, subject, from } = requestBody;

    console.log("🔍 Extracted fields:");
    console.log("  emailId:", emailId);
    console.log("  messageId:", messageId);
    console.log("  subject:", subject);
    console.log("  from:", from);
    console.log("  userApiKey:", userApiKey ? "provided" : "missing");

    // Validate required fields
    if (!emailId || !messageId || !emailBody) {
      console.log("❌ Missing required fields");
      return new Response(
        JSON.stringify({
          error: "Missing required data (emailId, messageId, emailBody)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ All required fields present");

    // Extract travel data using OpenAI
    console.log("🤖 Extracting travel data with OpenAI...");
    const userLocation = await detectUserLocation(req);
    const travelData = await extractTravelDataWithOpenAI(
      subject,
      from,
      emailBody,
      userLocation
    );
    console.log(
      "📊 Extracted travel data:",
      JSON.stringify(travelData, null, 2)
    );

    // Generate price comparisons based on travel type
    let comparisonData;
    switch (travelData.type) {
      case "flight":
        comparisonData = await getFlightComparisons(travelData);
        break;
      case "hotel":
        comparisonData = await getHotelComparisons(travelData);
        break;
      case "attraction":
        comparisonData = await getAttractionComparisons(travelData);
        break;
      default:
        // For general or unclassified travel emails, default to hotel search
        console.log("🏨 General travel detected, defaulting to hotel search");
        comparisonData = await getHotelComparisons(travelData);
    }

    console.log(
      "💰 Generated comparisons:",
      JSON.stringify(comparisonData, null, 2)
    );

    // Store travel data in database
    try {
      await storeTravelData(user.id, emailId, travelData, comparisonData);
      console.log("✅ Travel data stored successfully");
    } catch (storeError) {
      console.error("⚠️ Failed to store travel data:", storeError);
      // Continue anyway - don't fail the request for storage issues
    }

    // Return the travel data and comparisons
    return new Response(
      JSON.stringify({
        success: true,
        travelData,
        comparisons: comparisonData.comparisons,
        type: travelData.type,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("💥 Function error:", error);
    return new Response(
      JSON.stringify({
        error: "Function error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function extractTravelDataWithOpenAI(
  subject: string,
  from: string,
  emailBody: string,
  userLocation?: { city?: string; airport: string; currency: string }
) {
  // Use user's location as default origin if no origin is specified
  const defaultOrigin = userLocation?.airport || "NYC";

  const prompt = `Extract travel information from this email and classify the type of travel booking.

Email Subject: ${subject}
From: ${from}
Email Body: ${emailBody.substring(0, 2000)}

Extract the following information:
1. Travel type: "flight", "hotel", "attraction", or "general"
2. Destination(s) - use 3-letter airport/city codes when possible (e.g., "NYC", "LAX", "LON"), or city names
3. Origin (for flights) - use 3-letter airport codes when possible. Default to "${defaultOrigin}" if not specified.
4. Dates in YYYY-MM-DD format
5. Number of travelers/guests
6. Any specific requirements

IMPORTANT RULES:
- Use ONLY valid JSON format, no markdown
- Never use "unknown" as a value - use appropriate defaults instead
- For destinations, prefer city names or 3-letter codes
- For flight origins, use "${defaultOrigin}" if not clearly specified in the email
- For dates, use future dates in YYYY-MM-DD format or leave empty
- For numbers, use integers only

Response format:
{
  "type": "flight|hotel|attraction|general",
  "origin": "3-letter code or city name (flights only, default: ${defaultOrigin})",
  "destination": "3-letter code or city name",
  "departureDate": "YYYY-MM-DD or empty",
  "returnDate": "YYYY-MM-DD or empty",
  "checkInDate": "YYYY-MM-DD or empty", 
  "checkOutDate": "YYYY-MM-DD or empty",
  "travelers": 1,
  "guests": 1,
  "preferences": "any specific requirements",
  "bookingReference": "confirmation number if found"
}`;

  try {
    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1,
    });

    let response = completion.choices[0].message.content;
    if (!response) throw new Error("Empty response from OpenAI");

    response = response.trim();
    if (response.startsWith("```json")) {
      response = response.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (response.startsWith("```")) {
      response = response.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    try {
      const parsed = JSON.parse(response);

      // Clean and validate the extracted data
      const cleanedData = {
        type: parsed.type || "general",
        origin: cleanString(parsed.origin) || defaultOrigin,
        destination: cleanString(parsed.destination) || "New York",
        departureDate: cleanDate(parsed.departureDate),
        returnDate: cleanDate(parsed.returnDate),
        checkInDate: cleanDate(parsed.checkInDate),
        checkOutDate: cleanDate(parsed.checkOutDate),
        travelers: cleanNumber(parsed.travelers, 1),
        guests: cleanNumber(parsed.guests, 1),
        preferences: cleanString(parsed.preferences) || "Extracted from email",
        bookingReference: cleanString(parsed.bookingReference),
      };

      console.log(
        "🧠 Cleaned travel data:",
        JSON.stringify(cleanedData, null, 2)
      );
      return cleanedData;
    } catch (parseError) {
      console.log("⚠️ Failed to parse OpenAI response, using fallback");
      return getDefaultTravelData(defaultOrigin);
    }
  } catch (error) {
    console.log("⚠️ OpenAI extraction failed, using fallback");
    return getDefaultTravelData(defaultOrigin);
  }
}

// Helper functions to clean extracted data
function cleanString(value: any): string | null {
  if (
    !value ||
    typeof value !== "string" ||
    value.toLowerCase() === "unknown" ||
    value.trim() === ""
  ) {
    return null;
  }
  return value.trim();
}

function cleanDate(value: any): string | null {
  if (
    !value ||
    typeof value !== "string" ||
    value.toLowerCase() === "unknown"
  ) {
    return null;
  }

  // Validate date format YYYY-MM-DD
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(value)) {
    return null;
  }

  // Check if it's a valid future date
  const date = new Date(value);
  const today = new Date();
  if (isNaN(date.getTime()) || date <= today) {
    return null;
  }

  return value;
}

function cleanNumber(value: any, defaultValue: number): number {
  if (typeof value === "number" && value > 0 && value <= 10) {
    return Math.floor(value);
  }
  if (typeof value === "string") {
    const parsed = parseInt(value);
    if (!isNaN(parsed) && parsed > 0 && parsed <= 10) {
      return parsed;
    }
  }
  return defaultValue;
}

function getDefaultTravelData(defaultOrigin: string = "NYC") {
  return {
    type: "general",
    origin: defaultOrigin,
    destination: "New York",
    departureDate: null,
    returnDate: null,
    checkInDate: null,
    checkOutDate: null,
    travelers: 1,
    guests: 1,
    preferences: "Extracted from email",
    bookingReference: null,
  };
}

async function storeTravelData(
  userId: string,
  emailId: string,
  travelData: any,
  comparisonData: any
) {
  const parseDate = (dateStr: string | null) => {
    if (
      !dateStr ||
      dateStr.trim() === "" ||
      dateStr.toLowerCase() === "unknown"
    ) {
      return null;
    }

    // Validate date format
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(dateStr)) {
      return null;
    }

    // Check if it's a valid date
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return null;
    }

    return dateStr;
  };

  const { error } = await supabaseAdmin.from("travel").insert({
    user_id: userId,
    email_id: emailId,
    type: travelData.type,
    destination: travelData.destination || null,
    start_date: parseDate(travelData.departureDate || travelData.checkInDate),
    end_date: parseDate(travelData.returnDate || travelData.checkOutDate),
    details: {
      ...travelData,
      comparisons: comparisonData,
    },
  });

  if (error) {
    console.error("Error storing travel data:", error);
  }
}

async function getUserByApiKey(apiKey: string) {
  try {
    console.log(
      "🔍 Looking up user with API key:",
      apiKey.substring(0, 10) + "..."
    );

    // Use service role to query directly, bypassing RLS
    const { data: user, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    console.log("📊 Database query result:", {
      user: user ? "found" : "not found",
      error: error?.message,
    });

    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Error getting user by API key:", error);
    return null;
  }
}
