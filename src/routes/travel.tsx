import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery } from "@tanstack/react-query";
import { useState, useEffect } from "react";
import { PlaneIcon } from "lucide-react";
import { supabase } from "../supabase/client";
import { useAuth } from "../hooks/useAuth";
import { PageTitle } from "../components/dashboard/PageTitle";
import { Button } from "../components/ui/button";
import {
  TravelSection,
  TravelEmailCard,
  TravelSectionSkeleton,
  getAirportFromCity,
  getCurrencyFromCountry,
  travelSearchSchema,
  type LocationInfo,
  type TravelData,
  type TravelSearchParams,
} from "../components/travel";

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

function TravelDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const searchParams = travelRoute.useSearch();
  const navigate = useNavigate({ from: travelRoute.fullPath });

  // Sync travel criteria with search params
  const [travelCriteria, setTravelCriteria] = useState<TravelData>({
    destination: searchParams.destination || "",
    origin: searchParams.origin || "NYC",
    travelers: searchParams.travelers || 1,
  });

  // Update travel criteria when search params change (e.g., when clicking a saved travel email)
  useEffect(() => {
    setTravelCriteria({
      destination: searchParams.destination || "",
      origin: searchParams.origin || "NYC",
      travelers: searchParams.travelers || 1,
    });
  }, [searchParams.destination, searchParams.origin, searchParams.travelers]);

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
  const { data: travelComparisons, isLoading: travelLoading } = useQuery({
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
  const { data: savedTravels } = useQuery({
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
        <div className="flex justify-between items-center">
          <div className="flex-1">
            {/* Breadcrumb when viewing specific travel */}
            {hasDestination && searchParams.from === "dashboard" && (
              <nav className="flex mb-2" aria-label="Breadcrumb">
                <ol className="inline-flex items-center space-x-1 md:space-x-1">
                  <li className="inline-flex items-center">
                    <Button
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
                      variant="ghost"
                      size="sm"
                      className="text-sm font-medium text-thunder hover:text-jade p-0"
                    >
                      Travel Dashboard
                    </Button>
                  </li>
                  <li>
                    <div className="flex items-center">
                      <span className="text-thunder mx-2">/</span>
                      <span className="text-sm font-medium text-thunder">
                        Email Analysis
                      </span>
                    </div>
                  </li>
                </ol>
              </nav>
            )}

            <PageTitle
              title={
                hasDestination
                  ? `Travel to ${travelCriteria.destination}`
                  : "Travel Dashboard"
              }
              description={
                hasDestination
                  ? searchParams.from === "dashboard"
                    ? "Refreshed recommendations from your email analysis"
                    : "Comprehensive travel recommendations powered by AI"
                  : "Your travel email history and planning hub"
              }
            />
          </div>
          <div className="text-right ml-4">
            <p className="text-sm text-thunder">Your location</p>
            <p className="text-lg font-medium text-thunder">
              📍 {(userLocation || defaultLocation).city},{" "}
              {(userLocation || defaultLocation).country}
            </p>
          </div>
        </div>

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
          <div className="mt-8 bg-bittersweet rounded-md p-8 text-center">
            <div className="mx-auto w-16 h-16 bg-gold/10 rounded-full flex items-center justify-center mb-4">
              <PlaneIcon className="h-8 w-8 text-gold" />
            </div>
            <h3 className="text-2xl font-medium text-gold mb-2">
              Ready to Plan Your Next Adventure?
            </h3>
            <p className="text-white mb-6 max-w-md mx-auto">
              Your travel recommendations will appear here when you analyze
              travel emails in Gmail. Check your recent travel emails below or
              head to Gmail to get started!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a
                href="https://mail.google.com"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md transition-colors bg-jade text-white hover:bg-jade/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-jade"
              >
                <PlaneIcon className="h-4 w-4 mr-2" />
                Open Gmail
              </a>
              <Button
                onClick={() => window.location.reload()}
                variant="outline"
                size="sm"
              >
                🔄 Refresh Page
              </Button>
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
                <Button
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
                  variant="outline"
                  size="sm"
                  className="text-xs"
                >
                  ✕ Clear Selection
                </Button>
              )}
            </div>
            <div className="bg-white rounded-md border-2 border-gray-light overflow-hidden">
              <ul className="divide-y divide-gray-light">
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
