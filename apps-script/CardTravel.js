// CardTravel.js - Simplified Travel Card Components
// Streamlined travel cards focused on email history and destination insights

// ============================================================================
// SIMPLIFIED TRAVEL PROCESSING CARDS
// ============================================================================

/**
 * Create simplified travel card that just shows email subject and destination
 * Much faster processing - no heavy API calls for comprehensive data
 */
function createTravelProcessedCard(gmailMessage, emailData) {
  console.log("✈️ Creating simplified travel card...");
  
  // Extract basic travel info (fast, lightweight)
  const travelInfo = extractBasicTravelInfo(emailData);
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("🌍 Travel Email")
        .setSubtitle("Email saved to your travel history")
        .setImageUrl(ICON_URL)
    )
    .setName("travel_processed_card");

  // Add email subject section (main content)
  addTravelEmailSection(card, emailData, travelInfo);
  
  // Add simple action section with "Get insights" button
  addSimpleTravelActionSection(card, emailData, travelInfo);
  
  return card.build();
}

/**
 * Create travel card from cached/pre-processed data
 * Even simpler - just show the stored email info
 */
function createCachedTravelCard(preProcessedData, gmailMessage, emailData) {
  console.log("🎯 Creating cached travel card from stored data");
  
  // Extract basic info from stored data
  const travelInfo = {
    destination: preProcessedData.destination || "Unknown Destination",
    subject: preProcessedData.subject || emailData.subject || "Travel Email"
  };
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("🌍 Travel Email")
        .setSubtitle("Previously saved to your history")
        .setImageUrl(ICON_URL)
    )
    .setName("cached_travel_card");

  // Add email content section
  addTravelEmailSection(card, emailData, travelInfo);
  
  // Add action section
  addSimpleTravelActionSection(card, emailData, travelInfo);
  
  return card.build();
}

/**
 * Create error card for travel processing issues
 */
function createTravelErrorCard(errorMessage) {
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("⚠️ Travel Processing")
        .setSubtitle("Unable to process travel email")
        .setImageUrl(ICON_URL)
    )
    .addSection(
      CardService.newCardSection()
        .setHeader("🔧 Issue Details")
        .addWidget(
          CardService.newTextParagraph()
            .setText(
              `<font color="#dc2626"><b>❌ Error:</b></font><br>` +
              `<font color="#6b7280">${errorMessage}</font><br><br>` +
              `<font color="#6b7280"><b>💡 Try:</b></font><br>` +
              `<font color="#6b7280">• Refreshing the email</font><br>` +
              `<font color="#6b7280">• Checking your connection</font><br>` +
              `<font color="#6b7280">• Contacting support if needed</font>`
            )
        )
        .addWidget(
          CardService.newTextButton()
            .setText("🔄 Try Again")
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName("refreshTravelCard")
            )
        )
    )
    .build();
}

// ============================================================================
// SIMPLIFIED SECTION BUILDERS
// ============================================================================

/**
 * Add email subject and destination section (main content)
 */
function addTravelEmailSection(card, emailData, travelInfo) {
  const section = CardService.newCardSection()
    .setHeader("📧 Travel Email Details");
  
  // Email subject (truncated to 3 lines like in the web UI)
  const subject = travelInfo.subject || emailData.subject || "Travel Email";
  const truncatedSubject = truncateText(subject, 120); // ~3 lines
  
  section.addWidget(
    CardService.newTextParagraph()
      .setText(
        `<font color="#1f2937"><b>${truncatedSubject}</b></font>`
      )
  );
  
  // Destination info if available
  if (travelInfo.destination && travelInfo.destination !== "Unknown Destination") {
    section.addWidget(
      CardService.newTextParagraph()
        .setText(
          `<font color="#3b82f6"><b>📍 Destination:</b></font> ` +
          `<font color="#6b7280">${travelInfo.destination}</font>`
        )
    );
  }
  
  // Email date
  const emailDate = new Date(emailData.date || Date.now());
  const formattedDate = emailDate.toLocaleDateString('en-US', { 
    weekday: 'short', 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
  
  section.addWidget(
    CardService.newTextParagraph()
      .setText(`<font color="#9ca3af">📅 ${formattedDate}</font>`)
  );
  
  card.addSection(section);
}

/**
 * Add simple action section with travel details button
 */
function addSimpleTravelActionSection(card, emailData, travelInfo) {
  const section = CardService.newCardSection()
  
  // Main CTA - View travel details and recommendations
  const destination = travelInfo.destination || "this destination";
  const buttonText = destination !== "Unknown Destination" && destination !== "this destination" 
    ? `Explore ${destination}`
    : "View Travel Details";
  
  section.addWidget(
    CardService.newTextButton()
      .setText(buttonText)
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(buildSimpleTravelDashboardUrl(emailData, travelInfo))
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  card.addSection(section);
}

// ============================================================================
// SIMPLIFIED UTILITY FUNCTIONS
// ============================================================================

/**
 * Extract basic travel info from email (lightweight, fast)
 */
function extractBasicTravelInfo(emailData) {
  const subject = emailData.subject || "";
  const body = emailData.body || "";
  const textToAnalyze = `${subject} ${body}`.toLowerCase();
  
  // Simple destination extraction patterns
  const destinationPatterns = [
    // Direct mentions including "time to" pattern
    /(?:to|in|visit|destination|traveling to|flying to|trip to|time to)\s+([A-Z][a-zA-Z\s]{2,20})/gi,
    // City, Country format
    /([A-Z][a-zA-Z\s]{2,15}),\s*([A-Z][a-zA-Z\s]{2,15})/g,
    // Airport codes
    /\b([A-Z]{3})\b/g,
    // Hotel/flight booking patterns
    /(?:hotel|flight|booking).*(?:in|to|at)\s+([A-Z][a-zA-Z\s]{2,20})/gi
  ];
  
  let destination = null;
  
  for (const pattern of destinationPatterns) {
    const matches = subject.match(pattern);
    if (matches && matches.length > 0) {
      // Take the first reasonable match
      const match = matches[0];
      if (match.length > 2 && match.length < 50) {
        destination = match.trim();
        break;
      }
    }
  }
  
  // Clean up destination
  if (destination) {
    destination = destination
      .replace(/^(to|in|visit|destination|traveling to|flying to|trip to|time to)\s+/i, '')
      .trim();
  }
  
  return {
    destination: destination || "Unknown Destination",
    subject: emailData.subject || "Travel Email"
  };
}

/**
 * Truncate text to specified length (like in web UI)
 */
function truncateText(text, maxLength = 120) {
  if (!text || text.length <= maxLength) return text;
  return text.substring(0, maxLength).trim() + "...";
}

/**
 * Build travel details page URL - links directly to the dedicated travel page
 */
function buildSimpleTravelDashboardUrl(emailData, travelInfo) {
  // For now, we'll link to the main travel page with query params
  // In the future, we could fetch the specific travel email ID from the database
  // and link directly to /travel/$id
  const baseUrl = `${BASE_URL}/travel`;
  const params = [];
  
  // Always add basic params for potential future use
  params.push(`from=gmail`);
  params.push(`messageId=${encodeURIComponent(emailData.messageId)}`);
  
  // Add destination if we found one - this could help with filtering/highlighting
  if (travelInfo.destination && travelInfo.destination !== "Unknown Destination") {
    params.push(`destination=${encodeURIComponent(travelInfo.destination)}`);
  }
  
  return `${baseUrl}?${params.join('&')}`;
}

// ============================================================================
// ACTION HANDLERS
// ============================================================================

/**
 * Refresh travel card action
 */
function refreshTravelCard(e) {
  const messageId = e && e.parameter ? e.parameter.messageId : null;
  if (!messageId) {
    console.error("No messageId provided for refresh");
    return createTravelErrorCard("Unable to refresh - missing email ID");
  }
  
  // Just recreate the simple card
  return createTravelProcessedCard(null, { messageId: messageId });
} 