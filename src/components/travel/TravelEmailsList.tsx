import { PlaneIcon, ChevronDown, BriefcaseIcon, Dot } from "lucide-react";
import { Button } from "../ui/button";
import { TravelEmailCard } from "./TravelEmailCard";
import { TestEmailButton } from "../ui";
import Loading from "../Loading";
import { Spiral } from "../illustrations";

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
    return <Loading message="Loading travel emails..." />;
  }

  if (Object.keys(groupedTravelEmails).length === 0) {
    return (
      <div className="bg-daisy rounded-xl p-12 mt-8 text-lavender relative overflow-hidden">
        <div className="absolute -bottom-32 right-0 w-1/2 h-1/2 scale-x-[-1]">
          <Spiral className="text-heliotrope text-lg" />
        </div>
        <PlaneIcon className="h-16 w-16 mb-6" />
        <p className="text-lg mt-6 max-w-2xl leading-relaxed text-white">
          Your travel command center is ready to track every adventure! Once connected, we'll automatically capture and
          organize travel emails from airlines, hotels, and booking platforms as they arrive. The best part? You don't
          have to do anything.
        </p>

        <ul className="text-left text-white space-y-2 mt-6">
          <li className="flex items-start">
            <Dot className="text-lavender relative right-2" />
            <span>
              <strong className="text-lavender">Travel promotional emails</strong> and destination deals from travel
              companies
            </span>
          </li>
          <li className="flex items-start">
            <Dot className="text-lavender relative right-2" />
            <span>
              <strong className="text-lavender">Hotel and flight deals</strong> like "75% off NYC hotels" or "Flights to
              Tokyo $299"
            </span>
          </li>
          <li className="flex items-start">
            <Dot className="text-lavender relative right-2" />
            <span>
              <strong className="text-lavender">Travel inspiration</strong> and destination-specific promotional offers
            </span>
          </li>
          <li className="flex items-start">
            <Dot className="text-lavender relative right-2" />
            <span>
              <strong className="text-lavender">Smart destination insights</strong> with AI-powered recommendations and
              comparisons
            </span>
          </li>
        </ul>

        <div className="mb-6 pt-6 max-w-lg mt-6 border-t">
          <p className="text-white font-medium text-sm">
            <strong>Don't have any travel emails yet?</strong> Send yourself a test flight confirmation to see Actioneer
            in action immediately!
          </p>
          <TestEmailButton category="travel" variant="primary" className="mt-4" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-8">
      <div className="space-y-8">
        {Object.entries(groupedTravelEmails).map(([dateString, travelsForDay]) => (
          <div key={dateString} className="space-y-2">
            {/* Date Header with Count */}
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold text-black">{formatDateLabel(dateString)}</h3>
              <div className="text-right">
                <div className="text-sm text-thunder">
                  {travelsForDay.length} travel {travelsForDay.length === 1 ? "email" : "emails"}
                </div>
              </div>
            </div>

            {/* Travel Email Cards Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {travelsForDay.map((travel: any) => (
                <TravelEmailCard key={travel.id} travel={travel} onExplore={onExploreDestination} />
              ))}
            </div>
          </div>
        ))}
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
