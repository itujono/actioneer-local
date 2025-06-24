import { useQuery } from "@tanstack/react-query";
import { AirportData, FormattedDestinationProps } from "./types";
import { fallbackAirportToCityMap } from "./constants";

// Hook to get airport information from API
export function useAirportInfo(airportCode: string) {
  return useQuery({
    queryKey: ["airport-info", airportCode],
    queryFn: async (): Promise<AirportData | null> => {
      // API Ninjas requires an API key, but we can use a fallback approach
      // For now, let's use a free alternative - the GitHub airports database
      try {
        const response = await fetch(
          `https://raw.githubusercontent.com/lxndrblz/Airports/main/airports.csv`
        );

        if (!response.ok) {
          throw new Error("Failed to fetch airports database");
        }

        const csvData = await response.text();
        const lines = csvData.split("\n");
        const headers = lines[0].split(",");

        // Find the airport by IATA code
        for (let i = 1; i < lines.length; i++) {
          const values = lines[i].split(",");
          const airport: Record<string, string> = {};
          headers.forEach((header, index) => {
            airport[header.replace(/"/g, "")] =
              values[index]?.replace(/"/g, "") || "";
          });

          if (airport["iata_code"] === airportCode.toUpperCase()) {
            return {
              iata: airport["iata_code"],
              icao: airport["icao_code"],
              name: airport["name"],
              city: airport["municipality"] || airport["name"],
              country: airport["iso_country"],
            };
          }
        }

        // If not found, return null to trigger fallback
        return null;
      } catch (error) {
        console.log(
          `⚠️ Failed to fetch airport info for ${airportCode}:`,
          error
        );
        return null;
      }
    },
    staleTime: 1000 * 60 * 60 * 24 * 7, // 7 days - airport data rarely changes
    gcTime: 1000 * 60 * 60 * 24 * 30, // Keep in cache for 30 days
    enabled: !!airportCode && airportCode.length === 3,
    retry: false, // Don't retry on failure, use fallback instead
  });
}

// TanStack Query hook to format destination names
export function useFormattedDestination(destination: string) {
  console.log(`🔍 Starting format for: "${destination}"`);

  // First try to get airport info if it looks like an airport code
  const { data: airportInfo, isLoading: airportLoading } =
    useAirportInfo(destination);

  console.log(`✈️ Airport info for "${destination}":`, {
    airportInfo,
    airportLoading,
  });

  const { data: formattedName, isLoading: formatLoading } = useQuery({
    queryKey: ["destination-format", destination],
    queryFn: async () => {
      console.log(`🏃 Running format query for: "${destination}"`);

      // If it's already a proper city/country name (not a 3-letter code), return as-is
      if (
        destination.length > 3 ||
        !/^[A-Z]{3}$/.test(destination.toUpperCase())
      ) {
        console.log(`📝 "${destination}" is already a proper name`);
        return destination;
      }

      // If we have airport info, use the city from airport data
      if (airportInfo?.city) {
        console.log(`✈️ Using airport city: "${airportInfo.city}"`);
        return airportInfo.city;
      }

      try {
        // First, check if it's a known airport code in our fallback mapping
        console.log(`🗺️ Trying fallback mapping for: "${destination}"`);
        const cityName = fallbackAirportToCityMap[destination.toUpperCase()];
        if (cityName) {
          console.log(`🗺️ Found in fallback: "${cityName}"`);
          return cityName;
        }

        // If not in airport mapping, try to get country name by alpha3 code
        console.log(`🌍 Trying country API for: "${destination}"`);
        const countryResponse = await fetch(
          `https://restcountries.com/v3.1/alpha/${destination.toLowerCase()}`
        );

        if (countryResponse.ok) {
          const countryData = await countryResponse.json();
          if (
            countryData &&
            countryData[0] &&
            countryData[0].name &&
            countryData[0].name.common
          ) {
            console.log(`🌍 Found country: "${countryData[0].name.common}"`);
            return countryData[0].name.common;
          }
        }

        // If no mapping found, return original
        console.log(`❌ No mapping found for: "${destination}"`);
        return destination;
      } catch (error) {
        console.log(
          `⚠️ Failed to resolve destination "${destination}":`,
          error
        );
        // Fallback to original destination on error
        return destination;
      }
    },
    staleTime: 1000 * 60 * 60 * 24, // 24 hours - destination names don't change often
    gcTime: 1000 * 60 * 60 * 24 * 7, // Keep in cache for 7 days
    enabled: !!destination && !airportInfo?.city, // Only run if destination exists and we don't have airport info
  });

  const result = airportInfo?.city || formattedName || destination;
  console.log(`🎯 Final result for "${destination}": "${result}"`);

  // Return airport city if available, otherwise formatted name, otherwise original
  return result;
}

// Component to display formatted destination
export function FormattedDestination({
  destination,
}: FormattedDestinationProps) {
  const formattedName = useFormattedDestination(destination);

  // Debug formatting
  if (destination !== formattedName) {
    console.log(`🗺️ Formatted "${destination}" → "${formattedName}"`);
  }

  return <>{formattedName}</>;
}
