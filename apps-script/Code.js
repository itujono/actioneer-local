// Code.js - Main Gmail Add-on Logic
// Core functionality for the Actioneer Gmail Add-on
// Test functions are located in Tests.gs

const BASE_URL = "https://stellar-quokka-a92bb9.netlify.app";
const BACKEND_API_URL = PropertiesService.getScriptProperties().getProperty("BACKEND_API_URL");
const SUPABASE_ANON_KEY = PropertiesService.getScriptProperties().getProperty("SUPABASE_ANON_KEY");
const MASTER_API_KEY = PropertiesService.getScriptProperties().getProperty("MASTER_API_KEY");
const ICON_URL = "https://raw.githubusercontent.com/itujono/test-widget/refs/heads/main/assets/images/logo.png"

function getSupabaseHeaders(includeApiKey = false) {
  const headers = {
    "Content-Type": "application/json",
  };

  // Always include Supabase anon key for Edge Functions
  if (SUPABASE_ANON_KEY) {
    headers["apikey"] = SUPABASE_ANON_KEY;

    if (!includeApiKey) {
      headers["Authorization"] = "Bearer " + SUPABASE_ANON_KEY;
    }
  }

  if (includeApiKey) {
    const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    if (userApiKey) {
      headers["Authorization"] = "Bearer " + userApiKey;
    }
  }

  return headers;
}

function getMasterKeyHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  // Include Supabase anon key (required for Edge Functions)
  if (SUPABASE_ANON_KEY) {
    headers["apikey"] = SUPABASE_ANON_KEY;
  }

  // Include master API key using custom header to avoid JWT validation
  // DO NOT include Authorization header to avoid Supabase JWT validation
  if (MASTER_API_KEY) {
    headers["X-Master-Key"] = MASTER_API_KEY;
  }

  return headers;
}

// NEW: Special headers for Edge Functions that use our custom API key auth
function getEdgeFunctionHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  // Include Supabase anon key (required for Edge Functions)
  if (SUPABASE_ANON_KEY) {
    headers["apikey"] = SUPABASE_ANON_KEY;
  }

  // Include user API key in Authorization header for our custom auth
  const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
  if (userApiKey) {
    headers["Authorization"] = "Bearer " + userApiKey;
  }

  return headers;
}

function onGmailMessage(e) {
  console.log("=== GMAIL ADD-ON TRIGGERED ===");
  console.log("Event object:", JSON.stringify(e, null, 2));

  try {
    if (!e || !e.messageMetadata) {
      console.error("❌ Missing event or messageMetadata");
      return [
        createDebugCard("Missing event data", "No messageMetadata found"),
      ];
    }

    const messageId = e.messageMetadata.messageId;
    const accessToken = e.messageMetadata.accessToken;

    console.log("📧 Processing email:", messageId);
    console.log("🔑 Access token available:", !!accessToken);

    console.log("📥 Fetching email content...");
    const gmailMessage = GmailApp.getMessageById(messageId);
    
    if (!gmailMessage) {
      console.error("❌ Failed to get Gmail message");
      return [
        createDebugCard(
          "Email Fetch Failed",
          "Could not retrieve Gmail message"
        ),
      ];
    }
    
    const emailData = getEmailContent(messageId, accessToken);

    if (!emailData) {
      console.error("❌ Failed to get email content");
      return [
        createDebugCard(
          "Email Fetch Failed",
          "Could not retrieve email content"
        ),
      ];
    }

    console.log("🔐 Ensuring user API key...");
    const userApiKey = ensureUserApiKey();

    if (!userApiKey) {
      console.error("❌ Failed to get or generate user API key");
      return [
        createDebugCard("API Key Failed", "Could not generate user API key"),
      ];
    }

    console.log("✅ User API key obtained");

    console.log("🤖 Classifying email...");
    const classification = classifyEmail(emailData, userApiKey);

    if (!classification) {
      console.error("❌ Classification failed");
      return [
        createDebugCard(
          "Classification Failed",
          "Backend classification returned null"
        ),
      ];
    }

    console.log(
      "🎯 Classification result:",
      JSON.stringify(classification, null, 2)
    );

    // Auto-process based on classification
    if (classification.type === "receipt") {
      console.log("💰 Receipt detected - auto-processing...");
      const card = createReceiptProcessedCard(gmailMessage, emailData);
      console.log("🎨 Receipt processed card created successfully");
      return [card];
    } else if (classification.type === "travel") {
      console.log("✈️ Travel email detected - auto-processing...");
      const card = createTravelProcessedCard(gmailMessage, emailData);
      return [card];
    } else if (classification.type === "job") {
      console.log("💼 Job email detected - auto-processing...");
      const card = createJobProcessedCard(gmailMessage, emailData);
      return [card];
    } else {
      // Fallback to action buttons for unhandled types
      if (!classification.actions || classification.actions.length === 0) {
        console.log("ℹ️ No smart actions available for this email");
        return [
          createDebugCard(
            "No Actions",
            `Email classified as: ${classification.type || "unknown"}`
          ),
        ];
      }

      console.log(`✅ Found ${classification.actions.length} smart actions`);
      const card = createSmartActionsCard(classification, messageId);
      console.log("🎨 Smart actions card created successfully");
      return [card];
    }
  } catch (error) {
    console.error("💥 Critical error in onGmailMessage:", error);
    console.error("Error stack:", error.stack);

    return [
      createDebugCard(
        "Critical Error",
        error.message || "Unknown error occurred"
      ),
    ];
  }
}

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

function runQuickTestFromCard() {
  console.log("🚀 Running quick test from card...");

  try {
    // Call quickTest() function from Tests.gs
    quickTest();

    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification().setText(
          "Quick test completed - check Apps Script logs"
        )
      )
      .build();
  } catch (error) {
    console.error("Quick test error:", error);

    return CardService.newActionResponseBuilder()
      .setNotification(
        CardService.newNotification().setText(
          "Quick test failed - check Apps Script logs"
        )
      )
      .build();
  }
}

function ensureUserApiKey() {
  try {
    let userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");

    if (userApiKey) {
      console.log("Using existing user API key");
      if (validateUserApiKey(userApiKey)) {
        return userApiKey;
      } else {
        console.log("Existing API key is invalid, generating new one...");
        PropertiesService.getUserProperties().deleteProperty("USER_API_KEY");
      }
    }

    console.log("Generating new user API key...");
    const userEmail = Session.getActiveUser().getEmail();
    const userName = userEmail.split("@")[0]; // Use email prefix as name
    userApiKey = generateUserApiKey(userEmail, userName);

    if (userApiKey) {
      PropertiesService.getUserProperties().setProperty(
        "USER_API_KEY",
        userApiKey
      );
      console.log("User API key generated and stored successfully");
      return userApiKey;
    }

    console.error("Failed to generate user API key");
    return null;
  } catch (error) {
    console.error("Error ensuring user API key:", error);
    return null;
  }
}

function validateUserApiKey(apiKey) {
  try {
    const response = UrlFetchApp.fetch(
      `${BACKEND_API_URL}/auth/validate-user-key`,
      {
        method: "POST",
        headers: getSupabaseHeaders(),
        payload: JSON.stringify({
          api_key: apiKey,
        }),
      }
    );

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      return result.valid;
    } else {
      console.error("API key validation failed:", response.getContentText());
      return false;
    }
  } catch (error) {
    console.error("Error validating API key:", error);
    return false;
  }
}

function generateUserApiKey(userEmail, userName) {
  try {
    const response = UrlFetchApp.fetch(
      `${BACKEND_API_URL}/auth/generate-user-key`,
      {
        method: "POST",
        headers: getMasterKeyHeaders(),
        payload: JSON.stringify({
          email: userEmail,
          name: userName,
        }),
      }
    );

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      if (result.success) {
        console.log(
          `User ${result.created ? "created" : "found"}: ${result.message}`
        );
        return result.api_key;
      } else {
        console.error("Failed to generate user API key:", result.error);
        return null;
      }
    } else {
      console.error(
        "Failed to generate user API key:",
        response.getContentText()
      );
      return null;
    }
  } catch (error) {
    console.error("Error generating user API key:", error);
    return null;
  }
}

function getEmailContent(messageId, accessToken) {
  try {
    console.log("🔍 Getting email content for messageId:", messageId);

    // Use Gmail Apps Script service instead of direct API calls
    // This automatically handles authentication
    const message = GmailApp.getMessageById(messageId);

    if (!message) {
      console.error("❌ Message not found with ID:", messageId);
      return null;
    }

    console.log("📧 Gmail message retrieved successfully");

    const subject = message.getSubject();
    const from = message.getFrom();
    const date = message.getDate().toISOString();
    const body = message.getPlainBody() || message.getBody();

    console.log("📧 Extracted subject:", subject);
    console.log("📧 Extracted from:", from);
    console.log("📧 Body length:", body.length);

    const result = {
      messageId,
      subject,
      from,
      date,
      body,
    };

    console.log("✅ Email content extracted successfully");
    return result;
  } catch (error) {
    console.error("💥 Error fetching email:", error);
    console.error("Error details:", error.message);
    console.error("Error stack:", error.stack);
    return null;
  }
}

function classifyEmail(emailData, userApiKey) {
  if (!emailData || !userApiKey) return null;

  try {
    const payload = {
      messageId: emailData.messageId,
      subject: emailData.subject,
      from: emailData.from,
      body: emailData.body,
      date: emailData.date,
    };

    const response = UrlFetchApp.fetch(`${BACKEND_API_URL}/classify-email`, {
      method: "POST",
      headers: getEdgeFunctionHeaders(), // Use the new Edge Function headers
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    } else {
      console.error("Classification failed:", response.getContentText());

      if (response.getResponseCode() === 401) {
        console.log("API key invalid, clearing stored key");
        PropertiesService.getUserProperties().deleteProperty("USER_API_KEY");
      }

      return null;
    }
  } catch (error) {
    console.error("Error classifying email:", error);
    return null;
  }
}

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

function handleTrackExpense(e) {
  const messageId = e.parameters.messageId;
  const actionData = JSON.parse(e.parameters.actionData);

  console.log("💰 Tracking expense for messageId:", messageId);

  try {
    const message = GmailApp.getMessageById(messageId);
    if (!message) {
      throw new Error("Could not find email message");
    }

    const expenseData = extractExpenseFromEmail(message);

    // Process the expense data (optional - call backend if you have an expenses endpoint)
    // const result = processExpense(expenseData, userApiKey);

    const amount = expenseData.amount || "Unknown";
    const merchant = expenseData.merchant || "Unknown Merchant";
    const currency = expenseData.currency || "$";

    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("✅ Expense Tracked"))
      .addSection(
        CardService.newCardSection()
          .addWidget(
            CardService.newTextParagraph().setText(
              `<b>Amount:</b> ${currency}${amount}<br>` +
                `<b>Merchant:</b> ${merchant}<br>` +
                `<b>Date:</b> ${message
                  .getDate()
                  .toLocaleDateString()}<br><br>` +
                `<i>Expense has been recorded successfully!</i>`
            )
          )
          .addWidget(
            CardService.newTextButton()
              .setText("View All Expenses")
              .setOpenLink(
                CardService.newOpenLink()
                  .setUrl(`${BASE_URL}/expenses`)
                  .setOpenAs(CardService.OpenAs.OVERLAY)
              )
          )
      )
      .build();
  } catch (error) {
    console.error("💥 Error tracking expense:", error);

    return CardService.newCardBuilder()
      .setHeader(CardService.newCardHeader().setTitle("❌ Error"))
      .addSection(
        CardService.newCardSection().addWidget(
          CardService.newTextParagraph().setText(
            `Failed to track expense: ${error.message}`
          )
        )
      )
      .build();
  }
}

function extractExpenseFromEmail(message) {
  const subject = message.getSubject();
  const body = message.getPlainBody() || message.getBody();
  const from = message.getFrom();

  let expenseData = {
    amount: null,
    currency: "$",
    merchant: null,
    date: message.getDate().toISOString(),
    description: subject,
    category: "receipt",
  };

  if (subject.toLowerCase().includes("vercel")) {
    expenseData.merchant = "Vercel Inc.";
  } else if (subject.toLowerCase().includes("amazon")) {
    expenseData.merchant = "Amazon";
  } else if (subject.toLowerCase().includes("uber")) {
    expenseData.merchant = "Uber";
  } else if (from.includes("@")) {
    const domain = from.split("@")[1].split(".")[0];
    expenseData.merchant = domain.charAt(0).toUpperCase() + domain.slice(1);
  }

  const amountPatterns = [
    /\$(\d+\.?\d*)/g, // $20.00, $20
    /(\d+\.?\d*)\s*USD/gi, // 20.00 USD
    /total[:\s]*\$?(\d+\.?\d*)/gi, // Total: $20.00
    /amount[:\s]*\$?(\d+\.?\d*)/gi, // Amount: $20.00
    /charged[:\s]*\$?(\d+\.?\d*)/gi, // Charged: $20.00
    /paid[:\s]*\$?(\d+\.?\d*)/gi, // Paid: $20.00
  ];

  const textToSearch = subject + " " + body;

  for (const pattern of amountPatterns) {
    const matches = textToSearch.match(pattern);
    if (matches && matches.length > 0) {
      const numericMatch = matches[0].match(/(\d+\.?\d*)/);
      if (numericMatch) {
        expenseData.amount = parseFloat(numericMatch[1]);
        console.log("💰 Found amount:", expenseData.amount);
        break;
      }
    }
  }

  if (!expenseData.amount) {
    const generalPattern = /(\d+\.?\d*)/g;
    const numbers = textToSearch.match(generalPattern);
    if (numbers && numbers.length > 0) {
      for (const num of numbers) {
        const amount = parseFloat(num);
        if (amount >= 1 && amount <= 10000) {
          expenseData.amount = amount;
          console.log("💰 Found general amount:", expenseData.amount);
          break;
        }
      }
    }
  }

  console.log("✅ Final expense data:", JSON.stringify(expenseData, null, 2));
  return expenseData;
}

function processExpense(expenseData, userApiKey) {
  try {
    const response = UrlFetchApp.fetch(`${BACKEND_API_URL}/expenses`, {
      method: "POST",
      headers: getEdgeFunctionHeaders(),
      payload: JSON.stringify(expenseData),
    });

    return JSON.parse(response.getContentText());
  } catch (error) {
    console.error("Error processing expense:", error);
    return null;
  }
}

function getUserProfile() {
  const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
  if (!userApiKey) {
    console.error("No API key found");
    return null;
  }

  try {
    const response = UrlFetchApp.fetch(`${BACKEND_API_URL}/auth/profile`, {
      method: "GET",
      headers: getEdgeFunctionHeaders(),
    });

    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    } else {
      console.error("Failed to get user profile:", response.getContentText());
      return null;
    }
  } catch (error) {
    console.error("Error getting user profile:", error);
    return null;
  }
}

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
        .setSubtitle("Price comparison ready")
        .setImageUrl(ICON_URL)
    )
    .setName("travel_processed_card");

  if (travelComparison && travelComparison.comparisons && travelComparison.comparisons.length > 0) {
    // Show travel data extracted
    const travelInfoSection = CardService.newCardSection()
      .setHeader("🎯 Travel Details Detected");
    
    const travelData = travelComparison.travelData;
    let travelInfo = "";
    
    if (travelData.type) {
      travelInfo += `<b>Type:</b> ${travelData.type.charAt(0).toUpperCase() + travelData.type.slice(1)}<br>`;
    }
    if (travelData.destination) {
      travelInfo += `<b>Destination:</b> ${travelData.destination}<br>`;
    }
    if (travelData.origin && travelData.type === 'flight') {
      travelInfo += `<b>From:</b> ${travelData.origin}<br>`;
    }
    if (travelData.departureDate || travelData.checkInDate) {
      const date = travelData.departureDate || travelData.checkInDate;
      travelInfo += `<b>Date:</b> ${new Date(date).toLocaleDateString()}<br>`;
    }
    if (travelData.travelers || travelData.guests) {
      const count = travelData.travelers || travelData.guests;
      travelInfo += `<b>Travelers:</b> ${count}<br>`;
    }
    
    travelInfoSection.addWidget(
      CardService.newTextParagraph().setText(travelInfo)
    );
    
    card.addSection(travelInfoSection);
    
    // Show price comparisons
    const comparisonSection = CardService.newCardSection()
      .setHeader(`💰 ${travelData.type === 'flight' ? 'Flight' : travelData.type === 'hotel' ? 'Hotel' : 'Travel'} Price Comparison`);
    
    travelComparison.comparisons.slice(0, 3).forEach((comparison, index) => {
      let comparisonText = "";
      
      if (travelData.type === 'flight') {
        comparisonText = `<b>${comparison.airline || comparison.provider}</b><br>` +
                        `<font color="#1a73e8"><b>${comparison.currency} ${comparison.price}</b></font><br>` +
                        `<font color="#5f6368">${comparison.duration} • ${comparison.stops} stops</font>`;
      } else if (travelData.type === 'hotel') {
        comparisonText = `<b>${comparison.hotelName || comparison.name}</b><br>` +
                        `<font color="#1a73e8"><b>${comparison.currency} ${comparison.price}/night</b></font><br>` +
                        `<font color="#5f6368">⭐ ${comparison.rating} • ${comparison.location}</font>`;
      } else {
        comparisonText = `<b>${comparison.name}</b><br>` +
                        `<font color="#1a73e8"><b>${comparison.currency || ''} ${comparison.price}</b></font><br>` +
                        `<font color="#5f6368">${comparison.description || comparison.category}</font>`;
      }
      
      comparisonSection.addWidget(
        CardService.newTextParagraph().setText(comparisonText)
      );
      
      if (comparison.bookingUrl) {
        comparisonSection.addWidget(
          CardService.newTextButton()
            .setText(`Book with ${comparison.provider || comparison.airline || 'Provider'}`)
            .setOpenLink(
              CardService.newOpenLink()
                .setUrl(comparison.bookingUrl)
                .setOpenAs(CardService.OpenAs.FULL_SIZE)
            )
        );
      }
      
      // Add separator except for last item
      if (index < Math.min(travelComparison.comparisons.length - 1, 2)) {
        comparisonSection.addWidget(
          CardService.newTextParagraph().setText("<hr>")
        );
      }
    });
    
    card.addSection(comparisonSection);
  } else {
    // Fallback if comparison fails
    const section = CardService.newCardSection()
      .addWidget(
        CardService.newTextParagraph().setText(
          "🔍 <b>Travel email detected!</b><br><br>" +
          "We're analyzing your travel details and will show price comparisons shortly.<br><br>" +
          "In the meantime, you can:"
        )
      );
    
    card.addSection(section);
  }

  // Always add travel dashboard button
  const actionSection = CardService.newCardSection();
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("View Travel Dashboard")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(`${BASE_URL}/travel?from=gmail&messageId=${emailData.messageId}&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`)
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );
  
  card.addSection(actionSection);
  return card.build();
}

/**
 * Auto-process job email
 */
function createJobProcessedCard(gmailMessage, emailData) {
  console.log("💼 Auto-processing job email...");
  
  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("💼 Job Parsed")
        .setSubtitle("Opportunity tracked")
        .setImageUrl(ICON_URL)
    )
    .setName("job_processed_card");

  // TODO: Add job processing
  const section = CardService.newCardSection()
    .addWidget(
      CardService.newTextParagraph().setText(
        "🚧 <b>Job auto-processing coming soon!</b><br><br>" +
        "We detected this is a job-related email. Soon we'll automatically extract:<br>" +
        "• Company details<br>" +
        "• Position information<br>" +
        "• Application status<br>" +
        "• Interview schedules"
      )
    )
    .addWidget(
      CardService.newTextButton()
        .setText("View Job Tracker")
        .setOpenLink(
          CardService.newOpenLink()
            .setUrl(`${BASE_URL}/jobs?from=gmail&messageId=${emailData.messageId}`)
            .setOpenAs(CardService.OpenAs.OVERLAY)
        )
    );

  card.addSection(section);
  return card.build();
}

function getRecentExpenses() {
  try {
    const response = UrlFetchApp.fetch(`${BACKEND_API_URL}/expenses/recent`, {
      method: "GET",
      headers: getEdgeFunctionHeaders(),
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      return result.expenses || [];
    } else {
      console.log("No recent expenses found or endpoint not available");
      return [];
    }
  } catch (error) {
    console.error("Error fetching recent expenses:", error);
    return [];
  }
}

/**
 * Get travel comparison data from backend
 */
function getTravelComparison(emailData) {
  try {
    const userApiKey = ensureUserApiKey();
    if (!userApiKey) {
      console.error("No API key found for travel comparison");
      return null;
    }

    const payload = {
      emailId: emailData.messageId,
      messageId: emailData.messageId,
      emailBody: emailData.body,
      subject: emailData.subject,
      from: emailData.from
    };

    console.log("🔍 Requesting travel comparison...");
    console.log("🌐 BACKEND_API_URL:", BACKEND_API_URL);
    console.log("🎯 Full URL:", `${BACKEND_API_URL}/travel-v2`);
    
    // Headers required for Supabase Edge Functions
    const headers = {
      "Content-Type": "application/json",
      "apikey": SUPABASE_ANON_KEY, // Required for Edge Functions
      "Authorization": `Bearer ${SUPABASE_ANON_KEY}`, // Use anon key for platform auth
      "x-user-api-key": userApiKey // User API key in custom header
    };
    
    console.log("📋 Headers being sent:", JSON.stringify(headers, null, 2));
    console.log("🔑 User API key:", userApiKey ? userApiKey.substring(0, 10) + "..." : "MISSING");
    
    const response = UrlFetchApp.fetch(`${BACKEND_API_URL}/travel-v2`, {
      method: "POST",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      console.log("✅ Travel comparison received:", JSON.stringify(result, null, 2));
      return result;
    } else {
      console.error("Travel comparison failed:", response.getContentText());
      return null;
    }
  } catch (error) {
    console.error("Error getting travel comparison:", error);
    return null;
  }
}