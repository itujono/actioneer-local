import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { PlaneIcon } from "lucide-react";
import { supabase } from "../supabase/client";
import { useAuth } from "../hooks/useAuth";

// Define search params schema for type safety and validation
const travelSearchSchema = {
  destination: {
    parse: (value: string | undefined) => value,
    stringify: (value: string | undefined) => value,
  },
  origin: {
    parse: (value: string | undefined) => value,
    stringify: (value: string | undefined) => value,
  },
  travelers: {
    parse: (value: string | undefined) => (value ? Number(value) : undefined),
    stringify: (value: number | undefined) => value?.toString(),
  },
  messageId: {
    parse: (value: string | undefined) => value,
    stringify: (value: string | undefined) => value,
  },
  from: {
    parse: (value: string | undefined) => value,
    stringify: (value: string | undefined) => value,
  },
};

export const travelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/travel",
  component: TravelDashboard,
  validateSearch: (search: Record<string, unknown>): TravelSearchParams => ({
    destination: travelSearchSchema.destination.parse(
      search.destination as string
    ),
    origin: travelSearchSchema.origin.parse(search.origin as string),
    travelers: travelSearchSchema.travelers.parse(search.travelers as string),
    messageId: travelSearchSchema.messageId.parse(search.messageId as string),
    from: travelSearchSchema.from.parse(search.from as string),
  }),
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

interface TravelSearchParams {
  destination?: string;
  origin?: string;
  travelers?: number;
  messageId?: string;
  from?: string;
}

function TravelDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = travelRoute.useSearch();
  const navigate = useNavigate({ from: travelRoute.fullPath });

  // Only set travel criteria if we have search params
  const [travelCriteria, setTravelCriteria] = useState<TravelData>({
    destination: searchParams.destination || "",
    origin: searchParams.origin || "NYC",
    travelers: searchParams.travelers || 1,
  });

  // Check if we have a destination to show recommendations
  const hasDestination = Boolean(searchParams.destination);

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

  // Get user coordinates using browser geolocation
  const { data: coordinates } = useQuery({
    queryKey: ["user-coordinates"],
    queryFn: async (): Promise<{ latitude: number; longitude: number }> => {
      return new Promise((resolve, reject) => {
        if (!navigator.geolocation) {
          reject(new Error("Geolocation not supported"));
          return;
        }

        navigator.geolocation.getCurrentPosition(
          (position) => {
            resolve({
              latitude: position.coords.latitude,
              longitude: position.coords.longitude,
            });
          },
          (error) => {
            reject(new Error(`Geolocation failed: ${error.message}`));
          },
          { timeout: 10000, maximumAge: 300000 } // 5 minutes cache
        );
      });
    },
    retry: false, // Don't retry geolocation requests
    staleTime: 1000 * 60 * 5, // 5 minutes
  });

  // Fetch location info based on coordinates
  const { data: userLocation } = useQuery({
    queryKey: ["user-location", coordinates?.latitude, coordinates?.longitude],
    queryFn: async (): Promise<LocationInfo> => {
      if (!coordinates) throw new Error("No coordinates available");

      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${coordinates.latitude}&longitude=${coordinates.longitude}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error("Reverse geocoding failed");
      }

      const data = await response.json();

      return {
        city: data.city,
        country: data.countryName,
        countryCode: data.countryCode,
        airport: getAirportFromCity(data.city) || "NYC",
        currency: getCurrencyFromCountry(data.countryCode) || "USD",
      };
    },
    enabled: !!coordinates,
    staleTime: 1000 * 60 * 30, // 30 minutes
  });

  // Default location fallback
  const defaultLocation: LocationInfo = {
    city: "New York",
    country: "United States",
    countryCode: "US",
    airport: "NYC",
    currency: "USD",
  };

  // Update travel criteria when user location changes
  useEffect(() => {
    if (userLocation) {
      setTravelCriteria((prev) => ({
        ...prev,
        origin: userLocation.airport,
      }));
      console.log("📍 User location detected:", userLocation);
    }
  }, [userLocation]);

  // Fetch comprehensive travel data - only when we have a destination
  const {
    data: travelComparisons,
    isLoading: travelLoading,
    refetch: refetchTravel,
  } = useQuery({
    queryKey: ["travel-comparisons", travelCriteria],
    queryFn: async () => {
      if (!userProfile?.api_key) throw new Error("No API key available");
      if (!travelCriteria.destination)
        throw new Error("No destination specified");

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
            emailId: searchParams.messageId || `dashboard-request`,
            messageId: searchParams.messageId || `dashboard-request`,
            emailBody: `Travel planning for ${travelCriteria.destination}`,
            subject: `Trip to ${travelCriteria.destination}`,
            from: searchParams.from || "dashboard@example.com",
          }),
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch travel data");
      }

      const data = await response.json();
      return data;
    },
    enabled:
      !!userProfile?.api_key && hasDestination && !!travelCriteria.destination,
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

  // Debug saved travels data and selection state
  if (savedTravels) {
    console.log(
      "📊 Saved travels data:",
      savedTravels.map((t) => ({
        id: t.id,
        email_id: t.email_id,
        destination: t.destination,
        created_at: t.created_at,
        isSelected: searchParams.messageId === t.email_id && hasDestination,
      }))
    );
    console.log("🎯 Current selection state:", {
      messageId: searchParams.messageId,
      hasDestination,
      from: searchParams.from,
    });
  }

  if (authLoading) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-jade"></div>
            <p className="mt-2 text-sm text-thunder">
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
            {/* Breadcrumb when viewing specific travel */}
            {hasDestination && searchParams.from === "dashboard" && (
              <nav className="flex mb-2" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-3">
                  <li className="inline-flex items-center">
                    <button
                      onClick={() =>
                        navigate({
                          search: () => ({
                            destination: undefined,
                            origin: undefined,
                            travelers: undefined,
                            messageId: undefined,
                            from: undefined,
                          }),
                        })
                      }
                      className="inline-flex items-center text-sm font-medium text-thunder hover:text-jade"
                    >
                      🏠 Travel Dashboard
                    </button>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="text-concrete mx-2">/</span>
                      <span className="text-sm font-medium text-thunder">
                        📧 Email Analysis
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
            )}

            <h1 className="text-2xl font-bold text-thunder">
              {hasDestination
                ? `Travel to ${travelCriteria.destination}`
                : "Travel Dashboard"}
            </h1>
            <p className="mt-1 text-sm text-thunder">
              {hasDestination
                ? searchParams.from === "dashboard"
                  ? "Refreshed recommendations from your email analysis"
                  : "Comprehensive travel recommendations powered by AI"
                : "Your travel email history and planning hub"}
            </p>
          </div>
          <div className="text-right">
            <p className="text-sm text-thunder">Your location</p>
            <p className="text-lg font-medium text-thunder">
              📍 {(userLocation || defaultLocation).city},{" "}
              {(userLocation || defaultLocation).country}
            </p>
          </div>
        </div>

        {/* Travel Search Form */}
        {/* <div className="mt-8 bg-white rounded-lg shadow px-6 py-6">
          <h2 className="text-lg font-medium text-thunder mb-4">
            Plan Your Trip
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-thunder">
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
                className="mt-1 block w-full px-3 py-2 border border-concrete rounded-md shadow-sm focus:outline-none focus:ring-jade focus:border-jade"
                placeholder="e.g., Kyoto, Paris, Tokyo"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-thunder">
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
                className="mt-1 block w-full px-3 py-2 border border-concrete rounded-md shadow-sm focus:outline-none focus:ring-jade focus:border-jade"
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
                className="w-full flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-jade hover:bg-jade/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jade disabled:opacity-50"
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

        {/* Only show travel recommendations when we have a destination */}
        {hasDestination && (
          <>
            {/* Loading State with Skeleton */}
            {travelLoading && (
              <div className="mt-8 space-y-8">
                {/* Flights Skeleton */}
                <TravelSectionSkeleton
                  title="✈️ Flights"
                  subtitle="From your location to destination"
                />

                {/* Hotels Skeleton */}
                <TravelSectionSkeleton
                  title="🏨 Hotels"
                  subtitle="Accommodation in destination"
                />

                {/* Attractions Skeleton */}
                <TravelSectionSkeleton
                  title="🎯 Attractions & Activities"
                  subtitle="Things to do in destination"
                />
              </div>
            )}

            {/* Travel Recommendations */}
            {travelComparisons && !travelLoading && (
              <div className="mt-8 space-y-8">
                {/* Flights Section */}
                {travelComparisons.comparisons?.flights?.length > 0 && (
                  <TravelSection
                    title="✈️ Flights"
                    subtitle={`From ${
                      (userLocation || defaultLocation).city
                    } to ${travelCriteria.destination}`}
                    items={travelComparisons.comparisons.flights}
                    type="flight"
                    userLocation={userLocation || defaultLocation}
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
          </>
        )}

        {/* No destination message */}
        {!hasDestination && (
          <div className="mt-8 bg-gradient-to-r from-jade/5 to-emerald/5 rounded-lg p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-jade/10 rounded-full flex items-center justify-center mb-4">
              <PlaneIcon className="h-8 w-8 text-jade" />
            </div>
            <h3 className="text-lg font-medium text-thunder mb-2">
              Ready to Plan Your Next Adventure?
            </h3>
            <p className="text-thunder mb-6 max-w-md mx-auto">
              Your travel recommendations will appear here when you analyze
              travel emails in Gmail. Check your recent travel emails below or
              head to Gmail to get started!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-jade hover:bg-jade/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jade"
              >
                <PlaneIcon className="h-4 w-4 mr-2" />
                Open Gmail
              </a>
              <button
                onClick={() => window.location.reload()}
                className="inline-flex items-center px-4 py-2 border border-concrete rounded-md shadow-sm text-sm font-medium text-thunder bg-white hover:bg-concrete focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jade"
              >
                🔄 Refresh Page
              </button>
            </div>
          </div>
        )}

        {/* Recent Travel Emails */}
        {savedTravels && savedTravels.length > 0 && (
          <div className="mt-12">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-medium text-thunder">
                Recent Travel Emails
              </h2>
              {hasDestination && searchParams.from === "dashboard" && (
                <button
                  onClick={() =>
                    navigate({
                      search: () => ({
                        destination: undefined,
                        origin: undefined,
                        travelers: undefined,
                        messageId: undefined,
                        from: undefined,
                      }),
                    })
                  }
                  className="inline-flex items-center px-3 py-1.5 border border-concrete rounded-md text-xs font-medium text-thunder bg-white hover:bg-concrete focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jade transition-colors"
                >
                  ✕ Clear Selection
                </button>
              )}
            </div>
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <ul className="divide-y divide-gray-200">
                {savedTravels.map((travel) => {
                  // Ensure only one card is selected at a time
                  const isCurrentlySelected =
                    searchParams.messageId === travel.email_id &&
                    hasDestination;

                  return (
                    <TravelEmailCard
                      key={travel.id}
                      travel={travel}
                      isSelected={isCurrentlySelected}
                      onSelect={(selectedTravel) => {
                        // Use TanStack Router's type-safe navigation
                        navigate({
                          search: () => ({
                            destination: selectedTravel.destination,
                            origin: selectedTravel.details?.origin,
                            travelers: selectedTravel.details?.travelers,
                            messageId: selectedTravel.email_id,
                            from: "dashboard",
                          }),
                        });
                      }}
                    />
                  );
                })}
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
      <div className="px-6 py-4 border-b border-concrete">
        <h3 className="text-lg font-medium text-thunder">{title}</h3>
        <p className="text-sm text-thunder">{subtitle}</p>
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

  const handleBookingClick = () => {
    // Add tracking or analytics here if needed
    const url = getBestBookingUrl();

    // If the URL seems problematic (too long or complex), show a warning
    if (url.length > 200 || url.includes("%3A") || url.includes("%2C")) {
      console.log(
        "⚠️ Complex booking URL detected, may be stripped by external site"
      );
    }
  };

  return (
    <div className="border border-concrete rounded-lg p-4 hover:shadow-md transition-shadow">
      <div className="mb-3">
        {type === "flight" && (
          <div>
            <h4 className="font-medium text-thunder">
              {item.airline} {item.flightNumber}
            </h4>
            <p className="text-sm text-thunder">
              {item.duration} •{" "}
              {item.stops === 0
                ? "Direct"
                : `${item.stops} stop${item.stops > 1 ? "s" : ""}`}
            </p>
          </div>
        )}
        {type === "hotel" && (
          <div>
            <h4 className="font-medium text-thunder">
              {item.hotelName || item.name}
            </h4>
            <p className="text-sm text-thunder">
              ⭐ {item.rating} • {item.location}
            </p>
          </div>
        )}
        {type === "attraction" && (
          <div>
            <h4 className="font-medium text-thunder">{item.name}</h4>
            <p className="text-sm text-thunder">
              ⭐ {item.rating} • {item.category}
            </p>
          </div>
        )}
      </div>

      <div className="flex items-center justify-between">
        <div className="text-lg font-bold text-jade">
          {getBestPrice()}
          {type === "hotel" && "/night"}
        </div>
        <a
          href={getBestBookingUrl()}
          target="_blank"
          rel="noopener noreferrer"
          className="px-3 py-1 bg-jade text-white text-sm rounded hover:bg-jade/90 transition-colors"
          onClick={handleBookingClick}
        >
          Book Now
        </a>
      </div>
    </div>
  );
}

// Helper component for travel email cards
interface TravelEmailCardProps {
  travel: any; // Using any for now since we don't have full type definition
  onSelect: (travel: any) => void;
  isSelected?: boolean;
}

function TravelEmailCard({
  travel,
  onSelect,
  isSelected = false,
}: TravelEmailCardProps) {
  const getTravelTypeIcon = (type: string) => {
    const icons = {
      flight: "✈️",
      hotel: "🏨",
      attraction: "🎯",
      general: "🌍",
    };
    return icons[type as keyof typeof icons] || "🌍";
  };

  const getTravelTypeColor = (type: string) => {
    const colors = {
      flight: "bg-blue-50 text-blue-600",
      hotel: "bg-purple-50 text-purple-600",
      attraction: "bg-green-50 text-green-600",
      general: "bg-concrete text-thunder",
    };
    return colors[type as keyof typeof colors] || "bg-concrete text-thunder";
  };

  const formatDateRange = () => {
    if (!travel.start_date) return null;

    const startDate = new Date(travel.start_date);
    const endDate = travel.end_date ? new Date(travel.end_date) : null;

    if (endDate && endDate.getTime() !== startDate.getTime()) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    return startDate.toLocaleDateString();
  };

  const getAdditionalInfo = () => {
    const info = [];

    // Add travelers count if available
    if (travel.details?.travelers || travel.details?.guests) {
      const count = travel.details.travelers || travel.details.guests;
      info.push(`${count} ${count === 1 ? "traveler" : "travelers"}`);
    }

    // Add origin if available and different from destination
    if (
      travel.details?.origin &&
      travel.details.origin !== travel.destination
    ) {
      info.push(`from ${travel.details.origin}`);
    }

    // Add flight details if available
    if (travel.type === "flight" && travel.details?.airline) {
      info.push(travel.details.airline);
    }

    // Add hotel details if available
    if (travel.type === "hotel" && travel.details?.hotelName) {
      info.push(travel.details.hotelName);
    }

    return info.length > 0 ? info.join(" • ") : null;
  };

  return (
    <li
      className={`px-6 py-4 cursor-pointer transition-all duration-200 border-l-4 ${
        isSelected
          ? "bg-jade/10 border-jade shadow-sm ring-1 ring-jade/20 hover:bg-jade/15"
          : "border-transparent hover:bg-concrete hover:border-jade/50"
      }`}
      onClick={() => onSelect(travel)}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center flex-1 min-w-0">
          <div className="flex-shrink-0">
            <div
              className={`h-12 w-12 rounded-full flex items-center justify-center ${getTravelTypeColor(
                travel.type
              )}`}
            >
              <span className="text-lg">{getTravelTypeIcon(travel.type)}</span>
            </div>
          </div>
          <div className="ml-4 flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1">
              <p
                className={`text-sm font-medium truncate ${
                  isSelected ? "text-thunder" : "text-thunder"
                }`}
              >
                To <FormattedDestination destination={travel.destination} />
              </p>
              <span
                className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getTravelTypeColor(
                  travel.type
                )} ${isSelected ? "ring-1 ring-current/20" : ""}`}
              >
                {travel.type}
              </span>
            </div>

            {/* Date range */}
            {formatDateRange() && (
              <p className="text-sm text-thunder mb-1">
                📅 {formatDateRange()}
              </p>
            )}

            {/* Additional context info */}
            {getAdditionalInfo() && (
              <p className="text-xs text-concrete truncate">
                {getAdditionalInfo()}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end text-right ml-4">
          <div className="text-xs text-concrete mb-1">Analyzed</div>
          <div className="text-sm text-thunder">
            {new Date(travel.created_at).toLocaleDateString()}
          </div>
          <div className="mt-2">
            <div className="inline-flex items-center text-xs font-medium text-jade">
              {isSelected ? "✓ Selected" : "View Details →"}
            </div>
          </div>
        </div>
      </div>
    </li>
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

// Fallback airport/city mappings for when API fails
const fallbackAirportToCityMap: Record<string, string> = {
  // Major airports that don't match country codes
  NYC: "New York",
  LAX: "Los Angeles",
  CHI: "Chicago",
  MIA: "Miami",
  SFO: "San Francisco",
  BOS: "Boston",
  SEA: "Seattle",
  DEN: "Denver",
  ATL: "Atlanta",
  DFW: "Dallas",
  LAS: "Las Vegas",
  PHX: "Phoenix",
  LON: "London",
  PAR: "Paris",
  TYO: "Tokyo",
  SYD: "Sydney",
  YTO: "Toronto",
  BKK: "Bangkok",
  SIN: "Singapore",
  HKG: "Hong Kong",
  ICN: "Seoul",
  NRT: "Tokyo",
  KIX: "Osaka",
  PVG: "Shanghai",
  PEK: "Beijing",
  DEL: "New Delhi",
  BOM: "Mumbai",
  KUL: "Kuala Lumpur",
  CGK: "Jakarta",
  MNL: "Manila",
  // Additional airports that might not be in the API
  IST: "Istanbul",
  LHR: "London",
  CDG: "Paris",
  FRA: "Frankfurt",
  AMS: "Amsterdam",
  FCO: "Rome",
  MAD: "Madrid",
  BCN: "Barcelona",
  ZUR: "Zurich",
  VIE: "Vienna",
};

// Airport data interface
interface AirportData {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
}

// Hook to get airport information from API
function useAirportInfo(airportCode: string) {
  return useQuery({
    queryKey: ["airport-info", airportCode],
    queryFn: async (): Promise<AirportData | null> => {
      // API Ninjas requires an API key, but we can use a fallback approach
      // For now, let's use a free alternative - the GitHub airports database
      try {
        const response = await fetch(
          `https://raw.githubusercontent.com/lxndrblz/Airports/main/airports.csv`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch airports database");
        }

        const csvData = await response.text();
        const lines = csvData.split("\n");
        const headers = lines[0].split(",");

        // Find the airport by IATA code
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",");
          const airport: Record<string, string> = {};
          headers.forEach((header, index) => {
            airport[header.replace(/"/g, "")] =
              values[index]?.replace(/"/g, "") || "";
          });

          if (airport["iata_code"] === airportCode.toUpperCase()) {
            return {
              iata: airport["iata_code"],
              icao: airport["icao_code"],
              name: airport["name"],
              city: airport["municipality"] || airport["name"],
              country: airport["iso_country"],
            };
          }
        }

        // If not found, return null to trigger fallback
        return null;
      } catch (error) {
        console.log(
          `⚠️ Failed to fetch airport info for ${airportCode}:`,
          error
        );
        return null;
      }
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - airport data rarely changes
    gcTime: 1000 * 60 * 60 * 24 * 30, // Keep in cache for 30 days
    enabled: !!airportCode && airportCode.length === 3,
    retry: false, // Don't retry on failure, use fallback instead
  });
}

// TanStack Query hook to format destination names
function useFormattedDestination(destination: string) {
  console.log(`🔍 Starting format for: "${destination}"`);

  // First try to get airport info if it looks like an airport code
  const { data: airportInfo, isLoading: airportLoading } =
    useAirportInfo(destination);

  console.log(`✈️ Airport info for "${destination}":`, {
    airportInfo,
    airportLoading,
  });

  const { data: formattedName, isLoading: formatLoading } = useQuery({
    queryKey: ["destination-format", destination],
    queryFn: async () => {
      console.log(`🏃 Running format query for: "${destination}"`);

      // If it's already a proper city/country name (not a 3-letter code), return as-is
      if (
        destination.length > 3 ||
        !/^[A-Z]{3}$/.test(destination.toUpperCase())
      ) {
        console.log(`📝 "${destination}" is already a proper name`);
        return destination;
      }

      // If we have airport info, use the city from airport data
      if (airportInfo?.city) {
        console.log(`✈️ Using airport city: "${airportInfo.city}"`);
        return airportInfo.city;
      }

      try {
        // First, check if it's a known airport code in our fallback mapping
        console.log(`🗺️ Trying fallback mapping for: "${destination}"`);
        const cityName = fallbackAirportToCityMap[destination.toUpperCase()];
        if (cityName) {
          console.log(`🗺️ Found in fallback: "${cityName}"`);
          return cityName;
        }

        // If not in airport mapping, try to get country name by alpha3 code
        console.log(`🌍 Trying country API for: "${destination}"`);
        const countryResponse = await fetch(
          `https://restcountries.com/v3.1/alpha/${destination.toLowerCase()}`
        );

        if (countryResponse.ok) {
          const countryData = await countryResponse.json();
          if (
            countryData &&
            countryData[0] &&
            countryData[0].name &&
            countryData[0].name.common
          ) {
            console.log(`🌍 Found country: "${countryData[0].name.common}"`);
            return countryData[0].name.common;
          }
        }

        // If no mapping found, return original
        console.log(`❌ No mapping found for: "${destination}"`);
        return destination;
      } catch (error) {
        console.log(
          `⚠️ Failed to resolve destination "${destination}":`,
          error
        );
        // Fallback to original destination on error
        return destination;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - destination names don't change often
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days
    enabled: !!destination && !airportInfo?.city, // Only run if destination exists and we don't have airport info
  });

  const result = airportInfo?.city || formattedName || destination;
  console.log(`🎯 Final result for "${destination}": "${result}"`);

  // Return airport city if available, otherwise formatted name, otherwise original
  return result;
}

// Component to display formatted destination
function FormattedDestination({ destination }: { destination: string }) {
  const formattedName = useFormattedDestination(destination);

  // Debug formatting
  if (destination !== formattedName) {
    console.log(`🗺️ Formatted "${destination}" → "${formattedName}"`);
  }

  return <>{formattedName}</>;
}

// Skeleton loading components
function TravelSectionSkeleton({
  title,
  subtitle,
}: {
  title: string;
  subtitle: string;
}) {
  return (
    <div className="bg-white rounded-lg shadow">
      <div className="px-6 py-4 border-b border-concrete">
        <h3 className="text-lg font-medium text-thunder">{title}</h3>
        <div className="mt-1">
          <div className="h-4 bg-concrete rounded animate-pulse w-48"></div>
        </div>
      </div>
      <div className="p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((index) => (
            <TravelCardSkeleton key={index} />
          ))}
        </div>
      </div>
    </div>
  );
}

function TravelCardSkeleton() {
  return (
    <div className="border border-concrete rounded-lg p-4">
      <div className="mb-3">
        {/* Title skeleton */}
        <div className="h-5 bg-concrete rounded animate-pulse w-3/4 mb-2"></div>
        {/* Subtitle skeleton */}
        <div className="h-4 bg-concrete rounded animate-pulse w-1/2"></div>
      </div>

      <div className="flex items-center justify-between">
        {/* Price skeleton */}
        <div className="h-6 bg-concrete rounded animate-pulse w-20"></div>
        {/* Button skeleton */}
        <div className="h-8 bg-concrete rounded animate-pulse w-20"></div>
      </div>
    </div>
  );
}
