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
  travel: any; // Using any for now since we don't have full type definition
  onSelect: (travel: any) => void;
  isSelected?: boolean;
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
