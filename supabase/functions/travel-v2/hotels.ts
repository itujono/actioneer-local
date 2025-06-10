import {
  callAmadeusAPI,
  getCityCodeFromDestination,
  getPlaceholderHotelImage,
  HOTEL_PROVIDERS,
} from "./utils.ts";

// Helper function to generate proper booking URLs for each provider
function generateHotelBookingUrl(
  provider: string,
  destination: string,
  checkInDate: string,
  checkOutDate: string,
  adults: number
): string {
  // Format dates for different platforms
  const formatDateForBooking = (date: string) => date; // YYYY-MM-DD format
  const formatDateForAgoda = (date: string) => date; // YYYY-MM-DD format
  const formatDateForTrip = (date: string) => date; // YYYY-MM-DD format
  const formatDateForExpedia = (date: string) => {
    // Expedia expects MM/DD/YYYY format
    const d = new Date(date);
    return `${(d.getMonth() + 1).toString().padStart(2, "0")}/${d
      .getDate()
      .toString()
      .padStart(2, "0")}/${d.getFullYear()}`;
  };

  switch (provider) {
    case "Booking.com":
      return `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(
        destination
      )}&checkin=${formatDateForBooking(
        checkInDate
      )}&checkout=${formatDateForBooking(
        checkOutDate
      )}&group_adults=${adults}&no_rooms=1&group_children=0&selected_currency=USD`;

    case "Agoda":
      return `https://www.agoda.com/search?city=${encodeURIComponent(
        destination
      )}&checkIn=${formatDateForAgoda(
        checkInDate
      )}&checkOut=${formatDateForAgoda(
        checkOutDate
      )}&rooms=1&adults=${adults}&children=0&cid=-1&tag=f79a6205-9329-4e77-8658-6eb0c5c0aa68`;

    case "Trip.com":
      // Trip.com uses different URL structure and date format
      return `https://us.trip.com/hotels/list?city=${encodeURIComponent(
        destination
      )}&checkin=${formatDateForTrip(checkInDate)}&checkout=${formatDateForTrip(
        checkOutDate
      )}&rooms=1&guests=${adults}&locale=en_US&curr=USD`;

    case "Expedia":
      return `https://www.expedia.com/Hotel-Search?destination=${encodeURIComponent(
        destination
      )}&d1=${formatDateForExpedia(checkInDate)}&d2=${formatDateForExpedia(
        checkOutDate
      )}&rooms=1&adults=${adults}`;

    case "Hotels.com":
    case "Amadeus Direct":
    default:
      return `https://www.hotels.com/search.do?q-destination=${encodeURIComponent(
        destination
      )}&q-check-in=${formatDateForBooking(
        checkInDate
      )}&q-check-out=${formatDateForBooking(
        checkOutDate
      )}&q-rooms=1&q-room-0-adults=${adults}&q-room-0-children=0`;
  }
}

export async function getHotelComparisons(travelData: any) {
  try {
    console.log("🏨 Getting real hotel data from Amadeus...");
    console.log("📋 Travel data input:", JSON.stringify(travelData, null, 2));

    // Get city code with better validation
    const destination = travelData.destination || "NYC";
    console.log("🎯 Raw destination:", destination);

    const cityCode = await getCityCodeFromDestination(destination);
    console.log("🏙️ City code resolved:", cityCode);

    // Validate city code format (must be 3 letters)
    if (!cityCode || cityCode.length !== 3) {
      console.log("⚠️ Invalid city code, using fallback data");
      return getFallbackHotelComparisons(travelData);
    }

    const hotelListParams = {
      cityCode: cityCode,
      radius: 5,
      radiusUnit: "KM",
      hotelSource: "ALL",
    };

    console.log("🔍 Hotel list search parameters:", hotelListParams);

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

    const hotelIds = hotelListResponse.data
      .slice(0, 3)
      .map((hotel: any) => hotel.hotelId);
    console.log("🏨 Hotel IDs selected:", hotelIds);

    // Validate hotel IDs
    if (hotelIds.length === 0 || hotelIds.some((id) => !id)) {
      console.log("⚠️ Invalid hotel IDs, using fallback data");
      return getFallbackHotelComparisons(travelData);
    }

    // Use more realistic future dates with better validation
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(today.getDate() + 7); // 1 week from now
    const dayAfter = new Date(tomorrow);
    dayAfter.setDate(tomorrow.getDate() + 2); // 2 night stay

    // Validate and format dates
    let checkInDate = travelData.checkInDate;
    let checkOutDate = travelData.checkOutDate;

    // Check if provided dates are valid and in the future
    if (!checkInDate || new Date(checkInDate) <= today) {
      checkInDate = tomorrow.toISOString().split("T")[0];
    }
    if (!checkOutDate || new Date(checkOutDate) <= new Date(checkInDate)) {
      checkOutDate = dayAfter.toISOString().split("T")[0];
    }

    // Validate adults parameter
    const adults = Math.max(1, Math.min(8, parseInt(travelData.guests) || 1));

    const hotelOffersParams = {
      hotelIds: hotelIds.join(","),
      checkInDate: checkInDate,
      checkOutDate: checkOutDate,
      adults: adults,
    };

    console.log("💰 Hotel offers search parameters:", hotelOffersParams);

    // Validate all parameters before making the call
    if (
      !hotelOffersParams.hotelIds ||
      !hotelOffersParams.checkInDate ||
      !hotelOffersParams.checkOutDate
    ) {
      console.log("⚠️ Missing required parameters, using fallback data");
      return getFallbackHotelComparisons(travelData);
    }

    const hotelOffersResponse = await callAmadeusAPI(
      "/v3/shopping/hotel-offers",
      hotelOffersParams
    );

    if (!hotelOffersResponse.data || hotelOffersResponse.data.length === 0) {
      console.log("⚠️ No hotel offers found, using fallback data");
      return getFallbackHotelComparisons(travelData);
    }

    console.log(
      `✅ Found ${hotelOffersResponse.data.length} hotel offers from Amadeus`
    );

    const comparisons = await Promise.all(
      hotelOffersResponse.data
        .slice(0, 3)
        .map(async (hotelData: any, index: number) => {
          const hotel = hotelData.hotel || {};
          const offer = hotelData.offers?.[0] || {};
          const hotelImage = getPlaceholderHotelImage(hotel.name || "Hotel");
          const basePrice = parseFloat(offer.price?.total || "100");

          // Generate multiple OTA options for this hotel with realistic price variations
          const otaOptions = HOTEL_PROVIDERS.map((provider, providerIndex) => {
            // Create realistic price variations (±5-15% from base price)
            const variation = 1 + (Math.random() * 0.3 - 0.15); // ±15%
            const variatedPrice = Math.round(basePrice * variation);

            return {
              provider: provider,
              price: variatedPrice.toString(),
              currency: offer.price?.currency || "USD",
              bookingUrl: generateHotelBookingUrl(
                provider,
                destination,
                checkInDate,
                checkOutDate,
                adults
              ),
              isBestDeal: false as boolean,
            };
          });

          // Sort by price to identify best deal
          otaOptions.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

          // Mark the best deal
          otaOptions[0].isBestDeal = true;

          return {
            hotelName: hotel.name || "Hotel",
            rating: hotel.rating || "4.0",
            location:
              hotel.address?.cityName || travelData.destination || "Location",
            image: hotelImage,
            otaOptions: otaOptions,
            details: {
              checkIn: checkInDate,
              checkOut: checkOutDate,
              roomType: offer.room?.typeEstimated?.category || "Standard Room",
              amenities: hotel.amenities || ["WiFi", "Room Service"],
            },
          };
        })
    );

    console.log("🏨 Hotel comparisons created:", comparisons.length);
    return { type: "hotel", comparisons, searchCriteria: travelData };
  } catch (error) {
    console.error("❌ Error fetching hotels from Amadeus:", error);
    console.log("🔄 Falling back to mock data");
    return getFallbackHotelComparisons(travelData);
  }
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

function getFallbackHotelComparisons(travelData: any) {
  const destination = travelData.destination || "New York";
  const checkInDate = travelData.checkInDate || "2024-07-01";
  const checkOutDate = travelData.checkOutDate || "2024-07-03";
  const adults = travelData.guests || 1;

  const hotels = [
    {
      hotelName: "City Center Inn",
      rating: "4.0",
      location: "City Center",
      basePrice: 120,
      image:
        "https://images.unsplash.com/photo-1551882547-ff40c63fe5fa?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      roomType: "Standard Room",
      amenities: ["WiFi", "Breakfast"],
    },
    {
      hotelName: "Grand Plaza Hotel",
      rating: "4.5",
      location: "Downtown",
      basePrice: 150,
      image:
        "https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      roomType: "Deluxe Room",
      amenities: ["WiFi", "Pool", "Gym"],
    },
    {
      hotelName: "Luxury Suites",
      rating: "5.0",
      location: "Premium District",
      basePrice: 220,
      image:
        "https://images.unsplash.com/photo-1582719478250-c89cae4dc85b?w=400&h=300&fit=crop&crop=center&auto=format&q=80",
      roomType: "Executive Suite",
      amenities: ["WiFi", "Spa", "Concierge", "Pool"],
    },
  ];

  const comparisons = hotels.map((hotel) => {
    // Generate OTA options for each hotel with realistic price variations
    const otaOptions = HOTEL_PROVIDERS.map((provider, index) => {
      // Add some price variation: Booking.com might be cheapest, Agoda middle, Trip.com highest
      const priceMultipliers = [0.95, 1.0, 1.08]; // Booking.com: -5%, Agoda: base, Trip.com: +8%
      const variatedPrice = Math.round(
        hotel.basePrice * priceMultipliers[index]
      );

      return {
        provider: provider,
        price: variatedPrice.toString(),
        currency: "USD",
        bookingUrl: generateHotelBookingUrl(
          provider,
          destination,
          checkInDate,
          checkOutDate,
          adults
        ),
        isBestDeal: false as boolean,
      };
    });

    // Sort by price and mark best deal
    otaOptions.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    otaOptions[0].isBestDeal = true;

    return {
      hotelName: hotel.hotelName,
      rating: hotel.rating,
      location: hotel.location,
      image: hotel.image,
      otaOptions: otaOptions,
      details: {
        checkIn: checkInDate,
        checkOut: checkOutDate,
        roomType: hotel.roomType,
        amenities: hotel.amenities,
      },
    };
  });

  return {
    type: "hotel",
    comparisons,
    searchCriteria: travelData,
  };
}
