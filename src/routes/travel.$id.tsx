import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useQuery } from "@tanstack/react-query";
import {
  MapPin,
  Camera,
  Hotel,
  Loader2,
  AlertCircle,
  ArrowLeft,
} from "lucide-react";
import { DashboardContainer } from "../components/dashboard";
import { Button } from "../components/ui/button";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase/client";

// Import the recommendation components from the dialog
import {
  RecommendationCard,
  LoadingSkeleton,
  fetchTravelRecommendations,
  type RecommendationItem,
} from "../components/travel/TravelRecommendationComponents";

export const travelDetailRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/travel/$id",
  component: TravelDetailPage,
});

function TravelDetailPage() {
  const { id } = travelDetailRoute.useParams();
  const { user, isLoading: authLoading } = useAuth();

  // Fetch the travel email details
  const {
    data: travelEmail,
    isLoading: emailLoading,
    error: emailError,
  } = useQuery({
    queryKey: ["travel-email", id, user?.id],
    queryFn: async () => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("travel")
        .select("*")
        .eq("id", id)
        .eq("user_id", user.id)
        .single();

      if (error) throw error;
      return data;
    },
    enabled: !!user && !authLoading && !!id,
  });

  const destinationName =
    travelEmail?.details?.origin || travelEmail?.subject || "Unknown";
  const travelers = travelEmail?.details?.travelers || 2;

  // Fetch travel recommendations
  const {
    data: recommendations,
    isLoading: recommendationsLoading,
    error: recommendationsError,
  } = useQuery({
    queryKey: ["travel-recommendations", destinationName, travelers],
    queryFn: () => fetchTravelRecommendations(destinationName, travelers),
    enabled: !!destinationName && destinationName !== "Unknown",
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  const isLoading = emailLoading || recommendationsLoading;
  const error = emailError || recommendationsError;

  if (authLoading) {
    return (
      <DashboardContainer
        title="Loading..."
        description="Fetching travel details"
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </DashboardContainer>
    );
  }

  if (!user) {
    return (
      <DashboardContainer
        title="Authentication Required"
        description="Please log in to view travel details"
      >
        <div className="text-center py-8">
          <p className="text-thunder">
            You need to be logged in to view this page.
          </p>
        </div>
      </DashboardContainer>
    );
  }

  if (emailError) {
    return (
      <DashboardContainer
        title="Travel Not Found"
        description="The requested travel details could not be found"
        backButtonText="Back to Travel"
      >
        <div className="flex items-center gap-2 text-bittersweet bg-bittersweet/10 p-4 rounded-lg">
          <AlertCircle className="h-5 w-5" />
          <div>
            <p className="font-medium">Travel email not found</p>
            <p className="text-sm">{emailError.message}</p>
          </div>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer
      title={`Explore ${destinationName}`}
      description={`Travel recommendations for ${travelers} travelers`}
      backButtonText="Back to Travel"
    >
      {/* Email Details Section */}
      {/* {travelEmail && (
        <div className="bg-white rounded-lg border-2 border-concrete p-6 mb-8">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h2 className="text-lg font-semibold text-thunder mb-2">
                Travel Email
              </h2>
              <p className="text-thunder mb-2">{travelEmail.subject}</p>
              <p className="text-sm text-gray-600">
                📅 {new Date(travelEmail.created_at).toLocaleDateString()}
              </p>
            </div>
            <div className="text-right">
              <div className="text-sm text-gray-600">
                👥 {travelers} travelers
              </div>
            </div>
          </div>
        </div>
      )} */}

      {/* Recommendations Section */}
      <div className="space-y-8">
        {isLoading && (
          <div className="space-y-6">
            <div className="flex items-center gap-2 text-thunder">
              <Loader2 className="h-4 w-4 animate-spin" />
              Finding the best attractions and hotels...
            </div>
            <LoadingSkeleton />
          </div>
        )}

        {recommendationsError && (
          <div className="flex items-center gap-2 text-bittersweet bg-bittersweet/10 p-4 rounded-lg">
            <AlertCircle className="h-5 w-5" />
            <div>
              <p className="font-medium">Failed to load recommendations</p>
              <p className="text-sm">{recommendationsError.message}</p>
            </div>
          </div>
        )}

        {recommendations && (
          <>
            {recommendations.overview && (
              <div className="bg-jade/10 border border-jade/20 rounded-lg p-6">
                <h3 className="text-lg font-semibold mb-3 text-thunder">
                  Overview
                </h3>
                <p className="text-thunder leading-relaxed">
                  {recommendations.overview}
                </p>
              </div>
            )}

            {recommendations.attractions.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Camera className="h-6 w-6 text-jade" />
                  <h3 className="text-xl font-semibold">
                    Attractions ({recommendations.attractions.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {recommendations.attractions.map(
                    (attraction: RecommendationItem) => (
                      <RecommendationCard
                        key={attraction.id}
                        item={attraction}
                      />
                    )
                  )}
                </div>
              </div>
            )}

            {recommendations.hotels.length > 0 && (
              <div>
                <div className="flex items-center gap-2 mb-6">
                  <Hotel className="h-6 w-6 text-jade" />
                  <h3 className="text-xl font-semibold">
                    Hotels ({recommendations.hotels.length})
                  </h3>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {recommendations.hotels.map((hotel: RecommendationItem) => (
                    <RecommendationCard key={hotel.id} item={hotel} />
                  ))}
                </div>
              </div>
            )}

            {recommendations.hotels.length === 0 &&
              recommendations.attractions.length === 0 && (
                <div className="text-center py-12 bg-gray-50 rounded-lg">
                  <Camera className="h-16 w-16 mx-auto mb-4 text-jade/20" />
                  <h3 className="text-lg font-medium text-thunder mb-2">
                    No recommendations found
                  </h3>
                  <p className="text-thunder">
                    We couldn't find any recommendations for this destination.
                  </p>
                  <p className="text-sm text-gray-600 mt-1">
                    Try searching for a more specific location.
                  </p>
                </div>
              )}
          </>
        )}
      </div>
    </DashboardContainer>
  );
}
