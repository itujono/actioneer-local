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

  try {
    console.log("🚀 Travel comparison function called!");
    console.log("📋 Method:", req.method);
    console.log("🌐 URL:", req.url);

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

    const { emailId, messageId, emailBody, subject, from, userApiKey } =
      requestBody;

    console.log("🔍 Extracted fields:");
    console.log("  emailId:", emailId);
    console.log("  messageId:", messageId);
    console.log("  subject:", subject);
    console.log("  from:", from);
    console.log("  userApiKey:", userApiKey ? "provided" : "missing");

    // Validate required fields
    if (!emailId || !messageId || !emailBody || !userApiKey) {
      console.log("❌ Missing required fields");
      return new Response(
        JSON.stringify({
          error:
            "Missing required data (emailId, messageId, emailBody, userApiKey)",
        }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ All required fields present");

    // Return success for now
    return new Response(
      JSON.stringify({
        success: true,
        message: "Travel comparison function is working!",
        receivedData: {
          emailId,
          messageId,
          subject,
          from,
          hasUserApiKey: !!userApiKey,
        },
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
  emailBody: string
) {
  const prompt = `
    Extract travel information from this email and classify the type of travel booking:
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 2000)}
    
    Determine:
    1. Travel type: "flight", "hotel", "attraction", or "general"
    2. Destination(s)
    3. Dates (departure, return, check-in, check-out)
    4. Number of travelers/guests
    5. Origin (for flights)
    6. Any specific preferences mentioned
    
    IMPORTANT: Respond with ONLY valid JSON, no markdown formatting or code blocks.
    
    Format:
    {
      "type": "flight|hotel|attraction|general",
      "origin": "city/airport code",
      "destination": "city/airport code or hotel name",
      "departureDate": "YYYY-MM-DD",
      "returnDate": "YYYY-MM-DD",
      "checkInDate": "YYYY-MM-DD", 
      "checkOutDate": "YYYY-MM-DD",
      "travelers": 1,
      "guests": 1,
      "preferences": "any specific requirements",
      "bookingReference": "confirmation number if found"
    }
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

    try {
      return JSON.parse(response);
    } catch (parseError) {
      console.error("JSON parse error:", parseError);
      console.error("Raw response:", response);

      // Return fallback data
      return {
        type: "general",
        destination: "Unknown",
        travelers: 1,
        preferences: "Extracted from email",
      };
    }
  } catch (error) {
    console.error("OpenAI travel extraction error:", error);
    // Return mock data if AI fails
    return {
      type: "general",
      destination: "Unknown",
      travelers: 1,
      preferences: "Extracted from email",
    };
  }
}

async function getFlightComparisons(travelData: any) {
  // Return mock flight comparisons since we don't have Amadeus API configured
  return {
    type: "flight",
    comparisons: [
      {
        provider: "Expedia",
        airline: "Delta",
        price: "299",
        currency: "USD",
        duration: "5h 30m",
        stops: 0,
        bookingUrl: `https://www.expedia.com/Flights-Search?trip=oneway&leg1=from:${
          travelData.origin || "NYC"
        },to:${travelData.destination || "LAX"},departure:${
          travelData.departureDate || "2024-07-01"
        }TANYT&passengers=adults:${travelData.travelers || 1}`,
        details: {
          departure: { at: "08:00", iataCode: travelData.origin || "NYC" },
          arrival: { at: "13:30", iataCode: travelData.destination || "LAX" },
        },
      },
      {
        provider: "Kayak",
        airline: "American",
        price: "325",
        currency: "USD",
        duration: "6h 15m",
        stops: 1,
        bookingUrl: `https://www.kayak.com/flights/${
          travelData.origin || "NYC"
        }-${travelData.destination || "LAX"}/${
          travelData.departureDate || "2024-07-01"
        }`,
        details: {
          departure: { at: "10:15", iataCode: travelData.origin || "NYC" },
          arrival: { at: "16:30", iataCode: travelData.destination || "LAX" },
        },
      },
      {
        provider: "Google Flights",
        airline: "United",
        price: "289",
        currency: "USD",
        duration: "5h 45m",
        stops: 0,
        bookingUrl: `https://www.google.com/travel/flights/search?tfs=CBwQAhooEgoyMDI0LTA3LTAxagcIARIDTllDcgcIARIDTEFYGgEBIAFAAUgBmAEB`,
        details: {
          departure: { at: "14:20", iataCode: travelData.origin || "NYC" },
          arrival: { at: "20:05", iataCode: travelData.destination || "LAX" },
        },
      },
    ],
    searchCriteria: travelData,
  };
}

async function getHotelComparisons(travelData: any) {
  return {
    type: "hotel",
    comparisons: [
      {
        provider: "Booking.com",
        hotelName: "Grand Plaza Hotel",
        price: "150",
        currency: "USD",
        rating: "4.5",
        location: travelData.destination || "Downtown",
        bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
          travelData.destination || "New York"
        )}&checkin=${travelData.checkInDate || "2024-07-01"}&checkout=${
          travelData.checkOutDate || "2024-07-03"
        }`,
        details: {
          checkIn: travelData.checkInDate,
          checkOut: travelData.checkOutDate,
          roomType: "Deluxe Room",
          amenities: ["WiFi", "Pool", "Gym"],
        },
      },
      {
        provider: "Expedia",
        hotelName: "City Center Inn",
        price: "120",
        currency: "USD",
        rating: "4.0",
        location: travelData.destination || "City Center",
        bookingUrl: `https://www.expedia.com/Hotels-Search?destination=${encodeURIComponent(
          travelData.destination || "New York"
        )}&startDate=${travelData.checkInDate || "2024-07-01"}&endDate=${
          travelData.checkOutDate || "2024-07-03"
        }`,
        details: {
          checkIn: travelData.checkInDate,
          checkOut: travelData.checkOutDate,
          roomType: "Standard Room",
          amenities: ["WiFi", "Breakfast"],
        },
      },
      {
        provider: "Hotels.com",
        hotelName: "Luxury Suites",
        price: "220",
        currency: "USD",
        rating: "5.0",
        location: travelData.destination || "Premium District",
        bookingUrl: `https://www.hotels.com/search.do?destination-id=${encodeURIComponent(
          travelData.destination || "New York"
        )}&q-check-in=${travelData.checkInDate || "2024-07-01"}&q-check-out=${
          travelData.checkOutDate || "2024-07-03"
        }`,
        details: {
          checkIn: travelData.checkInDate,
          checkOut: travelData.checkOutDate,
          roomType: "Executive Suite",
          amenities: ["WiFi", "Spa", "Concierge", "Pool"],
        },
      },
    ],
    searchCriteria: travelData,
  };
}

async function getAttractionComparisons(travelData: any) {
  return {
    type: "attraction",
    comparisons: [
      {
        provider: "Viator",
        name: "City Museum",
        price: "25",
        currency: "USD",
        rating: "4.3",
        category: "Museum",
        bookingUrl: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(
          travelData.destination || "New York"
        )}`,
        details: {
          description: "Explore the rich history and culture of the city",
          duration: "2-3 hours",
          location: travelData.destination,
        },
      },
      {
        provider: "GetYourGuide",
        name: "Scenic City Tour",
        price: "45",
        currency: "USD",
        rating: "4.7",
        category: "Tour",
        bookingUrl: `https://www.getyourguide.com/s/?q=${encodeURIComponent(
          travelData.destination || "New York"
        )}`,
        details: {
          description: "Guided tour of the city's top landmarks",
          duration: "4 hours",
          location: travelData.destination,
        },
      },
      {
        provider: "TripAdvisor",
        name: "Adventure Park",
        price: "35",
        currency: "USD",
        rating: "4.5",
        category: "Entertainment",
        bookingUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(
          travelData.destination || "New York"
        )}`,
        details: {
          description: "Thrilling outdoor activities and adventures",
          duration: "Full day",
          location: travelData.destination,
        },
      },
    ],
    searchCriteria: travelData,
  };
}

async function getGenericTravelComparisons(travelData: any) {
  // For general travel emails, provide a mix of suggestions
  return {
    type: "general",
    comparisons: [
      {
        provider: "Google Flights",
        type: "flight",
        name: "Flight Search",
        description: "Search for flights to your destination",
        bookingUrl: `https://www.google.com/travel/flights?q=flights%20to%20${encodeURIComponent(
          travelData.destination || "destination"
        )}`,
      },
      {
        provider: "Booking.com",
        type: "hotel",
        name: "Hotel Search",
        description: "Find hotels in your destination",
        bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
          travelData.destination || "destination"
        )}`,
      },
      {
        provider: "TripAdvisor",
        type: "attraction",
        name: "Activities & Attractions",
        description: "Discover things to do",
        bookingUrl: `https://www.tripadvisor.com/Attractions-g${encodeURIComponent(
          travelData.destination || "destination"
        )}`,
      },
    ],
    searchCriteria: travelData,
  };
}

async function storeTravelData(
  userId: string,
  emailId: string,
  travelData: any,
  comparisonData: any
) {
  try {
    // Helper function to convert empty strings to null for date fields
    const parseDate = (dateStr: string) => {
      if (!dateStr || dateStr.trim() === "") return null;
      return dateStr;
    };

    // Use admin client to insert directly, bypassing RLS
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
      // Don't throw - this is not critical for the user experience
    } else {
      console.log("✅ Travel data stored successfully");
    }
  } catch (error) {
    console.error("Failed to store travel data:", error);
    // Don't throw - this is not critical for the user experience
  }
}
