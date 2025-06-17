// CardExpenses.js - Expense and Receipt Card Components
// All expense tracking and receipt processing related cards

// ============================================================================
// EXPENSE PROCESSING CARDS
// ============================================================================

/**
 * Auto-process receipt and show results
 */
function createReceiptProcessedCard(gmailMessage, emailData) {
  console.log("💰 Auto-processing receipt...");
  
  const expenseData = extractExpenseFromEmail(gmailMessage);
  
  // Save to backend (optional - you can enable this when ready)
  // processExpense(expenseData, userApiKey);
  
  const recentExpenses = getRecentExpenses();
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("💰 Receipt Parsed")
        .setSubtitle("Expense automatically tracked")
        .setImageUrl(ICON_URL)
    )
    .setName("receipt_processed_card");

  const currentExpenseSection = CardService.newCardSection()
    .setHeader("📄 New Expense");
    
  const amount = expenseData.amount || "Unknown";
  const merchant = expenseData.merchant || "Unknown Merchant";
  const currency = expenseData.currency || "$";
  const date = new Date(expenseData.date).toLocaleDateString();
  
  currentExpenseSection.addWidget(
    CardService.newTextParagraph().setText(
      `<b>${merchant}</b><br>` +
      `<font color="#1a73e8"><b>${currency}${amount}</b></font><br>` +
      `<font color="#5f6368">${date}</font>`
    )
  );

  card.addSection(currentExpenseSection);

  if (recentExpenses && recentExpenses.length > 0) {
    const recentSection = CardService.newCardSection()
      .setHeader("📊 Your expenses this month so far");
    
    const expensesToShow = recentExpenses.slice(0, 5);
    let totalAmount = 0;
    
    expensesToShow.forEach(expense => {
      totalAmount += expense.amount || 0;
      const expenseDate = new Date(expense.date).toLocaleDateString();
      recentSection.addWidget(
        CardService.newTextParagraph().setText(
          `<b>${expense.merchant || 'Unknown'}</b> - $${expense.amount || '0'}<br>` +
          `<font color="#5f6368">${expenseDate}</font>`
        )
      );
    });
    
    recentSection.addWidget(
      CardService.newTextParagraph().setText(
        `<br><b>Total this month: <font color="#1a73e8">$${totalAmount.toFixed(2)}</font></b>`
      )
    );
    
    card.addSection(recentSection);
  }

  const actionSection = CardService.newCardSection();
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("View All Your Expenses")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(`${BASE_URL}/expenses?from=gmail&messageId=${emailData.messageId}&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`)
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  card.addSection(actionSection);
  
  return card.build();
}

// ============================================================================
// EXPENSE PRE-PROCESSED SECTIONS
// ============================================================================

function addReceiptPreProcessedSection(card, data) {
  const section = CardService.newCardSection()
    .setHeader("💰 Receipt Details Extracted");
  
  if (data.receiptData) {
    let receiptInfo = "";
    const receiptData = data.receiptData;
    
    if (receiptData.merchant) {
      receiptInfo += `<strong>Merchant:</strong> ${receiptData.merchant}<br>`;
    }
    if (receiptData.amount && receiptData.currency) {
      receiptInfo += `<strong>Amount:</strong> ${receiptData.currency} ${receiptData.amount}<br>`;
    }
    if (receiptData.date) {
      receiptInfo += `<strong>Date:</strong> ${new Date(receiptData.date).toLocaleDateString()}<br>`;
    }
    if (receiptData.category) {
      receiptInfo += `<strong>Category:</strong> ${receiptData.category}<br>`;
    }
    
    section.addWidget(
      CardService.newTextParagraph().setText(receiptInfo)
    );
  }
  
  section.addWidget(
    CardService.newTextParagraph().setText(
      "<br>✅ <strong>Expense automatically tracked!</strong>"
    )
  );
  
  card.addSection(section);
} 