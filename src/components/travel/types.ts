export interface LocationInfo {
  city?: string;
  country?: string;
  countryCode?: string;
  airport: string;
  currency: string;
}

export interface TravelData {
  destination: string;
  origin: string;
  travelers: number;
  departureDate?: string;
  returnDate?: string;
  checkInDate?: string;
  checkOutDate?: string;
}

export interface TravelSearchParams {
  destination?: string;
  origin?: string;
  travelers?: number;
  messageId?: string;
  from?: string;
}

export interface TravelEmailCardProps {
  travel: any;
  onExplore: (travel: any) => void;
}

export interface TravelEmailsListProps {
  isLoading: boolean;
  groupedTravelEmails: Record<string, any[]>;
  hasNextPage?: boolean;
  isFetchingNextPage?: boolean;
  onLoadMore?: () => void;
  onExploreDestination: (travel: any) => void;
}

export interface TravelStatsProps {
  travelEmails?: any[];
  isLoading: boolean;
}

export interface AirportData {
  iata: string;
  icao: string;
  name: string;
  city: string;
  country: string;
}

export interface TravelSectionProps {
  title: string;
  subtitle: string;
  items: any[];
  type: "flight" | "hotel" | "attraction";
  userLocation?: LocationInfo | null;
}

export interface TravelCardProps {
  item: any;
  type: "flight" | "hotel" | "attraction";
  userLocation?: LocationInfo | null;
}

export interface TravelSectionSkeletonProps {
  title: string;
  subtitle: string;
}

export interface FormattedDestinationProps {
  destination: string;
}

export interface RecommendationItem {
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
  imageUrl?: string;
  bookingUrl?: string;
  category?: string;
  rank?: number;
  // Additional hotel-specific fields
  amenities?: string[];
  area?: string;
  chain?: string;
  starRating?: number;
  roomType?: string;
  cancellationPolicy?: string;
}
