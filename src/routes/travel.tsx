import { createRoute, useNavigate } from "@tanstack/react-router";
import { rootRoute } from "./root";
import { useInfiniteQuery } from "@tanstack/react-query";
import { useMemo } from "react";
import { useAuth } from "../hooks/useAuth";
import { supabase } from "../supabase/client";
import { TravelStats, TravelEmailsList } from "../components/travel";
import { DashboardContainer } from "../components/dashboard";

export const travelRoute = createRoute({
  getParentRoute: () => rootRoute,
  path: "/travel",
  component: TravelDashboard,
});

function TravelDashboard() {
  const { user, isLoading: authLoading } = useAuth();
  const navigate = useNavigate();

  const {
    data,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage,
    isLoading,
    error,
  } = useInfiniteQuery({
    queryKey: ["travel", user?.id],
    queryFn: async ({ pageParam }) => {
      if (!user) throw new Error("User not authenticated");

      const { data, error } = await supabase
        .from("travel")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .range(pageParam, pageParam + 19);

      if (error) throw error;
      return data || [];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) => {
      if (lastPage.length < 20) return undefined;
      return pages.length * 20;
    },
    enabled: !!user && !authLoading,
  });

  const travelEmails = useMemo(() => {
    return data?.pages.flatMap((page) => page) || [];
  }, [data]);

  const groupedTravelEmails = useMemo(() => {
    return travelEmails.reduce((acc, email) => {
      const date = new Date(email.created_at).toDateString();
      if (!acc[date]) {
        acc[date] = [];
      }
      acc[date].push(email);
      return acc;
    }, {} as Record<string, any[]>);
  }, [travelEmails]);

  const handleExploreDestination = (travel: any) => {
    console.log("🌍 Exploring destination:", travel.destination);
    navigate({ to: "/travel/$id", params: { id: travel.id } });
  };

  if (authLoading || isLoading) {
    return (
      <DashboardContainer
        title="Travel Dashboard"
        description="All your travel emails are stored here. Find the best hotels and attractions for your next trip."
      >
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
          <div className="h-32 bg-gray-200 rounded"></div>
        </div>
      </DashboardContainer>
    );
  }

  if (error) {
    return (
      <DashboardContainer
        title="Travel Dashboard"
        description="All your travel emails are stored here. Find the best hotels and attractions for your next trip."
      >
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-700">
            Error loading travel data: {error.message}
          </p>
        </div>
      </DashboardContainer>
    );
  }

  return (
    <DashboardContainer
      title="Travel Dashboard"
      description="All your travel emails are stored here. Find the best hotels and attractions for your next trip."
    >
      <TravelStats travelEmails={travelEmails} isLoading={isLoading} />
      <TravelEmailsList
        isLoading={isLoading}
        groupedTravelEmails={groupedTravelEmails}
        hasNextPage={hasNextPage}
        isFetchingNextPage={isFetchingNextPage}
        onLoadMore={fetchNextPage}
        onExploreDestination={handleExploreDestination}
      />
    </DashboardContainer>
  );
}
