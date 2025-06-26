import { Button } from "../ui/button";

export interface TravelEmailCardProps {
  travel: any;
  onExplore: (travel: any) => void;
}

// Helper function to truncate text to 3 lines
const truncateText = (text: string, maxLength: number = 120): string => {
  if (text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
};

// Helper function to extract destination from travel data
const getDestination = (travel: any): string => {
  return travel.destination || "Unknown Destination";
};

export function TravelEmailCard({ travel, onExplore }: TravelEmailCardProps) {
  // Use the email subject as the description
  const description = travel.subject || travel.email_subject || "Travel email";
  const destination = getDestination(travel);
  const emailDate = new Date(travel.created_at).toLocaleDateString();

  return (
    <div className="bg-white rounded-xl border-concrete border-2 p-6 hover:shadow-lg transition-all duration-200">
      {/* Travel Email Content */}
      <div className="space-y-4">
        {/* Email Subject/Description - truncated to 3 lines */}
        <div>
          <p className="text-black text-sm leading-relaxed">
            {truncateText(description)}
          </p>
        </div>

        {/* Email Date */}
        <div className="flex items-center text-xs text-thunder">
          <span>📅 {emailDate}</span>
        </div>

        {/* Action Button */}
        <div className="pt-2">
          <Button
            onClick={() => onExplore(travel)}
            variant="outline"
            size="sm"
            className="w-full text-sm font-medium hover:bg-concrete/50 transition-colors"
          >
            Explore {destination}
          </Button>
        </div>
      </div>
    </div>
  );
}
