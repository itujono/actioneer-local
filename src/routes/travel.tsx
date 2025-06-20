import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import {
  PlaneIcon,
  HotelIcon,
  MapPinIcon,
  CalendarIcon,
  UsersIcon,
  RefreshCwIcon,
} from "lucide-react";
import { supabase } from "../supabase/client";
import { useAuth } from "../hooks/useAuth";

export const travelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/travel",
  component: TravelDashboard,
});

interface LocationInfo {
  city?: string;
  country?: string;
  countryCode?: string;
  airport: string;
  currency: string;
}

interface TravelData {
  destination: string;
  origin: string;
  travelers: number;
  departureDate?: string;
  returnDate?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

function TravelDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const [userLocation, setUserLocation] = useState<LocationInfo | null>(null);
  const [travelCriteria, setTravelCriteria] = useState<TravelData>({
    destination: "Kyoto",
    origin: "NYC",
    travelers: 1,
  });

  // Fetch user's full profile including API key
  const { data: userProfile } = useQuery({
    queryKey: ["user-profile", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("users")
        .select("*")
        .eq("email", user.email)
        .eq("is_active", true)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  // Detect user location on component mount
  useEffect(() => {
    detectUserLocation();
  }, []);

  const detectUserLocation = async () => {
    try {
      // Try to get user's location using browser's geolocation API
      if (navigator.geolocation) {
        navigator.geolocation.getCurrentPosition(
          async (position) => {
            const { latitude, longitude } = position.coords;

            // Use a free reverse geocoding service
            try {
              const response = await fetch(
                `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
              );
              const data = await response.json();

              const locationInfo: LocationInfo = {
                city: data.city,
                country: data.countryName,
                countryCode: data.countryCode,
                airport: getAirportFromCity(data.city) || "NYC",
                currency: getCurrencyFromCountry(data.countryCode) || "USD",
              };

              setUserLocation(locationInfo);
              setTravelCriteria((prev) => ({
                ...prev,
                origin: locationInfo.airport,
              }));

              console.log("📍 User location detected:", locationInfo);
            } catch (error) {
              console.log(
                "⚠️ Reverse geocoding failed, using default location"
              );
              setDefaultLocation();
            }
          },
          (error) => {
            console.log("⚠️ Geolocation failed:", error);
            setDefaultLocation();
          }
        );
      } else {
        console.log("⚠️ Geolocation not supported");
        setDefaultLocation();
      }
    } catch (error) {
      console.log("⚠️ Location detection failed:", error);
      setDefaultLocation();
    }
  };

  const setDefaultLocation = () => {
    const defaultLocation: LocationInfo = {
      city: "New York",
      country: "United States",
      countryCode: "US",
      airport: "NYC",
      currency: "USD",
    };
    setUserLocation(defaultLocation);
  };

  // Fetch comprehensive travel data
  const {
    data: travelComparisons,
    isLoading: travelLoading,
    refetch: refetchTravel,
  } = useQuery({
    queryKey: ["travel-comparisons", travelCriteria],
    queryFn: async () => {
      if (!userProfile?.api_key) throw new Error("No API key available");

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/travel-v2`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            "x-user-api-key": userProfile.api_key,
          },
          body: JSON.stringify({
            emailId: `dashboard-${Date.now()}`,
            messageId: `dashboard-${Date.now()}`,
            emailBody: `Travel planning for ${travelCriteria.destination}`,
            subject: `Trip to ${travelCriteria.destination}`,
            from: "dashboard@example.com",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch travel data");
      }

      const data = await response.json();
      return data;
    },
    enabled: !!userProfile?.api_key,
    staleTime: 1000 * 60 * 10, // 10 minutes
  });

  // Fetch saved travel data from database
  const { data: savedTravels, isLoading: savedLoading } = useQuery({
    queryKey: ["saved-travels", user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("travel")
        .select("*")
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });

  if (authLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">
              Loading travel dashboard...
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="py-6">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        {/* Header */}
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Travel Dashboard
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Comprehensive travel recommendations powered by AI
            </p>
          </div>
          {userLocation && (
            <div className="text-right">
              <p className="text-sm text-gray-600">Your location</p>
              <p className="text-lg font-medium text-gray-900">
                📍 {userLocation.city}, {userLocation.country}
              </p>
            </div>
          )}
        </div>

        {/* Travel Search Form */}
        {/* <div className="mt-8 bg-white rounded-lg shadow px-6 py-6">
          <h2 className="text-lg font-medium text-gray-900 mb-4">
            Plan Your Trip
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Destination
              </label>
              <input
                type="text"
                value={travelCriteria.destination}
                onChange={(e) =>
                  setTravelCriteria((prev) => ({
                    ...prev,
                    destination: e.target.value,
                  }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                placeholder="e.g., Kyoto, Paris, Tokyo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Travelers
              </label>
              <select
                value={travelCriteria.travelers}
                onChange={(e) =>
                  setTravelCriteria((prev) => ({
                    ...prev,
                    travelers: parseInt(e.target.value),
                  }))
                }
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                {[1, 2, 3, 4, 5, 6].map((num) => (
                  <option key={num} value={num}>
                    {num} {num === 1 ? "traveler" : "travelers"}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => refetchTravel()}
                disabled={travelLoading}
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
              >
                {travelLoading ? (
                  <RefreshCwIcon className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <MapPinIcon className="h-4 w-4 mr-2" />
                )}
                Get Recommendations
              </button>
            </div>
          </div>
        </div> */}

        {/* Loading State */}
        {travelLoading && (
          <div className="mt-8 text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p className="mt-2 text-sm text-gray-500">
              Searching for the best travel recommendations...
            </p>
          </div>
        )}

        {/* Travel Recommendations */}
        {travelComparisons && !travelLoading && (
          <div className="mt-8 space-y-8">
            {/* Flights Section */}
            {travelComparisons.comparisons?.flights?.length > 0 && (
              <TravelSection
                title="✈️ Flights"
                subtitle={`From ${userLocation?.city || "your location"} to ${
                  travelCriteria.destination
                }`}
                items={travelComparisons.comparisons.flights}
                type="flight"
                userLocation={userLocation}
              />
            )}

            {/* Hotels Section */}
            {travelComparisons.comparisons?.hotels?.length > 0 && (
              <TravelSection
                title="🏨 Hotels"
                subtitle={`Accommodation in ${travelCriteria.destination}`}
                items={travelComparisons.comparisons.hotels}
                type="hotel"
              />
            )}

            {/* Attractions Section */}
            {travelComparisons.comparisons?.attractions?.length > 0 && (
              <TravelSection
                title="🎯 Attractions & Activities"
                subtitle={`Things to do in ${travelCriteria.destination}`}
                items={travelComparisons.comparisons.attractions}
                type="attraction"
              />
            )}
          </div>
        )}

        {/* Recent Travel History */}
        {savedTravels && savedTravels.length > 0 && (
          <div className="mt-8">
            <h2 className="text-lg font-medium text-gray-900 mb-4">
              Recent Travel Plans
            </h2>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {savedTravels.map((travel) => (
                  <li key={travel.id} className="px-6 py-4 hover:bg-gray-50">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center">
                        <div className="flex-shrink-0">
                          <div className="h-10 w-10 rounded-full bg-blue-100 flex items-center justify-center">
                            <PlaneIcon className="h-6 w-6 text-blue-600" />
                          </div>
                        </div>
                        <div className="ml-4">
                          <p className="text-sm font-medium text-gray-900">
                            {travel.type} to {travel.destination}
                          </p>
                          <p className="text-sm text-gray-500">
                            {travel.start_date &&
                              new Date(travel.start_date).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-sm text-gray-500">
                        {new Date(travel.created_at).toLocaleDateString()}
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Helper component for travel sections
function TravelSection({
  title,
  subtitle,
  items,
  type,
  userLocation,
}: {
  title: string;
  subtitle: string;
  items: any[];
  type: "flight" | "hotel" | "attraction";
  userLocation?: LocationInfo | null;
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-gray-200">
        <h3 className="text-lg font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-500">{subtitle}</p>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.slice(0, 6).map((item, index) => (
            <TravelCard
              key={index}
              item={item}
              type={type}
              userLocation={userLocation}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Helper component for individual travel cards
function TravelCard({
  item,
  type,
  userLocation,
}: {
  item: any;
  type: "flight" | "hotel" | "attraction";
  userLocation?: LocationInfo | null;
}) {
  const getBestPrice = () => {
    if (item.otaOptions && item.otaOptions.length > 0) {
      const prices = item.otaOptions.map((option: any) =>
        parseFloat(option.price)
      );
      const minPrice = Math.min(...prices);
      const currency = item.otaOptions[0].currency || "USD";
      return `${currency} ${minPrice}`;
    }
    return item.price || "N/A";
  };

  const getBestBookingUrl = () => {
    if (item.otaOptions && item.otaOptions.length > 0) {
      const sortedOptions = item.otaOptions.sort(
        (a: any, b: any) => parseFloat(a.price) - parseFloat(b.price)
      );
      return sortedOptions[0].bookingUrl;
    }
    return item.bookingUrl || "#";
  };

  return (
    <div className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="mb-3">
        {type === "flight" && (
          <div>
            <h4 className="font-medium text-gray-900">
              {item.airline} {item.flightNumber}
            </h4>
            <p className="text-sm text-gray-500">
              {item.duration} •{" "}
              {item.stops === 0
                ? "Direct"
                : `${item.stops} stop${item.stops > 1 ? "s" : ""}`}
            </p>
          </div>
        )}
        {type === "hotel" && (
          <div>
            <h4 className="font-medium text-gray-900">
              {item.hotelName || item.name}
            </h4>
            <p className="text-sm text-gray-500">
              ⭐ {item.rating} • {item.location}
            </p>
          </div>
        )}
        {type === "attraction" && (
          <div>
            <h4 className="font-medium text-gray-900">{item.name}</h4>
            <p className="text-sm text-gray-500">
              ⭐ {item.rating} • {item.category}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-lg font-bold text-blue-600">
          {getBestPrice()}
          {type === "hotel" && "/night"}
        </div>
        <a
          href={getBestBookingUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          Book Now
        </a>
      </div>
    </div>
  );
}

// Helper functions
function getAirportFromCity(city: string): string {
  const cityToAirport: Record<string, string> = {
    "New York": "NYC",
    "Los Angeles": "LAX",
    Chicago: "CHI",
    Miami: "MIA",
    "San Francisco": "SFO",
    Boston: "BOS",
    Seattle: "SEA",
    Denver: "DEN",
    Atlanta: "ATL",
    Dallas: "DFW",
    London: "LON",
    Paris: "PAR",
    Tokyo: "TYO",
    Sydney: "SYD",
    Toronto: "YTO",
    // Add more as needed
  };

  return cityToAirport[city] || "NYC";
}

function getCurrencyFromCountry(countryCode: string): string {
  const countryToCurrency: Record<string, string> = {
    US: "USD",
    GB: "GBP",
    CA: "CAD",
    AU: "AUD",
    JP: "JPY",
    FR: "EUR",
    DE: "EUR",
    IT: "EUR",
    ES: "EUR",
    NL: "EUR",
    // Add more as needed
  };

  return countryToCurrency[countryCode] || "USD";
}
