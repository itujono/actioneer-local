import React from "react";
import {
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  ExternalLink,
  Mail,
} from "lucide-react";
import { Button } from "../ui/button";
import type { JobApplication } from "./types";

// Helper function to get flag emoji from country code
export const getFlagEmoji = (countryCode?: string): string => {
  if (!countryCode) return "";

  const flags: Record<string, string> = {
    US: "🇺🇸",
    GB: "🇬🇧",
    CA: "🇨🇦",
    AU: "🇦🇺",
    DE: "🇩🇪",
    FR: "🇫🇷",
    JP: "🇯🇵",
    KR: "🇰🇷",
    IN: "🇮🇳",
    BR: "🇧🇷",
    MX: "🇲🇽",
    NL: "🇳🇱",
    SE: "🇸🇪",
    CH: "🇨🇭",
    IT: "🇮🇹",
    ES: "🇪🇸",
    ID: "🇮🇩",
    NZ: "🇳🇿",
    SG: "🇸🇬",
    HK: "🇭🇰",
    TW: "🇹🇼",
    PH: "🇵🇭",
    ZA: "🇿🇦",
    MY: "🇲🇾",
    TH: "🇹🇭",
    VN: "🇻🇳",
    NG: "🇳🇬",
  };

  return flags[countryCode.toUpperCase()] || "";
};

// Helper function to construct Gmail URL from message ID
export const getGmailUrl = (
  emailId: string,
  application?: JobApplication
): string => {
  console.log("🔗 Constructing Gmail URL for email ID:", emailId);

  if (!emailId) {
    console.warn("⚠️ No email ID provided, redirecting to inbox");
    return "https://mail.google.com/mail/u/0/#inbox";
  }

  // Since Gmail API message IDs (msg-f:123456789) don't work with Gmail web URLs,
  // we'll use a search-based approach that's more reliable

  if (application?.company && application?.position) {
    // Create a search query using company and position which should be unique enough
    const searchTerms = [];

    // Add company name (clean it up for search)
    const cleanCompany = application.company.replace(/[^\w\s]/g, "").trim();
    if (cleanCompany) {
      searchTerms.push(`"${cleanCompany}"`);
    }

    // Add position keywords
    const cleanPosition = application.position.replace(/[^\w\s]/g, "").trim();
    if (cleanPosition) {
      // Split position into words and add the most meaningful ones
      const positionWords = cleanPosition
        .split(/\s+/)
        .filter(
          (word) =>
            word.length > 2 &&
            !["the", "and", "for", "with"].includes(word.toLowerCase())
        );
      if (positionWords.length > 0) {
        searchTerms.push(`"${positionWords.slice(0, 2).join(" ")}"`);
      }
    }

    // Add "job" or "application" to narrow down results
    searchTerms.push("(job OR application OR position OR role)");

    const searchQuery = searchTerms.join(" ");
    const encodedQuery = encodeURIComponent(searchQuery);
    const searchUrl = `https://mail.google.com/mail/u/0/#search/${encodedQuery}`;

    console.log("🔍 Generated search query:", searchQuery);
    console.log("🌐 Generated search URL:", searchUrl);
    return searchUrl;
  }

  // Fallback: Search for just the message ID (though this format likely won't match)
  console.log("🔍 Using message ID fallback search");
  const fallbackQuery = encodeURIComponent(`"${emailId}"`);
  const fallbackUrl = `https://mail.google.com/mail/u/0/#search/${fallbackQuery}`;
  console.log("🌐 Generated fallback URL:", fallbackUrl);
  return fallbackUrl;
};

// Helper function to handle Gmail URL opening with error handling
export const openGmailUrl = (emailId: string, application?: JobApplication) => {
  try {
    const url = getGmailUrl(emailId, application);
    console.log("🚀 Opening Gmail URL:", url);

    // Open in new tab
    const newWindow = window.open(url, "_blank", "noopener,noreferrer");

    if (!newWindow) {
      console.error("❌ Failed to open new window - popup blocked?");
      // Fallback: try to navigate in current tab
      window.location.href = url;
    } else {
      console.log("✅ Successfully opened Gmail search in new tab");
    }
  } catch (error) {
    console.error("❌ Error opening Gmail URL:", error);
    // Ultimate fallback: just go to Gmail inbox
    window.open("https://mail.google.com/mail/u/0/#inbox", "_blank");
  }
};

export const getStatusIcon = (status: string) => {
  switch (status.toLowerCase()) {
    case "applied":
      return <Clock className="h-4 w-4 text-thunder" />;
    case "next_step":
      return <AlertCircle className="h-4 w-4 text-heliotrope" />;
    case "interview":
    case "interviewing":
      return <AlertCircle className="h-4 w-4 text-jade" />;
    case "offer":
    case "accepted":
      return <CheckCircle className="h-4 w-4 text-jade" />;
    case "rejected":
    case "declined":
      return <XCircle className="h-4 w-4 text-thunder" />;
    default:
      return <Clock className="h-4 w-4 text-thunder" />;
  }
};

export const getStatusBadgeColor = (status: string) => {
  switch (status.toLowerCase()) {
    case "applied":
      return "bg-concrete text-thunder";
    case "next_step":
      return "bg-heliotrope/20 text-heliotrope";
    case "interview":
    case "interviewing":
      return "bg-jade/20 text-jade";
    case "offer":
    case "accepted":
      return "bg-jade/20 text-jade";
    case "rejected":
    case "declined":
      return "bg-bittersweet/20 text-bittersweet";
    default:
      return "bg-concrete text-thunder";
  }
};

// Gmail button component
export const GmailButton = ({
  emailId,
  application,
}: {
  emailId: string;
  application?: JobApplication;
}) => (
  <Button
    onClick={() => openGmailUrl(emailId, application)}
    variant="outline"
    size="sm"
    title="Search for this email in Gmail"
  >
    <Mail className="h-3 w-3 mr-1" />
    Find in Gmail
    <ExternalLink className="h-3 w-3 ml-1" />
  </Button>
);
