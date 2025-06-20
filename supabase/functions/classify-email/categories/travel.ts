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
    /flight\s+(?:deal|sale|offer)/i,
    /airfare\s+(?:deal|discount|sale)/i,
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
    /hotel\s+(?:deal|sale|offer|discount)/i,
    /accommodation\s+(?:deal|sale|offer)/i,
  ],

  attractions: [
    /attraction\s+(?:booking|ticket|confirmation)/i,
    /tour\s+(?:booking|confirmation|reservation)/i,
    /activity\s+(?:booking|confirmation|ticket)/i,
    /museum\s+(?:ticket|booking|pass)/i,
    /theme\s+park\s+(?:ticket|pass)/i,
    /sightseeing\s+(?:tour|pass|ticket)/i,
    /excursion\s+(?:booking|confirmation)/i,
    /experience\s+(?:booking|ticket)/i,
    /getyourguide/i,
    /viator/i,
    /klook/i,
    /activity\s+(?:deal|discount|offer)/i,
    /tour\s+(?:deal|discount|offer)/i,
  ],

  // Travel promotional and destination patterns
  promotional: [
    /(?:vacation|holiday|trip|travel|adventure|getaway)\s+(?:deal|sale|offer|discount|promotion)/i,
    /\b(?:50%|30%|25%|20%)\s*(?:off|discount|save)/i,
    /limited\s+time\s+(?:offer|deal|sale)/i,
    /book\s+now\s+(?:and\s+save|for\s+less)/i,
    /special\s+(?:offer|promotion|deal|rate)/i,
    /flash\s+(?:sale|deal)/i,
    /weekend\s+(?:getaway|deal|sale)/i,
    /last\s+minute\s+(?:deal|booking|offer)/i,
    /early\s+bird\s+(?:discount|offer|special)/i,
  ],

  // Destination and trip patterns
  destinations: [
    /(?:trip|travel|adventure|vacation|holiday|getaway)\s+to\s+[\w\s]+/i,
    /your\s+(?:next|upcoming)\s+(?:trip|adventure|vacation|getaway)/i,
    /explore\s+[\w\s]+(?:city|country|destination)/i,
    /discover\s+[\w\s]+(?:city|country|destination)/i,
    /visit\s+[\w\s]+(?:city|country|destination)/i,
    /🧳.*(?:adventure|trip|vacation|travel)/i,
    /✈️.*(?:adventure|trip|vacation|travel)/i,
    /🏨.*(?:stay|hotel|accommodation)/i,
    /🎯.*(?:attraction|activity|tour)/i,
    /(?:asia|europe|america|africa|oceania)\s+(?:trip|adventure|tour)/i,
    /(?:tokyo|kyoto|hong\s+kong|singapore|bangkok|seoul|paris|london|rome|new\s+york|los\s+angeles)\s+(?:trip|adventure|vacation|getaway)/i,
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
    /travel\s+(?:package|bundle|combo)/i,
    /holiday\s+(?:package|booking|deal)/i,
  ],

  // Transportation patterns
  transportation: [
    /car\s+rental\s+(?:confirmation|booking|receipt)/i,
    /rental\s+car\s+(?:confirmation|booking)/i,
    /uber\s+(?:receipt|trip)/i,
    /lyft\s+(?:receipt|trip)/i,
    /taxi\s+(?:receipt|booking)/i,
    /train\s+(?:ticket|booking|confirmation)/i,
    /bus\s+(?:ticket|booking|confirmation)/i,
    /ferry\s+(?:ticket|booking)/i,
    /transfer\s+(?:booking|confirmation)/i,
    /transportation\s+(?:booking|arrangement)/i,
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
    /getyourguide/i,
    /viator/i,
    /klook/i,
    /agoda/i,
    /travelocity/i,
    /orbitz/i,
  ],
};

export function buildTravelPrompt(emailData: EmailData): string {
  return `
    Analyze this email to determine if it's related to travel, including bookings, promotions, or trip planning.
    
    TRAVEL EMAIL TYPES TO INCLUDE:
    - Flight bookings, confirmations, boarding passes, check-in reminders
    - Hotel/accommodation reservations and confirmations  
    - Activity/attraction bookings and tickets
    - Car rental bookings and confirmations
    - Travel itineraries and trip summaries
    - Transportation receipts (Uber, taxi, train, bus)
    - Travel insurance confirmations
    - Visa/passport related communications
    - Travel promotional emails and deals
    - Destination-specific travel content
    - Trip planning and inspiration emails
    
    INCLUDE PROMOTIONAL CONTENT IF:
    - It's from known travel companies/OTAs
    - Contains destination names + travel keywords
    - Has discount/sale language + travel context
    - Mentions specific cities/countries with travel intent
    
    EXCLUDE ONLY:
    - General newsletters without specific travel offers
    - Non-travel booking confirmations
    - Emails with no travel context
    
    Email Subject: ${emailData.subject}
    From: ${emailData.from}
    Email Body: ${emailData.body.substring(0, 1500)}
    
    Respond with JSON: { "isMatch": boolean, "confidence": 0-1, "reasoning": "explanation", "travelType": "comprehensive" }
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

  const hasAttractionPattern = TRAVEL_PATTERNS.attractions.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasTransportationPattern = TRAVEL_PATTERNS.transportation.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasGeneralTravelPattern = TRAVEL_PATTERNS.general.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasPromotionalPattern = TRAVEL_PATTERNS.promotional.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasDestinationPattern = TRAVEL_PATTERNS.destinations.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  // Determine confidence based on pattern strength
  let confidence = 0;
  let travelType = "comprehensive"; // Always use comprehensive now

  // High confidence patterns (specific bookings/confirmations)
  if (hasFlightPattern || hasHotelPattern || hasAttractionPattern) {
    confidence = 0.9;
  }
  // Medium-high confidence (transportation, general travel)
  else if (hasTransportationPattern || hasGeneralTravelPattern) {
    confidence = 0.8;
  }
  // Medium confidence (promotional + travel context)
  else if (
    hasPromotionalPattern &&
    (hasDestinationPattern || isFromTravelDomain)
  ) {
    confidence = 0.75;
  }
  // Medium confidence (destination-specific content)
  else if (hasDestinationPattern) {
    confidence = 0.7;
  }
  // Lower confidence (travel domain with booking context)
  else if (
    isFromTravelDomain &&
    (bodyLower.includes("booking") ||
      bodyLower.includes("reservation") ||
      bodyLower.includes("travel") ||
      bodyLower.includes("trip"))
  ) {
    confidence = 0.65;
  }

  if (confidence > 0.6) {
    return {
      type: "travel",
      confidence,
      actions: getTravelActions(),
      method: "pattern-based",
      reasoning: `Detected comprehensive travel email with confidence ${confidence}`,
    };
  }

  return null;
}

function getTravelActions(): Action[] {
  return [
    {
      type: "complex" as const,
      label: "Get Travel Recommendations",
      handler: "openTravelDashboard",
      data: { travelType: "comprehensive" },
    },
    {
      type: "simple" as const,
      label: "Add to Travel Plans",
      handler: "addTravelToCalendar",
      data: { travelType: "comprehensive" },
    },
    {
      type: "complex" as const,
      label: "Compare Prices",
      handler: "compareTravelPrices",
      data: { travelType: "comprehensive" },
    },
  ];
}
