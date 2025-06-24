import { TravelSectionProps } from "./types";
import { TravelCard } from "./TravelCard";

// Helper component for travel sections
export function TravelSection({
  title,
  subtitle,
  items,
  type,
  userLocation,
}: TravelSectionProps) {
  return (
    <div className="bg-white rounded-md border-2 border-gray-light">
      <div className="px-6 py-4 border-b border-gray-light">
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
