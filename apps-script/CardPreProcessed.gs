// CardPreProcessed.js - Pre-processed Email Card Components
// Handles displaying cards for emails that have been automatically processed

// ============================================================================
// PRE-PROCESSED EMAIL CARDS
// ============================================================================

/**
 * Create card for pre-processed email data
 */
function createPreProcessedCard(preProcessedData, gmailMessage, emailData) {
  console.log("🎨 Creating pre-processed card for type:", preProcessedData.type);
  
  // Special handling for travel - show full comparison data from cache
  if (preProcessedData.type === 'travel') {
    return createCachedTravelCard(preProcessedData, gmailMessage, emailData);
  }
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("⚡ Auto-Processed")
        .setSubtitle(`${preProcessedData.type} detected & processed`)
        .setImageUrl(ICON_URL)
    )
    .setName("pre_processed_card");

  // Add auto-processing indicator
  const statusSection = CardService.newCardSection()
    .setHeader("🤖 Automatically Processed")
    .addWidget(
      CardService.newTextParagraph().setText(
        "✅ <b>This email was automatically processed when it arrived!</b><br><br>" +
        "Your data has been extracted and is ready to view in your dashboard."
      )
    );
  
  card.addSection(statusSection);

  // Show type-specific processed data
  switch (preProcessedData.type) {
    case 'receipt':
      addReceiptPreProcessedSection(card, preProcessedData);
      break;
    case 'job_application':
      addJobPreProcessedSection(card, preProcessedData);
      break;
    default:
      addGenericPreProcessedSection(card, preProcessedData);
  }

  // Add dashboard link
  const actionSection = CardService.newCardSection();
  const userEmail = Session.getActiveUser().getEmail();
  let dashboardUrl;
  
  switch (preProcessedData.type) {
    case 'receipt':
      dashboardUrl = `${BASE_URL}/expenses?from=gmail&messageId=${emailData.messageId}&email=${encodeURIComponent(userEmail)}`;
      break;
    case 'job_application':
      dashboardUrl = `${BASE_URL}/jobs?from=gmail&messageId=${emailData.messageId}&email=${encodeURIComponent(userEmail)}`;
      break;
    default:
      dashboardUrl = `${BASE_URL}/dashboard?from=gmail&messageId=${emailData.messageId}&email=${encodeURIComponent(userEmail)}`;
  }
  
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("View in Dashboard")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(dashboardUrl)
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  card.addSection(actionSection);
  return card.build();
}

// ============================================================================
// GENERIC PRE-PROCESSED SECTIONS
// ============================================================================

function addGenericPreProcessedSection(card, data) {
  const section = CardService.newCardSection()
    .setHeader("📧 Email Processed");
  
  section.addWidget(
    CardService.newTextParagraph().setText(
      `✅ <strong>Email classified as:</strong> ${data.type}<br><br>` +
      "Your email has been automatically processed and the relevant data has been extracted."
    )
  );
  
  card.addSection(section);
} 