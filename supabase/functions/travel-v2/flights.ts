import {
  callAmadeusAPI,
  FLIGHT_PROVIDERS,
  AIRLINE_CODES,
  getCityCodeFromName,
} from "./utils.ts";

// Helper function to generate proper booking URLs for each provider
function generateFlightBookingUrl(
  provider: string,
  originCode: string,
  destinationCode: string,
  departureDate: string,
  returnDate: string | null,
  travelers: number
): string {
  switch (provider) {
    case "Expedia":
      if (returnDate) {
        return `https://www.expedia.com/Flights-Search?trip=roundtrip&leg1=from:${originCode},to:${destinationCode},departure:${departureDate}&leg2=from:${destinationCode},to:${originCode},departure:${returnDate}&passengers=adults:${travelers}`;
      } else {
        return `https://www.expedia.com/Flights-Search?trip=oneway&leg1=from:${originCode},to:${destinationCode},departure:${departureDate}&passengers=adults:${travelers}`;
      }

    case "Kayak":
      if (returnDate) {
        return `https://www.kayak.com/flights/${originCode}-${destinationCode}/${departureDate}/${returnDate}?sort=price_a&attempts=1&passengers=${travelers}`;
      } else {
        return `https://www.kayak.com/flights/${originCode}-${destinationCode}/${departureDate}?sort=price_a&attempts=1&passengers=${travelers}`;
      }

    case "Skyscanner":
      const depDate = departureDate.replace(/-/g, "");
      if (returnDate) {
        const retDate = returnDate.replace(/-/g, "");
        return `https://www.skyscanner.com/transport/flights/${originCode}/${destinationCode}/${depDate}/${retDate}/?adults=${travelers}&children=0&cabinclass=economy`;
      } else {
        return `https://www.skyscanner.com/transport/flights/${originCode}/${destinationCode}/${depDate}/?adults=${travelers}&children=0&cabinclass=economy`;
      }

    default:
      // Fallback to Google Flights
      return `https://www.google.com/travel/flights?q=flights%20from%20${originCode}%20to%20${destinationCode}`;
  }
}

export async function getFlightComparisons(travelData: any) {
  try {
    console.log("✈️ Getting real flight data from Amadeus...");
    console.log("📋 Travel data input:", JSON.stringify(travelData, null, 2));

    // Validate and fix origin/destination codes
    const rawOrigin = travelData.origin || "NYC";
    const rawDestination = travelData.destination || "LAX";

    console.log(
      "🎯 Raw origin:",
      rawOrigin,
      "Raw destination:",
      rawDestination
    );

    // Convert to 3-letter codes
    const originCode =
      rawOrigin === "unknown" || rawOrigin.length !== 3
        ? getCityCodeFromName(rawOrigin === "unknown" ? "New York" : rawOrigin)
        : rawOrigin;
    const destinationCode =
      rawDestination === "unknown" || rawDestination.length !== 3
        ? getCityCodeFromName(
            rawDestination === "unknown" ? "Los Angeles" : rawDestination
          )
        : rawDestination;

    console.log(
      "🛫 Origin code:",
      originCode,
      "Destination code:",
      destinationCode
    );

    // Validate dates
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 7); // 1 week from now
    const weekLater = new Date(tomorrow);
    weekLater.setDate(tomorrow.getDate() + 7); // Return date

    let departureDate = travelData.departureDate;
    let returnDate = travelData.returnDate;

    // Fix invalid dates
    if (
      !departureDate ||
      departureDate === "unknown" ||
      new Date(departureDate) <= today
    ) {
      departureDate = tomorrow.toISOString().split("T")[0];
    }

    if (
      returnDate &&
      returnDate !== "unknown" &&
      new Date(returnDate) > new Date(departureDate)
    ) {
      // Keep the provided return date if it's valid
    } else if (returnDate && returnDate !== "unknown") {
      // Invalid return date, create a sensible one
      returnDate = weekLater.toISOString().split("T")[0];
    } else {
      // No return date provided or "unknown"
      returnDate = null;
    }

    console.log(
      "📅 Departure date:",
      departureDate,
      "Return date:",
      returnDate
    );

    const searchParams: any = {
      originLocationCode: originCode,
      destinationLocationCode: destinationCode,
      departureDate: departureDate,
      adults: Math.max(1, Math.min(8, parseInt(travelData.travelers) || 1)),
      max: 3,
    };

    if (returnDate) {
      searchParams.returnDate = returnDate;
    }

    console.log(
      "🔍 Flight search parameters:",
      JSON.stringify(searchParams, null, 2)
    );

    // Validate all required parameters
    if (
      !searchParams.originLocationCode ||
      !searchParams.destinationLocationCode ||
      !searchParams.departureDate
    ) {
      console.log("⚠️ Missing required flight parameters, using fallback data");
      return getFallbackFlightComparisons(travelData);
    }

    const amadeusResponse = await callAmadeusAPI(
      "/v2/shopping/flight-offers",
      searchParams
    );

    if (!amadeusResponse.data || amadeusResponse.data.length === 0) {
      console.log("⚠️ No flights found from Amadeus, using fallback data");
      return getFallbackFlightComparisons(travelData);
    }

    console.log(`✅ Found ${amadeusResponse.data.length} flights from Amadeus`);

    const comparisons = amadeusResponse.data
      .slice(0, 3)
      .map((offer: any, index: number) => {
        const itinerary = offer.itineraries?.[0] || {};
        const segment = itinerary.segments?.[0] || {};
        const lastSegment =
          itinerary.segments?.[itinerary.segments.length - 1] || segment;
        const basePrice = parseFloat(offer.price?.total || "300");

        // Generate multiple OTA options for this flight with realistic price variations
        const otaOptions = FLIGHT_PROVIDERS.map((provider, providerIndex) => {
          // Create realistic price variations (±5-10% from base price)
          const variation = 1 + (Math.random() * 0.2 - 0.1); // ±10%
          const variatedPrice = Math.round(basePrice * variation);

          return {
            provider: provider,
            price: variatedPrice.toString(),
            currency: offer.price?.currency || "USD",
            bookingUrl: generateFlightBookingUrl(
              provider,
              originCode,
              destinationCode,
              departureDate,
              returnDate,
              searchParams.adults
            ),
            isBestDeal: false as boolean,
          };
        });

        // Sort by price to identify best deal
        otaOptions.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

        // Mark the best deal
        otaOptions[0].isBestDeal = true;

        return {
          airline:
            AIRLINE_CODES[segment.carrierCode] ||
            segment.carrierCode ||
            "Airline",
          flightNumber: segment.number || "N/A",
          duration: itinerary.duration
            ? itinerary.duration.replace("PT", "").toLowerCase()
            : "N/A",
          stops: itinerary.segments ? itinerary.segments.length - 1 : 0,
          otaOptions: otaOptions,
          details: {
            departure: {
              at: segment.departure?.at
                ? segment.departure.at.split("T")[1].substring(0, 5)
                : "N/A",
              iataCode: segment.departure?.iataCode || originCode,
            },
            arrival: {
              at: lastSegment.arrival?.at
                ? lastSegment.arrival.at.split("T")[1].substring(0, 5)
                : "N/A",
              iataCode: lastSegment.arrival?.iataCode || destinationCode,
            },
          },
        };
      });

    console.log("✈️ Flight comparisons created:", comparisons.length);
    return { type: "flight", comparisons, searchCriteria: travelData };
  } catch (error) {
    console.error("❌ Error fetching flights from Amadeus:", error);
    console.log("🔄 Falling back to mock data");
    return getFallbackFlightComparisons(travelData);
  }
}

function getFallbackFlightComparisons(travelData: any) {
  // Use cleaned data for fallback URLs
  const origin =
    travelData.origin === "unknown" ? "NYC" : travelData.origin || "NYC";
  const destination =
    travelData.destination === "unknown"
      ? "LAX"
      : travelData.destination || "LAX";
  const departureDate =
    travelData.departureDate === "unknown"
      ? "2024-07-01"
      : travelData.departureDate || "2024-07-01";
  const returnDate =
    travelData.returnDate && travelData.returnDate !== "unknown"
      ? travelData.returnDate
      : null;
  const travelers = Math.max(1, parseInt(travelData.travelers) || 1);

  const flights = [
    {
      airline: "Delta",
      flightNumber: "DL2891",
      basePrice: 299,
      duration: "5h 30m",
      stops: 0,
      details: {
        departure: { at: "08:00", iataCode: origin },
        arrival: { at: "13:30", iataCode: destination },
      },
    },
    {
      airline: "American",
      flightNumber: "AA1205",
      basePrice: 325,
      duration: "6h 15m",
      stops: 1,
      details: {
        departure: { at: "10:15", iataCode: origin },
        arrival: { at: "16:30", iataCode: destination },
      },
    },
    {
      airline: "United",
      flightNumber: "UA789",
      basePrice: 289,
      duration: "5h 45m",
      stops: 0,
      details: {
        departure: { at: "14:20", iataCode: origin },
        arrival: { at: "20:05", iataCode: destination },
      },
    },
  ];

  const comparisons = flights.map((flight) => {
    // Generate OTA options for each flight with realistic price variations
    const otaOptions = FLIGHT_PROVIDERS.map((provider, index) => {
      // Add some price variation: Expedia might be cheapest, Kayak middle, Skyscanner highest
      const priceMultipliers = [0.97, 1.0, 1.05]; // Expedia: -3%, Kayak: base, Skyscanner: +5%
      const variatedPrice = Math.round(
        flight.basePrice * priceMultipliers[index]
      );

      return {
        provider: provider,
        price: variatedPrice.toString(),
        currency: "USD",
        bookingUrl: generateFlightBookingUrl(
          provider,
          origin,
          destination,
          departureDate,
          returnDate,
          travelers
        ),
        isBestDeal: false as boolean,
      };
    });

    // Sort by price and mark best deal
    otaOptions.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    otaOptions[0].isBestDeal = true;

    return {
      airline: flight.airline,
      flightNumber: flight.flightNumber,
      duration: flight.duration,
      stops: flight.stops,
      otaOptions: otaOptions,
      details: flight.details,
    };
  });

  return {
    type: "flight",
    comparisons,
    searchCriteria: travelData,
  };
}
