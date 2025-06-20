// CardFinancial.js - Financial Transaction Card Components
// All expense tracking, revenue tracking, and financial processing related cards

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
      cardSubtitle = "Revenue automatically tracked";
      sectionHeader = "📈 New Income";
    }
  }
  
  if (transactionType === 'expense' || (transactionType === 'auto' && !transactionData)) {
    // Extract expense data if no revenue found or explicitly expense
    transactionData = extractExpenseFromEmail(gmailMessage);
    transactionType = 'expense';
    cardTitle = "🧾 Receipt Parsed";
    cardSubtitle = "Expense automatically tracked";
    sectionHeader = "📄 New Expense";
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
  
  // Color-code based on transaction type
  const amountColor = transactionType === 'revenue' ? "#16a34a" : "#dc2626"; // green for revenue, red for expense
  const amountPrefix = transactionType === 'revenue' ? "+" : "-";
  
  currentTransactionSection.addWidget(
    CardService.newTextParagraph().setText(
      `<b>${source}</b><br>` +
      `<font color="${amountColor}"><b>${amountPrefix}${currency}${amount}</b></font><br>` +
      `<font color="#5f6368">${date} • ${category}</font>`
    )
  );

  card.addSection(currentTransactionSection);

  // Show recent transactions of the same type
  if (recentTransactions && recentTransactions.length > 0) {
    const recentSection = CardService.newCardSection()
      .setHeader(`📊 Your ${transactionType === 'revenue' ? 'income' : 'expenses'} this month`);
    
    const transactionsToShow = recentTransactions.slice(0, 5);
    let totalAmount = 0;
    
    transactionsToShow.forEach(transaction => {
      totalAmount += transaction.amount || 0;
      const transactionDate = new Date(transaction.date).toLocaleDateString();
      const displaySource = transaction.merchant || transaction.source || 'Unknown';
      recentSection.addWidget(
        CardService.newTextParagraph().setText(
          `<b>${displaySource}</b> - ${currency}${transaction.amount || '0'}<br>` +
          `<font color="#5f6368">${transactionDate}</font>`
        )
      );
    });
    
    const totalColor = transactionType === 'revenue' ? "#16a34a" : "#dc2626";
    const totalPrefix = transactionType === 'revenue' ? "+" : "";
    
    recentSection.addWidget(
      CardService.newTextParagraph().setText(
        `<br><b>Total this month: <font color="${totalColor}">${totalPrefix}${currency}${totalAmount.toFixed(2)}</font></b>`
      )
    );
    
    card.addSection(recentSection);
  }

  // Action buttons section
  const actionSection = CardService.newCardSection();
  
  // Primary action - view financial dashboard
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("💼 View Financial Dashboard")
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
  const headerText = isRevenue ? "Revenue Details Extracted" : "Receipt Details Extracted";
  
  const section = CardService.newCardSection()
    .setHeader(`${headerIcon} ${headerText}`);
  
  const transactionData = isRevenue ? data.revenueData : data.receiptData;
  
  if (transactionData) {
    let transactionInfo = "";
    
    if (transactionData.source || transactionData.merchant) {
      const sourceLabel = isRevenue ? "Source" : "Merchant";
      const sourceValue = transactionData.source || transactionData.merchant;
      transactionInfo += `<strong>${sourceLabel}:</strong> ${sourceValue}<br>`;
    }
    
    if (transactionData.amount && transactionData.currency) {
      const amountPrefix = isRevenue ? "+" : "";
      transactionInfo += `<strong>Amount:</strong> ${amountPrefix}${transactionData.currency} ${transactionData.amount}<br>`;
    }
    
    if (transactionData.date) {
      transactionInfo += `<strong>Date:</strong> ${new Date(transactionData.date).toLocaleDateString()}<br>`;
    }
    
    if (transactionData.category) {
      transactionInfo += `<strong>Category:</strong> ${transactionData.category}<br>`;
    }
    
    if (transactionData.description) {
      transactionInfo += `<strong>Description:</strong> ${transactionData.description}<br>`;
    }
    
    section.addWidget(
      CardService.newTextParagraph().setText(transactionInfo)
    );
  }
  
  const successMessage = isRevenue ? 
    "✅ <strong>Revenue automatically tracked!</strong>" : 
    "✅ <strong>Expense automatically tracked!</strong>";
  
  section.addWidget(
    CardService.newTextParagraph().setText(`<br>${successMessage}`)
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
        .setTitle("💼 Financial Overview")
        .setSubtitle("Your money at a glance")
        .setImageUrl(ICON_URL)
    )
    .setName("financial_summary_card");

  // Calculate totals
  const totalExpenses = recentExpenses ? recentExpenses.reduce((sum, exp) => sum + (exp.amount || 0), 0) : 0;
  const totalRevenue = recentRevenue ? recentRevenue.reduce((sum, rev) => sum + (rev.amount || 0), 0) : 0;
  const netIncome = totalRevenue - totalExpenses;
  
  // Summary section
  const summarySection = CardService.newCardSection()
    .setHeader("📈 This Month Summary");
  
  summarySection.addWidget(
    CardService.newTextParagraph().setText(
      `<font color="#16a34a"><b>Income: +$${totalRevenue.toFixed(2)}</b></font><br>` +
      `<font color="#dc2626"><b>Expenses: -$${totalExpenses.toFixed(2)}</b></font><br>` +
      `<font color="${netIncome >= 0 ? '#16a34a' : '#dc2626'}"><b>Net: ${netIncome >= 0 ? '+' : ''}$${netIncome.toFixed(2)}</b></font>`
    )
  );
  
  card.addSection(summarySection);
  
  // Quick actions
  const actionSection = CardService.newCardSection()
    .setHeader("🚀 Quick Actions");
  
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("💼 Open Financial Dashboard")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(`${BASE_URL}/finance?from=gmail&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`)
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("📊 View Detailed Analysis")
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
 * Get recent financial transactions by type
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
      
      // Add type indicators
      const expensesWithType = expenses.map(exp => ({ ...exp, type: 'expense' }));
      const revenueWithType = revenue.map(rev => ({ ...rev, type: 'revenue' }));
      
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