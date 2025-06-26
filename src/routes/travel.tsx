import { createRoute } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useState, useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase/client";
import {
  TravelHeader,
  TravelStats,
  TravelEmailsList,
} from "../components/travel";

export const travelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/travel",
  component: TravelDashboard,
});

function TravelDashboard() {
  const { user, isLoading: authLoading } = useAuth();

  const PAGE_SIZE = 20;

  // Fetch travel emails with infinite query
  const {
    data: travelPages,
    isLoading: travelLoading,
    error: travelError,
    fetchNextPage: fetchNextTravel,
    hasNextPage: hasNextTravelPage,
    isFetchingNextPage: isFetchingNextTravel,
    refetch: refetchTravel,
  } = useInfiniteQuery({
    queryKey: ["travel-emails", user?.id],
    queryFn: async ({ pageParam }: { pageParam: number }) => {
      if (!user) throw new Error("User not authenticated");

      console.log(
        `✈️ Fetching travel emails page ${pageParam} for user:`,
        user.id
      );

      let query = supabase.from("travel").select("*").eq("user_id", user.id);

      query = query
        .order("created_at", { ascending: false })
        .range(pageParam * PAGE_SIZE, (pageParam + 1) * PAGE_SIZE - 1);

      const { data, error } = await query;

      if (error) {
        console.error("❌ Error fetching travel emails:", error);
        throw error;
      }

      console.log(
        `✅ Travel emails page ${pageParam} fetched:`,
        data?.length || 0
      );
      return { data: data || [], pageParam };
    },
    initialPageParam: 0,
    getNextPageParam: (
      lastPage: { data: any[]; pageParam: number },
      pages: any[]
    ) => {
      if (lastPage.data.length < PAGE_SIZE) {
        return undefined;
      }
      return pages.length;
    },
    enabled: !!user && !authLoading,
  });

  // Flatten travel emails from all pages
  const travelEmails = useMemo(() => {
    return (
      travelPages?.pages.flatMap((page: { data: any[] }) => page.data) || []
    );
  }, [travelPages]);

  // Group travel emails by date (similar to finance transactions)
  const groupedTravelEmails = useMemo(() => {
    if (!travelEmails || travelEmails.length === 0) return {};

    const grouped = travelEmails.reduce((groups, email) => {
      const date = new Date(email.created_at).toDateString();
      if (!groups[date]) {
        groups[date] = [];
      }
      groups[date].push(email);
      return groups;
    }, {} as Record<string, any[]>);

    return grouped;
  }, [travelEmails]);

  // Handle explore destination
  const handleExploreDestination = (travel: any) => {
    // For now, we'll just log it. Later we can implement the attractions/hotels view
    console.log("🌍 Exploring destination:", travel.destination, travel);

    // TODO: Navigate to destination details or open modal with attractions/hotels
    // This is where we'll implement the "cool things to do" feature
    alert(
      `Coming soon: Explore ${travel.destination}!\n\nWe'll show you cool attractions, hotels, and activities here.`
    );
  };

  // Show auth loading state
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

  if (!user) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="py-12 text-center">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-jade"></div>
            <p className="mt-2 text-sm text-thunder">Redirecting to login...</p>
          </div>
        </div>
      </div>
    );
  }

  if (travelError) {
    return (
      <div className="py-6">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
          <div className="bg-bittersweet/10 border border-bittersweet rounded-lg p-6">
            <div className="flex">
              <div className="ml-3">
                <h3 className="text-sm font-medium text-bittersweet">
                  Error loading travel emails
                </h3>
                <p className="mt-1 text-sm text-bittersweet">
                  {travelError?.message || "An unexpected error occurred"}
                </p>
                <div className="mt-2 text-xs text-bittersweet">
                  User ID: {user?.id || "Not authenticated"}
                  <br />
                  Email: {user?.email || "Not authenticated"}
                </div>
                <div className="mt-3">
                  <button
                    onClick={() => refetchTravel()}
                    className="text-bittersweet border border-bittersweet hover:bg-bittersweet/10 px-3 py-1 rounded text-sm"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-concrete/10 py-6 pb-12">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
        <TravelHeader />

        <TravelStats travelEmails={travelEmails} isLoading={travelLoading} />

        <TravelEmailsList
          isLoading={travelLoading}
          groupedTravelEmails={groupedTravelEmails}
          hasNextPage={hasNextTravelPage}
          isFetchingNextPage={isFetchingNextTravel}
          onLoadMore={fetchNextTravel}
          onExploreDestination={handleExploreDestination}
        />
      </div>
    </div>
  );
}
