import {
  callAmadeusAPI,
  getDestinationCoordinates,
  ATTRACTION_PROVIDERS,
} from "./utils.ts";

// Helper function to generate proper booking URLs for each provider
function generateAttractionBookingUrl(
  provider: string,
  destination: string,
  activityName: string,
  category: string
): string {
  const encodedDestination = encodeURIComponent(destination);
  const encodedActivity = encodeURIComponent(activityName);

  switch (provider) {
    case "GetYourGuide":
      return `https://www.getyourguide.com/s/?q=${encodedDestination}&categoryId=${getCategoryId(
        category
      )}`;

    case "Viator":
      return `https://www.viator.com/searchResults/all?text=${encodedDestination}&categoryId=${getViatorCategoryId(
        category
      )}`;

    case "TripAdvisor":
      return `https://www.tripadvisor.com/Attractions-g1-Activities-${encodedDestination}.html`;

    case "Klook":
      return `https://www.klook.com/en-US/search/N-${encodedDestination}/?aid=1807`;

    case "Tiqets":
      return `https://www.tiqets.com/en/search?query=${encodedDestination}`;

    default:
      return `https://www.getyourguide.com/s/?q=${encodedDestination}`;
  }
}

// Helper function to map categories to GetYourGuide category IDs
function getCategoryId(category: string): string {
  const categoryMap: Record<string, string> = {
    Museum: "museums",
    Tour: "tours",
    "Food & Drink": "food-and-drinks",
    Adventure: "outdoor-activities",
    Entertainment: "entertainment",
    Attraction: "attractions",
  };
  return categoryMap[category] || "attractions";
}

// Helper function to map categories to Viator category IDs
function getViatorCategoryId(category: string): string {
  const categoryMap: Record<string, string> = {
    Museum: "26",
    Tour: "20",
    "Food & Drink": "18",
    Adventure: "21",
    Entertainment: "25",
    Attraction: "23",
  };
  return categoryMap[category] || "23";
}

export async function getAttractionComparisons(travelData: any) {
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

        const basePrice = parseFloat(activity.price?.amount || "25");
        const destination = travelData.destination || "New York";

        // Generate multiple OTA options for this attraction with realistic price variations
        const otaOptions = ATTRACTION_PROVIDERS.map(
          (provider, providerIndex) => {
            // Create realistic price variations (±5-15% from base price)
            const variation = 1 + (Math.random() * 0.3 - 0.15); // ±15%
            const variatedPrice = Math.round(basePrice * variation);

            return {
              provider: provider,
              price: variatedPrice.toString(),
              currency: activity.price?.currencyCode || "USD",
              bookingUrl: generateAttractionBookingUrl(
                provider,
                destination,
                activity.name,
                category
              ),
              isBestDeal: false as boolean,
            };
          }
        );

        // Sort by price to identify best deal
        otaOptions.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));

        // Mark the best deal
        otaOptions[0].isBestDeal = true;

        return {
          name: activity.name,
          rating: activity.rating || "4.5",
          category: category,
          otaOptions: otaOptions,
          details: {
            description:
              activity.shortDescription ||
              "Experience the best of the destination",
            duration: "2-4 hours", // Default duration as Amadeus doesn't always provide this
            location: destination,
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

// getDestinationCoordinates function moved to utils.ts

function getFallbackAttractionComparisons(travelData: any) {
  const destination = travelData.destination || "New York";

  const attractions = [
    {
      name: "City Museum",
      basePrice: 25,
      rating: "4.3",
      category: "Museum",
      details: {
        description: "Explore the rich history and culture of the city",
        duration: "2-3 hours",
        location: destination,
      },
    },
    {
      name: "Scenic City Tour",
      basePrice: 45,
      rating: "4.7",
      category: "Tour",
      details: {
        description: "Guided tour of the city's top landmarks",
        duration: "4 hours",
        location: destination,
      },
    },
    {
      name: "Adventure Park",
      basePrice: 35,
      rating: "4.5",
      category: "Entertainment",
      details: {
        description: "Thrilling outdoor activities and adventures",
        duration: "Full day",
        location: destination,
      },
    },
  ];

  const comparisons = attractions.map((attraction) => {
    // Generate OTA options for each attraction with realistic price variations
    const otaOptions = ATTRACTION_PROVIDERS.map((provider, index) => {
      // Add some price variation: GetYourGuide might be cheapest, Viator middle, TripAdvisor highest
      const priceMultipliers = [0.92, 1.0, 1.12]; // GetYourGuide: -8%, Viator: base, TripAdvisor: +12%
      const variatedPrice = Math.round(
        attraction.basePrice * priceMultipliers[index]
      );

      return {
        provider: provider,
        price: variatedPrice.toString(),
        currency: "USD",
        bookingUrl: generateAttractionBookingUrl(
          provider,
          destination,
          attraction.name,
          attraction.category
        ),
        isBestDeal: false as boolean,
      };
    });

    // Sort by price and mark best deal
    otaOptions.sort((a, b) => parseFloat(a.price) - parseFloat(b.price));
    otaOptions[0].isBestDeal = true;

    return {
      name: attraction.name,
      rating: attraction.rating,
      category: attraction.category,
      otaOptions: otaOptions,
      details: attraction.details,
    };
  });

  return {
    type: "attraction",
    comparisons,
    searchCriteria: travelData,
  };
}

export async function getGenericTravelComparisons(travelData: any) {
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
