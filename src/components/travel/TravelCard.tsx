import { TravelCardProps } from "./types";

// Helper component for individual travel cards
export function TravelCard({ item, type, userLocation }: TravelCardProps) {
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
          className="inline-flex items-center justify-center px-3 py-1.5 text-sm font-medium rounded-md transition-colors bg-heliotrope text-white hover:bg-heliotrope/90 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-heliotrope"
          onClick={handleBookingClick}
        >
          Book Now
        </a>
      </div>
    </div>
  );
}
