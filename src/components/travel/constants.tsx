// Helper functions for airport and currency mappings
export function getAirportFromCity(city: string): string {
  const cityToAirport: Record<string, string> = {
    "New York": "NYC",
    "Los Angeles": "LAX",
    Chicago: "CHI",
    Miami: "MIA",
    "San Francisco": "SFO",
    Boston: "BOS",
    Seattle: "SEA",
    Denver: "DEN",
    Atlanta: "ATL",
    Dallas: "DFW",
    London: "LON",
    Paris: "PAR",
    Tokyo: "TYO",
    Sydney: "SYD",
    Toronto: "YTO",
    // Add more as needed
  };

  return cityToAirport[city] || "NYC";
}

export function getCurrencyFromCountry(countryCode: string): string {
  const countryToCurrency: Record<string, string> = {
    US: "USD",
    GB: "GBP",
    CA: "CAD",
    AU: "AUD",
    JP: "JPY",
    FR: "EUR",
    DE: "EUR",
    IT: "EUR",
    ES: "EUR",
    NL: "EUR",
    // Add more as needed
  };

  return countryToCurrency[countryCode] || "USD";
}

// Fallback airport/city mappings for when API fails
export const fallbackAirportToCityMap: Record<string, string> = {
  // Major airports that don't match country codes
  NYC: "New York",
  LAX: "Los Angeles",
  CHI: "Chicago",
  MIA: "Miami",
  SFO: "San Francisco",
  BOS: "Boston",
  SEA: "Seattle",
  DEN: "Denver",
  ATL: "Atlanta",
  DFW: "Dallas",
  LAS: "Las Vegas",
  PHX: "Phoenix",
  LON: "London",
  PAR: "Paris",
  TYO: "Tokyo",
  SYD: "Sydney",
  YTO: "Toronto",
  BKK: "Bangkok",
  SIN: "Singapore",
  HKG: "Hong Kong",
  ICN: "Seoul",
  NRT: "Tokyo",
  KIX: "Osaka",
  PVG: "Shanghai",
  PEK: "Beijing",
  DEL: "New Delhi",
  BOM: "Mumbai",
  KUL: "Kuala Lumpur",
  CGK: "Jakarta",
  MNL: "Manila",
  // Additional airports that might not be in the API
  IST: "Istanbul",
  LHR: "London",
  CDG: "Paris",
  FRA: "Frankfurt",
  AMS: "Amsterdam",
  FCO: "Rome",
  MAD: "Madrid",
  BCN: "Barcelona",
  ZUR: "Zurich",
  VIE: "Vienna",
};

// Travel search schema for type safety and validation
export const travelSearchSchema = {
  destination: {
    parse: (value: string | undefined) => value,
    stringify: (value: string | undefined) => value,
  },
  origin: {
    parse: (value: string | undefined) => value,
    stringify: (value: string | undefined) => value,
  },
  travelers: {
    parse: (value: string | undefined) => (value ? Number(value) : undefined),
    stringify: (value: number | undefined) => value?.toString(),
  },
  messageId: {
    parse: (value: string | undefined) => value,
    stringify: (value: string | undefined) => value,
  },
  from: {
    parse: (value: string | undefined) => value,
    stringify: (value: string | undefined) => value,
  },
};
