import { PlaneIcon, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { TravelEmailCard } from "./TravelEmailCard";

export interface TravelEmailsListProps {
  isLoading: boolean;
  groupedTravelEmails: Record<string, any[]>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onExploreDestination: (travel: any) => void;
}

// Helper function to format date labels (similar to finance)
const formatDateLabel = (dateString: string): string => {
  const date = new Date(dateString);
  const today = new Date();
  const yesterday = new Date(today);
  yesterday.setDate(yesterday.getDate() - 1);

  // Reset time to start of day for comparison
  const resetTime = (d: Date) => {
    d.setHours(0, 0, 0, 0);
    return d;
  };

  const dateOnly = resetTime(new Date(date));
  const todayOnly = resetTime(new Date(today));
  const yesterdayOnly = resetTime(new Date(yesterday));

  if (dateOnly.getTime() === todayOnly.getTime()) {
    return "Today";
  } else if (dateOnly.getTime() === yesterdayOnly.getTime()) {
    return "Yesterday";
  } else {
    return date.toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  }
};

export function TravelEmailsList({
  isLoading,
  groupedTravelEmails,
  hasNextPage,
  isFetchingNextPage,
  onLoadMore,
  onExploreDestination,
}: TravelEmailsListProps) {
  if (isLoading) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-concrete/30 p-12 mt-12">
        <div className="flex justify-center items-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-jade"></div>
          <span className="ml-4 text-lg text-thunder">
            Loading travel emails...
          </span>
        </div>
      </div>
    );
  }

  if (Object.keys(groupedTravelEmails).length === 0) {
    return (
      <div className="bg-white rounded-xl shadow-lg border border-concrete/30 p-12 text-center mt-12">
        <PlaneIcon className="h-16 w-16 text-gray-light mx-auto mb-4" />
        <h3 className="text-xl font-medium text-black mb-2">
          No travel emails found
        </h3>
        <p className="text-black">
          Your travel email history will appear here once processed. Start by
          connecting your email for automatic travel tracking!
        </p>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="space-y-8">
        {Object.entries(groupedTravelEmails).map(
          ([dateString, travelsForDay]) => (
            <div key={dateString} className="space-y-2">
              {/* Date Header with Count */}
              <div className="flex items-center justify-between">
                <h3 className="text-lg font-semibold text-black">
                  {formatDateLabel(dateString)}
                </h3>
                <div className="text-right">
                  <div className="text-sm text-thunder">
                    {travelsForDay.length} travel{" "}
                    {travelsForDay.length === 1 ? "email" : "emails"}
                  </div>
                </div>
              </div>

              {/* Travel Email Cards Grid */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {travelsForDay.map((travel: any) => (
                  <TravelEmailCard
                    key={travel.id}
                    travel={travel}
                    onExplore={onExploreDestination}
                  />
                ))}
              </div>
            </div>
          )
        )}
      </div>

      {/* Load More Button */}
      {hasNextPage && (
        <div className="mt-8 flex justify-center">
          <Button
            onClick={onLoadMore}
            disabled={isFetchingNextPage}
            variant="outline"
            size="md"
            className={isFetchingNextPage ? "opacity-50" : ""}
          >
            {isFetchingNextPage ? (
              "Loading more..."
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-2" />
                Show more travel emails
              </>
            )}
          </Button>
        </div>
      )}
    </div>
  );
}
