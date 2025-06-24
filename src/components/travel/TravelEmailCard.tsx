import { TravelEmailCardProps } from "./types";
import { FormattedDestination } from "./DestinationFormatter";

// Helper component for travel email cards
export function TravelEmailCard({
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
      flight: "bg-gold/20 text-thunder",
      hotel: "bg-jade/20 text-jade",
      attraction: "bg-gold/20 text-gold",
      general: "bg-lime/20 text-thunder",
    };
    return colors[type as keyof typeof colors] || "bg-lime text-thunder";
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
          ? "bg-concrete/50 border-gray-light shadow-sm hover:bg-concrete/80"
          : "border-transparent hover:bg-concrete hover:border-gray-light"
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
              <p className="text-xs text-thunder truncate">
                {getAdditionalInfo()}
              </p>
            )}
          </div>
        </div>

        <div className="flex flex-col items-end text-right ml-4">
          <div className="text-xs text-bittersweet mb-1">Analyzed</div>
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
