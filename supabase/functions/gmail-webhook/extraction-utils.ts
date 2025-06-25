import {
  COUNTRY_MAPPING,
  TLD_TO_COUNTRY,
  COUNTRY_NAMES,
  COMMON_SERVICES,
  COMMON_EMAIL_PROVIDERS,
  VALID_STATUSES,
} from "./constants.ts";

export function extractCompanyFromEmail(from: string): string | null {
  // Extract company from email domain
  const emailMatch = from.match(/@([^.]+)/);
  if (emailMatch && emailMatch[1]) {
    const domain = emailMatch[1];
    // Skip common email providers
    if (!COMMON_EMAIL_PROVIDERS.includes(domain.toLowerCase())) {
      return domain.charAt(0).toUpperCase() + domain.slice(1);
    }
  }
  return null;
}

export function extractCompanyFromText(text: string): string | null {
  const companyPatterns = [
    // Match "at Company Name" format (very common in job emails) - with better boundaries
    /(?:role|position)\s+at\s+([A-Za-z\s&'.,-]+?)(?:\s+(?:hi|hello|dear|team|careers|hr|\n|$))/i,
    // Match "Role at Company Name" format - with better boundaries
    /\w+\s+(?:role|position|developer|engineer|manager|analyst|specialist)\s+at\s+([A-Za-z\s&'.,-]+?)(?:\s+(?:hi|hello|dear|team|careers|hr|\n|$))/i,
    // Match "Company Name" at end of subject after dash
    /-\s*([A-Za-z\s&'.,-]+)\s*$/i,
    // Match "from Company Name team"
    /from\s+([A-Za-z\s&'.,-]+)(?:\s+team|\s+careers|\s+hr)/i,
    // Match "at Company Name" (general) - with better boundaries
    /\bat\s+([A-Za-z\s&'.,-]+?)(?:\s+(?:hi|hello|dear|team|careers|hr|and|\.|\n|$))/i,
    // Match "Company Name team"
    /([A-Za-z\s&'.,-]+)\s+team/i,
    // Match "Company Name careers"
    /([A-Za-z\s&'.,-]+)\s+careers/i,
    // Match "Company Name hiring"
    /([A-Za-z\s&'.,-]+)\s+hiring/i,
    // Match company name before "and your interest"
    /to\s+the\s+([^,\n\.]+)\s+and\s+your\s+interest/i,
    // Match "Best Regards, Company Name"
    /best\s+regards,\s*([A-Za-z\s&'.,-]+)/i,
  ];

  for (const pattern of companyPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      let company = match[1].trim();

      // Clean up common trailing words and greetings
      company = company.replace(
        /\s+(team|careers|hr|hiring|department|hi|hello|dear)$/i,
        ""
      );

      // Filter out common non-company words and ensure reasonable length
      const skipWords = [
        "position",
        "role",
        "application",
        "job",
        "opportunity",
        "opening",
        "the team",
        "our team",
        "team",
        "careers",
        "hr",
        "hiring",
        "department",
        "hi",
        "hello",
        "dear",
      ];

      if (
        !skipWords.some(
          (word) => company.toLowerCase() === word.toLowerCase()
        ) &&
        company.length > 1 &&
        company.length < 50
      ) {
        // Add max length check
        return company;
      }
    }
  }
  return null;
}

export function extractCountryFromEmail(from: string): string | null {
  // Extract country from email domain TLD
  const tldMatch = from.match(/\.([a-zA-Z]{2})$/);
  if (tldMatch && tldMatch[1]) {
    const tld = tldMatch[1].toLowerCase();
    return TLD_TO_COUNTRY[tld] || null;
  }

  // Check for .co.uk pattern specifically
  if (from.includes(".co.uk")) {
    return "GB";
  }

  return null;
}

export function extractCountryFromEmailBody(emailBody: string): string | null {
  // Extract country from email body content (signatures, addresses, etc.)
  const text = emailBody.toLowerCase();

  // Patterns to look for country mentions
  const countryPatterns = [
    // Location pin emoji followed by location
    /📍\s*[^,\n]*,\s*([^,\n]+)/g,
    // Based in pattern
    /based\s+in\s+([^,\n\.]+)/gi,
    // Location patterns
    /location[:\s]+([^,\n\.]+)/gi,
    // Address patterns (City, Country)
    /,\s*([^,\n]{4,25})(?:\s|$)/g,
    // Office in pattern
    /office\s+in\s+([^,\n\.]+)/gi,
  ];

  for (const pattern of countryPatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      if (match[1]) {
        const location = match[1].trim().toLowerCase();

        // Check if the extracted location matches any country
        for (const [countryName, countryCode] of Object.entries(
          COUNTRY_MAPPING
        )) {
          if (location.includes(countryName)) {
            console.log(
              `🌍 Found country from email body: ${location} → ${countryCode}`
            );
            return countryCode;
          }
        }
      }
    }
  }

  return null;
}

export function getCountryName(countryCode: string): string | null {
  return COUNTRY_NAMES[countryCode.toUpperCase()] || null;
}

export function extractPositionFromText(text: string): string | null {
  const positionPatterns = [
    // Match "Position Role at Company" format (very common)
    /(?:for\s+)?([A-Za-z\s]+(?:Developer|Engineer|Manager|Analyst|Specialist|Designer|Coordinator|Director|Lead|Senior|Junior|Principal)(?:\s+Role|\s+Position)?)\s+at\s+[A-Za-z\s&'.,-]+/i,
    // Match "Final Step for Name - Position Role"
    /final\s+step\s+for\s+\w+\s*-\s*([A-Za-z\s]+(?:Developer|Engineer|Manager|Analyst|Specialist|Designer|Coordinator|Director|Lead|Senior|Junior|Principal)(?:\s+Role|\s+Position)?)/i,
    // Match "Position (Details) - Company" format
    /to\s+the\s+([^,\n\-]+?)(?:\s*\([^)]*\))?\s*-\s*[A-Za-z\s&]+\s+and/i,
    // Match "for the Position position"
    /for\s+the\s+([^,\n\.]+)\s+(?:position|role)/i,
    // Match "as a/an Position"
    /as\s+(?:a|an)\s+([^,\n\.]+)/i,
    // Match "Position:" format
    /(?:position|role):\s*([^,\n\.]+)/i,
    // Match "applying for Position"
    /applying\s+for\s+([^,\n\.]+)/i,
    // Match "application to the Position"
    /application\s+to\s+the\s+([^,\n\.]+)/i,
    // Match common job titles anywhere in text
    /((?:Senior|Junior|Lead|Principal|Associate|Staff)\s+)?(?:Software\s+)?(?:Developer|Engineer|Manager|Analyst|Specialist|Designer|Coordinator|Director|Architect|Consultant)(?:\s+(?:Role|Position))?/i,
  ];

  for (const pattern of positionPatterns) {
    const match = text.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      let position = match[1].trim();

      // Clean up the position text
      position = position
        .replace(/\s*\([^)]*\)\s*/g, "") // Remove parenthetical content
        .replace(/\s*-\s*.*$/, "") // Remove everything after dash
        .replace(/\s+(role|position)$/i, "") // Remove trailing "role" or "position"
        .trim();

      if (position.length > 2) {
        return position;
      }
    }
  }
  return null;
}

export function extractStatusFromText(text: string): string {
  const lowerText = text.toLowerCase();

  const statusKeywords = {
    rejected: [
      "unfortunately",
      "regret",
      "not selected",
      "not moving forward",
      "decided not to",
      "proceed with another candidate",
      "decided to proceed with",
      "not be moving forward",
      "will not be proceeding",
    ],
    interview: [
      "interview",
      "scheduled",
      "meeting",
      "call",
      "zoom",
      "video call",
      "phone screen",
      "next round",
    ],
    next_step: [
      "move forward with your application",
      "next step in our process",
      "next stage",
      "proceed with your candidacy",
      "additional information",
      "assessment",
      "test",
      "coding challenge",
      "take-home assignment",
      "portfolio review",
      "technical review",
      "excited to proceed",
      "would like to proceed",
      "please complete",
      "technical challenge",
      "coding test",
      "skills assessment",
      "move to the next",
      "advance your application",
      "further consideration",
    ],
    offer: [
      "offer",
      "pleased to extend",
      "job offer",
      "congratulations",
      "excited to offer",
      "happy to offer",
    ],
    accepted: [
      "welcome to",
      "excited to have you",
      "looking forward to working",
      "onboarding",
      "start date",
    ],
  };

  for (const [status, keywords] of Object.entries(statusKeywords)) {
    if (keywords.some((keyword) => lowerText.includes(keyword))) {
      return status;
    }
  }

  return "applied";
}

export function validateStatus(status: string): string | null {
  return VALID_STATUSES.includes(status?.toLowerCase())
    ? status.toLowerCase()
    : null;
}

export function validateDate(dateStr: string): string | null {
  if (!dateStr) return null;

  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return null;

  return date.toISOString().split("T")[0];
}

export function extractWebsiteFromEmail(
  from: string,
  emailBody: string
): string {
  // Extract website from email signature, footer, or body
  const text = emailBody.toLowerCase();

  // Common website patterns in email signatures
  const websitePatterns = [
    // Full URLs with protocol
    /https?:\/\/(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    // URLs without protocol
    /(?:^|\s)(?:www\.)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\s|$|\/)/g,
    // Company website mentions
    /(?:website|site|visit us|learn more):\s*(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    // Globe emoji pattern (🌐 followed by website)
    /🌐\s*([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/g,
    // Web/URL indicators followed by domain
    /(?:web|url|link):\s*(?:https?:\/\/)?(?:www\.)?([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})/gi,
    // Plain domain patterns in signatures (more flexible)
    /(?:^|\s)([a-zA-Z0-9.-]+\.[a-zA-Z]{2,})(?:\s|$)/g,
  ];

  const foundUrls = new Set<string>();

  // Extract URLs using patterns
  for (const pattern of websitePatterns) {
    const matches = text.matchAll(pattern);
    for (const match of matches) {
      const domain = match[1] || match[0];
      if (
        domain &&
        !isFromCommonEmailProvider(domain) &&
        !isCommonService(domain)
      ) {
        // Clean up the domain
        const cleanDomain = domain
          .replace(/^https?:\/\//, "")
          .replace(/^www\./, "")
          .split("/")[0];
        if (cleanDomain.includes(".") && cleanDomain.length > 3) {
          foundUrls.add(cleanDomain);
        }
      }
    }
  }

  // Try to extract from email domain if no website found
  if (foundUrls.size === 0) {
    const emailDomain = extractDomainFromEmail(from);
    if (emailDomain && !isFromCommonEmailProvider(emailDomain)) {
      foundUrls.add(emailDomain);
    }
  }

  // Return the first valid website found, prefer shorter domains (likely main company site)
  if (foundUrls.size > 0) {
    const sortedUrls = Array.from(foundUrls).sort(
      (a, b) => a.length - b.length
    );
    return `https://${sortedUrls[0]}`;
  }

  return "-";
}

export function extractDomainFromEmail(email: string): string | null {
  const match = email.match(/@([^>]*)/);
  if (match && match[1]) {
    return match[1].trim();
  }
  return null;
}

export function isCommonService(domain: string): boolean {
  return COMMON_SERVICES.some((service) => domain.includes(service));
}

export function isFromCommonEmailProvider(fromEmail: string): boolean {
  return COMMON_EMAIL_PROVIDERS.some((provider) =>
    fromEmail.includes(provider.toLowerCase())
  );
}

// Receipt extraction utilities
export function extractVendorFromEmail(from: string): string | null {
  // Extract vendor from email domain
  const emailMatch = from.match(/@([^.]+)/);
  if (emailMatch && emailMatch[1]) {
    const domain = emailMatch[1];
    // Clean up common domain patterns
    return domain
      .replace(/noreply|no-reply|billing|support|payments/gi, "")
      .replace(/[-_]/g, " ")
      .trim()
      .split(" ")[0]
      .toLowerCase();
  }
  return null;
}

export function extractVendorFromText(text: string): string | null {
  // Look for common vendor patterns in text
  const patterns = [
    /(?:receipt from|invoice from|payment to|charged by)\s+([^\n,]+)/i,
    /(?:thank you for|purchase from|order from)\s+([^\n,]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }
  return null;
}

export function extractAmountFromText(text: string): number | null {
  // Look for monetary amounts
  const patterns = [
    /\$(\d+(?:\.\d{2})?)/,
    /(\d+\.\d{2})\s*USD/i,
    /total[:\s]*\$?(\d+(?:\.\d{2})?)/i,
    /amount[:\s]*\$?(\d+(?:\.\d{2})?)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return parseFloat(match[1]);
    }
  }
  return null;
}

export function extractCategoryFromText(text: string): string {
  const textLower = text.toLowerCase();

  if (/software|saas|subscription|license|api|cloud|hosting/.test(textLower)) {
    return "software";
  }
  if (/office|supplies|equipment|desk|chair|computer/.test(textLower)) {
    return "office_supplies";
  }
  if (/internet|phone|cell|mobile|utility|electric|gas/.test(textLower)) {
    return "utilities";
  }
  if (/flight|hotel|travel|uber|lyft|taxi|car rental/.test(textLower)) {
    return "travel";
  }
  if (/restaurant|food|meal|coffee|lunch|dinner/.test(textLower)) {
    return "entertainment";
  }

  return "other";
}

export function extractInvoiceNumber(text: string): string | null {
  // Look for invoice/receipt numbers
  const patterns = [
    /(?:invoice|receipt|bill|reference)?\s*[#:]?\s*([A-Z0-9-]{4,})/i,
    /\[#([A-Z0-9-]+)\]/i,
    /\(#([A-Z0-9-]+)\)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }
  return null;
}
