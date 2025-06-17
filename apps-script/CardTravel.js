// CardTravel.js - Travel and Price Comparison Card Components
// All travel booking, price comparison, and travel analysis related cards

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
        .setTitle("✈️ Travel Comparison")
        .setSubtitle("AI-powered price analysis")
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

  if (travelComparison && travelComparison.comparisons && travelComparison.comparisons.length > 0) {
    // Add travel details section with improved formatting
    addTravelDetailsSection(card, travelComparison.travelData);
    
    // Add price comparison section with enhanced UI
    addPriceComparisonSection(card, travelComparison);
    
    // Add insights section (new feature)
    addTravelInsightsSection(card, travelComparison);
  } else {
    // Enhanced fallback with better messaging
    addTravelFallbackSection(card, emailData);
  }

  // Enhanced action section with more options
  addTravelActionSection(card, emailData);
  
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
  const comparisons = details.comparisons || [];
  
  console.log("📊 Cached travel data:", JSON.stringify(travelData, null, 2));
  console.log("💰 Cached comparisons:", JSON.stringify(comparisons, null, 2));
  
  // Prepare the travel comparison data structure to determine what we have
  const travelComparison = {
    travelData: travelData,
    comparisons: comparisons.comparisons || comparisons, // Handle nested structure
    type: travelData.type
  };
  
  const hasComparisons = travelComparison.comparisons && travelComparison.comparisons.length > 0;
  const hasTravelData = travelData && Object.keys(travelData).length > 0;
  
  // If we don't have sufficient data, automatically trigger live analysis
  if (!hasComparisons && !hasTravelData) {
    console.log("🔄 Insufficient cached data, triggering automatic live analysis");
    return createTravelProcessedCard(gmailMessage, emailData);
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("✈️ Travel Comparison")
        .setSubtitle(hasComparisons ? "From cache • Previously analyzed" : "Analyzing prices...")
        .setImageUrl(ICON_URL)
    )
    .setName("cached_travel_card");

  // Add appropriate status message based on what data we have
  const statusSection = CardService.newCardSection();
  
  if (hasComparisons) {
    statusSection.addWidget(
      CardService.newTextParagraph().setText(
        "⚡ <strong>Complete travel analysis from cache</strong><br>" +
        "<font color=\"#5f6368\">Travel details and price comparisons retrieved instantly from previous analysis.</font>"
      )
    );
  } else if (hasTravelData) {
    // If we have travel data but no comparisons, automatically trigger live analysis
    console.log("🔄 Travel data found but no comparisons, triggering automatic live analysis");
    return createTravelProcessedCard(gmailMessage, emailData);
  }
  
  card.addSection(statusSection);

  // Show content - at this point we know we have complete data
  addTravelDetailsSection(card, travelComparison.travelData);
  addPriceComparisonSection(card, travelComparison);
  addTravelInsightsSection(card, travelComparison);

  // Enhanced action section with cache-specific options
  addCachedTravelActionSection(card, emailData, hasComparisons);
  
  return card.build();
}

function createTravelErrorCard(errorMessage) {
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("⚠️ Travel Analysis Error")
        .setSubtitle("Unable to process travel data")
        .setImageUrl(ICON_URL)
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph()
            .setText(`<font color="#ea4335"><b>Error:</b> ${errorMessage}</font><br><br>Please try refreshing or contact support if the issue persists.`)
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
  const section = CardService.newCardSection()
  
  const detailsWidget = createTravelDetailsWidget(travelData);
  section.addWidget(detailsWidget);
  
  // Add travel type badge
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
      .setText(`<font color="#1a73e8"><b>${priceRange.min} - ${priceRange.max} ${priceRange.currency}</b></font>`)
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
        CardService.newTextParagraph().setText("<hr style='border-color: #e8eaed;'>")
      );
    }
  });
  
  card.addSection(section);
}

function addTravelInsightsSection(card, travelComparison) {
  const insights = generateTravelInsights(travelComparison);
  
  if (insights.length > 0) {
    const section = CardService.newCardSection()
      .setHeader("💡 Smart Insights");
    
    insights.forEach(insight => {
      section.addWidget(
        CardService.newTextParagraph()
          .setText(`<font color="#5f6368">${insight}</font>`)
      );
    });
    
    card.addSection(section);
  }
}

function addTravelFallbackSection(card, emailData) {
  const section = CardService.newCardSection()
    .setHeader("🔍 Travel Email Detected");
  
  section.addWidget(
    CardService.newTextParagraph().setText(
      "🎯 <b>AI is analyzing your travel details...</b><br><br>" +
      "We're extracting information about destinations, dates, and preferences to find the best deals.<br><br>" +
      "<font color=\"#1a73e8\">⚡ This usually takes 10-30 seconds</font>"
    )
  );
  
  // Add refresh button
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

function addTravelActionSection(card, emailData) {
  const section = CardService.newCardSection();
  
  // Primary action - Travel Dashboard
  section.addWidget(
    CardService.newTextButton()
      .setText("📊 View Full Travel Dashboard")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(`${BASE_URL}/travel?from=gmail&messageId=${emailData.messageId}&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`)
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
function addCachedTravelActionSection(card, emailData, hasComparisons) {
  const section = CardService.newCardSection()
    .setHeader("📊 Actions");
  
  // Primary action - Travel Dashboard
  section.addWidget(
    CardService.newTextButton()
      .setText("📊 View Travel Dashboard")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(`${BASE_URL}/travel?from=gmail&messageId=${emailData.messageId}&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`)
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  // Secondary action - Refresh data
  section.addWidget(
    CardService.newTextButton()
      .setText("🔄 Refresh Price Data")
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName("reprocessTravelEmail")
          .setParameters({ messageId: emailData.messageId })
      )
  );
  
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
    summaryParts.push(`<strong>${travelData.origin}-${travelData.destination}</strong>`);
  } else if (travelData.destination) {
    summaryParts.push(`<strong>${travelData.destination}</strong>`);
  }
  
  if (travelData.travelers || travelData.guests) {
    const count = travelData.travelers || travelData.guests;
    const travelerText = count === 1 ? "1 traveler" : `${count} travelers`;
    summaryParts.push(travelerText);
  }
  
  if (summaryParts.length > 0) {
    detailsHtml += summaryParts.join(" &middot; ");
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
      detailsHtml += `<br><font color="#5f6368">${formattedDate}</font>`;
    } catch (e) {
      // If date parsing fails, show the raw date
      detailsHtml += `<br><font color="#5f6368">${date}</font>`;
    }
  }
  
  // Fallback if no data is available
  if (!detailsHtml) {
    detailsHtml = "<font color=\"#5f6368\">Travel details being processed...</font>";
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
  
  return CardService.newTextParagraph()
    .setText(`<font color="#1a73e8"><b>${badgeText}</b></font>`);
}

function createComparisonWidget(comparison, travelType, isBestDeal) {
  let comparisonHtml = "";
  
  // Add "Best Deal" badge for the first (cheapest) option
  if (isBestDeal) {
    comparisonHtml += "<font color=\"#34a853\"><b>🏆 BEST DEAL</b></font><br>";
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
      
      comparisonHtml += `<b>${airline}${flightNumber ? ' ' + flightNumber : ''}</b><br>`;
      
      if (minPrice === maxPrice) {
        comparisonHtml += `<font color="#1a73e8"><b>${currency} ${minPrice}</b></font><br>`;
      } else {
        comparisonHtml += `<font color="#1a73e8"><b>${currency} ${minPrice} - ${currency} ${maxPrice}</b></font><br>`;
      }
      
      comparisonHtml += `<font color="#5f6368">${duration} • ${stopsText}</font>`;
    } else {
      // Fallback for old structure
      const currency = comparison.currency || 'USD';
      const price = comparison.price || 'N/A';
      
      comparisonHtml += `<b>${airline}${flightNumber ? ' ' + flightNumber : ''}</b><br>` +
                       `<font color="#1a73e8"><b>${currency} ${price}</b></font><br>` +
                       `<font color="#5f6368">${duration} • ${stopsText}</font>`;
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
      
      comparisonHtml += `<b>${hotelName}</b><br>`;
      
      if (minPrice === maxPrice) {
        comparisonHtml += `<font color="#1a73e8"><b>${currency} ${minPrice}/night</b></font><br>`;
      } else {
        comparisonHtml += `<font color="#1a73e8"><b>${currency} ${minPrice} - ${currency} ${maxPrice}</b></font><br>`;
      }
      
      comparisonHtml += `<font color="#5f6368">⭐ ${rating} • ${location}</font>`;
    } else {
      // Fallback for old structure
      const currency = comparison.currency || 'USD';
      const price = comparison.price || 'N/A';
      
      comparisonHtml += `<b>${hotelName}</b><br>` +
                       `<font color="#1a73e8"><b>${currency} ${price}/night</b></font><br>` +
                       `<font color="#5f6368">⭐ ${rating} • ${location}</font>`;
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
      
      comparisonHtml += `<b>${name}</b><br>`;
      
      if (minPrice === maxPrice) {
        comparisonHtml += `<font color="#1a73e8"><b>${currency} ${minPrice}</b></font><br>`;
      } else {
        comparisonHtml += `<font color="#1a73e8"><b>${currency} ${minPrice} - ${currency} ${maxPrice}</b></font><br>`;
      }
      
      comparisonHtml += `<font color="#5f6368">⭐ ${rating} • ${category}</font>`;
    } else {
      // Fallback for old structure
      const currency = comparison.currency || '';
      const price = comparison.price || 'N/A';
      
      comparisonHtml += `<b>${name}</b><br>` +
                       `<font color="#1a73e8"><b>${currency ? currency + ' ' : ''}${price}</b></font><br>` +
                       `<font color="#5f6368">⭐ ${rating} • ${category}</font>`;
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