import { useQuery } from "@tanstack/react-query";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { Button } from "../ui/button";
import {
  MapPin,
  Star,
  Hotel,
  Camera,
  Loader2,
  ExternalLink,
  AlertCircle,
  Wifi,
  Car,
  Coffee,
  Utensils,
  Waves,
  Dumbbell,
  Building,
} from "lucide-react";
import { supabase } from "../../supabase/client";

interface TravelRecommendationsDialogProps {
  isOpen: boolean;
  onClose: () => void;
  destination: any; // Travel email object with destination info
}

interface RecommendationItem {
  id: string;
  name: string;
  type: "hotel" | "attraction" | "restaurant";
  description?: string;
  price?: {
    amount: string;
    currency: string;
    perNight?: boolean;
  };
  rating?: number;
  address?: string;
  coordinates?: {
    lat: number;
    lng: number;
  };
  category?: string;
  rank?: number;
  // Additional hotel-specific fields
  amenities?: string[];
  area?: string;
  chain?: string;
  starRating?: number;
  roomType?: string;
  cancellationPolicy?: string;
  bookingUrl?: string;
  imageUrl?: string;
  // Enhanced rating information from sentiments API
  sentimentScore?: number; // Overall sentiment score (0-100)
  reviewCount?: number; // Number of reviews
  overallRating?: number; // Computed overall rating
}

interface RecommendationsResponse {
  hotels: RecommendationItem[];
  attractions: RecommendationItem[];
  overview: string;
  destination: string;
  searchDate: string;
}

async function fetchTravelRecommendations(
  destination: string,
  travelers?: number
): Promise<RecommendationsResponse> {
  const { data, error } = await supabase.functions.invoke(
    "get-travel-recommendations",
    {
      body: {
        destination,
        travelers: travelers || 2,
      },
    }
  );

  if (error) {
    console.error("Error fetching recommendations:", error);
    throw new Error(error.message || "Failed to fetch recommendations");
  }

  return data;
}

// Helper function to get amenity icon
function getAmenityIcon(amenity: string) {
  const amenityLower = amenity.toLowerCase();
  if (amenityLower.includes("wifi") || amenityLower.includes("internet"))
    return Wifi;
  if (amenityLower.includes("parking") || amenityLower.includes("garage"))
    return Car;
  if (amenityLower.includes("restaurant") || amenityLower.includes("dining"))
    return Utensils;
  if (amenityLower.includes("pool") || amenityLower.includes("swimming"))
    return Waves;
  if (amenityLower.includes("gym") || amenityLower.includes("fitness"))
    return Dumbbell;
  if (amenityLower.includes("coffee") || amenityLower.includes("breakfast"))
    return Coffee;
  return Building;
}

// Helper function to clean HTML tags from text
function cleanHtmlFromText(text: string): string {
  return text
    .replace(/<[^>]*>/g, "") // Remove HTML tags
    .replace(/&nbsp;/g, " ") // Replace &nbsp; with space
    .replace(/&amp;/g, "&") // Replace &amp; with &
    .replace(/&lt;/g, "<") // Replace &lt; with <
    .replace(/&gt;/g, ">") // Replace &gt; with >
    .replace(/&quot;/g, '"') // Replace &quot; with "
    .replace(/&#39;/g, "'") // Replace &#39; with '
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim(); // Remove leading/trailing whitespace
}

function RecommendationCard({ item }: { item: RecommendationItem }) {
  const isHotel = item.type === "hotel";
  const Icon = isHotel ? Hotel : Camera;

  console.log({ item });

  return (
    <div className="border-2 border-concrete rounded-lg overflow-hidden hover:shadow-md transition-all duration-200">
      <div className="flex flex-col md:flex-row gap-8">
        {/* Image Section */}
        {item.imageUrl && (
          <div className="relative w-56 flex-shrink-0">
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover"
              onError={(e) => {
                // Hide image if it fails to load
                const target = e.target as HTMLImageElement;
                target.style.display = "none";
              }}
            />
            {item.type === "hotel" && item.starRating && (
              <div className="absolute top-2 left-2 bg-thunder/70 text-white px-2 py-1 rounded text-xs font-medium">
                {item.starRating} ⭐
              </div>
            )}
          </div>
        )}

        {/* Content Section */}
        <div className="flex-1 p-4 flex flex-col">
          {/* Main content that should expand */}
          <div className="flex-1">
            <div className="flex items-start justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon className="h-5 w-5 text-jade" />
                <div className="flex flex-col">
                  <h4 className="font-semibold text-gray-900 line-clamp-1">
                    {item.name}
                  </h4>
                  {isHotel && item.area && (
                    <span className="text-xs text-gray-500">{item.area}</span>
                  )}
                </div>
              </div>
              <div className="flex flex-col items-end gap-1">
                {item.rating && (
                  <div className="flex items-center gap-1 text-gold">
                    <Star className="h-4 w-4 fill-current" />
                    <span className="text-sm font-medium text-thunder">
                      {item.rating}/100
                      {item.reviewCount && (
                        <span className="text-xs text-gray ml-1">
                          ({item.reviewCount} reviews)
                        </span>
                      )}
                    </span>
                  </div>
                )}
                {isHotel && item.sentimentScore && item.sentimentScore > 0 && (
                  <div className="text-xs text-gray-600">
                    Sentiment: {item.sentimentScore}%
                  </div>
                )}
              </div>
            </div>

            {/* Hotel-specific info */}
            {isHotel && (item.chain || item.roomType) && (
              <div className="flex flex-wrap gap-2 mb-2">
                {item.roomType && (
                  <span className="py-1 px-2 [&:first-child]:pl-0 text-gray text-xs font-medium">
                    {item.roomType}
                  </span>
                )}
              </div>
            )}

            {item.description && (
              <p className="text-sm text-thunder mb-2 line-clamp-2">
                {cleanHtmlFromText(item.description)}
              </p>
            )}

            {/* Amenities for hotels */}
            {isHotel && item.amenities && item.amenities.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-2">
                {item.amenities.slice(0, 3).map((amenity, index) => {
                  const AmenityIcon = getAmenityIcon(amenity);
                  return (
                    <div
                      key={index}
                      className="flex items-center gap-1 text-xs text-thunder"
                    >
                      <AmenityIcon className="h-3 w-3" />
                      <span className="truncate max-w-20">{amenity}</span>
                    </div>
                  );
                })}
                {item.amenities.length > 3 && (
                  <span className="text-xs text-thunder">
                    +{item.amenities.length - 3} more
                  </span>
                )}
              </div>
            )}

            {item.address && (
              <div className="flex items-center gap-1 text-sm text-thunder mb-2">
                <MapPin className="h-3 w-3" />
                <span className="line-clamp-1">{item.address}</span>
              </div>
            )}

            {item.category && !isHotel && (
              <div className="inline-block px-2 py-1 bg-jade/20 text-jade text-xs font-medium rounded-full mb-2">
                {item.category}
              </div>
            )}
          </div>

          {/* Price and booking section - always at bottom */}
          <div className="flex items-center justify-between mt-3">
            {item.price ? (
              <div className="flex flex-col">
                <div className="flex items-center gap-1 text-green-600">
                  {/* <DollarSign className="h-4 w-4" /> */}
                  <span className="font-semibold">
                    {item.price.currency} {item.price.amount}
                    {item.price.perNight && (
                      <span className="text-sm">/night</span>
                    )}
                  </span>
                </div>
                {isHotel && item.cancellationPolicy && (
                  <span className="text-xs text-gray-500 capitalize">
                    {item.cancellationPolicy.replace("_", " ")} cancellation
                  </span>
                )}
              </div>
            ) : (
              <div className="text-thunder text-sm">Price on request</div>
            )}

            <Button
              variant="outline"
              size="sm"
              className="text-xs"
              onClick={() => {
                if (item.bookingUrl) {
                  window.open(item.bookingUrl, "_blank");
                }
              }}
            >
              <ExternalLink className="h-3 w-3 mr-1" />
              {isHotel ? "Book Now" : "View Details"}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

function LoadingSkeleton() {
  return (
    <div className="space-y-4">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="border border-concrete rounded-lg p-4">
          <div className="animate-pulse">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <div className="h-5 w-5 bg-concrete rounded"></div>
                <div className="h-4 w-32 bg-concrete rounded"></div>
              </div>
              <div className="h-4 w-12 bg-concrete rounded"></div>
            </div>
            <div className="h-3 w-full bg-concrete rounded mb-2"></div>
            <div className="h-3 w-24 bg-concrete rounded mb-2"></div>
            <div className="flex justify-between">
              <div className="h-4 w-16 bg-concrete rounded"></div>
              <div className="h-6 w-20 bg-concrete rounded"></div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

export function TravelRecommendationsDialog({
  isOpen,
  onClose,
  destination,
}: TravelRecommendationsDialogProps) {
  const destinationName =
    destination?.details?.origin || destination?.subject || "Unknown";
  const travelers = destination?.details?.travelers || 2;

  const {
    data: recommendations,
    isLoading,
    error,
  } = useQuery({
    queryKey: ["travel-recommendations", destinationName, travelers],
    queryFn: () => fetchTravelRecommendations(destinationName, travelers),
    enabled: isOpen && !!destinationName,
    staleTime: 10 * 60 * 1000, // 10 minutes
    gcTime: 10 * 60 * 1000, // 10 minutes
    retry: 1,
  });

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-shrink-0">
          <DialogTitle className="flex items-center gap-2">
            <MapPin className="h-5 w-5 text-jade" />
            Explore {destinationName}
          </DialogTitle>
          <DialogDescription>
            Planning for {travelers} travelers • Next 7 days
          </DialogDescription>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto">
          {isLoading && (
            <div className="space-y-6">
              <div className="flex items-center gap-2 text-thunder">
                <Loader2 className="h-4 w-4 animate-spin" />
                Finding the best hotels and attractions...
              </div>
              <LoadingSkeleton />
            </div>
          )}

          {error && (
            <div className="flex items-center gap-2 text-bittersweet bg-bittersweet/10 p-4 rounded-lg">
              <AlertCircle className="h-5 w-5" />
              <div>
                <p className="font-medium">Failed to load recommendations</p>
                <p className="text-sm">{error.message}</p>
              </div>
            </div>
          )}

          {recommendations && (
            <div className="space-y-12">
              {recommendations.overview && (
                <p className="text-thunder">{recommendations.overview}</p>
              )}

              {/* Hotels Section */}
              {recommendations.hotels.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Hotel className="h-5 w-5 text-jade" />
                    <h3 className="text-lg font-semibold">
                      Hotels ({recommendations.hotels.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    {recommendations.hotels.map((hotel) => (
                      <RecommendationCard key={hotel.id} item={hotel} />
                    ))}
                  </div>
                </div>
              )}

              {/* Attractions Section */}
              {recommendations.attractions.length > 0 && (
                <div>
                  <div className="flex items-center gap-2 mb-4">
                    <Camera className="h-5 w-5 text-jade" />
                    <h3 className="text-lg font-semibold">
                      Attractions ({recommendations.attractions.length})
                    </h3>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                    {recommendations.attractions.map((attraction) => (
                      <RecommendationCard
                        key={attraction.id}
                        item={attraction}
                      />
                    ))}
                  </div>
                </div>
              )}

              {recommendations.hotels.length === 0 &&
                recommendations.attractions.length === 0 && (
                  <div className="text-center py-8 text-thunder">
                    <Camera className="h-12 w-12 mx-auto mb-4 text-jade/20" />
                    <p>No recommendations found for this destination.</p>
                    <p className="text-sm">
                      Try searching for a more specific location.
                    </p>
                  </div>
                )}
            </div>
          )}
        </div>

        <div className="flex-shrink-0 flex justify-end pt-4">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
