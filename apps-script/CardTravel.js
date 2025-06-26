// CardTravel.js - Travel and Price Comparison Card Components
// All travel booking, price comparison, and travel analysis related cards

// ============================================================================
// DESIGN SYSTEM CONSTANTS - Now imported from CardCommon.js
// ============================================================================

// All design constants are now centralized in CardCommon.js to avoid global scope conflicts
// Available constants: TRAVEL_COLORS, TRAVEL_TYPE_EMOJIS, TRAVEL_TYPE_COLORS

// ============================================================================
// TRAVEL PROCESSING CARDS
// ============================================================================

/**
 * Auto-process travel email with price comparison
 */
function createTravelProcessedCard(gmailMessage, emailData) {
  console.log("✈️ Auto-processing travel email...");
  
  // Get travel comparison data
  const travelComparison = getTravelComparison(emailData);
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("🌍 Travel Intelligence")
        .setImageUrl(ICON_URL)
    )
    .setName("travel_processed_card");

  // Handle different states: loading, success, error
  if (!travelComparison) {
    return createTravelErrorCard("Unable to process travel data");
  }

  if (travelComparison.error) {
    return createTravelErrorCard(travelComparison.error);
  }

  // Check if we have the new comprehensive data structure
  const hasComprehensiveData = travelComparison.comparisons && 
    (travelComparison.comparisons.hotels || travelComparison.comparisons.attractions || travelComparison.comparisons.flights);

  // Check if we have legacy data structure
  const hasLegacyData = travelComparison.comparisons && 
    Array.isArray(travelComparison.comparisons) && 
    travelComparison.comparisons.length > 0;

  if (hasComprehensiveData) {
    console.log("🎯 Using comprehensive travel data structure");
    
    // Add travel details section
    if (travelComparison.travelData) {
      addTravelDetailsSection(card, travelComparison.travelData);
    }
    
    // Add comprehensive travel sections (hotels & attractions for card)
    addComprehensiveTravelSections(card, travelComparison.travelData, travelComparison.comparisons);
    
    // Add enhanced CTA for dashboard
    addComprehensiveTravelActionSection(card, emailData, travelComparison.travelData);
    
  } else if (hasLegacyData) {
    console.log("🔄 Using legacy travel data structure");
    
    // Add travel details section with improved formatting
    addTravelDetailsSection(card, travelComparison.travelData);
    
    // Add price comparison section with enhanced UI
    addPriceComparisonSection(card, travelComparison);
    
    // Add insights section
    addTravelInsightsSection(card, travelComparison);
    
    // Enhanced action section
    addTravelActionSection(card, emailData, travelComparison.travelData);
    
  } else {
    // Enhanced fallback with better messaging
    addTravelFallbackSection(card, emailData);
  }
  
  return card.build();
}

/**
 * Create travel card from cached/pre-processed data
 */
function createCachedTravelCard(preProcessedData, gmailMessage, emailData) {
  console.log("🎯 Creating cached travel card from pre-processed data");
  
  // Extract travel data and comparisons from the details field
  const details = preProcessedData.details || {};
  const travelData = details.travelData || details; // Fallback to details if no nested structure
  const comparisons = details.comparisons || {};
  
  console.log("📊 Cached travel data:", JSON.stringify(travelData, null, 2));
  console.log("💰 Cached comparisons:", JSON.stringify(comparisons, null, 2));
  
  // Check if we have comprehensive data structure (new format)
  const isComprehensiveData = comparisons.hotels || comparisons.attractions || comparisons.flights;
  
  // For comprehensive data, check if we have sufficient content
  let hasUsefulData = false;
  if (isComprehensiveData) {
    const hotelCount = (comparisons.hotels && comparisons.hotels.length) || 0;
    const attractionCount = (comparisons.attractions && comparisons.attractions.length) || 0;
    const flightCount = (comparisons.flights && comparisons.flights.length) || 0;
    
    hasUsefulData = hotelCount > 0 || attractionCount > 0 || flightCount > 0;
    console.log(`📈 Comprehensive data counts - Hotels: ${hotelCount}, Attractions: ${attractionCount}, Flights: ${flightCount}`);
  } else {
    // Legacy format check
    hasUsefulData = comparisons.comparisons && comparisons.comparisons.length > 0;
  }
  
  const hasTravelData = travelData && Object.keys(travelData).length > 0;
  
  // If we don't have sufficient data, automatically trigger live analysis
  if (!hasUsefulData && !hasTravelData) {
    console.log("🔄 Insufficient cached data, triggering automatic live analysis");
    return createTravelProcessedCard(gmailMessage, emailData);
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("🌍 Travel Intelligence")
        .setSubtitle(hasUsefulData ? "Smart travel recommendations" : "Analyzing your travel...")
        .setImageUrl(ICON_URL)
    )
    .setName("cached_travel_card");

  // Add travel destination info
  if (hasTravelData) {
    addTravelDetailsSection(card, travelData);
  }

  // Show comprehensive comparisons if we have them
  if (isComprehensiveData && hasUsefulData) {
    addComprehensiveTravelSections(card, travelData, comparisons);
  } else if (hasUsefulData) {
    // Legacy format handling
    const legacyComparison = {
      travelData: travelData,
      comparisons: comparisons.comparisons || comparisons,
      type: travelData.type
    };
    addPriceComparisonSection(card, legacyComparison);
    addTravelInsightsSection(card, legacyComparison);
  }

  // Add CTA for full dashboard experience
  addComprehensiveTravelActionSection(card, emailData, travelData);
  
  return card.build();
}

function createTravelErrorCard(errorMessage) {
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("⚠️ Travel Analysis Error")
        .setSubtitle("Temporary processing issue")
        .setImageUrl(ICON_URL)
    )
    .addSection(
      CardService.newCardSection()
        .setHeader("🔧 What Happened?")
        .addWidget(
          CardService.newTextParagraph()
            .setText(
              `<font color="${TRAVEL_COLORS.ERROR}"><b>❌ Error Details:</b></font><br>` +
              `<font color="${TRAVEL_COLORS.SECONDARY}">${errorMessage}</font><br><br>` +
              `<font color="${TRAVEL_COLORS.SECONDARY}"><b>💡 Quick Fixes:</b></font><br>` +
              `<font color="${TRAVEL_COLORS.SECONDARY}">• Try refreshing the analysis</font><br>` +
              `<font color="${TRAVEL_COLORS.SECONDARY}">• Check your internet connection</font><br>` +
              `<font color="${TRAVEL_COLORS.SECONDARY}">• Contact support if issue persists</font>`
            )
        )
        .addWidget(
          CardService.newTextButton()
            .setText("🔄 Try Again")
            .setOnClickAction(
              CardService.newAction()
                .setFunctionName("refreshTravelAnalysis")
            )
        )
    )
    .build();
}

// ============================================================================
// TRAVEL SECTION BUILDERS
// ============================================================================

// Helper function for travel details with better formatting
function addTravelDetailsSection(card, travelData) {
  const section = CardService.newCardSection().setHeader(
    "🎯 Trip Overview"
  )
  
  const detailsWidget = createTravelDetailsWidget(travelData);
  section.addWidget(detailsWidget);
  
  // Add travel type badge with enhanced styling
  const typeBadge = createTravelTypeBadge(travelData.type);
  section.addWidget(typeBadge);
  
  card.addSection(section);
}

function addPriceComparisonSection(card, travelComparison) {
  const travelData = travelComparison.travelData;
  const comparisons = travelComparison.comparisons;
  
  const sortedComparisons = sortComparisonsByPrice(comparisons);
  
  const section = CardService.newCardSection()
    .setHeader(`💰 Best ${getTravelTypeDisplayName(travelData.type)} Deals`);
  
  const priceRange = getPriceRange(sortedComparisons);
  section.addWidget(
    CardService.newTextParagraph()
      .setText(`<font color="${TRAVEL_COLORS.PRICE}"><b>💵 ${priceRange.min} - ${priceRange.max} ${priceRange.currency}</b></font>`)
  );
  
  // Add each comparison with enhanced formatting
  sortedComparisons.slice(0, 3).forEach((comparison, index) => {
    const comparisonWidget = createComparisonWidget(comparison, travelData.type, index === 0);
    section.addWidget(comparisonWidget);
    
    // For hotels, flights, and attractions with multiple OTA options, show all booking options
    if (travelData.type === 'hotel' && comparison.otaOptions && comparison.otaOptions.length > 0) {
      addHotelBookingOptions(section, comparison);
    } else if (travelData.type === 'flight' && comparison.otaOptions && comparison.otaOptions.length > 0) {
      addFlightBookingOptions(section, comparison);
    } else if (travelData.type === 'attraction' && comparison.otaOptions && comparison.otaOptions.length > 0) {
      addAttractionBookingOptions(section, comparison);
    } else {
      // For other travel types or fallback
      const bookingButton = createBookingButton(comparison, index === 0);
      section.addWidget(bookingButton);
    }
    
    if (index < Math.min(sortedComparisons.length - 1, 2)) {
      section.addWidget(
        CardService.newTextParagraph().setText(`<font color="${TRAVEL_COLORS.MUTED}">─────────────────────</font>`)
      );
    }
  });
  
  card.addSection(section);
}

function addTravelInsightsSection(card, travelComparison) {
  const insights = generateTravelInsights(travelComparison);
  
  if (insights.length > 0) {
    const section = CardService.newCardSection()
      .setHeader("💡 Smart Travel Insights");
    
    insights.forEach(insight => {
      section.addWidget(
        CardService.newTextParagraph()
          .setText(`<font color="${TRAVEL_COLORS.SECONDARY}">• ${insight}</font>`)
      );
    });
    
    card.addSection(section);
  }
}

function addTravelFallbackSection(card, emailData) {
  const section = CardService.newCardSection()
    .setHeader("🤖 AI Travel Analysis");
  
  section.addWidget(
    CardService.newTextParagraph().setText(
      `<font color="${TRAVEL_COLORS.ACCENT}"><b>🔍 Analyzing your travel details...</b></font><br><br>` +
      `<font color="${TRAVEL_COLORS.SECONDARY}">Our AI is extracting:</font><br>` +
      `<font color="${TRAVEL_COLORS.SECONDARY}">• Destination & travel dates</font><br>` +
      `<font color="${TRAVEL_COLORS.SECONDARY}">• Best flight & hotel deals</font><br>` +
      `<font color="${TRAVEL_COLORS.SECONDARY}">• Top attractions & activities</font><br>` +
      `<font color="${TRAVEL_COLORS.SECONDARY}">• Personalized recommendations</font><br><br>` +
      `<font color="${TRAVEL_COLORS.PRIMARY}">⚡ <b>Usually completes in 10-30 seconds</b></font>`
    )
  );
  
  // Add refresh button with enhanced styling
  section.addWidget(
    CardService.newTextButton()
      .setText("🔄 Refresh Analysis")
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName("refreshTravelAnalysis")
          .setParameters({ messageId: emailData.messageId })
      )
  );
  
  card.addSection(section);
}

function addTravelActionSection(card, emailData, travelData) {
  const section = CardService.newCardSection().setHeader(
    "🚀 Travel Actions"
  );
  
  // Primary action - Travel Dashboard
  section.addWidget(
    CardService.newTextButton()
      .setText("📊 Open Travel Dashboard")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(buildTravelDashboardUrl(emailData, travelData))
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  // Secondary actions
  const secondarySection = CardService.newCardSection();
  
  secondarySection.addWidget(
    CardService.newTextButton()
      .setText("🔄 Re-analyze Email")
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName("reprocessTravelEmail")
          .setParameters({ messageId: emailData.messageId })
      )
  );
  
  card.addSection(section);
  card.addSection(secondarySection);
}

/**
 * Action section for cached travel cards
 */
function addCachedTravelActionSection(card, emailData, travelData) {
  const section = CardService.newCardSection()
  
  // Primary action - Travel Dashboard
  section.addWidget(
    CardService.newTextButton()
      .setText("📊 View Complete Travel Guide")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(buildTravelDashboardUrl(emailData, travelData))
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  // Secondary action - Refresh data
  section.addWidget(
    CardService.newTextButton()
      .setText("🔄 Refresh Travel Data")
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName("reprocessTravelEmail")
          .setParameters({ messageId: emailData.messageId })
      )
  );
  
  card.addSection(section);
}

/**
 * Add comprehensive travel sections for hotels and attractions
 */
function addComprehensiveTravelSections(card, travelData, comparisons) {
  // Add hotels section if we have hotel data
  if (comparisons.hotels && comparisons.hotels.length > 0) {
    addCompactHotelSection(card, comparisons.hotels, travelData);
  }
  
  // Add attractions section if we have attraction data
  if (comparisons.attractions && comparisons.attractions.length > 0) {
    addCompactAttractionSection(card, comparisons.attractions, travelData);
  }
  
  // Add summary insights
  addComprehensiveInsightsSection(card, comparisons, travelData);
}

/**
 * Add compact hotel recommendations section
 */
function addCompactHotelSection(card, hotels, travelData) {
  const section = CardService.newCardSection()
    .setHeader("🏨 Hotel Recommendations");
    
  // Show top 2 hotels to keep card compact
  hotels.slice(0, 2).forEach((hotel, index) => {
    const hotelWidget = createCompactHotelWidget(hotel, index === 0);
    section.addWidget(hotelWidget);
    
    // Add best booking option for each hotel
    if (hotel.otaOptions && hotel.otaOptions.length > 0) {
      const bestOption = hotel.otaOptions.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
      const bookingButton = CardService.newTextButton()
        .setText(`Book on ${bestOption.provider} - ${bestOption.currency} ${bestOption.price}`)
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(bestOption.bookingUrl || 'https://www.booking.com')
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
        );
      section.addWidget(bookingButton);
    }
    
    if (index < Math.min(hotels.length - 1, 1)) {
      section.addWidget(
        CardService.newTextParagraph().setText(`<font color="${TRAVEL_COLORS.MUTED}">─────────────────────</font>`)
      );
    }
  });
  
  if (hotels.length > 2) {
    section.addWidget(
      CardService.newTextParagraph()
        .setText(`<font color="${TRAVEL_COLORS.SECONDARY}">+ ${hotels.length - 2} more hotels available on dashboard</font>`)
    );
  }
  
  card.addSection(section);
}

/**
 * Add compact attractions section
 */
function addCompactAttractionSection(card, attractions, travelData) {
  const section = CardService.newCardSection()
    .setHeader("🎯 Top Attractions");
    
  // Show top 2 attractions to keep card compact
  attractions.slice(0, 2).forEach((attraction, index) => {
    const attractionWidget = createCompactAttractionWidget(attraction, index === 0);
    section.addWidget(attractionWidget);
    
    // Add best booking option for each attraction
    if (attraction.otaOptions && attraction.otaOptions.length > 0) {
      const bestOption = attraction.otaOptions.sort((a, b) => parseFloat(a.price) - parseFloat(b.price))[0];
      const bookingButton = CardService.newTextButton()
        .setText(`Book on ${bestOption.provider} - ${bestOption.currency} ${bestOption.price}`)
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(bestOption.bookingUrl || 'https://www.getyourguide.com')
            .setOpenAs(CardService.OpenAs.FULL_SIZE)
        );
      section.addWidget(bookingButton);
    }
    
    if (index < Math.min(attractions.length - 1, 1)) {
      section.addWidget(
        CardService.newTextParagraph().setText(`<font color="${TRAVEL_COLORS.MUTED}">─────────────────────</font>`)
      );
    }
  });
  
  if (attractions.length > 2) {
    section.addWidget(
      CardService.newTextParagraph()
        .setText(`<font color="${TRAVEL_COLORS.SECONDARY}">+ ${attractions.length - 2} more activities available on dashboard</font>`)
    );
  }
  
  card.addSection(section);
}

/**
 * Add comprehensive insights section
 */
function addComprehensiveInsightsSection(card, comparisons, travelData) {
  const insights = [];
  
  // Hotel insights
  if (comparisons.hotels && comparisons.hotels.length > 0) {
    const hotelPrices = [];
    comparisons.hotels.forEach(hotel => {
      if (hotel.otaOptions) {
        hotel.otaOptions.forEach(option => {
          const price = parseFloat(option.price);
          if (!isNaN(price)) hotelPrices.push(price);
        });
      }
    });
    
    if (hotelPrices.length > 0) {
      const minPrice = Math.min(...hotelPrices);
      const maxPrice = Math.max(...hotelPrices);
      const currency = comparisons.hotels[0].otaOptions?.[0]?.currency || 'USD';
      insights.push(`🏨 Hotels from ${currency} ${minPrice} - ${currency} ${maxPrice} per night`);
    }
  }
  
  // Attraction insights
  if (comparisons.attractions && comparisons.attractions.length > 0) {
    const attractionCount = comparisons.attractions.length;
    insights.push(`🎯 ${attractionCount} top-rated activities and attractions found`);
  }
  
  // Destination insights
  if (travelData.destination) {
    insights.push(`✈️ Flight prices from your location available on dashboard`);
  }
  
  if (insights.length > 0) {
    const section = CardService.newCardSection()
      .setHeader("💡 Quick Insights");
    
    insights.forEach(insight => {
      section.addWidget(
        CardService.newTextParagraph()
          .setText(`<font color="${TRAVEL_COLORS.SECONDARY}">• ${insight}</font>`)
      );
    });
    
    card.addSection(section);
  }
}

/**
 * Add comprehensive travel action section with enhanced CTA
 */
function addComprehensiveTravelActionSection(card, emailData, travelData) {
  const section = CardService.newCardSection().setHeader(
    "🚀 Complete Travel Experience"
  );
  
  // Create compelling CTA message
  const destination = travelData?.destination || 'your destination';
  const ctaText = `🌟 Complete Travel Guide for ${destination}`;
  const ctaSubtext = "Flight prices from your city • All hotels • Full activity list • Smart recommendations";
  
  // Add CTA description with enhanced styling
  section.addWidget(
    CardService.newTextParagraph().setText(
      `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${ctaText}</b></font><br>` +
      `<font color="${TRAVEL_COLORS.SECONDARY}">${ctaSubtext}</font>`
    )
  );
  
  // Primary CTA button
  section.addWidget(
    CardService.newTextButton()
      .setText("Open Travel Dashboard")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(buildTravelDashboardUrl(emailData, travelData))
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  // Secondary action
  // section.addWidget(
  //   CardService.newTextButton()
  //     .setText("🔄 Refresh Recommendations")
  //     .setOnClickAction(
  //       CardService.newAction()
  //         .setFunctionName("reprocessTravelEmail")
  //         .setParameters({ messageId: emailData.messageId })
  //     )
  // );
  
  card.addSection(section);
}

// ============================================================================
// TRAVEL WIDGET CREATORS
// ============================================================================

function createTravelDetailsWidget(travelData) {
  let detailsHtml = "";
  
  // Create a natural, human-readable summary line
  let summaryParts = [];
  
  // For flights, show origin-destination format
  if (travelData.type === 'flight' && travelData.origin && travelData.destination) {
    summaryParts.push(`<font color="${TRAVEL_COLORS.PRIMARY}"><b>${travelData.origin} → ${travelData.destination}</b></font>`);
  } else if (travelData.destination) {
    summaryParts.push(`<font color="${TRAVEL_COLORS.PRIMARY}"><b>${travelData.destination}</b></font>`);
  }
  
  if (travelData.travelers || travelData.guests) {
    const count = travelData.travelers || travelData.guests;
    const travelerText = count === 1 ? "1 traveler" : `${count} travelers`;
    summaryParts.push(`<font color="${TRAVEL_COLORS.SECONDARY}">${travelerText}</font>`);
  }
  
  if (summaryParts.length > 0) {
    detailsHtml += summaryParts.join(" • ");
  }
  
  if (travelData.departureDate || travelData.checkInDate) {
    const date = travelData.departureDate || travelData.checkInDate;
    try {
      const formattedDate = new Date(date).toLocaleDateString('en-US', { 
        weekday: 'short', 
        year: 'numeric', 
        month: 'short', 
        day: 'numeric' 
      });
      detailsHtml += `<br><font color="${TRAVEL_COLORS.MUTED}">📅 ${formattedDate}</font>`;
    } catch (e) {
      // If date parsing fails, show the raw date
      detailsHtml += `<br><font color="${TRAVEL_COLORS.MUTED}">📅 ${date}</font>`;
    }
  }
  
  // Fallback if no data is available
  if (!detailsHtml) {
    detailsHtml = `<font color="${TRAVEL_COLORS.ACCENT}">🤖 Analyzing travel details...</font>`;
  }
  
  return CardService.newTextParagraph().setText(detailsHtml);
}

function createTravelTypeBadge(type) {
  const badges = {
    flight: "✈️ Flight Booking",
    hotel: "🏨 Hotel Reservation", 
    attraction: "🎯 Activity Booking",
    general: "🌍 Travel Planning"
  };
  
  const badgeText = badges[type] || "🌍 Travel";
  const badgeColor = TRAVEL_TYPE_COLORS[type] || TRAVEL_COLORS.SECONDARY;
  
  return CardService.newTextParagraph()
    .setText(`<font color="${badgeColor}"><b>${badgeText}</b></font>`);
}

function createComparisonWidget(comparison, travelType, isBestDeal) {
  let comparisonHtml = "";
  
  // Add "Best Deal" badge for the first (cheapest) option
  if (isBestDeal) {
    comparisonHtml += `<font color="${TRAVEL_COLORS.SUCCESS}"><b>🏆 BEST DEAL</b></font><br>`;
  }
  
  if (travelType === 'flight') {
    const airline = comparison.airline || comparison.provider || 'Airline';
    const flightNumber = comparison.flightNumber || '';
    const duration = comparison.duration || 'N/A';
    const stops = comparison.stops !== undefined ? comparison.stops : 'N/A';
    const stopsText = stops === 'N/A' ? 'N/A stops' : `${stops} ${stops === 1 ? 'stop' : 'stops'}`;
    
    if (comparison.otaOptions && comparison.otaOptions.length > 0) {
      // Find price range from all OTA options
      const prices = comparison.otaOptions.map(ota => parseFloat(ota.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const currency = comparison.otaOptions[0].currency || 'USD';
      
      comparisonHtml += `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${airline}${flightNumber ? ' ' + flightNumber : ''}</b></font><br>`;
      
      if (minPrice === maxPrice) {
        comparisonHtml += `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency} ${minPrice}</b></font><br>`;
      } else {
        comparisonHtml += `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency} ${minPrice} - ${currency} ${maxPrice}</b></font><br>`;
      }
      
      comparisonHtml += `<font color="${TRAVEL_COLORS.SECONDARY}">${duration} • ${stopsText}</font>`;
    } else {
      // Fallback for old structure
      const currency = comparison.currency || 'USD';
      const price = comparison.price || 'N/A';
      
      comparisonHtml += `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${airline}${flightNumber ? ' ' + flightNumber : ''}</b></font><br>` +
                       `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency} ${price}</b></font><br>` +
                       `<font color="${TRAVEL_COLORS.SECONDARY}">${duration} • ${stopsText}</font>`;
    }
  } else if (travelType === 'hotel') {
    const hotelName = comparison.hotelName || comparison.name || 'Hotel';
    const rating = comparison.rating || 'N/A';
    const location = comparison.location || 'Location';
    
    if (comparison.otaOptions && comparison.otaOptions.length > 0) {
      // Find price range from all OTA options
      const prices = comparison.otaOptions.map(ota => parseFloat(ota.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const currency = comparison.otaOptions[0].currency || 'USD';
      
      comparisonHtml += `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${hotelName}</b></font><br>`;
      
      if (minPrice === maxPrice) {
        comparisonHtml += `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency} ${minPrice}/night</b></font><br>`;
      } else {
        comparisonHtml += `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency} ${minPrice} - ${currency} ${maxPrice}</b></font><br>`;
      }
      
      comparisonHtml += `<font color="${TRAVEL_COLORS.SECONDARY}">⭐ ${rating} • ${location}</font>`;
    } else {
      // Fallback for old structure
      const currency = comparison.currency || 'USD';
      const price = comparison.price || 'N/A';
      
      comparisonHtml += `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${hotelName}</b></font><br>` +
                       `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency} ${price}/night</b></font><br>` +
                       `<font color="${TRAVEL_COLORS.SECONDARY}">⭐ ${rating} • ${location}</font>`;
    }
  } else {
    const name = comparison.name || 'Activity';
    const rating = comparison.rating || 'N/A';
    const category = comparison.category || comparison.description || 'Experience';
    
    if (comparison.otaOptions && comparison.otaOptions.length > 0) {
      // Find price range from all OTA options  
      const prices = comparison.otaOptions.map(ota => parseFloat(ota.price));
      const minPrice = Math.min(...prices);
      const maxPrice = Math.max(...prices);
      const currency = comparison.otaOptions[0].currency || 'USD';
      
      comparisonHtml += `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${name}</b></font><br>`;
      
      if (minPrice === maxPrice) {
        comparisonHtml += `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency} ${minPrice}</b></font><br>`;
      } else {
        comparisonHtml += `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency} ${minPrice} - ${currency} ${maxPrice}</b></font><br>`;
      }
      
      comparisonHtml += `<font color="${TRAVEL_COLORS.SECONDARY}">⭐ ${rating} • ${category}</font>`;
    } else {
      // Fallback for old structure
      const currency = comparison.currency || '';
      const price = comparison.price || 'N/A';
      
      comparisonHtml += `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${name}</b></font><br>` +
                       `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency ? currency + ' ' : ''}${price}</b></font><br>` +
                       `<font color="${TRAVEL_COLORS.SECONDARY}">⭐ ${rating} • ${category}</font>`;
    }
  }
  
  return CardService.newTextParagraph().setText(comparisonHtml);
}

function createBookingButton(comparison, isBestDeal) {
  const buttonText = isBestDeal 
    ? `🏆 Book Best Deal - ${comparison.provider || comparison.airline || 'Provider'}`
    : `Book with ${comparison.provider || comparison.airline || 'Provider'}`;
  
  // Validate booking URL
  const bookingUrl = comparison.bookingUrl || 'https://www.google.com/travel/flights';
  
  // Ensure URL is valid
  if (!bookingUrl || typeof bookingUrl !== 'string' || bookingUrl.length < 10) {
    console.warn('Invalid booking URL:', bookingUrl, 'for comparison:', comparison);
    return CardService.newTextButton()
      .setText('⚠️ Booking URL Not Available')
      .setDisabled(true);
  }
  
  return CardService.newTextButton()
    .setText(buttonText)
    .setOpenLink(
      CardService.newOpenLink()
        .setUrl(bookingUrl)
        .setOpenAs(CardService.OpenAs.FULL_SIZE)
    );
}

/**
 * Create compact hotel widget for comprehensive view
 */
function createCompactHotelWidget(hotel, isBestDeal) {
  let hotelHtml = "";
  
  // Add "Best Deal" badge for the first (cheapest) option
  if (isBestDeal) {
    hotelHtml += `<font color="${TRAVEL_COLORS.SUCCESS}"><b>🏆 BEST VALUE</b></font><br>`;
  }
  
  const hotelName = hotel.hotelName || hotel.name || 'Hotel';
  const rating = hotel.rating || 'N/A';
  const location = hotel.location || 'Location';
  
  if (hotel.otaOptions && hotel.otaOptions.length > 0) {
    // Find price range from all OTA options
    const prices = hotel.otaOptions.map(ota => parseFloat(ota.price));
    const minPrice = Math.min(...prices);
    const currency = hotel.otaOptions[0].currency || 'USD';
    
    hotelHtml += `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${hotelName}</b></font><br>` +
                 `<font color="${TRAVEL_COLORS.PRICE}"><b>From ${currency} ${minPrice}/night</b></font><br>` +
                 `<font color="${TRAVEL_COLORS.SECONDARY}">⭐ ${rating} • ${location}</font>`;
  } else {
    // Fallback for old structure
    const currency = hotel.currency || 'USD';
    const price = hotel.price || 'N/A';
    
    hotelHtml += `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${hotelName}</b></font><br>` +
                 `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency} ${price}/night</b></font><br>` +
                 `<font color="${TRAVEL_COLORS.SECONDARY}">⭐ ${rating} • ${location}</font>`;
  }
  
  return CardService.newTextParagraph().setText(hotelHtml);
}

/**
 * Create compact attraction widget for comprehensive view
 */
function createCompactAttractionWidget(attraction, isBestDeal) {
  let attractionHtml = "";
  
  // Add "Best Deal" badge for the first (cheapest) option
  if (isBestDeal) {
    attractionHtml += `<font color="${TRAVEL_COLORS.SUCCESS}"><b>🎯 TOP PICK</b></font><br>`;
  }
  
  const name = attraction.name || 'Activity';
  const rating = attraction.rating || 'N/A';
  const category = attraction.category || attraction.description || 'Experience';
  
  if (attraction.otaOptions && attraction.otaOptions.length > 0) {
    // Find price range from all OTA options  
    const prices = attraction.otaOptions.map(ota => parseFloat(ota.price));
    const minPrice = Math.min(...prices);
    const currency = attraction.otaOptions[0].currency || 'USD';
    
    attractionHtml += `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${name}</b></font><br>` +
                      `<font color="${TRAVEL_COLORS.PRICE}"><b>From ${currency} ${minPrice}</b></font><br>` +
                      `<font color="${TRAVEL_COLORS.SECONDARY}">⭐ ${rating} • ${category}</font>`;
  } else {
    // Fallback for old structure
    const currency = attraction.currency || '';
    const price = attraction.price || 'N/A';
    
    attractionHtml += `<font color="${TRAVEL_COLORS.PRIMARY}"><b>${name}</b></font><br>` +
                      `<font color="${TRAVEL_COLORS.PRICE}"><b>${currency ? currency + ' ' : ''}${price}</b></font><br>` +
                      `<font color="${TRAVEL_COLORS.SECONDARY}">⭐ ${rating} • ${category}</font>`;
  }
  
  return CardService.newTextParagraph().setText(attractionHtml);
}

// ============================================================================
// BOOKING OPTIONS BUILDERS
// ============================================================================

function addHotelBookingOptions(section, hotelComparison) {
  // Add each OTA option as a button
  hotelComparison.otaOptions.forEach((ota, index) => {
    let buttonText = `${ota.provider}: ${ota.currency} ${ota.price}`;
    
    if (ota.isBestDeal) {
      buttonText += " 🏆 BEST DEAL";
    }
    
    // Validate booking URL
    const bookingUrl = ota.bookingUrl || 'https://www.booking.com';
    
    if (!bookingUrl || typeof bookingUrl !== 'string' || bookingUrl.length < 10) {
      console.warn('Invalid hotel booking URL:', bookingUrl, 'for OTA:', ota);
      return; // Skip this button
    }
    
    const button = CardService.newTextButton()
      .setText(buttonText)
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(bookingUrl)
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
      );
    
    section.addWidget(button);
  });
}

function addFlightBookingOptions(section, flightComparison) {
  // Add each OTA option as a button
  flightComparison.otaOptions.forEach((ota, index) => {
    let buttonText = `${ota.provider}: ${ota.currency} ${ota.price}`;
    
    if (ota.isBestDeal) {
      buttonText += " 🏆 BEST DEAL";
    }
    
    // Validate booking URL
    const bookingUrl = ota.bookingUrl || 'https://www.google.com/travel/flights';
    
    if (!bookingUrl || typeof bookingUrl !== 'string' || bookingUrl.length < 10) {
      console.warn('Invalid flight booking URL:', bookingUrl, 'for OTA:', ota);
      return; // Skip this button
    }
    
    const button = CardService.newTextButton()
      .setText(buttonText)
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(bookingUrl)
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
      );
    
    section.addWidget(button);
  });
}

function addAttractionBookingOptions(section, attractionComparison) {
  // Add each OTA option as a button
  attractionComparison.otaOptions.forEach((ota, index) => {
    let buttonText = `${ota.provider}: ${ota.currency} ${ota.price}`;
    
    if (ota.isBestDeal) {
      buttonText += " 🏆 BEST DEAL";
    }
    
    // Validate booking URL
    const bookingUrl = ota.bookingUrl || 'https://www.getyourguide.com';
    
    if (!bookingUrl || typeof bookingUrl !== 'string' || bookingUrl.length < 10) {
      console.warn('Invalid attraction booking URL:', bookingUrl, 'for OTA:', ota);
      return; // Skip this button
    }
    
    const button = CardService.newTextButton()
      .setText(buttonText)
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(bookingUrl)
          .setOpenAs(CardService.OpenAs.FULL_SIZE)
      );
    
    section.addWidget(button);
  });
}

// ============================================================================
// TRAVEL UTILITY FUNCTIONS
// ============================================================================

/**
 * Build travel dashboard URL with proper search parameters
 * Apps Script compatible version (no URLSearchParams)
 */
function buildTravelDashboardUrl(emailData, travelData) {
  const baseUrl = `${BASE_URL}/travel`;
  const params = [];
  
  // Always add basic params
  params.push(`from=gmail`);
  params.push(`messageId=${encodeURIComponent(emailData.messageId)}`);
  params.push(`email=${encodeURIComponent(Session.getActiveUser().getEmail())}`);
  
  // Add travel-specific params if available
  if (travelData) {
    if (travelData.destination) {
      params.push(`destination=${encodeURIComponent(travelData.destination)}`);
    }
    if (travelData.origin) {
      params.push(`origin=${encodeURIComponent(travelData.origin)}`);
    }
    if (travelData.travelers || travelData.guests) {
      params.push(`travelers=${encodeURIComponent((travelData.travelers || travelData.guests).toString())}`);
    }
  }
  
  return `${baseUrl}?${params.join('&')}`;
}

function sortComparisonsByPrice(comparisons) {
  return comparisons.sort((a, b) => {
    let priceA, priceB;
    
    if (a.otaOptions && a.otaOptions.length > 0) {
      // For hotels, use the minimum price from all OTA options
      const prices = a.otaOptions.map(ota => parseFloat(ota.price || '0'));
      priceA = Math.min(...prices);
    } else {
      // For other travel types or old structure
      priceA = parseFloat((a.price || '0').toString().replace(/[^0-9.]/g, ''));
    }
    
    if (b.otaOptions && b.otaOptions.length > 0) {
      const prices = b.otaOptions.map(ota => parseFloat(ota.price || '0'));
      priceB = Math.min(...prices);
    } else {
      // For other travel types or old structure
      priceB = parseFloat((b.price || '0').toString().replace(/[^0-9.]/g, ''));
    }
    
    // Handle NaN values - put them at the end
    if (isNaN(priceA) && isNaN(priceB)) return 0;
    if (isNaN(priceA)) return 1;
    if (isNaN(priceB)) return -1;
    
    return priceA - priceB;
  });
}

function getPriceRange(comparisons) {
  if (comparisons.length === 0) return { min: 'N/A', max: 'N/A', currency: '' };
  
  const validPrices = [];
  let currency = '';
  
  for (const comparison of comparisons) {
    if (comparison.otaOptions && comparison.otaOptions.length > 0) {
      // For hotels with multiple OTA options
      currency = comparison.otaOptions[0].currency || 'USD';
      for (const ota of comparison.otaOptions) {
        const price = parseFloat(ota.price || '0');
        if (!isNaN(price) && price > 0) {
          validPrices.push(price);
        }
      }
    } else {
      // For other travel types or old structure
      currency = comparison.currency || currency || 'USD';
      const priceStr = (comparison.price || '0').toString().replace(/[^0-9.]/g, '');
      const price = parseFloat(priceStr);
      if (!isNaN(price) && price > 0) {
        validPrices.push(price);
      }
    }
  }
  
  if (validPrices.length === 0) {
    return { min: 'N/A', max: 'N/A', currency: '' };
  }
  
  const minPrice = Math.min(...validPrices);
  const maxPrice = Math.max(...validPrices);
  
  return {
    min: `${currency} ${minPrice.toFixed(0)}`,
    max: `${currency} ${maxPrice.toFixed(0)}`,
    currency: currency
  };
}

function getTravelTypeDisplayName(type) {
  const displayNames = {
    flight: 'Flight',
    hotel: 'Hotel',
    attraction: 'Activity',
    general: 'Travel'
  };
  return displayNames[type] || 'Travel';
}

function generateTravelInsights(travelComparison) {
  const insights = [];
  const comparisons = travelComparison.comparisons;
  const travelData = travelComparison.travelData;
  
  if (comparisons.length >= 2) {
    const allPrices = [];
    let currency = '';
    
    for (const c of comparisons) {
      if (c.otaOptions && c.otaOptions.length > 0) {
        // For hotels with multiple OTA options
        currency = c.otaOptions[0].currency || 'USD';
        allPrices.push(...c.otaOptions.map(ota => parseFloat(ota.price || '0')));
      } else {
        // For other travel types or old structure
        currency = c.currency || currency || 'USD';
        allPrices.push(parseFloat((c.price || '0').toString().replace(/[^0-9.]/g, '')));
      }
    }
    
    const validPrices = allPrices.filter(p => !isNaN(p) && p > 0);
    if (validPrices.length >= 2) {
      const savings = Math.max(...validPrices) - Math.min(...validPrices);
      if (savings > 0) {
        insights.push(`💰 You could save up to ${currency} ${savings.toFixed(0)} by choosing the best deal`);
      }
    }
  }
  
  if (travelData.type === 'flight' && comparisons.some(c => c.stops === 0)) {
    insights.push("✈️ Direct flights available - save time with non-stop options");
  }
  
  if (travelData.type === 'hotel' && comparisons.some(c => parseFloat(c.rating) >= 4.5)) {
    insights.push("⭐ Highly rated accommodations available (4.5+ stars)");
  }
  
  // Add seasonal insights based on dates
  if (travelData.departureDate || travelData.checkInDate) {
    const travelDate = new Date(travelData.departureDate || travelData.checkInDate);
    const month = travelDate.getMonth();
    
    if ([11, 0, 1].includes(month)) { // Winter months
      insights.push("❄️ Winter travel - consider weather delays and pack accordingly");
    } else if ([5, 6, 7].includes(month)) { // Summer months
      insights.push("☀️ Peak summer season - book early for better rates");
    }
  }
  
  return insights;
}

// ============================================================================
// TRAVEL ACTION HANDLERS
// ============================================================================

// Action handlers for new functionality
function refreshTravelAnalysis(e) {
  const messageId = e && e.parameter ? e.parameter.messageId : null;
  if (!messageId) {
    console.error("No messageId provided for refresh");
    return createTravelErrorCard("Unable to refresh - missing email ID");
  }
  
  // Trigger re-analysis of the travel email
  // This would call the travel comparison API again
  return createTravelProcessedCard(null, { messageId: messageId });
}

function reprocessTravelEmail(e) {
  const messageId = e && e.parameter ? e.parameter.messageId : null;
  if (!messageId) {
    console.error("No messageId provided for reprocess");
    return createTravelErrorCard("Unable to reprocess - missing email ID");
  }
  
  // Force reprocessing of the email with fresh data
  console.log("🔄 Reprocessing travel email:", messageId);
  return createTravelProcessedCard(null, { messageId: messageId });
} 