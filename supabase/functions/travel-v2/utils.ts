// Amadeus API configuration and utilities
const AMADEUS_CLIENT_ID = Deno.env.get("AMADEUS_CLIENT_ID") ?? "";
const AMADEUS_CLIENT_SECRET = Deno.env.get("AMADEUS_CLIENT_SECRET") ?? "";
const AMADEUS_BASE_URL = "https://test.api.amadeus.com";

// Cache for Amadeus access token (module-level)
let amadeusAccessToken: string | null = null;
let tokenExpiryTime: number = 0;

// Location detection utilities
export interface LocationInfo {
  country: string;
  countryCode: string;
  city?: string;
  airport: string;
  currency: string;
}

// API-based location detection using free services
export async function detectUserLocation(
  request: Request
): Promise<LocationInfo> {
  const headers = request.headers;

  let countryCode =
    headers.get("cf-ipcountry") ||
    headers.get("x-country") ||
    headers.get("x-country-code") ||
    headers.get("cloudfront-viewer-country") ||
    headers.get("x-forwarded-country") ||
    headers.get("geoip-country-code") ||
    headers.get("x-geoip-country");

  let city =
    headers.get("cf-ipcity") ||
    headers.get("x-city") ||
    headers.get("x-geoip-city") ||
    headers.get("cloudfront-viewer-city");

  // If no country from headers, try IP geolocation
  if (!countryCode) {
    try {
      // Check all possible IP sources
      const xForwardedFor = headers.get("x-forwarded-for");
      const xRealIp = headers.get("x-real-ip");
      const cfConnectingIp = headers.get("cf-connecting-ip");
      const xClientIp = headers.get("x-client-ip");

      console.log("🔍 IP Detection - Available IPs:");
      console.log(`  x-forwarded-for: ${xForwardedFor}`);
      console.log(`  x-real-ip: ${xRealIp}`);
      console.log(`  cf-connecting-ip: ${cfConnectingIp}`);
      console.log(`  x-client-ip: ${xClientIp}`);

      const clientIP =
        xForwardedFor?.split(",")[0]?.trim() ||
        xRealIp ||
        cfConnectingIp ||
        xClientIp;

      if (
        clientIP &&
        clientIP !== "127.0.0.1" &&
        !clientIP.startsWith("10.") &&
        !clientIP.startsWith("192.168.")
      ) {
        console.log(`🔍 Using IP for geolocation: ${clientIP}`);

        // Try ipinfo.io first (often more accurate)
        console.log("🌐 Trying ipinfo.io for geolocation...");
        const ipinfoResponse = await fetch(
          `https://ipinfo.io/${clientIP}/json`,
          {
            signal: AbortSignal.timeout(5000),
          }
        );

        if (ipinfoResponse.ok) {
          const ipinfoData = await ipinfoResponse.json();
          console.log(
            `🌐 ipinfo.io response:`,
            JSON.stringify(ipinfoData, null, 2)
          );
          countryCode = ipinfoData.country;
          city = ipinfoData.city;
          console.log(
            `✅ ipinfo.io result - Country: ${countryCode}, City: ${city}`
          );
          console.log(
            `📍 IP ${clientIP} detected as: ${ipinfoData.country} in ${
              ipinfoData.city || "Unknown city"
            }`
          );
        } else {
          console.log(
            `⚠️ ipinfo.io failed: ${ipinfoResponse.status}, trying fallback...`
          );

          const geoResponse = await fetch(
            `https://ipapi.co/${clientIP}/json/`,
            { signal: AbortSignal.timeout(5000) }
          );

          if (geoResponse.ok) {
            const geoData = await geoResponse.json();
            countryCode = geoData.country_code;
            city = geoData.city;
          }
        }
      }
    } catch (error) {
      console.log("⚠️ IP geolocation failed:", error);
    }
  }

  if (!countryCode) {
    countryCode = "US";
  }

  const locationInfo = await getLocationInfo(countryCode, city);

  return locationInfo;
}

// Get airport and currency info for a country
async function getLocationInfo(
  countryCode: string,
  city?: string
): Promise<LocationInfo> {
  console.log(`🔍 Getting location info for ${countryCode}, city: ${city}`);

  try {
    // Get currency for country using REST Countries API (free)
    const currencyInfo = await getCurrencyForCountry(countryCode);

    // Get airport for country/city using API Ninjas (free tier: 1000 requests/month)
    const airportInfo = await getAirportForLocation(countryCode, city);

    return {
      country: currencyInfo.countryName,
      countryCode: countryCode.toUpperCase(),
      city: city,
      airport: airportInfo.airport,
      currency: currencyInfo.currency,
    };
  } catch (error) {
    console.error("❌ Error getting location info:", error);

    // Fallback to minimal static mapping for major countries
    const fallbackInfo = getFallbackLocationInfo(countryCode);
    return fallbackInfo;
  }
}

// Get currency info using REST Countries API (completely free)
async function getCurrencyForCountry(
  countryCode: string
): Promise<{ countryName: string; currency: string }> {
  try {
    console.log(`💰 Getting currency for ${countryCode}`);

    const response = await fetch(
      `https://restcountries.com/v3.1/alpha/${countryCode}?fields=name,currencies`,
      {
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.ok) {
      const data = await response.json();
      const countryName = data.name?.common || countryCode;

      // Get first currency code
      const currencies = data.currencies || {};
      const currencyCode = Object.keys(currencies)[0] || "USD";

      console.log(`✅ Currency API result: ${countryName} -> ${currencyCode}`);
      return { countryName, currency: currencyCode };
    }
  } catch (error) {
    console.log("⚠️ Currency API failed:", error);
  }

  // Fallback for major currencies
  const currencyFallbacks: Record<
    string,
    { countryName: string; currency: string }
  > = {
    US: { countryName: "United States", currency: "USD" },
    GB: { countryName: "United Kingdom", currency: "GBP" },
    EU: { countryName: "Europe", currency: "EUR" },
    JP: { countryName: "Japan", currency: "JPY" },
    CN: { countryName: "China", currency: "CNY" },
    SG: { countryName: "Singapore", currency: "SGD" },
    AU: { countryName: "Australia", currency: "AUD" },
    CA: { countryName: "Canada", currency: "CAD" },
  };

  return currencyFallbacks[countryCode] || currencyFallbacks.US;
}

// Get airport info using API Ninjas Airports API (free tier: 1000 requests/month)
async function getAirportForLocation(
  countryCode: string,
  city?: string
): Promise<{ airport: string }> {
  try {
    console.log(`✈️ Getting airport for ${countryCode}, city: ${city}`);

    // Try to get airport by country (and city if available)
    const params = new URLSearchParams({
      country: countryCode,
      ...(city && { city: city }),
    });

    const apiKey = Deno.env.get("API_NINJAS_KEY");
    if (!apiKey) {
      console.log("⚠️ API_NINJAS_KEY not found, using fallback");
      throw new Error("API_NINJAS_KEY not configured");
    }

    const response = await fetch(
      `https://api.api-ninjas.com/v1/airports?${params}`,
      {
        headers: {
          "X-Api-Key": apiKey,
        },
        signal: AbortSignal.timeout(5000),
      }
    );

    if (response.ok) {
      const airports = await response.json();
      if (airports && airports.length > 0) {
        // Get the first major airport
        const airport = airports.find((a: any) => a.iata) || airports[0];
        const airportCode = airport.iata || airport.icao || "XXX";
        console.log(`✅ Airport API result: ${airportCode}`);
        return { airport: airportCode };
      }
    }
  } catch (error) {
    console.log("⚠️ Airport API failed:", error);
  }

  // Fallback to major airport codes
  const airportFallbacks: Record<string, string> = {
    US: "NYC", // New York area
    GB: "LON", // London area
    FR: "PAR", // Paris area
    DE: "BER", // Berlin
    JP: "NRT", // Tokyo Narita
    CN: "PEK", // Beijing
    SG: "SIN", // Singapore
    AU: "SYD", // Sydney
    CA: "YYZ", // Toronto
    TH: "BKK", // Bangkok
    ID: "CGK", // Jakarta
    MY: "KUL", // Kuala Lumpur
    PH: "MNL", // Manila
    VN: "SGN", // Ho Chi Minh City
    KR: "ICN", // Seoul Incheon
    IN: "DEL", // Delhi
    AE: "DXB", // Dubai
    HK: "HKG", // Hong Kong
    TW: "TPE", // Taipei
    ES: "MAD", // Madrid
    IT: "ROM", // Rome
    NL: "AMS", // Amsterdam
    CH: "ZUR", // Zurich
    BR: "GRU", // São Paulo
    MX: "MEX", // Mexico City
    NZ: "AKL", // Auckland
  };

  return { airport: airportFallbacks[countryCode] || "NYC" };
}

// Minimal fallback for when APIs fail
function getFallbackLocationInfo(countryCode: string): LocationInfo {
  const fallbacks: Record<string, LocationInfo> = {
    US: {
      country: "United States",
      countryCode: "US",
      airport: "NYC",
      currency: "USD",
    },
    GB: {
      country: "United Kingdom",
      countryCode: "GB",
      airport: "LON",
      currency: "GBP",
    },
    JP: {
      country: "Japan",
      countryCode: "JP",
      airport: "NRT",
      currency: "JPY",
    },
    SG: {
      country: "Singapore",
      countryCode: "SG",
      airport: "SIN",
      currency: "SGD",
    },
    AU: {
      country: "Australia",
      countryCode: "AU",
      airport: "SYD",
      currency: "AUD",
    },
  };

  return fallbacks[countryCode] || fallbacks.US;
}

export async function getAmadeusAccessToken(): Promise<string> {
  // Check if we have a valid cached token
  if (amadeusAccessToken && Date.now() < tokenExpiryTime) {
    return amadeusAccessToken;
  }

  console.log("🔑 Getting new Amadeus access token...");

  // Debug: Check if credentials are available
  if (!AMADEUS_CLIENT_ID || !AMADEUS_CLIENT_SECRET) {
    console.error("❌ Amadeus credentials missing:");
    console.error(
      "AMADEUS_CLIENT_ID:",
      AMADEUS_CLIENT_ID ? "✅ Set" : "❌ Missing"
    );
    console.error(
      "AMADEUS_CLIENT_SECRET:",
      AMADEUS_CLIENT_SECRET ? "✅ Set" : "❌ Missing"
    );
    throw new Error("Amadeus API credentials not configured");
  }

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
    const errorText = await response.text();
    console.error(
      "❌ Failed to get Amadeus token:",
      response.status,
      response.statusText
    );
    console.error("Error response:", errorText);
    throw new Error(
      `Failed to get Amadeus token: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  amadeusAccessToken = data.access_token;
  // Set expiry time (subtract 60 seconds for safety)
  tokenExpiryTime = Date.now() + (data.expires_in - 60) * 1000;

  console.log("✅ Amadeus access token obtained");
  return amadeusAccessToken!;
}

export async function callAmadeusAPI(
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
  console.log("📋 Request params:", JSON.stringify(params, null, 2));

  const response = await fetch(url.toString(), {
    method: "GET",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    },
  });

  if (!response.ok) {
    const errorText = await response.text();
    console.error(
      "❌ Amadeus API error:",
      response.status,
      response.statusText
    );
    console.error("📝 Request URL:", url.toString());
    console.error("📋 Request params:", JSON.stringify(params, null, 2));
    console.error("💥 Error response body:", errorText);
    throw new Error(
      `Amadeus API error: ${response.status} ${response.statusText} - ${errorText}`
    );
  }

  const data = await response.json();
  console.log(
    "✅ Amadeus API response received, data length:",
    data.data?.length || "no data array"
  );
  return data;
}

// Common city code mapping utility
export function getCityCodeFromName(destination: string): string {
  const cityCodeMap: Record<string, string> = {
    "new york": "NYC",
    london: "LON",
    paris: "PAR",
    tokyo: "TYO",
    "los angeles": "LAX",
    chicago: "CHI",
    miami: "MIA",
    "san francisco": "SFO",
    barcelona: "BCN",
    rome: "ROM",
    amsterdam: "AMS",
    berlin: "BER",
    madrid: "MAD",
    dubai: "DXB",
    singapore: "SIN",
    "hong kong": "HKG",
    sydney: "SYD",
    melbourne: "MEL",
    toronto: "YYZ",
    vancouver: "YVR",
    // Asian cities
    jakarta: "CGK",
    bangkok: "BKK",
    "kuala lumpur": "KUL",
    manila: "MNL",
    seoul: "ICN",
    "ho chi minh city": "SGN",
    "new delhi": "DEL",
    mumbai: "BOM",
    istanbul: "IST",
    // Additional major cities
    shanghai: "PVG",
    beijing: "PEK",
    osaka: "KIX",
    frankfurt: "FRA",
    zurich: "ZUR",
    vienna: "VIE",
  };

  const normalizedDestination = destination.toLowerCase();
  return cityCodeMap[normalizedDestination] || "NYC";
}

// Common coordinates mapping utility
export function getCoordinatesFromName(destination: string): {
  latitude: number;
  longitude: number;
} {
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
      madrid: { latitude: 40.4168, longitude: -3.7038 },
      dubai: { latitude: 25.2048, longitude: 55.2708 },
      singapore: { latitude: 1.3521, longitude: 103.8198 },
      "hong kong": { latitude: 22.3193, longitude: 114.1694 },
      sydney: { latitude: -33.8688, longitude: 151.2093 },
      melbourne: { latitude: -37.8136, longitude: 144.9631 },
      toronto: { latitude: 43.6532, longitude: -79.3832 },
      vancouver: { latitude: 49.2827, longitude: -123.1207 },
      // Asian cities
      jakarta: { latitude: -6.2088, longitude: 106.8456 },
      bangkok: { latitude: 13.7563, longitude: 100.5018 },
      "kuala lumpur": { latitude: 3.139, longitude: 101.6869 },
      manila: { latitude: 14.5995, longitude: 120.9842 },
      seoul: { latitude: 37.5665, longitude: 126.978 },
      "ho chi minh city": { latitude: 10.8231, longitude: 106.6297 },
      "new delhi": { latitude: 28.6139, longitude: 77.209 },
      mumbai: { latitude: 19.076, longitude: 72.8777 },
      istanbul: { latitude: 41.0082, longitude: 28.9784 },
      // Additional major cities
      shanghai: { latitude: 31.2304, longitude: 121.4737 },
      beijing: { latitude: 39.9042, longitude: 116.4074 },
      osaka: { latitude: 34.6937, longitude: 135.5023 },
      frankfurt: { latitude: 50.1109, longitude: 8.6821 },
      zurich: { latitude: 47.3769, longitude: 8.5417 },
      vienna: { latitude: 48.2082, longitude: 16.3738 },
    };

  const normalizedDestination = destination.toLowerCase();
  return (
    coordinateMap[normalizedDestination] || {
      latitude: 40.7128,
      longitude: -74.006,
    }
  ); // Default to NYC
}

// Utility to get city code via comprehensive airports database with Amadeus fallback
export async function getCityCodeFromDestination(
  destination: string
): Promise<string> {
  try {
    // First, try to find in comprehensive airports database (same as frontend)
    console.log(`🔍 Searching airports database for: "${destination}"`);

    const response = await fetch(
      "https://raw.githubusercontent.com/lxndrblz/Airports/main/airports.csv",
      { signal: AbortSignal.timeout(5000) }
    );

    if (response.ok) {
      const csvData = await response.text();
      const lines = csvData.split("\n");
      const headers = lines[0].split(",");

      // Search for city name or airport name matches
      const searchTerm = destination.toLowerCase();

      for (let i = 1; i < lines.length; i++) {
        const values = lines[i].split(",");
        const airport: Record<string, string> = {};
        headers.forEach((header, index) => {
          airport[header.replace(/"/g, "")] =
            values[index]?.replace(/"/g, "") || "";
        });

        const municipality = airport["municipality"]?.toLowerCase() || "";
        const airportName = airport["name"]?.toLowerCase() || "";
        const iataCode = airport["iata_code"]?.toUpperCase();

        // Match by city name or airport name
        if (
          iataCode &&
          (municipality === searchTerm || airportName.includes(searchTerm))
        ) {
          console.log(
            `✅ Found in airports DB: "${destination}" → "${iataCode}"`
          );
          return iataCode;
        }
      }
    }
  } catch (error) {
    console.log("⚠️ Airports database search failed:", error);
  }

  try {
    // Fallback to Amadeus API
    console.log(`🔄 Trying Amadeus API for: "${destination}"`);
    const searchResponse = await callAmadeusAPI(
      "/v1/reference-data/locations",
      {
        keyword: destination,
        subType: "CITY",
      }
    );

    if (searchResponse.data && searchResponse.data.length > 0) {
      console.log(
        `✅ Found in Amadeus: "${destination}" → "${searchResponse.data[0].iataCode}"`
      );
      return searchResponse.data[0].iataCode;
    }
  } catch (error) {
    console.error("⚠️ Amadeus API search failed:", error);
  }

  // Final fallback to local mapping
  console.log(`🗺️ Using local mapping for: "${destination}"`);
  return getCityCodeFromName(destination);
}

// Utility to get coordinates via Amadeus API with fallback
export async function getDestinationCoordinates(destination: string): Promise<{
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
    console.error("Error getting destination coordinates from Amadeus:", error);
  }

  // Fallback to local mapping
  return getCoordinatesFromName(destination);
}

// Utility for consistent placeholder hotel images
export function getPlaceholderHotelImage(hotelName: string): string {
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

// Common provider arrays for consistency
export const FLIGHT_PROVIDERS = ["Expedia", "Kayak", "Skyscanner"];
export const HOTEL_PROVIDERS = ["Booking.com", "Agoda", "Trip.com"];
export const ATTRACTION_PROVIDERS = ["GetYourGuide", "Viator", "TripAdvisor"];

// Common airline mapping
export const AIRLINE_CODES = {
  // US Airlines
  AA: "American Airlines",
  DL: "Delta Air Lines",
  UA: "United Airlines",
  B6: "JetBlue Airways",
  WN: "Southwest Airlines",
  AS: "Alaska Airlines",
  NK: "Spirit Airlines",
  F9: "Frontier Airlines",

  // European Airlines
  LH: "Lufthansa",
  BA: "British Airways",
  AF: "Air France",
  KL: "KLM",
  AZ: "Alitalia",
  IB: "Iberia",
  SN: "Brussels Airlines",
  OS: "Austrian Airlines",
  LX: "Swiss International",
  SK: "SAS",
  AY: "Finnair",
  TP: "TAP Air Portugal",

  // Canadian Airlines
  AC: "Air Canada",
  WS: "WestJet",

  // Asian Airlines
  SQ: "Singapore Airlines",
  CX: "Cathay Pacific",
  NH: "ANA",
  JL: "Japan Airlines",
  KE: "Korean Air",
  OZ: "Asiana Airlines",
  TG: "Thai Airways",
  MH: "Malaysia Airlines",
  SV: "Saudi Arabian Airlines",
  EK: "Emirates",
  QR: "Qatar Airways",
  EY: "Etihad Airways",
  YP: "Air Premia",
  GA: "Garuda Indonesia",

  // Chinese Airlines
  CA: "Air China",
  CZ: "China Southern",
  MU: "China Eastern",
  MF: "Xiamen Airlines",
  "3U": "Sichuan Airlines",
  HU: "Hainan Airlines",

  // Latin American Airlines
  LA: "LATAM Airlines",
  CM: "Copa Airlines",
  AM: "Aeroméxico",

  // African Airlines
  ET: "Ethiopian Airlines",
  MS: "EgyptAir",
  SA: "South African Airways",

  // Oceania Airlines
  QF: "Qantas",
  JQ: "Jetstar",
  NZ: "Air New Zealand",

  // Low-cost carriers
  FR: "Ryanair",
  U2: "easyJet",
  VY: "Vueling",
  W6: "Wizz Air",
  PC: "Pegasus Airlines",
};
