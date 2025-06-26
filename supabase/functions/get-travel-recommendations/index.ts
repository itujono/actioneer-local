import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import "https://deno.land/x/xhr@0.1.0/mod.ts";

const AMADEUS_BASE_URL = "https://api.amadeus.com";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

interface TravelRequest {
  destination: string;
  checkIn?: string;
  checkOut?: string;
  travelers?: number;
  budget?: "low" | "medium" | "high";
}

interface AmadeusTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface AmadeusHotel {
  name: string;
  hotelId: string;
  address: {
    countryCode: string;
    cityName: string;
    postalCode: string;
  };
  geoCode: {
    latitude: number;
    longitude: number;
  };
  rating?: number;
  price?: {
    currency: string;
    total: string;
  };
  description?: {
    text: string;
  };
}

interface AmadeusPointOfInterest {
  name: string;
  category: string;
  subCategory: string;
  geoCode: {
    latitude: number;
    longitude: number;
  };
  tags: string[];
  rank?: number;
}

interface RecommendationItem {
  id: string;
  name: string;
  type: "hotel" | "attraction" | "restaurant";
  description?: string;
  price?: {
    amount: string;
    currency: string;
    perNight?: boolean;
  };
  rating?: number;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  imageUrl?: string;
  bookingUrl?: string;
  category?: string;
  rank?: number;
  // Additional hotel-specific fields
  amenities?: string[];
  area?: string;
  chain?: string;
  starRating?: number;
  roomType?: string;
  cancellationPolicy?: string;
  // Enhanced rating information from sentiments API
  sentimentScore?: number; // Overall sentiment score (0-100)
  reviewCount?: number; // Number of reviews
  overallRating?: number; // Computed overall rating
}

interface RecommendationsResponse {
  hotels: RecommendationItem[];
  attractions: RecommendationItem[];
  overview: string;
  destination: string;
  searchDate: string;
}

async function getAmadeusToken(): Promise<string> {
  const apiKey = Deno.env.get("AMADEUS_CLIENT_ID");
  const apiSecret = Deno.env.get("AMADEUS_CLIENT_SECRET");

  console.log(
    `🔑 Getting Amadeus token with client_id: ${
      apiKey ? apiKey.substring(0, 8) + "..." : "MISSING"
    }`
  );
  console.log(`🔑 Client secret present: ${apiSecret ? "YES" : "NO"}`);

  if (!apiKey || !apiSecret) {
    throw new Error("Amadeus API credentials not configured");
  }

  console.log(
    `🔑 Requesting token from: ${AMADEUS_BASE_URL}/v1/security/oauth2/token`
  );

  const response = await fetch(`${AMADEUS_BASE_URL}/v1/security/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: new URLSearchParams({
      grant_type: "client_credentials",
      client_id: apiKey,
      client_secret: apiSecret,
    }),
  });

  console.log(`🔑 Token response status: ${response.status}`);

  if (!response.ok) {
    const errorText = await response.text();
    console.log(
      `🔑 Token error: ${response.status} ${response.statusText} ${errorText}`
    );
    throw new Error(
      `Failed to get Amadeus token: ${response.statusText} - ${errorText}`
    );
  }

  const data: AmadeusTokenResponse = await response.json();
  console.log(
    `🔑 Token received successfully, expires in: ${data.expires_in} seconds`
  );
  return data.access_token;
}

async function searchCityCoordinates(destination: string, token: string) {
  console.log(`🔍 Searching for city coordinates: ${destination}`);

  // Try city search first
  const cityUrl = new URL(
    `${AMADEUS_BASE_URL}/v1/reference-data/locations/cities`
  );
  cityUrl.searchParams.set("keyword", destination);
  cityUrl.searchParams.set("max", "1");

  const cityResponse = await fetch(cityUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`🔍 City search response status: ${cityResponse.status}`);

  if (cityResponse.ok) {
    const cityData = await cityResponse.json();
    console.log("🔍 City search result:", JSON.stringify(cityData, null, 2));

    if (cityData.data && cityData.data.length > 0) {
      const city = cityData.data[0];
      if (city.geoCode && city.geoCode.latitude && city.geoCode.longitude) {
        return {
          lat: parseFloat(city.geoCode.latitude),
          lng: parseFloat(city.geoCode.longitude),
          cityCode: city.iataCode,
        };
      }
    }
  } else {
    const cityError = await cityResponse.text();
    console.log(
      `🔍 City search failed: ${cityResponse.status} ${cityResponse.statusText} ${cityError}`
    );
  }

  // If city search fails, try airport/location search as fallback
  console.log("City search failed, trying general location search...");

  const locationUrl = new URL(
    `${AMADEUS_BASE_URL}/v1/reference-data/locations`
  );
  locationUrl.searchParams.set("keyword", destination);
  locationUrl.searchParams.set("subType", "AIRPORT,CITY");
  locationUrl.searchParams.set("page[limit]", "1");

  const locationResponse = await fetch(locationUrl.toString(), {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`Location search response status: ${locationResponse.status}`);

  if (locationResponse.ok) {
    const locationData = await locationResponse.json();
    console.log(
      "Location search result:",
      JSON.stringify(locationData, null, 2)
    );

    if (locationData.data && locationData.data.length > 0) {
      const location = locationData.data[0];
      if (
        location.geoCode &&
        location.geoCode.latitude &&
        location.geoCode.longitude
      ) {
        return {
          lat: parseFloat(location.geoCode.latitude),
          lng: parseFloat(location.geoCode.longitude),
          cityCode: location.iataCode,
        };
      }
    }
  }

  // If both searches fail, provide fallback coordinates for popular destinations
  const fallbackCoordinates = getFallbackCoordinates(destination);
  if (fallbackCoordinates) {
    console.log(
      `Using fallback coordinates for ${destination}:`,
      fallbackCoordinates
    );
    return fallbackCoordinates;
  }

  return null;
}

function parseDestinationFromText(text: string): string {
  console.log(`📍 Parsing destination from: "${text}"`);

  // Country-to-main-city mapping for better hotel search results
  const countryToMainCity: Record<string, string> = {
    turkey: "istanbul",
    thailand: "bangkok",
    japan: "tokyo",
    france: "paris",
    germany: "berlin",
    spain: "madrid",
    italy: "rome",
    netherlands: "amsterdam",
    india: "mumbai",
    china: "beijing",
  };

  // Simplified approach - look for known city names first (most reliable)
  const knownDestinations = [
    "Singapore",
    "Thailand",
    "Bangkok",
    "Turkey",
    "Istanbul",
    "Ankara",
    "London",
    "Paris",
    "New York",
    "Tokyo",
    "Sydney",
    "Berlin",
    "Madrid",
    "Rome",
    "Amsterdam",
    "Barcelona",
    "Milan",
    "Vienna",
    "Prague",
    "Budapest",
    "Jakarta",
    "Manila",
    "Kuala Lumpur",
    "Hong Kong",
    "Taipei",
    "Seoul",
    "Beijing",
    "Shanghai",
    "Mumbai",
    "Delhi",
  ];

  for (const dest of knownDestinations) {
    if (text.toLowerCase().includes(dest.toLowerCase())) {
      console.log(`📍 Found destination by keyword: "${dest}"`);

      // If it's a country, map it to the main city for better hotel results
      const destLower = dest.toLowerCase();
      if (countryToMainCity[destLower]) {
        const mainCity = countryToMainCity[destLower];
        console.log(
          `📍 Mapping country "${dest}" to main city "${mainCity}" for hotel search`
        );
        return mainCity;
      }

      return dest;
    }
  }

  // Pattern-based extraction as fallback
  const destinationPatterns = [
    // Look for "to [destination]" patterns with flexible ending
    /(?:to|in|visit|trip to|holiday to|itinerary to)\s+([A-Za-z\s&,]+?)(?:\s+🇸🇬|\s+🇹🇭|$|\s+&)/i,
    // Direct city/country names in context
    /(Singapore|Thailand|London|Paris|Bangkok)/gi,
  ];

  for (const pattern of destinationPatterns) {
    const match = text.match(pattern);
    if (match) {
      let destination = match[1] || match[0];
      // Clean up the destination
      destination = destination
        .replace(/[&,]/g, "") // Remove & and commas
        .replace(/\s+/g, " ") // Normalize spaces
        .trim();

      // If multiple destinations, take the first one
      if (destination.includes(" ")) {
        const words = destination.split(" ");
        // Look for known cities/countries
        for (const word of words) {
          if (word.length > 2 && /^[A-Za-z]+$/.test(word)) {
            destination = word;
            break;
          }
        }
      }

      console.log(`📍 Extracted destination: "${destination}"`);
      return destination;
    }
  }

  console.log(`📍 No destination found, using original text: "${text}"`);
  return text;
}

function getFallbackCoordinates(
  destination: string
): { lat: number; lng: number; cityCode?: string } | null {
  const fallbacks: Record<
    string,
    { lat: number; lng: number; cityCode?: string }
  > = {
    // Popular destinations with known coordinates
    singapore: { lat: 1.3521, lng: 103.8198, cityCode: "SIN" },
    thailand: { lat: 13.7563, lng: 100.5018, cityCode: "BKK" }, // Bangkok as main city
    turkey: { lat: 41.0082, lng: 28.9784, cityCode: "IST" }, // Istanbul as main city
    istanbul: { lat: 41.0082, lng: 28.9784, cityCode: "IST" },
    ankara: { lat: 39.9334, lng: 32.8597, cityCode: "ANK" },
    london: { lat: 51.5074, lng: -0.1278, cityCode: "LON" },
    paris: { lat: 48.8566, lng: 2.3522, cityCode: "PAR" },
    "new york": { lat: 40.7128, lng: -74.006, cityCode: "NYC" },
    tokyo: { lat: 35.6762, lng: 139.6503, cityCode: "TYO" },
    sydney: { lat: -33.8688, lng: 151.2093, cityCode: "SYD" },
    berlin: { lat: 52.52, lng: 13.405, cityCode: "BER" },
    madrid: { lat: 40.4168, lng: -3.7038, cityCode: "MAD" },
    rome: { lat: 41.9028, lng: 12.4964, cityCode: "ROM" },
    amsterdam: { lat: 52.3676, lng: 4.9041, cityCode: "AMS" },
    bangkok: { lat: 13.7563, lng: 100.5018, cityCode: "BKK" },
  };

  const key = destination.toLowerCase().trim();
  return fallbacks[key] || null;
}

async function getHotelSentiments(
  hotelIds: string[],
  token: string
): Promise<
  Record<
    string,
    { sentimentScore: number; reviewCount: number; overallRating: number }
  >
> {
  if (hotelIds.length === 0) return {};

  const sentiments: Record<
    string,
    { sentimentScore: number; reviewCount: number; overallRating: number }
  > = {};

  // Amadeus sentiments API has a limit - let's batch requests with max 3 hotels per request
  const batchSize = 3;
  const batches: string[][] = [];

  for (let i = 0; i < hotelIds.length; i += batchSize) {
    batches.push(hotelIds.slice(i, i + batchSize));
  }

  console.log(
    `🌟 Fetching sentiments for ${hotelIds.length} hotels in ${batches.length} batches of max ${batchSize}`
  );

  // Process batches sequentially to avoid rate limiting
  for (let batchIndex = 0; batchIndex < batches.length; batchIndex++) {
    const batch = batches[batchIndex];
    console.log(
      `🌟 Processing batch ${batchIndex + 1}/${batches.length}: ${batch.join(
        ", "
      )}`
    );

    const sentimentsUrl = `${AMADEUS_BASE_URL}/v2/e-reputation/hotel-sentiments?hotelIds=${batch.join(
      ","
    )}`;

    try {
      const response = await fetch(sentimentsUrl, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(
        `🌟 Batch ${batchIndex + 1} response status: ${response.status}`
      );

      if (response.ok) {
        const data = await response.json();
        console.log(
          `🌟 Batch ${batchIndex + 1} response:`,
          JSON.stringify(data, null, 2)
        );

        if (data.data && Array.isArray(data.data)) {
          data.data.forEach((sentiment: any) => {
            if (sentiment.hotelId && sentiment.overallRating !== undefined) {
              sentiments[sentiment.hotelId] = {
                sentimentScore: sentiment.sentimentScore || 0,
                reviewCount: sentiment.numberOfReviews || 0,
                overallRating: parseFloat(sentiment.overallRating) || 0,
              };
            }
          });
        }
      } else {
        const errorText = await response.text();
        console.error(
          `🌟 Batch ${batchIndex + 1} failed: ${response.status} ${
            response.statusText
          }`,
          errorText
        );
        // Continue with other batches even if one fails
      }

      // Small delay between batches to be nice to the API
      if (batchIndex < batches.length - 1) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    } catch (error) {
      console.error(`🌟 Batch ${batchIndex + 1} error:`, error);
      // Continue with other batches
    }
  }

  console.log(
    `🌟 Final: Processed sentiments for ${
      Object.keys(sentiments).length
    } out of ${hotelIds.length} hotels`
  );
  return sentiments;
}

async function searchHotels(
  coordinates: { lat: number; lng: number },
  token: string,
  checkIn?: string,
  checkOut?: string,
  adults = 2
): Promise<RecommendationItem[]> {
  // For hotel search, we need check-in and check-out dates
  // Default to next week (7 days from now) and 1 night stay
  const defaultCheckIn =
    checkIn ||
    new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
  const defaultCheckOut =
    checkOut ||
    new Date(Date.now() + 8 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];

  console.log(
    `🏨 Hotel search params: lat=${coordinates.lat}, lng=${
      coordinates.lng
    }, cityCode=${
      (coordinates as any).cityCode || "N/A"
    }, checkIn=${defaultCheckIn}, checkOut=${defaultCheckOut}, adults=${adults}`
  );

  // Step 1: Get hotel IDs first using the correct reference endpoints
  let hotelIds: string[] = [];

  // Try both by-city and by-geocode endpoints
  const hotelRefUrls: string[] = [
    // By geocode - always works
    `${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-geocode?latitude=${coordinates.lat}&longitude=${coordinates.lng}&radius=20`,
  ];

  // Add city code search if available
  if ((coordinates as any).cityCode) {
    hotelRefUrls.unshift(
      `${AMADEUS_BASE_URL}/v1/reference-data/locations/hotels/by-city?cityCode=${
        (coordinates as any).cityCode
      }`
    );
  }

  for (let i = 0; i < hotelRefUrls.length; i++) {
    const url = hotelRefUrls[i];
    console.log(`🏨 Trying hotel reference URL ${i + 1}: ${url}`);

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(
      `🏨 Hotel reference ${i + 1} response status: ${response.status}`
    );

    if (response.ok) {
      const data = await response.json();
      console.log(
        `🏨 Hotel reference ${i + 1} response:`,
        JSON.stringify(data, null, 2)
      );

      if (data.data && data.data.length > 0) {
        hotelIds = data.data.slice(0, 10).map((hotel: any) => hotel.hotelId);
        console.log(`🏨 Found ${hotelIds.length} hotel IDs:`, hotelIds);
        break; // Success, no need to try other endpoints
      }
    } else {
      const errorText = await response.text();
      console.error(
        `🏨 Hotel reference ${i + 1} failed: ${response.status} ${
          response.statusText
        }`,
        errorText
      );
    }
  }

  if (hotelIds.length === 0) {
    console.warn(
      `🏨 No hotel IDs found for coordinates: lat=${coordinates.lat}, lng=${coordinates.lng}`
    );
    return [];
  }

  // Step 2: Get hotel sentiments in parallel with offers
  const sentimentsPromise = getHotelSentiments(hotelIds, token);

  // Step 3: Search for actual hotel offers using the hotel IDs
  const hotelOffersUrl = `${AMADEUS_BASE_URL}/v3/shopping/hotel-offers?hotelIds=${hotelIds.join(
    ","
  )}&checkInDate=${defaultCheckIn}&checkOutDate=${defaultCheckOut}&adults=${adults}&max=10&currency=USD`;

  console.log(`🏨 Searching hotel offers: ${hotelOffersUrl}`);

  const offersResponse = await fetch(hotelOffersUrl, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });

  console.log(`🏨 Hotel offers response status: ${offersResponse.status}`);

  if (offersResponse.ok) {
    const offersData = await offersResponse.json();
    console.log(
      `🏨 Hotel offers response:`,
      JSON.stringify(offersData, null, 2)
    );

    // Wait for sentiments data
    const sentiments = await sentimentsPromise;
    console.log(`🌟 Final sentiments object:`, sentiments);
    console.log(
      `🌟 Number of hotels with sentiment data: ${
        Object.keys(sentiments).length
      }`
    );

    if (offersData.data && offersData.data.length > 0) {
      return offersData.data
        .slice(0, 6)
        .map((hotelOffer: any): RecommendationItem => {
          const hotel = hotelOffer.hotel;
          const offer = hotelOffer.offers?.[0];

          // Extract amenities from hotel data
          const amenities: string[] = [];
          if (hotel.amenities) {
            hotel.amenities.forEach((amenity: any) => {
              if (amenity.description) {
                amenities.push(amenity.description);
              }
            });
          }

          // Determine area/district from address
          console.log(
            `🏨 Hotel address data:`,
            JSON.stringify(hotel.address, null, 2)
          );

          let area: string | undefined = undefined;
          if (hotel.address) {
            if (hotel.address.postalCode) {
              area = `${hotel.address.cityName || ""} ${
                hotel.address.postalCode
              }`.trim();
            } else if (hotel.address.lines && hotel.address.lines.length > 0) {
              // Use first line of address as area if no postal code
              area = hotel.address.lines[0];
            } else if (hotel.address.cityName) {
              area = hotel.address.cityName;
            }
          }

          // Get sentiment data for this hotel
          const hotelSentiment = sentiments[hotel.hotelId];
          console.log(`🏨 Hotel ${hotel.hotelId} (${hotel.name}):`);
          console.log(`  - Basic rating: ${hotel.rating}`);
          console.log(`  - Sentiment data:`, hotelSentiment);
          console.log(
            `  - Final rating: ${
              hotelSentiment?.overallRating ||
              (hotel.rating ? parseFloat(hotel.rating) : undefined)
            }`
          );

          return {
            id: hotel.hotelId,
            name: hotel.name,
            type: "hotel" as const,
            description: hotel.description?.text,
            price: offer?.price
              ? {
                  amount: offer.price.total,
                  currency: offer.price.currency,
                  perNight: true,
                }
              : undefined,
            // Use sentiment-based rating if available, fallback to basic rating
            rating:
              hotelSentiment?.overallRating ||
              (hotel.rating ? parseFloat(hotel.rating) : undefined),
            address: hotel.address
              ? `${hotel.address.lines?.join(", ") || ""}, ${
                  hotel.address.cityName || ""
                }`.trim()
              : undefined,
            coordinates: {
              lat: parseFloat(hotel.latitude || coordinates.lat),
              lng: parseFloat(hotel.longitude || coordinates.lng),
            },
            // Enhanced hotel information
            amenities: amenities.length > 0 ? amenities.slice(0, 5) : undefined, // Limit to top 5
            area,
            chain: hotel.chainCode || undefined,
            starRating: hotel.rating
              ? Math.round(parseFloat(hotel.rating))
              : undefined,
            roomType:
              offer?.room?.description?.text ||
              offer?.room?.typeEstimated?.category,
            cancellationPolicy:
              offer?.policies?.cancellation?.type || undefined,
            // Enhanced rating information from sentiments API
            sentimentScore: hotelSentiment?.sentimentScore,
            reviewCount: hotelSentiment?.reviewCount,
            overallRating: hotelSentiment?.overallRating,
            // Generate booking URL for popular booking sites
            bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
              hotel.name + " " + (hotel.address?.cityName || "")
            )}&checkin=${
              checkIn ||
              new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            }&checkout=${
              checkOut ||
              new Date(Date.now() + 8 * 24 * 60 * 60 * 1000)
                .toISOString()
                .split("T")[0]
            }`,
          };
        });
    }
  } else {
    const errorText = await offersResponse.text();
    console.error(
      `🏨 Hotel offers search failed: ${offersResponse.status} ${offersResponse.statusText}`,
      errorText
    );
  }

  console.warn(`🏨 Hotel search completed but no offers found`);
  return [];
}

async function searchActivities(
  coordinates: { lat: number; lng: number },
  token: string
): Promise<RecommendationItem[]> {
  console.log(
    `🎭 Activities search params: lat=${coordinates.lat}, lng=${coordinates.lng}`
  );

  // Use the new Activities API endpoint
  const activitiesUrl = `${AMADEUS_BASE_URL}/v1/shopping/activities?latitude=${coordinates.lat}&longitude=${coordinates.lng}&radius=10`;

  console.log(`🎭 Trying Activities API: ${activitiesUrl}`);

  try {
    const response = await fetch(activitiesUrl, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    console.log(`🎭 Activities response status: ${response.status}`);

    if (response.ok) {
      const data = await response.json();
      console.log(`🎭 Activities response:`, JSON.stringify(data, null, 2));

      if (data.data && data.data.length > 0) {
        return data.data
          .slice(0, 8)
          .map((activity: any): RecommendationItem => {
            // Extract price information if available
            let price:
              | { amount: string; currency: string; perNight: boolean }
              | undefined = undefined;
            if (activity.price && activity.price.amount) {
              price = {
                amount: activity.price.amount,
                currency: activity.price.currencyCode || "EUR",
                perNight: false,
              };
            }

            // Extract rating from review scores if available
            let rating: number | undefined = undefined;
            if (activity.rating) {
              rating = parseFloat(activity.rating);
            }

            return {
              id: activity.id,
              name: activity.name,
              type: "attraction" as const,
              description: activity.shortDescription || activity.description,
              price,
              rating,
              category:
                activity.categories?.[0] || activity.category || "ACTIVITY",
              coordinates: {
                lat: parseFloat(activity.geoCode?.latitude || coordinates.lat),
                lng: parseFloat(activity.geoCode?.longitude || coordinates.lng),
              },
              bookingUrl: activity.bookingLink,
              imageUrl: activity.pictures?.[0] || undefined,
            };
          });
      }
    } else {
      const errorText = await response.text();
      console.error(
        `🎭 Activities search failed: ${response.status} ${response.statusText}`,
        errorText
      );
    }
  } catch (error) {
    console.error(`🎭 Activities search error:`, error);
  }

  console.warn(
    `🎭 Activities search failed for coordinates: lat=${coordinates.lat}, lng=${coordinates.lng}`
  );

  // Return some mock activities if API is completely unavailable
  console.log(`🎭 Returning mock activities as fallback`);
  return [
    {
      id: "mock-1",
      name: "City Center",
      type: "attraction" as const,
      description: "Historic city center with shops and restaurants",
      category: "SIGHTS",
      coordinates: coordinates,
    },
    {
      id: "mock-2",
      name: "Local Museum",
      type: "attraction" as const,
      description: "Popular local museum with cultural exhibits",
      category: "CULTURE",
      coordinates: coordinates,
    },
  ];
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { destination, checkIn, checkOut, travelers }: TravelRequest =
      await req.json();

    if (!destination) {
      return new Response(
        JSON.stringify({ error: "Destination is required" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Parse the actual destination from the email subject/text
    const parsedDestination = parseDestinationFromText(destination);
    console.log(
      `🎯 Original: "${destination}" → Parsed: "${parsedDestination}"`
    );

    // Get Amadeus access token
    const token = await getAmadeusToken();

    // Search for city coordinates
    const cityInfo = await searchCityCoordinates(parsedDestination, token);

    if (!cityInfo) {
      return new Response(JSON.stringify({ error: "Destination not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🎯 Using coordinates for ${parsedDestination}:`, cityInfo);

    // Search for both hotels and activities in parallel
    console.log(`🏨 Starting hotel search for ${parsedDestination}...`);
    const hotelsPromise = searchHotels(
      cityInfo,
      token,
      checkIn,
      checkOut,
      travelers
    );

    console.log(`🎭 Starting activities search for ${parsedDestination}...`);
    const activitiesPromise = searchActivities(cityInfo, token);

    // Wait for both searches to complete
    const [hotels, attractions] = await Promise.all([
      hotelsPromise,
      activitiesPromise,
    ]);

    console.log(
      `📊 Results: ${hotels.length} hotels, ${attractions.length} activities found`
    );

    const response: RecommendationsResponse = {
      hotels,
      attractions,
      overview: `Found ${hotels.length} hotel options and ${attractions.length} activities in ${parsedDestination}. Ready to explore!`,
      destination: parsedDestination,
      searchDate: new Date().toISOString(),
    };

    return new Response(JSON.stringify(response), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error fetching travel recommendations:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to fetch travel recommendations",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
