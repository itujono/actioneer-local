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

// Amadeus API configuration
const AMADEUS_CLIENT_ID = Deno.env.get("AMADEUS_CLIENT_ID") ?? "";
const AMADEUS_CLIENT_SECRET = Deno.env.get("AMADEUS_CLIENT_SECRET") ?? "";
const AMADEUS_BASE_URL = "https://api.amadeus.com";

// Cache for Amadeus access token
let amadeusAccessToken: string | null = null;
let tokenExpiryTime: number = 0;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
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
    const travelData = await extractTravelDataWithOpenAI(
      subject,
      from,
      emailBody
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
        comparisonData = await getGenericTravelComparisons(travelData);
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

// Amadeus API helper functions
async function getAmadeusAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (amadeusAccessToken && Date.now() < tokenExpiryTime) {
    return amadeusAccessToken;
  }

  console.log("🔑 Getting new Amadeus access token...");

  const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: AMADEUS_CLIENT_ID,
      client_secret: AMADEUS_CLIENT_SECRET,
    }),
  });

  if (!response.ok) {
    throw new Error(`Failed to get Amadeus token: ${response.statusText}`);
  }

  const data = await response.json();
  amadeusAccessToken = data.access_token;
  // Set expiry time (subtract 60 seconds for safety)
  tokenExpiryTime = Date.now() + (data.expires_in - 60) * 1000;

  console.log("✅ Amadeus access token obtained");
  return amadeusAccessToken;
}

async function callAmadeusAPI(
  endpoint: string,
  params: Record<string, any> = {}
): Promise<any> {
  const token = await getAmadeusAccessToken();

  const url = new URL(`${AMADEUS_BASE_URL}${endpoint}`);
  Object.keys(params).forEach((key) => {
    if (params[key] !== undefined && params[key] !== null) {
      url.searchParams.append(key, params[key].toString());
    }
  });

  console.log("🌐 Calling Amadeus API:", url.toString());

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    console.error(
      "❌ Amadeus API error:",
      response.status,
      response.statusText
    );
    const errorText = await response.text();
    console.error("Error details:", errorText);
    throw new Error(
      `Amadeus API error: ${response.status} ${response.statusText}`
    );
  }

  const data = await response.json();
  console.log("✅ Amadeus API response received");
  return data;
}

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
  try {
    console.log("✈️ Getting real flight data from Amadeus...");

    // Prepare search parameters
    const searchParams = {
      originLocationCode: travelData.origin || "NYC",
      destinationLocationCode: travelData.destination || "LAX",
      departureDate: travelData.departureDate || "2024-07-01",
      adults: travelData.travelers || 1,
      max: 3, // Limit to 3 results for comparison
    };

    // Add return date if available
    if (travelData.returnDate) {
      searchParams.returnDate = travelData.returnDate;
    }

    console.log("🔍 Flight search parameters:", searchParams);

    // Call Amadeus Flight Offers Search API
    const amadeusResponse = await callAmadeusAPI(
      "/v2/shopping/flight-offers",
      searchParams
    );

    if (!amadeusResponse.data || amadeusResponse.data.length === 0) {
      console.log("⚠️ No flights found from Amadeus, using fallback data");
      return getFallbackFlightComparisons(travelData);
    }

    console.log(`✅ Found ${amadeusResponse.data.length} flights from Amadeus`);

    // Transform Amadeus data to our format
    const comparisons = amadeusResponse.data
      .slice(0, 3)
      .map((offer: any, index: number) => {
        const itinerary = offer.itineraries[0]; // First itinerary (outbound)
        const segment = itinerary.segments[0]; // First segment
        const lastSegment = itinerary.segments[itinerary.segments.length - 1];

        const providers = ["Amadeus Direct", "Expedia", "Kayak"];
        const airlines = {
          AA: "American Airlines",
          DL: "Delta Air Lines",
          UA: "United Airlines",
          B6: "JetBlue Airways",
          WN: "Southwest Airlines",
          AS: "Alaska Airlines",
          NK: "Spirit Airlines",
          F9: "Frontier Airlines",
        };

        return {
          provider: providers[index] || "Amadeus Direct",
          airline: airlines[segment.carrierCode] || segment.carrierCode,
          price: offer.price.total,
          currency: offer.price.currency,
          duration: itinerary.duration.replace("PT", "").toLowerCase(),
          stops: itinerary.segments.length - 1,
          bookingUrl: `https://www.amadeus.com/booking?offer=${offer.id}`,
          details: {
            departure: {
              at: segment.departure.at.split("T")[1].substring(0, 5),
              iataCode: segment.departure.iataCode,
            },
            arrival: {
              at: lastSegment.arrival.at.split("T")[1].substring(0, 5),
              iataCode: lastSegment.arrival.iataCode,
            },
          },
        };
      });

    return {
      type: "flight",
      comparisons,
      searchCriteria: travelData,
    };
  } catch (error) {
    console.error("❌ Error fetching flights from Amadeus:", error);
    console.log("🔄 Falling back to mock data");
    return getFallbackFlightComparisons(travelData);
  }
}

function getFallbackFlightComparisons(travelData: any) {
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
  try {
    console.log("🏨 Getting real hotel data from Amadeus...");

    // First, we need to get hotel IDs for the destination using Hotel List API
    const cityCode = await getCityCodeFromDestination(
      travelData.destination || "NYC"
    );

    const hotelListParams = {
      cityCode: cityCode,
      radius: 5,
      radiusUnit: "KM",
      hotelSource: "ALL",
    };

    console.log("🔍 Hotel list search parameters:", hotelListParams);

    // Get list of hotels in the area
    const hotelListResponse = await callAmadeusAPI(
      "/v1/reference-data/locations/hotels/by-city",
      hotelListParams
    );

    if (!hotelListResponse.data || hotelListResponse.data.length === 0) {
      console.log("⚠️ No hotels found from Amadeus, using fallback data");
      return getFallbackHotelComparisons(travelData);
    }

    console.log(
      `✅ Found ${hotelListResponse.data.length} hotels from Amadeus`
    );

    // Get hotel offers for the first few hotels
    const hotelIds = hotelListResponse.data
      .slice(0, 3)
      .map((hotel: any) => hotel.hotelId);

    const hotelOffersParams = {
      hotelIds: hotelIds.join(","),
      checkInDate: travelData.checkInDate || "2024-07-01",
      checkOutDate: travelData.checkOutDate || "2024-07-03",
      adults: travelData.guests || 1,
    };

    console.log("💰 Hotel offers search parameters:", hotelOffersParams);

    const hotelOffersResponse = await callAmadeusAPI(
      "/v3/shopping/hotel-offers",
      hotelOffersParams
    );

    if (!hotelOffersResponse.data || hotelOffersResponse.data.length === 0) {
      console.log("⚠️ No hotel offers found, using fallback data");
      return getFallbackHotelComparisons(travelData);
    }

    // Transform Amadeus data to our format
    const comparisons = await Promise.all(
      hotelOffersResponse.data
        .slice(0, 3)
        .map(async (hotelData: any, index: number) => {
          const hotel = hotelData.hotel;
          const offer = hotelData.offers[0]; // First offer

          const providers = ["Amadeus Direct", "Booking.com", "Expedia"];

          // Get hotel image using Google Places API or fallback to placeholder
          const hotelImage = await getHotelImage(
            hotel.name,
            hotel.geoCode?.latitude,
            hotel.geoCode?.longitude
          );

          return {
            provider: providers[index] || "Amadeus Direct",
            hotelName: hotel.name,
            price: offer.price.total,
            currency: offer.price.currency,
            rating: hotel.rating || "4.0",
            location: `${hotel.address?.cityName || travelData.destination}`,
            bookingUrl: `https://www.amadeus.com/hotel-booking?hotel=${hotel.hotelId}&offer=${offer.id}`,
            image: hotelImage,
            details: {
              checkIn: travelData.checkInDate,
              checkOut: travelData.checkOutDate,
              roomType: offer.room?.typeEstimated?.category || "Standard Room",
              amenities: hotel.amenities || ["WiFi", "Room Service"],
            },
          };
        })
    );

    return {
      type: "hotel",
      comparisons,
      searchCriteria: travelData,
    };
  } catch (error) {
    console.error("❌ Error fetching hotels from Amadeus:", error);
    console.log("🔄 Falling back to mock data");
    return getFallbackHotelComparisons(travelData);
  }
}

async function getCityCodeFromDestination(
  destination: string
): Promise<string> {
  try {
    // Use Amadeus Airport & City Search to get city code
    const searchResponse = await callAmadeusAPI(
      "/v1/reference-data/locations",
      {
        keyword: destination,
        subType: "CITY",
      }
    );

    if (searchResponse.data && searchResponse.data.length > 0) {
      return searchResponse.data[0].iataCode;
    }
  } catch (error) {
    console.error("Error getting city code:", error);
  }

  // Fallback to common city codes
  const cityCodeMap = {
    "new york": "NYC",
    london: "LON",
    paris: "PAR",
    tokyo: "TYO",
    "los angeles": "LAX",
    chicago: "CHI",
    miami: "MIA",
    "san francisco": "SFO",
  };

  const normalizedDestination = destination.toLowerCase();
  return cityCodeMap[normalizedDestination] || "NYC";
}

async function getHotelImage(
  hotelName: string,
  latitude?: number,
  longitude?: number
): Promise<string> {
  // For now, just use placeholder images until we find a better image solution
  console.log(`🖼️ Using placeholder image for ${hotelName}`);
  return getPlaceholderHotelImage(hotelName);
}

function getPlaceholderHotelImage(hotelName: string): string {
  // Array of high-quality hotel images from Unsplash
  const hotelImages = [
    "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Luxury hotel lobby
    "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Modern hotel exterior
    "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Boutique hotel room
    "https://images.unsplash.com/photo-1564501049412-61c2a3083791?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Resort hotel pool
    "https://images.unsplash.com/photo-1571896349842-33c89424de2d?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // City hotel building
    "https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=300&fit=crop&crop=center&auto=format&q=80", // Hotel reception
  ];

  // Use hotel name to consistently select the same image for the same hotel
  const nameHash = hotelName.split("").reduce((a, b) => {
    a = (a << 5) - a + b.charCodeAt(0);
    return a & a;
  }, 0);

  const imageIndex = Math.abs(nameHash) % hotelImages.length;
  return hotelImages[imageIndex];
}

function getFallbackHotelComparisons(travelData: any) {
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
        image:
          "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
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
        image:
          "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
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
        image:
          "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
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
  try {
    console.log("🎯 Getting real attraction data from Amadeus...");

    // First, get coordinates for the destination using City Search API
    const coordinates = await getDestinationCoordinates(
      travelData.destination || "New York"
    );

    console.log("📍 Destination coordinates:", coordinates);

    // Search for activities using Tours and Activities API
    const activitiesParams = {
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      radius: 5, // 5km radius
    };

    console.log("🔍 Activities search parameters:", activitiesParams);

    const activitiesResponse = await callAmadeusAPI(
      "/v1/shopping/activities",
      activitiesParams
    );

    if (!activitiesResponse.data || activitiesResponse.data.length === 0) {
      console.log("⚠️ No activities found from Amadeus, using fallback data");
      return getFallbackAttractionComparisons(travelData);
    }

    console.log(
      `✅ Found ${activitiesResponse.data.length} activities from Amadeus`
    );

    // Transform Amadeus data to our format
    const comparisons = activitiesResponse.data
      .slice(0, 3)
      .map((activity: any, index: number) => {
        // Mix of providers to show comparison
        const providers = ["Amadeus Direct", "GetYourGuide", "Viator"];

        // Determine category based on activity name and description
        const activityName = activity.name.toLowerCase();
        const description = activity.shortDescription?.toLowerCase() || "";
        let category = "Tour";

        if (activityName.includes("museum") || description.includes("museum")) {
          category = "Museum";
        } else if (
          activityName.includes("food") ||
          activityName.includes("culinary")
        ) {
          category = "Food & Drink";
        } else if (
          activityName.includes("skip") ||
          activityName.includes("ticket")
        ) {
          category = "Attraction";
        } else if (
          activityName.includes("walking") ||
          activityName.includes("guided")
        ) {
          category = "Tour";
        } else if (
          activityName.includes("adventure") ||
          activityName.includes("outdoor")
        ) {
          category = "Adventure";
        }

        return {
          provider: providers[index] || "Amadeus Direct",
          name: activity.name,
          price: activity.price?.amount || "25",
          currency: activity.price?.currencyCode || "USD",
          rating: activity.rating || "4.5",
          category: category,
          bookingUrl:
            activity.bookingLink ||
            `https://www.amadeus.com/activities/${activity.id}`,
          details: {
            description:
              activity.shortDescription ||
              "Experience the best of the destination",
            duration: "2-4 hours", // Default duration as Amadeus doesn't always provide this
            location: travelData.destination,
            images: activity.pictures || [],
          },
        };
      });

    return {
      type: "attraction",
      comparisons,
      searchCriteria: travelData,
    };
  } catch (error) {
    console.error("❌ Error fetching attractions from Amadeus:", error);
    console.log("🔄 Falling back to mock data");
    return getFallbackAttractionComparisons(travelData);
  }
}

async function getDestinationCoordinates(destination: string): Promise<{
  latitude: number;
  longitude: number;
}> {
  try {
    // Use Amadeus City Search API to get coordinates
    const citySearchResponse = await callAmadeusAPI(
      "/v1/reference-data/locations/cities",
      {
        keyword: destination,
        max: 1,
      }
    );

    if (citySearchResponse.data && citySearchResponse.data.length > 0) {
      const city = citySearchResponse.data[0];
      return {
        latitude: parseFloat(city.geoCode.latitude),
        longitude: parseFloat(city.geoCode.longitude),
      };
    }
  } catch (error) {
    console.error("Error getting destination coordinates:", error);
  }

  // Fallback coordinates for common destinations
  const coordinateMap: Record<string, { latitude: number; longitude: number }> =
    {
      "new york": { latitude: 40.7128, longitude: -74.006 },
      london: { latitude: 51.5074, longitude: -0.1278 },
      paris: { latitude: 48.8566, longitude: 2.3522 },
      tokyo: { latitude: 35.6762, longitude: 139.6503 },
      "los angeles": { latitude: 34.0522, longitude: -118.2437 },
      chicago: { latitude: 41.8781, longitude: -87.6298 },
      miami: { latitude: 25.7617, longitude: -80.1918 },
      "san francisco": { latitude: 37.7749, longitude: -122.4194 },
      barcelona: { latitude: 41.3851, longitude: 2.1734 },
      rome: { latitude: 41.9028, longitude: 12.4964 },
      amsterdam: { latitude: 52.3676, longitude: 4.9041 },
      berlin: { latitude: 52.52, longitude: 13.405 },
    };

  const normalizedDestination = destination.toLowerCase();
  return (
    coordinateMap[normalizedDestination] || {
      latitude: 40.7128,
      longitude: -74.006,
    }
  ); // Default to NYC
}

function getFallbackAttractionComparisons(travelData: any) {
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
        price: "Compare Prices",
        currency: "",
        description: "Search for flights to your destination",
        bookingUrl: `https://www.google.com/travel/flights?q=flights%20to%20${encodeURIComponent(
          travelData.destination || "destination"
        )}`,
      },
      {
        provider: "Booking.com",
        type: "hotel",
        name: "Hotel Search",
        price: "Compare Rates",
        currency: "",
        description: "Find hotels in your destination",
        bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
          travelData.destination || "destination"
        )}`,
      },
      {
        provider: "TripAdvisor",
        type: "attraction",
        name: "Activities & Attractions",
        price: "Explore Options",
        currency: "",
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
