import { PlaneIcon, ChevronDown } from "lucide-react";
import { Button } from "../ui/button";
import { TravelEmailCard } from "./TravelEmailCard";
import { TestEmailButton } from "../ui";

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
      <div className="bg-white rounded-xl shadow-lg border-2 border-jade/30 p-12 text-center mt-12">
        <PlaneIcon className="h-16 w-16 text-jade mx-auto mb-6" />
        <h3 className="text-2xl font-bold text-black mb-4">
          Ready for Takeoff? ✈️
        </h3>
        <p className="text-thunder text-lg mb-6 max-w-2xl mx-auto leading-relaxed">
          Your travel command center is ready to capture amazing deals! Once
          connected, we'll automatically organize travel promotional emails,
          destination deals, and travel inspiration from companies and tourism
          boards as they arrive.
        </p>

        <div className="bg-sandy border-2 border-gold/30 rounded-lg p-4 mb-6 max-w-lg mx-auto">
          <p className="text-thunder font-medium text-sm">
            🚀 <strong>Don't like waiting?</strong> Send yourself a test flight
            confirmation to see Actioneer in action immediately!
          </p>
        </div>

        <div className="bg-concrete rounded-lg p-6 mb-6 max-w-xl mx-auto border border-gray-light">
          <h4 className="text-lg font-semibold text-black mb-3">
            🎯 What You'll Get:
          </h4>
          <ul className="text-left text-thunder space-y-2">
            <li className="flex items-start">
              <span className="text-jade mr-2">✓</span>
              <span>
                <strong>Travel promotional emails</strong> and destination deals
                from travel companies
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-jade mr-2">✓</span>
              <span>
                <strong>Hotel and flight deals</strong> like "75% off NYC
                hotels" or "Flights to Tokyo $299"
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-jade mr-2">✓</span>
              <span>
                <strong>Travel inspiration</strong> and destination-specific
                promotional offers
              </span>
            </li>
            <li className="flex items-start">
              <span className="text-jade mr-2">✓</span>
              <span>
                <strong>Smart destination insights</strong> with AI-powered
                recommendations and comparisons
              </span>
            </li>
          </ul>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <div className="text-sm text-thunder bg-sandy border border-gold rounded-lg px-4 py-2 flex items-center">
            <span className="text-gold mr-2">💡</span>
            Pro tip: Email processing happens automatically in the background!
          </div>
          <TestEmailButton
            category="travel"
            variant="primary"
            size="md"
            className="bg-jade hover:bg-jade/90 text-white"
          />
        </div>
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
