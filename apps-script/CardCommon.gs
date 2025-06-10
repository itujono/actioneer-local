// CardCommon.js - Common UI Components for Actioneer Gmail Add-on
// Debug utilities and smart actions that are shared across all categories

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
          webAppUrl = `${BASE_URL}/expenses?from=gmail&messageId=${messageId}&email=${encodeURIComponent(
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