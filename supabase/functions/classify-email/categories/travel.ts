// Travel Classification Module
import type { EmailData, Classification, Action } from "../types.ts";

export const TRAVEL_PATTERNS = {
  // Core travel patterns
  flights: [
    /flight\s+(?:confirmation|booking|itinerary|ticket|receipt)/i,
    /boarding\s+pass/i,
    /e-ticket/i,
    /airline\s+(?:confirmation|booking)/i,
    /check-in\s+(?:reminder|now\s+available|opens)/i,
    /gate\s+(?:change|assignment)/i,
    /departure\s+(?:reminder|update)/i,
    /seat\s+(?:assignment|selection)/i,
    /baggage\s+(?:allowance|policy)/i,
  ],

  hotels: [
    /hotel\s+(?:confirmation|booking|reservation|receipt)/i,
    /accommodation\s+(?:confirmation|booking)/i,
    /room\s+(?:confirmation|booking|reservation)/i,
    /check-in\s+(?:instructions|details|time)/i,
    /check-out\s+(?:reminder|time)/i,
    /reservation\s+(?:confirmation|details|summary)/i,
    /booking\.com/i,
    /hotels\.com/i,
    /expedia/i,
    /airbnb/i,
  ],

  transportation: [
    /car\s+rental\s+(?:confirmation|booking|receipt)/i,
    /rental\s+car\s+(?:confirmation|booking)/i,
    /uber\s+(?:receipt|trip)/i,
    /lyft\s+(?:receipt|trip)/i,
    /taxi\s+(?:receipt|booking)/i,
    /train\s+(?:ticket|booking|confirmation)/i,
    /bus\s+(?:ticket|booking|confirmation)/i,
    /ferry\s+(?:ticket|booking)/i,
  ],

  general: [
    /travel\s+(?:itinerary|confirmation|booking|receipt)/i,
    /trip\s+(?:confirmation|itinerary|summary)/i,
    /vacation\s+(?:booking|confirmation)/i,
    /booking\s+confirmation.*(?:flight|hotel|car|rental|travel)/i,
    /itinerary.*(?:flight|hotel|trip|travel)/i,
    /travel\s+insurance/i,
    /visa\s+(?:application|confirmation|approval)/i,
    /passport\s+(?:renewal|application)/i,
  ],

  // Travel-related domains
  domains: [
    /booking\.com/i,
    /expedia/i,
    /priceline/i,
    /kayak/i,
    /tripadvisor/i,
    /hotels\.com/i,
    /airbnb/i,
    /vrbo/i,
    /delta\.com/i,
    /united\.com/i,
    /american\.com/i,
    /southwest\.com/i,
    /jetblue/i,
    /emirates/i,
    /lufthansa/i,
    /hertz/i,
    /avis/i,
    /enterprise/i,
    /budget/i,
  ],
};

export function buildTravelPrompt(emailData: EmailData): string {
  return `
    Analyze this email to determine if it's related to travel bookings, confirmations, or trip management.
    
    TRAVEL EMAIL TYPES:
    - Flight bookings, confirmations, boarding passes, check-in reminders
    - Hotel/accommodation reservations and confirmations
    - Car rental bookings and confirmations
    - Travel itineraries and trip summaries
    - Transportation receipts (Uber, taxi, train, bus)
    - Travel insurance confirmations
    - Visa/passport related communications
    
    EXCLUDE:
    - General promotional emails from travel companies
    - Travel newsletters or deals
    - Unrelated booking confirmations (not travel)
    
    Email Subject: ${emailData.subject}
    From: ${emailData.from}
    Email Body: ${emailData.body.substring(0, 1500)}
    
    Respond with JSON: { "isMatch": boolean, "confidence": 0-1, "reasoning": "explanation", "travelType": "flight|hotel|car|general" }
  `;
}

export function classifyTravel(emailData: EmailData): Classification | null {
  const subjectLower = emailData.subject.toLowerCase();
  const fromLower = emailData.from.toLowerCase();
  const bodyLower = emailData.body.toLowerCase();

  // Check for travel domains
  const isFromTravelDomain = TRAVEL_PATTERNS.domains.some((pattern) =>
    pattern.test(fromLower)
  );

  // Check for specific travel patterns
  const hasFlightPattern = TRAVEL_PATTERNS.flights.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasHotelPattern = TRAVEL_PATTERNS.hotels.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasTransportationPattern = TRAVEL_PATTERNS.transportation.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasGeneralTravelPattern = TRAVEL_PATTERNS.general.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  // Determine confidence based on pattern strength
  let confidence = 0;
  let travelType = "general";

  if (hasFlightPattern) {
    confidence = 0.9;
    travelType = "flight";
  } else if (hasHotelPattern) {
    confidence = 0.85;
    travelType = "hotel";
  } else if (hasTransportationPattern) {
    confidence = 0.8;
    travelType = "transportation";
  } else if (hasGeneralTravelPattern) {
    confidence = 0.75;
    travelType = "general";
  } else if (
    isFromTravelDomain &&
    (bodyLower.includes("booking") || bodyLower.includes("reservation"))
  ) {
    confidence = 0.7;
    travelType = "general";
  }

  if (confidence > 0.6) {
    return {
      type: "travel",
      confidence,
      actions: getTravelActions(travelType),
      method: "pattern-based",
      reasoning: `Detected ${travelType} travel email with confidence ${confidence}`,
    };
  }

  return null;
}

function getTravelActions(travelType: string): Action[] {
  const baseActions: Action[] = [
    {
      type: "complex" as const,
      label: "View Travel Dashboard",
      handler: "openTravelDashboard",
      data: { travelType },
    },
    {
      type: "simple" as const,
      label: "Add to Calendar",
      handler: "addTravelToCalendar",
      data: { travelType },
    },
  ];

  // Add specific actions based on travel type
  switch (travelType) {
    case "flight":
      baseActions.push({
        type: "simple" as const,
        label: "Check Flight Status",
        handler: "checkFlightStatus",
        data: {},
      });
      break;
    case "hotel":
      baseActions.push({
        type: "complex" as const,
        label: "Compare Hotel Prices",
        handler: "compareHotelPrices",
        data: {},
      });
      break;
    case "transportation":
      baseActions.push({
        type: "simple" as const,
        label: "Track Expense",
        handler: "trackTransportExpense",
        data: {},
      });
      break;
  }

  return baseActions;
}
