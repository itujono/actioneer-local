// CardFinancial.js - Financial Transaction Card Components
// All expense tracking, revenue tracking, and financial processing related cards

// ============================================================================
// DESIGN SYSTEM CONSTANTS - Now imported from CardCommon.js
// ============================================================================

// All design constants are now centralized in CardCommon.js to avoid global scope conflicts
// Available constants: FINANCIAL_COLORS, TRANSACTION_TYPE_EMOJIS, TRANSACTION_STATUS_COLORS, CATEGORY_EMOJIS

// ============================================================================
// FINANCIAL TRANSACTION PROCESSING CARDS
// ============================================================================

/**
 * Auto-process financial transaction (expense or revenue) and show results
 */
function createFinancialTransactionCard(gmailMessage, emailData, transactionType = 'auto') {
  console.log(`💰 Auto-processing financial transaction (type: ${transactionType})...`);
  
  let transactionData;
  let cardTitle, cardSubtitle, sectionHeader;
  
  if (transactionType === 'revenue' || transactionType === 'auto') {
    // Try to extract revenue data first
    transactionData = extractRevenueFromEmailCard(gmailMessage);
    if (transactionData && transactionData.amount > 0) {
      transactionType = 'revenue';
      cardTitle = "💰 Income Received";
      cardSubtitle = "AI-powered revenue tracking";
      sectionHeader = "📈 New Income Entry";
    }
  }
  
  if (transactionType === 'expense' || (transactionType === 'auto' && !transactionData)) {
    // Extract expense data if no revenue found or explicitly expense
    transactionData = extractExpenseFromEmail(gmailMessage);
    transactionType = 'expense';
    cardTitle = "🧾 Receipt Processed";
    cardSubtitle = "AI-powered expense tracking";
    sectionHeader = "📄 New Expense Entry";
  }
  
  // Save to backend (optional - you can enable this when ready)
  if (transactionType === 'revenue') {
    // processRevenue(transactionData, userApiKey);
  } else {
    // processExpense(transactionData, userApiKey);
  }
  
  const recentTransactions = getRecentFinancialTransactions(transactionType);
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle(cardTitle)
        .setSubtitle(cardSubtitle)
        .setImageUrl(ICON_URL)
    )
    .setName(`${transactionType}_processed_card`);

  const currentTransactionSection = CardService.newCardSection()
    .setHeader(sectionHeader);
    
  const amount = transactionData.amount || "Unknown";
  const source = transactionData.merchant || transactionData.source || "Unknown Source";
  const currency = transactionData.currency || "$";
  const date = new Date(transactionData.date).toLocaleDateString();
  const category = transactionData.category || "uncategorized";
  
  // Enhanced color-coding and emoji usage
  const amountColor = transactionType === 'revenue' ? FINANCIAL_COLORS.REVENUE : FINANCIAL_COLORS.EXPENSE;
  const amountPrefix = transactionType === 'revenue' ? "+" : "-";
  const categoryEmoji = CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS.uncategorized;
  const typeEmoji = TRANSACTION_TYPE_EMOJIS[transactionType] || '💼';
  
  currentTransactionSection.addWidget(
    CardService.newTextParagraph().setText(
      `<font color="${FINANCIAL_COLORS.PRIMARY}"><b>${typeEmoji} ${source}</b></font><br>` +
      `<font color="${amountColor}"><b>${amountPrefix}${currency}${amount}</b></font><br>` +
      `<font color="${FINANCIAL_COLORS.SECONDARY}">${categoryEmoji} ${category} • 📅 ${date}</font>`
    )
  );

  card.addSection(currentTransactionSection);

  // Enhanced recent transactions section
  if (recentTransactions && recentTransactions.length > 0) {
    const recentSection = CardService.newCardSection()
      .setHeader(`📊 Your ${transactionType === 'revenue' ? 'Income' : 'Expenses'} This Month`);
    
    const transactionsToShow = recentTransactions.slice(0, 5);
    let totalAmount = 0;
    
    transactionsToShow.forEach(transaction => {
      totalAmount += transaction.amount || 0;
      const transactionDate = new Date(transaction.date).toLocaleDateString();
      const displaySource = transaction.merchant || transaction.source || 'Unknown';
      const transactionCategory = transaction.category || 'uncategorized';
      const transactionEmoji = CATEGORY_EMOJIS[transactionCategory] || CATEGORY_EMOJIS.uncategorized;
      
      recentSection.addWidget(
        CardService.newTextParagraph().setText(
          `<font color="${FINANCIAL_COLORS.PRIMARY}"><b>${displaySource}</b></font> - <font color="${amountColor}">${currency}${transaction.amount || '0'}</font><br>` +
          `<font color="${FINANCIAL_COLORS.MUTED}">${transactionEmoji} ${transactionCategory} • ${transactionDate}</font>`
        )
      );
    });
    
    const totalColor = transactionType === 'revenue' ? FINANCIAL_COLORS.REVENUE : FINANCIAL_COLORS.EXPENSE;
    const totalPrefix = transactionType === 'revenue' ? "+" : "";
    const totalEmoji = transactionType === 'revenue' ? '📈' : '📉';
    
    recentSection.addWidget(
      CardService.newTextParagraph().setText(
        `<br><font color="${totalColor}"><b>${totalEmoji} Monthly Total: ${totalPrefix}${currency}${totalAmount.toFixed(2)}</b></font>`
      )
    );
    
    card.addSection(recentSection);
  }

  // Enhanced action buttons section
  const actionSection = CardService.newCardSection().setHeader(
    "🚀 Financial Actions"
  );
  
  // Primary action - view financial dashboard
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("💼 Open Financial Dashboard")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(`${BASE_URL}/finance?from=gmail&messageId=${emailData.messageId}&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`)
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  // Secondary action based on transaction type
  if (transactionType === 'revenue') {
    actionSection.addWidget(
      CardService.newTextButton()
        .setText("📈 Track More Income")
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(`${BASE_URL}/finance?view=revenue&from=gmail&messageId=${emailData.messageId}&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`)
            .setOpenAs(CardService.OpenAs.OVERLAY)
        )
    );
  } else {
    actionSection.addWidget(
      CardService.newTextButton()
        .setText("📊 Manage Expenses")
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(`${BASE_URL}/finance?view=expenses&from=gmail&messageId=${emailData.messageId}&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`)
            .setOpenAs(CardService.OpenAs.OVERLAY)
        )
    );
  }
  
  card.addSection(actionSection);
  
  return card.build();
}

/**
 * Legacy function for backward compatibility
 */
function createReceiptProcessedCard(gmailMessage, emailData) {
  return createFinancialTransactionCard(gmailMessage, emailData, 'expense');
}

/**
 * Create revenue tracking card
 */
function createRevenueReceivedCard(gmailMessage, emailData) {
  return createFinancialTransactionCard(gmailMessage, emailData, 'revenue');
}

// ============================================================================
// FINANCIAL PRE-PROCESSED SECTIONS
// ============================================================================

function addFinancialPreProcessedSection(card, data, transactionType = 'expense') {
  const isRevenue = transactionType === 'revenue';
  const headerIcon = isRevenue ? "💰" : "🧾";
  const headerText = isRevenue ? "Revenue Automatically Tracked" : "Expense Automatically Tracked";
  
  const section = CardService.newCardSection()
    .setHeader(`${headerIcon} ${headerText}`);
  
  const transactionData = isRevenue ? data.revenueData : data.receiptData;
  
  if (transactionData) {
    let transactionInfo = "";
    
    const amountColor = isRevenue ? FINANCIAL_COLORS.REVENUE : FINANCIAL_COLORS.EXPENSE;
    const amountPrefix = isRevenue ? "+" : "";
    const category = transactionData.category || "uncategorized";
    const categoryEmoji = CATEGORY_EMOJIS[category] || CATEGORY_EMOJIS.uncategorized;
    
    if (transactionData.source || transactionData.merchant) {
      const sourceLabel = isRevenue ? "Source" : "Merchant";
      const sourceValue = transactionData.source || transactionData.merchant;
      transactionInfo += `<font color="${FINANCIAL_COLORS.PRIMARY}"><b>${sourceLabel}:</b> ${sourceValue}</font><br>`;
    }
    
    if (transactionData.amount && transactionData.currency) {
      transactionInfo += `<font color="${amountColor}"><b>Amount:</b> ${amountPrefix}${transactionData.currency} ${transactionData.amount}</font><br>`;
    }
    
    if (transactionData.date) {
      transactionInfo += `<font color="${FINANCIAL_COLORS.SECONDARY}"><b>Date:</b> 📅 ${new Date(transactionData.date).toLocaleDateString()}</font><br>`;
    }
    
    if (transactionData.category) {
      transactionInfo += `<font color="${FINANCIAL_COLORS.SECONDARY}"><b>Category:</b> ${categoryEmoji} ${transactionData.category}</font><br>`;
    }
    
    if (transactionData.description) {
      transactionInfo += `<font color="${FINANCIAL_COLORS.MUTED}"><b>Description:</b> ${transactionData.description}</font><br>`;
    }
    
    section.addWidget(
      CardService.newTextParagraph().setText(transactionInfo)
    );
  }
  
  const successMessage = isRevenue ? 
    `<font color="${FINANCIAL_COLORS.SUCCESS}">✅ <b>Revenue automatically tracked!</b></font>` : 
    `<font color="${FINANCIAL_COLORS.SUCCESS}">✅ <b>Expense automatically tracked!</b></font>`;
  
  const helpText = isRevenue ?
    `<font color="${FINANCIAL_COLORS.SECONDARY}">View detailed income analysis in your financial dashboard.</font>` :
    `<font color="${FINANCIAL_COLORS.SECONDARY}">View detailed expense breakdown in your financial dashboard.</font>`;
  
  section.addWidget(
    CardService.newTextParagraph().setText(`<br>${successMessage}<br>${helpText}`)
  );
  
  card.addSection(section);
}

/**
 * Legacy function for backward compatibility
 */
function addReceiptPreProcessedSection(card, data) {
  addFinancialPreProcessedSection(card, data, 'expense');
}

/**
 * Add revenue pre-processed section
 */
function addRevenuePreProcessedSection(card, data) {
  addFinancialPreProcessedSection(card, data, 'revenue');
}

// ============================================================================
// FINANCIAL SUMMARY CARD
// ============================================================================

/**
 * Create a comprehensive financial summary card
 */
function createFinancialSummaryCard(emailData) {
  console.log("📊 Creating financial summary card...");
  
  const recentExpenses = getRecentFinancialTransactions('expense');
  const recentRevenue = getRecentFinancialTransactions('revenue');
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("💼 Financial Intelligence")
        .setSubtitle("AI-powered money management")
        .setImageUrl(ICON_URL)
    )
    .setName("financial_summary_card");

  // Calculate totals with enhanced formatting
  const totalExpenses = recentExpenses ? recentExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) : 0;
  const totalRevenue = recentRevenue ? recentRevenue.reduce((sum, rev) => sum + (rev.amount || 0), 0) : 0;
  const netIncome = totalRevenue - totalExpenses;
  
  // Enhanced summary section
  const summarySection = CardService.newCardSection()
    .setHeader("📈 Monthly Financial Overview");
  
  summarySection.addWidget(
    CardService.newTextParagraph().setText(
      `<font color="${FINANCIAL_COLORS.REVENUE}"><b>📈 Income: +$${totalRevenue.toFixed(2)}</b></font><br>` +
      `<font color="${FINANCIAL_COLORS.EXPENSE}"><b>📉 Expenses: -$${totalExpenses.toFixed(2)}</b></font><br>` +
      `<font color="${FINANCIAL_COLORS.MUTED}">─────────────────────</font><br>` +
      `<font color="${netIncome >= 0 ? FINANCIAL_COLORS.SUCCESS : FINANCIAL_COLORS.ERROR}"><b>💰 Net Income: ${netIncome >= 0 ? '+' : ''}$${netIncome.toFixed(2)}</b></font>`
    )
  );
  
  // Add financial insights
  const insightsSection = CardService.newCardSection()
    .setHeader("💡 Smart Financial Insights");
  
  const insights = [];
  
  if (totalRevenue > 0 && totalExpenses > 0) {
    const profitMargin = ((netIncome / totalRevenue) * 100).toFixed(1);
    insights.push(`📊 Profit margin: ${profitMargin}% this month`);
  }
  
  if (totalExpenses > totalRevenue) {
    insights.push(`⚠️ Expenses exceed income by $${(totalExpenses - totalRevenue).toFixed(2)}`);
  } else if (netIncome > 0) {
    insights.push(`🎉 Positive cash flow of $${netIncome.toFixed(2)} this month`);
  }
  
  if (recentExpenses && recentExpenses.length > 0) {
    const avgExpense = totalExpenses / recentExpenses.length;
    insights.push(`📋 Average expense: $${avgExpense.toFixed(2)} per transaction`);
  }
  
  insights.forEach(insight => {
    insightsSection.addWidget(
      CardService.newTextParagraph().setText(
        `<font color="${FINANCIAL_COLORS.SECONDARY}">• ${insight}</font>`
      )
    );
  });
  
  if (insights.length > 0) {
    card.addSection(insightsSection);
  }
  
  card.addSection(summarySection);
  
  // Enhanced quick actions
  const actionSection = CardService.newCardSection()
    .setHeader("🚀 Financial Actions");
  
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("💼 Open Complete Financial Dashboard")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(`${BASE_URL}/finance?from=gmail&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`)
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("📊 View Detailed Financial Analysis")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(`${BASE_URL}/finance?view=all&timeframe=month&from=gmail&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`)
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  card.addSection(actionSection);
  
  return card.build();
}

// ============================================================================
// HELPER FUNCTIONS
// ============================================================================

/**
 * Get recent financial transactions by type with enhanced error handling
 */
function getRecentFinancialTransactions(type = 'all') {
  console.log(`Getting recent ${type} transactions...`);
  
  try {
    if (type === 'expense') {
      return getRecentExpenses();
    } else if (type === 'revenue') {
      return getRecentRevenue();
    } else if (type === 'all') {
      // Combine both expenses and revenue
      const expenses = getRecentExpenses() || [];
      const revenue = getRecentRevenue() || [];
      
      // Add type indicators and enhanced metadata
      const expensesWithType = expenses.map(exp => ({ 
        ...exp, 
        type: 'expense',
        emoji: CATEGORY_EMOJIS[exp.category] || CATEGORY_EMOJIS.uncategorized
      }));
      const revenueWithType = revenue.map(rev => ({ 
        ...rev, 
        type: 'revenue',
        emoji: CATEGORY_EMOJIS[rev.category] || CATEGORY_EMOJIS.sales
      }));
      
      // Combine and sort by date
      const allTransactions = [...expensesWithType, ...revenueWithType];
      allTransactions.sort((a, b) => new Date(b.date) - new Date(a.date));
      
      return allTransactions;
    }
  } catch (error) {
    console.error(`Error fetching ${type} transactions:`, error);
  }
  
  return [];
}

/**
 * Legacy function for backward compatibility
 */
function getRecentExpenses() {
  return getRecentFinancialTransactions('expense');
}

/**
 * Extract revenue data from email (CardFinancial.js wrapper)
 * This delegates to the main extraction function in Code.js
 */
function extractRevenueFromEmailCard(gmailMessage) {
  console.log("💰 Extracting revenue data from email (CardFinancial.js)...");
  
  // Delegate to the main extraction function in Code.js
  // Note: This will use the extractRevenueFromEmail function from Code.js
  try {
    return extractRevenueFromEmail(gmailMessage);
  } catch (error) {
    console.error("Error extracting revenue from email:", error);
    return null;
  }
} 