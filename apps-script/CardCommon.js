// CardCommon.js - Common UI Components for Actioneer Gmail Add-on
// Debug utilities and smart actions that are shared across all categories

// ============================================================================
// UNIFIED DESIGN SYSTEM CONSTANTS
// ============================================================================

const ACTIONEER_COLORS = {
  // Primary brand colors
  PRIMARY: '#1a73e8',      // Google Blue - for primary actions and highlights
  SUCCESS: '#34a853',      // Green - for positive states and success
  WARNING: '#fbbc04',      // Yellow - for warnings and pending states
  ERROR: '#ea4335',        // Red - for errors and negative states
  SECONDARY: '#5f6368',    // Gray - for secondary text and metadata
  ACCENT: '#9334e6',       // Purple - for special highlights and AI features
  MUTED: '#9aa0a6',        // Light gray - for very subtle text
  
  // Financial specific colors
  REVENUE: '#16a34a',      // Dark green - for income and positive cash flow
  EXPENSE: '#dc2626',      // Red - for expenses and negative cash flow
  PRICE: '#0d7377',        // Teal - for price highlights and neutral financial data
  SAVINGS: '#16a34a',      // Dark green - for savings and discounts
  
  // Status colors for different states
  APPROVED: '#34a853',     // Green - for approved/accepted states
  PENDING: '#fbbc04',      // Yellow - for pending/in-progress states
  REJECTED: '#ea4335',     // Red - for rejected/failed states
  NEUTRAL: '#5f6368'       // Gray - for neutral/unknown states
};

// ============================================================================
// EMOJI CONSTANTS FOR CONSISTENT VISUAL LANGUAGE
// ============================================================================

const ACTIONEER_EMOJIS = {
  // Job application status emojis
  JOB_STATUS: {
    applied: '📝',
    interview: '🎯',
    offer: '🎉',
    accepted: '✅',
    rejected: '❌'
  },
  
  // Travel type emojis
  TRAVEL_TYPES: {
    flight: '✈️',
    hotel: '🏨',
    attraction: '🎯',
    general: '🌍'
  },
  
  // Financial transaction emojis
  TRANSACTION_TYPES: {
    revenue: '💰',
    expense: '🧾',
    auto: '🤖'
  },
  
  // Category emojis for expenses and revenue
  CATEGORIES: {
    // Revenue categories
    sales: '💵',
    consulting: '🎯',
    subscription: '🔄',
    commission: '💼',
    
    // Expense categories
    office: '🏢',
    travel: '✈️',
    food: '🍽️',
    software: '💻',
    marketing: '📢',
    utilities: '⚡',
    supplies: '📦',
    uncategorized: '📋'
  },
  
  // Action and status emojis
  ACTIONS: {
    analyze: '🤖',
    success: '✅',
    error: '❌',
    warning: '⚠️',
    refresh: '🔄',
    dashboard: '📊',
    insights: '💡',
    time: '⏰',
    calendar: '📅',
    money: '💰',
    chart: '📈',
    trending_down: '📉',
    target: '🎯',
    rocket: '🚀',
    star: '⭐',
    trophy: '🏆',
    gem: '💎',
    fire: '🔥',
    lightning: '⚡'
  }
};

// ============================================================================
// COLOR MAPPING FOR DIFFERENT CONTEXTS
// ============================================================================

const COLOR_MAPPINGS = {
  // Job status color mapping
  JOB_STATUS: {
    applied: ACTIONEER_COLORS.PRIMARY,
    interview: ACTIONEER_COLORS.WARNING,
    offer: ACTIONEER_COLORS.SUCCESS,
    accepted: ACTIONEER_COLORS.SUCCESS,
    rejected: ACTIONEER_COLORS.ERROR
  },
  
  // Travel type color mapping
  TRAVEL_TYPES: {
    flight: ACTIONEER_COLORS.PRIMARY,
    hotel: ACTIONEER_COLORS.ACCENT,
    attraction: ACTIONEER_COLORS.SUCCESS,
    general: ACTIONEER_COLORS.SECONDARY
  },
  
  // Financial transaction color mapping
  TRANSACTIONS: {
    revenue: ACTIONEER_COLORS.REVENUE,
    expense: ACTIONEER_COLORS.EXPENSE,
    auto: ACTIONEER_COLORS.PRIMARY
  }
};

// ============================================================================
// COMMON CARD STYLING UTILITIES
// ============================================================================

/**
 * Create a styled text paragraph with consistent formatting
 * @param {string} text - The text content
 * @param {string} color - The color from ACTIONEER_COLORS
 * @param {boolean} bold - Whether to make text bold
 * @returns {CardService.TextParagraph}
 */
function createStyledText(text, color = ACTIONEER_COLORS.SECONDARY, bold = false) {
  const styledText = bold ? `<b>${text}</b>` : text;
  const coloredText = color ? `<font color="${color}">${styledText}</font>` : styledText;
  return CardService.newTextParagraph().setText(coloredText);
}

/**
 * Create a visual separator line
 * @param {string} color - The color for the separator
 * @returns {CardService.TextParagraph}
 */
function createSeparator(color = ACTIONEER_COLORS.MUTED) {
  return CardService.newTextParagraph()
    .setText(`<font color="${color}">─────────────────────</font>`);
}

/**
 * Create a status badge with emoji and color
 * @param {string} status - The status text
 * @param {string} emoji - The emoji to display
 * @param {string} color - The color for the badge
 * @returns {CardService.TextParagraph}
 */
function createStatusBadge(status, emoji, color = ACTIONEER_COLORS.PRIMARY) {
  return CardService.newTextParagraph()
    .setText(`<font color="${color}"><b>${emoji} ${status.toUpperCase()}</b></font>`);
}

/**
 * Create a highlight box for important information
 * @param {string} title - The title text
 * @param {string} content - The content text
 * @param {string} titleColor - Color for the title
 * @param {string} contentColor - Color for the content
 * @returns {CardService.TextParagraph}
 */
function createHighlightBox(title, content, titleColor = ACTIONEER_COLORS.PRIMARY, contentColor = ACTIONEER_COLORS.SECONDARY) {
  return CardService.newTextParagraph().setText(
    `<font color="${titleColor}"><b>${title}</b></font><br>` +
    `<font color="${contentColor}">${content}</font>`
  );
}

/**
 * Create a price display with currency and formatting
 * @param {number|string} amount - The amount to display
 * @param {string} currency - The currency symbol
 * @param {boolean} isPositive - Whether this is a positive amount (for color coding)
 * @returns {CardService.TextParagraph}
 */
function createPriceDisplay(amount, currency = '$', isPositive = true) {
  const color = isPositive ? ACTIONEER_COLORS.SUCCESS : ACTIONEER_COLORS.EXPENSE;
  const prefix = isPositive ? '+' : '';
  return CardService.newTextParagraph()
    .setText(`<font color="${color}"><b>${prefix}${currency}${amount}</b></font>`);
}

/**
 * Create an insight bullet point
 * @param {string} insight - The insight text
 * @param {string} emoji - Optional emoji to prefix
 * @returns {CardService.TextParagraph}
 */
function createInsightBullet(insight, emoji = '•') {
  return CardService.newTextParagraph()
    .setText(`<font color="${ACTIONEER_COLORS.SECONDARY}">${emoji} ${insight}</font>`);
}

/**
 * Create a loading/processing message
 * @param {string} message - The processing message
 * @param {string} timeEstimate - Estimated completion time
 * @returns {CardService.TextParagraph}
 */
function createProcessingMessage(message, timeEstimate = '10-30 seconds') {
  return CardService.newTextParagraph().setText(
    `<font color="${ACTIONEER_COLORS.ACCENT}"><b>${ACTIONEER_EMOJIS.ACTIONS.analyze} ${message}</b></font><br><br>` +
    `<font color="${ACTIONEER_COLORS.PRIMARY}">${ACTIONEER_EMOJIS.ACTIONS.lightning} <b>Usually completes in ${timeEstimate}</b></font>`
  );
}

/**
 * Create an error message with troubleshooting tips
 * @param {string} errorMessage - The error message
 * @param {Array<string>} tips - Array of troubleshooting tips
 * @returns {CardService.TextParagraph}
 */
function createErrorMessage(errorMessage, tips = []) {
  let errorText = `<font color="${ACTIONEER_COLORS.ERROR}"><b>${ACTIONEER_EMOJIS.ACTIONS.error} Error Details:</b></font><br>` +
                  `<font color="${ACTIONEER_COLORS.SECONDARY}">${errorMessage}</font>`;
  
  if (tips.length > 0) {
    errorText += `<br><br><font color="${ACTIONEER_COLORS.SECONDARY}"><b>${ACTIONEER_EMOJIS.ACTIONS.insights} Quick Fixes:</b></font><br>`;
    tips.forEach(tip => {
      errorText += `<font color="${ACTIONEER_COLORS.SECONDARY}">• ${tip}</font><br>`;
    });
  }
  
  return CardService.newTextParagraph().setText(errorText);
}

/**
 * Create a success confirmation message
 * @param {string} message - The success message
 * @param {string} helpText - Additional help text
 * @returns {CardService.TextParagraph}
 */
function createSuccessMessage(message, helpText = '') {
  let successText = `<font color="${ACTIONEER_COLORS.SUCCESS}">${ACTIONEER_EMOJIS.ACTIONS.success} <b>${message}</b></font>`;
  
  if (helpText) {
    successText += `<br><font color="${ACTIONEER_COLORS.SECONDARY}">${helpText}</font>`;
  }
  
  return CardService.newTextParagraph().setText(successText);
}

// ============================================================================
// COMMON CARD SECTIONS
// ============================================================================

/**
 * Create a standard action section with dashboard and refresh buttons
 * @param {string} dashboardUrl - URL for the dashboard
 * @param {string} dashboardText - Text for dashboard button
 * @param {string} refreshFunction - Function name for refresh action
 * @param {Object} refreshParams - Parameters for refresh function
 * @returns {CardService.CardSection}
 */
function createStandardActionSection(dashboardUrl, dashboardText, refreshFunction, refreshParams = {}) {
  const section = CardService.newCardSection()
    .setHeader(`${ACTIONEER_EMOJIS.ACTIONS.rocket} Quick Actions`);
  
  // Dashboard button
  section.addWidget(
    CardService.newTextButton()
      .setText(`${ACTIONEER_EMOJIS.ACTIONS.dashboard} ${dashboardText}`)
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(dashboardUrl)
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  // Refresh button
  if (refreshFunction) {
    section.addWidget(
      CardService.newTextButton()
        .setText(`${ACTIONEER_EMOJIS.ACTIONS.refresh} Refresh Analysis`)
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName(refreshFunction)
            .setParameters(refreshParams)
        )
    );
  }
  
  return section;
}

/**
 * Create a standard header for cards
 * @param {string} title - Card title
 * @param {string} subtitle - Card subtitle
 * @param {string} iconUrl - Icon URL
 * @returns {CardService.CardHeader}
 */
function createStandardHeader(title, subtitle, iconUrl = ICON_URL) {
  return CardService.newCardHeader()
    .setTitle(title)
    .setSubtitle(subtitle)
    .setImageUrl(iconUrl);
}

// ============================================================================
// FORMATTING UTILITIES
// ============================================================================

/**
 * Format a date for display
 * @param {Date|string} date - The date to format
 * @param {boolean} includeTime - Whether to include time
 * @returns {string}
 */
function formatDate(date, includeTime = false) {
  try {
    const dateObj = typeof date === 'string' ? new Date(date) : date;
    const options = {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    };
    
    if (includeTime) {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }
    
    return `${ACTIONEER_EMOJIS.ACTIONS.calendar} ${dateObj.toLocaleDateString('en-US', options)}`;
  } catch (e) {
    return `${ACTIONEER_EMOJIS.ACTIONS.calendar} ${date}`;
  }
}

/**
 * Format currency amount
 * @param {number} amount - The amount to format
 * @param {string} currency - Currency symbol
 * @param {boolean} showSign - Whether to show +/- sign
 * @returns {string}
 */
function formatCurrency(amount, currency = '$', showSign = false) {
  const sign = showSign ? (amount >= 0 ? '+' : '') : '';
  return `${sign}${currency}${Math.abs(amount).toFixed(2)}`;
}

/**
 * Get emoji for category
 * @param {string} category - The category name
 * @param {string} fallback - Fallback emoji
 * @returns {string}
 */
function getCategoryEmoji(category, fallback = ACTIONEER_EMOJIS.CATEGORIES.uncategorized) {
  return ACTIONEER_EMOJIS.CATEGORIES[category] || fallback;
}

/**
 * Get color for status
 * @param {string} status - The status
 * @param {string} type - The type (job, travel, transaction)
 * @returns {string}
 */
function getStatusColor(status, type) {
  switch (type) {
    case 'job':
      return COLOR_MAPPINGS.JOB_STATUS[status] || ACTIONEER_COLORS.SECONDARY;
    case 'travel':
      return COLOR_MAPPINGS.TRAVEL_TYPES[status] || ACTIONEER_COLORS.SECONDARY;
    case 'transaction':
      return COLOR_MAPPINGS.TRANSACTIONS[status] || ACTIONEER_COLORS.SECONDARY;
    default:
      return ACTIONEER_COLORS.SECONDARY;
  }
}

// ============================================================================
// CARD VALIDATION UTILITIES
// ============================================================================

/**
 * Validate and sanitize URL
 * @param {string} url - URL to validate
 * @param {string} fallback - Fallback URL
 * @returns {string}
 */
function validateUrl(url, fallback = 'https://www.google.com') {
  if (!url || typeof url !== 'string' || url.length < 10) {
    console.warn('Invalid URL provided:', url);
    return fallback;
  }
  return url;
}

/**
 * Sanitize text for display
 * @param {string} text - Text to sanitize
 * @param {number} maxLength - Maximum length
 * @returns {string}
 */
function sanitizeText(text, maxLength = 100) {
  if (!text || typeof text !== 'string') return 'N/A';
  
  // Remove any potentially harmful HTML tags except our allowed ones
  const cleanText = text.replace(/<(?!\/?(?:b|font|br)\b)[^>]*>/gi, '');
  
  // Truncate if too long
  if (cleanText.length > maxLength) {
    return cleanText.substring(0, maxLength - 3) + '...';
  }
  
  return cleanText;
}

// Export constants for backward compatibility
// (These can be used in the individual card files)
const CARD_COLORS = ACTIONEER_COLORS;
const TRAVEL_COLORS = ACTIONEER_COLORS;
const FINANCIAL_COLORS = ACTIONEER_COLORS;

// ============================================================================
// DEBUG & UTILITY CARDS
// ============================================================================

function createDebugCard(title, message) {
  console.log(`🐛 Creating debug card: ${title} - ${message}`);

  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("🐛 Actioneer Debug")
        .setSubtitle(title)
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph().setText(
            `<b>Debug Info:</b><br>${message}<br><br><i>Check Apps Script logs for details</i>`
          )
        )
        .addWidget(
          CardService.newTextButton()
            .setText("Run Quick Test")
            .setOnClickAction(
              CardService.newAction().setFunctionName("runQuickTestFromCard")
            )
        )
    )
    .build();
}

// ============================================================================
// SMART ACTIONS CARD
// ============================================================================

function createSmartActionsCard(classification, messageId) {
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("Smart Actions")
        .setSubtitle(`${classification.type} detected`)
        .setImageUrl(ICON_URL)
    )
    .setName("smart_actions_card");

  const section = CardService.newCardSection();

  classification.actions.forEach((action) => {
    let button;

    if (action.type === "simple") {
      button = CardService.newTextButton()
        .setText(action.label)
        .setOnClickAction(
          CardService.newAction()
            .setFunctionName(action.handler)
            .setParameters({
              messageId: messageId,
              actionData: JSON.stringify(action.data),
            })
        );
    } else {
      const userEmail = Session.getActiveUser().getEmail();
      let webAppUrl;

      switch (action.type) {
        case "expense_dashboard":
          webAppUrl = `${BASE_URL}/finance?view=expenses&from=gmail&messageId=${messageId}&email=${encodeURIComponent(
            userEmail
          )}`;
          break;
        case "revenue_dashboard":
          webAppUrl = `${BASE_URL}/finance?view=revenue&from=gmail&messageId=${messageId}&email=${encodeURIComponent(
            userEmail
          )}`;
          break;
        case "financial_dashboard":
          webAppUrl = `${BASE_URL}/finance?from=gmail&messageId=${messageId}&email=${encodeURIComponent(
            userEmail
          )}`;
          break;
        case "travel_comparison":
          webAppUrl = `${BASE_URL}/travel?from=gmail&messageId=${messageId}&email=${encodeURIComponent(
            userEmail
          )}`;
          break;
        case "job_tracker":
          webAppUrl = `${BASE_URL}/jobs?from=gmail&messageId=${messageId}&email=${encodeURIComponent(
            userEmail
          )}`;
          break;
        default:
          webAppUrl = `${BASE_URL}/dashboard?from=gmail&messageId=${messageId}&email=${encodeURIComponent(
            userEmail
          )}`;
      }

      button = CardService.newTextButton()
        .setText(action.label)
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(webAppUrl)
            .setOpenAs(CardService.OpenAs.OVERLAY)
        );
    }

    section.addWidget(button);
  });

  card.addSection(section);
  return card.build();
} 