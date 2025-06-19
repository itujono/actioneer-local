// Code.js - Core Gmail Add-on Logic & Authentication
// Main entry point and core functionality for the Actioneer Gmail Add-on
// UI components are in CardBuilders.js, test functions are in Tests.gs

const BASE_URL = "https://actioneer.online";
const BACKEND_API_URL =
  PropertiesService.getScriptProperties().getProperty("BACKEND_API_URL");
const SUPABASE_ANON_KEY =
  PropertiesService.getScriptProperties().getProperty("SUPABASE_ANON_KEY");
const MASTER_API_KEY =
  PropertiesService.getScriptProperties().getProperty("MASTER_API_KEY");
const ICON_URL =
  "https://raw.githubusercontent.com/itujono/test-widget/refs/heads/main/assets/images/logo.png";

// ============================================================================
// HEADER UTILITIES
// ============================================================================

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
    const userApiKey =
      PropertiesService.getUserProperties().getProperty("USER_API_KEY");
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

// Special headers for Edge Functions that use our custom API key auth
function getEdgeFunctionHeaders() {
  const headers = {
    "Content-Type": "application/json",
  };

  // Include Supabase anon key (required for Edge Functions)
  if (SUPABASE_ANON_KEY) {
    headers["apikey"] = SUPABASE_ANON_KEY;
  }

  // Include user API key in Authorization header for our custom auth
  const userApiKey =
    PropertiesService.getUserProperties().getProperty("USER_API_KEY");
  if (userApiKey) {
    headers["Authorization"] = "Bearer " + userApiKey;
  }

  return headers;
}

// ============================================================================
// WEBHOOK ENDPOINT FOR SUPABASE INTEGRATION
// ============================================================================

/**
 * Webhook endpoint for Supabase to trigger email processing
 * This allows real-time processing when Gmail notifications are received
 */
function doPost(e) {
  console.log("=== WEBHOOK TRIGGERED ===");
  console.log("🔍 DEBUG: doPost function called at:", new Date().toISOString());
  
  try {
    const requestBody = JSON.parse(e.postData.contents);
    console.log("📦 Webhook payload:", JSON.stringify(requestBody, null, 2));
    
    const { userEmail, historyId, action } = requestBody;
    
    if (!userEmail) {
      console.error("❌ No userEmail provided in webhook");
      return ContentService.createTextOutput(JSON.stringify({
        success: false,
        error: "userEmail is required"
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    if (action === "process_recent_emails") {
      console.log("🔄 Processing recent emails for:", userEmail);
      const result = processRecentEmails(userEmail, historyId);
      
      return ContentService.createTextOutput(JSON.stringify({
        success: true,
        result: result,
        processedAt: new Date().toISOString()
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: "Unknown action: " + action
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (error) {
    console.error("💥 Webhook error:", error);
    return ContentService.createTextOutput(JSON.stringify({
      success: false,
      error: error.toString()
    })).setMimeType(ContentService.MimeType.JSON);
  }
}

/**
 * Process recent emails for a specific user
 * This function polls Gmail for recent unread emails and processes them
 */
function processRecentEmails(userEmail, historyId = null) {
  console.log("📨 Starting email processing for:", userEmail);
  
  // Cooldown mechanism - prevent rapid fire calls
  const lastProcessedKey = `last_processed_${userEmail}`;
  const lastProcessed = PropertiesService.getScriptProperties().getProperty(lastProcessedKey);
  const now = Date.now();
  
  // if (lastProcessed) {
  //   const timeSinceLastProcessed = now - parseInt(lastProcessed);
  //   const cooldownPeriod = 30000; // 30 seconds cooldown
    
  //   if (timeSinceLastProcessed < cooldownPeriod) {
  //     console.log(`⏰ Cooldown active. Last processed ${timeSinceLastProcessed}ms ago, need ${cooldownPeriod}ms`);
  //     return {
  //       success: false,
  //       error: "Cooldown period active",
  //       userEmail: userEmail,
  //       cooldownRemaining: cooldownPeriod - timeSinceLastProcessed
  //     };
  //   }
  // }
  
  // Set current timestamp
  PropertiesService.getScriptProperties().setProperty(lastProcessedKey, now.toString());
  
  try {
    // Get user API key for this email
    const userApiKey = getUserApiKeyByEmail(userEmail);
    if (!userApiKey) {
      console.error("❌ No API key found for user:", userEmail);
      return { error: "User API key not found", userEmail: userEmail };
    }
    
    console.log("✅ User API key found for:", userEmail);
    
    // For webhook mode, we need to use Gmail API instead of GmailApp
    let threads = [];
    let emailMessages = [];
    
    // Skip Gmail processing in webhook mode - we'll handle this differently
    console.log("📝 Note: Webhook mode detected - skipping Gmail polling for now");
    console.log("💡 Future: Gmail push notifications will trigger processing directly");
    
    return {
      success: true,
      processedCount: 0,
      jobApplicationsFound: 0,
      userEmail: userEmail,
      note: "Webhook received but Gmail processing requires interactive authorization",
      mode: "webhook"
    };
    
    let processedCount = 0;
    let jobApplicationsFound = 0;
    
    for (let i = 0; i < emailMessages.length; i++) {
      const emailData = emailMessages[i];
      const messageId = emailData.messageId;
      
      console.log(`📧 Processing message ${i + 1}/${emailMessages.length}: ${messageId}`);
      
      // Check if we've already processed this email
      const preProcessedData = getPreProcessedEmailData(messageId, userApiKey);
      if (preProcessedData) {
        console.log(`⏭️ Email ${messageId} already processed, skipping`);
        continue;
      }
      
      if (!emailData) {
        console.log(`⚠️ Could not extract content from message ${messageId}`);
        continue;
      }
      
      // Classify the email
      const classification = classifyEmail(emailData, userApiKey);
      if (!classification) {
        console.log(`⚠️ Could not classify message ${messageId}`);
        continue;
      }
      
      console.log(`🎯 Email ${messageId} classified as: ${classification.type}`);
      
      // DEBUG: Log detailed classification info
      console.log(`🔍 CLASSIFICATION DEBUG for ${messageId}:`);
      console.log(`📧 Subject: ${emailData.subject}`);
      console.log(`📬 From: ${emailData.from}`);
      console.log(`🎯 Classification result:`, JSON.stringify(classification, null, 2));
      
      // Process based on classification
      if (classification.type === "other") {
        console.log("🚫 Email classified as 'other' - skipping processing (not worth our time)");
        // Early exit - we don't care about "other" emails
        continue;
      } else if (classification.type === "job_application") {
        console.log("💼 Processing job application email...");
        try {
          processJobApplicationInBackground(emailData, userApiKey);
          jobApplicationsFound++;
          console.log(`✅ Job application processed for email ${messageId}`);
        } catch (error) {
          console.error(`❌ Error processing job application ${messageId}:`, error);
        }
      } else if (classification.type === "travel") {
        console.log("✈️ Travel email found - could be processed in future");
        // TODO: Add travel processing when ready
      } else if (classification.type === "receipt") {
        console.log("💰 Processing receipt email...");
        console.log(`💰 DEBUG: About to call processReceiptInBackground for ${messageId}`);
        try {
          processReceiptInBackground(emailData, userApiKey);
          console.log(`✅ Receipt processed for email ${messageId}`);
        } catch (error) {
          console.error(`❌ Error processing receipt ${messageId}:`, error);
        }
      }
      
      processedCount++;
    }
    
    console.log(`🎉 Processing complete! Processed ${processedCount} emails, found ${jobApplicationsFound} job applications`);
    
    return {
      success: true,
      processedCount: processedCount,
      jobApplicationsFound: jobApplicationsFound,
      userEmail: userEmail,
      searchQuery: 'is:unread newer_than:2h'
    };
    
  } catch (error) {
    console.error("💥 Error in processRecentEmails:", error);
    return {
      success: false,
      error: error.toString(),
      userEmail: userEmail
    };
  }
}

/**
 * Get recent emails using Gmail API directly
 * This works better than GmailApp in webhook mode
 */
function getRecentEmailsViaAPI(accessToken) {
  try {
    // First try a broader search to see if we get any emails at all
    console.log('🔍 DEBUG: Starting Gmail API search...');
    console.log('🔑 DEBUG: OAuth token available:', !!accessToken);
    
    // Search for recent unread emails (last 10 minutes only - webhook should be real-time)
    const query = 'is:unread newer_than:10m';
    const url = `https://gmail.googleapis.com/gmail/v1/users/me/messages?q=${encodeURIComponent(query)}&maxResults=2`;
    
    console.log('📡 DEBUG: Gmail API URL:', url);
    console.log('🔍 DEBUG: Search query:', query);
    
    const response = UrlFetchApp.fetch(url, {
      method: 'GET',
      headers: {
        'Authorization': 'Bearer ' + accessToken,
        'Content-Type': 'application/json'
      }
    });
    
    console.log('📊 DEBUG: Gmail API response code:', response.getResponseCode());
    
    if (response.getResponseCode() !== 200) {
      console.error('Gmail API error:', response.getContentText());
      return [];
    }
    
    const data = JSON.parse(response.getContentText());
    const messages = data.messages || [];
    
    console.log('📬 DEBUG: Raw Gmail API response:', JSON.stringify(data, null, 2));
    console.log(`Found ${messages.length} recent email message IDs`);
    
    // If no unread emails found, just log it - don't do another search
    if (messages.length === 0) {
      console.log('📭 No unread emails found in last 10 minutes (this is normal)');
    }
    
    // Get full content for each message (reduce to 1 for testing to save quota)
    const emailMessages = [];
    for (const message of messages.slice(0, 1)) { // Limit to 1 to conserve Gmail API quota
      const emailContent = getEmailContent(message.id, accessToken);
      if (emailContent) {
        emailMessages.push(emailContent);
      }
    }
    
    return emailMessages;
  } catch (error) {
    console.error('Error fetching emails via API:', error);
    return [];
  }
}

/**
 * Helper function to get user API key by email
 * Works for both interactive and webhook modes
 */
function getUserApiKeyByEmail(userEmail) {
  console.log("🔍 DEBUG: getUserApiKeyByEmail called for:", userEmail);
  
  try {
    // First, try to get the current user's API key (for interactive mode)
    const currentUserEmail = Session.getActiveUser().getEmail();
    
    if (userEmail.toLowerCase() === currentUserEmail.toLowerCase()) {
      const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
      if (userApiKey) {
        console.log("✅ Found API key for current user:", userEmail);
        return userApiKey;
      }
    }
  } catch (error) {
    // Session.getActiveUser() fails in webhook mode - this is expected
    console.log("📝 No active user session (webhook mode) - looking up API key for:", userEmail);
  }
  
  // For webhook mode, we need to get the API key for the specific user
  // Since we can't access other users' properties, we'll use the deployment user's API key
  // This assumes the Apps Script is deployed by the same user receiving emails
  try {
    const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    if (userApiKey) {
      console.log("✅ Using deployment user's API key for webhook processing:", userEmail);
      return userApiKey;
    } else {
      console.log("❌ No API key found in user properties - generating one...");
      // Try to generate an API key
      const newApiKey = ensureUserApiKey();
      if (newApiKey) {
        console.log("✅ Generated new API key for webhook processing");
        return newApiKey;
      }
    }
  } catch (error) {
    console.error("❌ Error accessing user properties:", error);
  }
  
  console.log("❌ Cannot find or generate API key for user:", userEmail);
  return null;
}

/**
 * Extract email content from a Gmail message object
 * This is similar to getEmailContent but works with message objects directly
 */
function getEmailContentFromMessage(message) {
  try {
    const subject = message.getSubject();
    const date = message.getDate();
    const sender = message.getFrom();
    const body = message.getPlainBody();
    
    return {
      messageId: message.getId(),
      subject: subject,
      from: sender,
      date: date.toISOString(),
      body: body
    };
  } catch (error) {
    console.error("Error extracting email content:", error);
    return null;
  }
}

// ============================================================================
// DEBUG FUNCTION - Remove after testing
// ============================================================================

function debugConfiguration() {
  console.log("=== DEBUG CONFIGURATION ===");
  console.log("BACKEND_API_URL:", BACKEND_API_URL);
  console.log("SUPABASE_ANON_KEY available:", !!SUPABASE_ANON_KEY);
  console.log("Current time:", new Date().toISOString());
  
  try {
    const userEmail = Session.getActiveUser().getEmail();
    console.log("Active user:", userEmail);
  } catch (e) {
    console.log("No active user session");
  }
  
  return {
    backendUrl: BACKEND_API_URL,
    hasSupabaseKey: !!SUPABASE_ANON_KEY,
    timestamp: new Date().toISOString()
  };
}

// ============================================================================
// MAIN GMAIL ADD-ON ENTRY POINT
// ============================================================================

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

    // First, check if we have pre-processed data for this email
    const preProcessedData = getPreProcessedEmailData(messageId, userApiKey);

    if (preProcessedData) {
      console.log("⚡ Found pre-processed data:", preProcessedData.type);
      return [
        createPreProcessedCard(preProcessedData, gmailMessage, emailData),
      ];
    }

    console.log("🤖 No pre-processed data found, classifying email...");
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
      
      // Trigger backend receipt processing
      try {
        processReceiptInBackground(emailData, userApiKey);
        console.log("✅ Backend receipt processing triggered");
      } catch (error) {
        console.error("❌ Backend receipt processing failed:", error);
      }
      
      const card = createReceiptProcessedCard(gmailMessage, emailData);
      console.log("🎨 Receipt processed card created successfully");
      return [card];
    } else if (classification.type === "travel") {
      console.log("✈️ Travel email detected - auto-processing...");
      const card = createTravelProcessedCard(gmailMessage, emailData);
      return [card];
    } else if (classification.type === "job_application") {
      console.log("💼 Job application email detected - auto-processing...");

      // Trigger backend job processing
      try {
        processJobApplicationInBackground(emailData, userApiKey);
      } catch (error) {
        console.error("Background job processing failed:", error);
      }

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

      const card = createSmartActionsCard(classification, messageId);
      console.log("🎨 Smart actions card created successfully");
      return [card];
    }
  } catch (error) {
    console.error("💥 Critical error in onGmailMessage:", error);

    return [
      createDebugCard(
        "Critical Error",
        error.message || "Unknown error occurred"
      ),
    ];
  }
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

// ============================================================================
// AUTHENTICATION & API KEY MANAGEMENT
// ============================================================================

function ensureUserApiKey() {
  try {
    let userApiKey =
      PropertiesService.getUserProperties().getProperty("USER_API_KEY");

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
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
    };

    const response = UrlFetchApp.fetch(`${BACKEND_API_URL}/auth`, {
      method: "POST",
      headers: headers,
      payload: JSON.stringify({
        action: "validate",
        api_key: apiKey,
      }),
      muteHttpExceptions: true,
    });

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
    console.log("🔑 MASTER_API_KEY available:", !!MASTER_API_KEY);
    console.log("📧 User email:", userEmail);
    console.log("👤 User name:", userName);

    if (!MASTER_API_KEY) {
      console.error("❌ No MASTER_API_KEY available");
      return null;
    }

    // Use X-Master-Key header approach that works with --no-verify-jwt
    const headers = {
      "Content-Type": "application/json",
      "X-Master-Key": MASTER_API_KEY,
    };

    const payload = {
      email: userEmail,
      name: userName,
    };

    console.log("📡 Making request to:", `${BACKEND_API_URL}/auth`);

    const response = UrlFetchApp.fetch(`${BACKEND_API_URL}/auth`, {
      method: "POST",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    console.log("📨 Response code:", responseCode);
    console.log("📨 Response text:", responseText);

    if (responseCode === 200) {
      const result = JSON.parse(responseText);
      if (result.success) {
        console.log(
          `✅ User ${result.created ? "created" : "found"}: ${result.message}`
        );
        return result.api_key;
      } else {
        console.error("Failed to generate user API key:", result.error);
        return null;
      }
    } else {
      console.error("Failed to generate user API key:", responseText);
      return null;
    }
  } catch (error) {
    console.error("Error generating user API key:", error);
    return null;
  }
}

function getUserProfile() {
  const userApiKey =
    PropertiesService.getUserProperties().getProperty("USER_API_KEY");
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

// ============================================================================
// GMAIL WATCH SETUP
// ============================================================================

/**
 * Set up Gmail watch for push notifications
 * Call this once to enable automatic email processing
 */
function setupGmailWatch() {
  try {
    console.log("🔔 Setting up Gmail watch for push notifications...");

    const userEmail = Session.getActiveUser().getEmail();
    console.log("👤 Setting up watch for:", userEmail);

    // Check if watch already exists
    const existingWatch = checkExistingWatch();
    if (existingWatch) {
      console.log("✅ Gmail watch already exists:", existingWatch.historyId);
      return {
        success: true,
        message: "Gmail watch already active",
        historyId: existingWatch.historyId,
      };
    }

    console.log("📡 Creating Gmail watch...");

    // Use UrlFetchApp instead of Gmail Advanced Service to avoid JSON parsing issues
    const accessToken = ScriptApp.getOAuthToken();
    const url = "https://gmail.googleapis.com/gmail/v1/users/me/watch";

    const payload = {
      topicName: "projects/actioneer-462117/topics/gmail-notifications",
    };

    const options = {
      method: "POST",
      headers: {
        Authorization: "Bearer " + accessToken,
        "Content-Type": "application/json",
      },
      payload: JSON.stringify(payload),
    };

    console.log("🔗 Making direct API call to:", url);
    console.log("📋 Payload:", JSON.stringify(payload));

    const response = UrlFetchApp.fetch(url, options);
    const responseText = response.getContentText();

    console.log("📨 Response status:", response.getResponseCode());
    console.log("📨 Response:", responseText);

    if (response.getResponseCode() !== 200) {
      throw new Error(`Gmail API call failed: ${responseText}`);
    }

    const watchResponse = JSON.parse(responseText);

    console.log("✅ Gmail watch created successfully!");
    console.log("📊 History ID:", watchResponse.historyId);
    console.log("⏰ Expires:", new Date(parseInt(watchResponse.expiration)));

    // Store watch info for future reference
    PropertiesService.getUserProperties().setProperties({
      GMAIL_WATCH_HISTORY_ID: watchResponse.historyId,
      GMAIL_WATCH_EXPIRATION: watchResponse.expiration,
      GMAIL_WATCH_CREATED: new Date().toISOString(),
    });

    return {
      success: true,
      message: "Gmail watch created successfully",
      historyId: watchResponse.historyId,
      expiration: new Date(parseInt(watchResponse.expiration)),
    };
  } catch (error) {
    console.error("❌ Error setting up Gmail watch:", error);
    return {
      success: false,
      error: error.message || "Failed to set up Gmail watch",
    };
  }
}

/**
 * Check if Gmail watch already exists
 */
function checkExistingWatch() {
  try {
    const historyId = PropertiesService.getUserProperties().getProperty(
      "GMAIL_WATCH_HISTORY_ID"
    );
    const expiration = PropertiesService.getUserProperties().getProperty(
      "GMAIL_WATCH_EXPIRATION"
    );

    if (!historyId || !expiration) {
      return null;
    }

    // Check if watch has expired
    const expirationDate = new Date(parseInt(expiration));
    const now = new Date();

    if (expirationDate <= now) {
      console.log("⚠️ Gmail watch has expired, needs renewal");
      return null;
    }

    return {
      historyId: historyId,
      expiration: expirationDate,
    };
  } catch (error) {
    console.error("Error checking existing watch:", error);
    return null;
  }
}

/**
 * Stop Gmail watch
 */
function stopGmailWatch() {
  try {
    console.log("🛑 Stopping Gmail watch...");

    Gmail.Users.stop("me");

    // Clear stored watch info
    PropertiesService.getUserProperties().deleteProperty(
      "GMAIL_WATCH_HISTORY_ID"
    );
    PropertiesService.getUserProperties().deleteProperty(
      "GMAIL_WATCH_EXPIRATION"
    );
    PropertiesService.getUserProperties().deleteProperty("GMAIL_WATCH_CREATED");

    console.log("✅ Gmail watch stopped successfully");

    return {
      success: true,
      message: "Gmail watch stopped successfully",
    };
  } catch (error) {
    console.error("❌ Error stopping Gmail watch:", error);
    return {
      success: false,
      error: error.message || "Failed to stop Gmail watch",
    };
  }
}

/**
 * Get Gmail watch status
 */
function getGmailWatchStatus() {
  try {
    const existingWatch = checkExistingWatch();

    if (!existingWatch) {
      return {
        active: false,
        message: "No active Gmail watch found",
      };
    }

    const created = PropertiesService.getUserProperties().getProperty(
      "GMAIL_WATCH_CREATED"
    );

    return {
      active: true,
      historyId: existingWatch.historyId,
      expiration: existingWatch.expiration,
      created: created ? new Date(created) : null,
      message: "Gmail watch is active",
    };
  } catch (error) {
    console.error("Error getting watch status:", error);
    return {
      active: false,
      error: error.message || "Failed to get watch status",
    };
  }
}

// ============================================================================
// EMAIL PROCESSING & CLASSIFICATION
// ============================================================================

function getEmailContent(messageId, accessToken) {
  try {
    console.log("🔍 Getting email content for messageId:", messageId);

    // Check cache first to avoid duplicate API calls
    const emailCache = CacheService.getScriptCache();
    const emailCacheKey = `email_content_${messageId}`;
    const cachedContent = emailCache.get(emailCacheKey);
    
    if (cachedContent) {
      console.log("📦 Using cached email content for:", messageId);
      return JSON.parse(cachedContent);
    }

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

    // Cache the result for 1 hour to avoid re-fetching
    emailCache.put(emailCacheKey, JSON.stringify(result), 3600); // 1 hour cache

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

    // Hardcode the Supabase Edge Function URL
    const edgeFunctionUrl = "https://whnvhuusxtnuvkhgfxnu.supabase.co/functions/v1/classify-email";
    const response = UrlFetchApp.fetch(edgeFunctionUrl, {
      method: "POST",
      headers: getEdgeFunctionHeaders(), // Use the Edge Function headers
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 20000, // 20 second timeout
    });

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());

      // If backend classification succeeded, return it
      if (result && result.type && result.type !== "other") {
        return result;
      }

      // If backend returned 'other' or invalid result, try client-side fallback
      console.log(
        "🔄 Backend returned 'other', trying client-side fallback..."
      );
      const fallbackResult = classifyEmailClientSide(emailData);
      return fallbackResult || result; // Return fallback if better, otherwise original
    } else {
      console.error("Classification failed:", response.getContentText());

      if (response.getResponseCode() === 401) {
        console.log("API key invalid, clearing stored key");
        PropertiesService.getUserProperties().deleteProperty("USER_API_KEY");
      }

      // Try client-side fallback when backend fails
      console.log(
        "🔄 Backend classification failed, trying client-side fallback..."
      );
      return classifyEmailClientSide(emailData);
    }
  } catch (error) {
    console.error("Error classifying email:", error);

    // Try client-side fallback when there's an error
    console.log(
      "🔄 Backend classification error, trying client-side fallback..."
    );
    return classifyEmailClientSide(emailData);
  }
}

/**
 * Client-side pattern-based email classification
 */
function classifyEmailClientSide(emailData) {
  if (!emailData) return null;

  console.log("🔍 Client-side classification for:", emailData.subject);

  const subject = (emailData.subject || "").toLowerCase();
  const from = (emailData.from || "").toLowerCase();
  const body = (emailData.body || "").toLowerCase();

  // First, check for explicit exclusions that should NOT be job applications
  const jobExclusionPatterns = [
    // Job boards and alerts
    /indeed\.com/i,
    /linkedin\.com/i,
    /glassdoor\.com/i,
    /monster\.com/i,
    /ziprecruiter\.com/i,
    /careerbuilder\.com/i,
    /job alert/i,
    /job recommendation/i,
    /new jobs/i,
    /jobs matching/i,
    /job search/i,
    /career newsletter/i,
    /weekly jobs/i,
    /job digest/i,
    /hiring event/i,
    /career fair/i,
    /join our talent/i,
    /talent pool/i,
    /we're hiring/i,
    /now hiring/i,
    /open positions/i,
    /career opportunities/i,
    /would you be interested/i,
    /might be interested/i,
    /connection request/i,
    /invitation to connect/i,
    /unsubscribe/i,
    /marketing@/i,
    /newsletter@/i,
    /noreply@/i,
    /no-reply@/i,
  ];

  // Check if this email should be excluded from job classification
  const shouldExclude = jobExclusionPatterns.some(
    (pattern) => pattern.test(subject) || pattern.test(body) || pattern.test(from)
  );

  if (shouldExclude) {
    console.log("❌ Email excluded from job classification due to exclusion patterns");
    return {
      type: "other",
      confidence: 0.9,
      actions: [],
      method: "client-side-excluded",
    };
  }

  // More specific job application patterns (only if not excluded)
  const specificJobPatterns = [
    // Very specific application confirmations
    /thank\s+you\s+for\s+your\s+application\s+(?:for|to)/i,
    /we\s+have\s+received\s+your\s+application\s+for/i,
    /your\s+application\s+for\s+the\s+(?:position|role)\s+of/i,
    /application\s+received.*position/i,
    /application\s+confirmation.*position/i,
    
    // Interview specific patterns
    /interview\s+(?:invitation|request|scheduled|confirmation).*(?:position|role)/i,
    /(?:phone|video|zoom|teams)\s+interview.*(?:position|role)/i,
    /would\s+like\s+to\s+schedule.*interview/i,
    /interview\s+for\s+the\s+(?:position|role)\s+of/i,
    
    // Specific rejection patterns
    /unfortunately.*not\s+(?:selected|moving\s+forward|proceeding)/i,
    /regret\s+to\s+inform.*(?:position|application)/i,
    /decided\s+to\s+(?:proceed|move\s+forward)\s+with\s+(?:another|other)\s+candidate/i,
    /will\s+not\s+be\s+(?:moving\s+forward|proceeding)\s+with\s+your\s+application/i,
    
    // Offer patterns
    /(?:pleased|excited|happy)\s+to\s+(?:extend|offer).*(?:position|role)/i,
    /job\s+offer.*(?:position|role)/i,
    /offer\s+of\s+employment/i,
    /congratulations.*(?:selected|chosen|offered)/i,
    
    // Status update patterns (must be specific)
    /application\s+status\s+update.*(?:position|role)/i,
    /update\s+on\s+your\s+application\s+for/i,
    /status\s+of\s+your\s+application\s+for/i,
  ];

  // Check for specific job application patterns
  const hasSpecificJobPattern = specificJobPatterns.some(
    (pattern) => pattern.test(subject) || pattern.test(body)
  );

  // Additional context checks for job emails
  const hasJobContext = 
    // Must have job-related keywords AND application context
    (body.includes('application') || body.includes('applied')) &&
    (body.includes('position') || body.includes('role') || body.includes('job')) &&
    // Must be from a company domain (not common email providers)
    !/(gmail|yahoo|outlook|hotmail|aol|icloud)\.com/i.test(from) &&
    // Should have personal context (you, your)
    (body.includes('your application') || body.includes('you applied') || body.includes('your interest'));

  if (hasSpecificJobPattern || hasJobContext) {
    console.log("✅ Client-side classification: job_application");
    return {
      type: "job_application",
      confidence: hasSpecificJobPattern ? 0.8 : 0.6,
      actions: [
        {
          type: "complex",
          label: "Track Application",
          handler: "openJobTracker",
          data: {},
        },
      ],
      method: "client-side",
    };
  }

  // Travel patterns (more specific)
  const specificTravelPatterns = [
    /flight\s+(?:confirmation|booking|itinerary|ticket)/i,
    /boarding\s+pass/i,
    /hotel\s+(?:confirmation|booking|reservation)/i,
    /booking\s+confirmation.*(?:flight|hotel|car|rental)/i,
    /itinerary.*(?:flight|hotel|trip)/i,
    /reservation\s+confirmation/i,
    /travel\s+itinerary/i,
    /check-in\s+(?:reminder|now\s+available)/i,
  ];

  const hasSpecificTravelPattern = specificTravelPatterns.some(
    (pattern) => pattern.test(subject) || pattern.test(body)
  );

  if (hasSpecificTravelPattern) {
    console.log("✅ Client-side classification: travel");
    return {
      type: "travel",
      confidence: 0.7,
      actions: [
        {
          type: "complex",
          label: "Compare Hotel Prices",
          handler: "openHotelComparison",
          data: {},
        },
      ],
      method: "client-side",
    };
  }

  // Receipt patterns (more specific)
  const specificReceiptPatterns = [
    /receipt.*(?:purchase|order|payment)/i,
    /invoice.*(?:payment|due|amount)/i,
    /payment\s+(?:confirmation|receipt|successful)/i,
    /order\s+(?:confirmation|receipt|summary)/i,
    /transaction\s+(?:receipt|confirmation|summary)/i,
    /purchase\s+(?:confirmation|receipt|summary)/i,
    /your\s+(?:receipt|invoice|bill)/i,
  ];

  const hasSpecificReceiptPattern = specificReceiptPatterns.some(
    (pattern) => pattern.test(subject) || pattern.test(body)
  );

  if (hasSpecificReceiptPattern) {
    console.log("✅ Client-side classification: receipt");
    return {
      type: "receipt",
      confidence: 0.7,
      actions: [
        {
          type: "simple",
          label: "Track Expense",
          handler: "handleTrackExpense",
          data: {},
        },
      ],
      method: "client-side",
    };
  }

  console.log("✅ Client-side classification: other");
  return {
    type: "other",
    confidence: 0.5,
    actions: [],
    method: "client-side",
  };
}

/**
 * Process job application email in background
 */
function processJobApplicationInBackground(emailData, userApiKey) {
  console.log("🔄 Starting background job processing...");

  try {
    const payload = {
      messageId: emailData.messageId,
      subject: emailData.subject,
      from: emailData.from,
      emailBody: emailData.body,
    };

    // Headers required for Supabase Edge Functions (similar to travel-v2)
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "x-user-api-key": userApiKey,
    };

    // Call the job processing Edge Function
    const response = UrlFetchApp.fetch(
      `${BACKEND_API_URL}/process-job-application`,
      {
        method: "POST",
        headers: headers,
        payload: JSON.stringify(payload),
        muteHttpExceptions: true,
      }
    );

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      console.log(
        "✅ Job application processed successfully:",
        result.jobApplicationId
      );
      console.log(
        "📊 Extracted data:",
        JSON.stringify(result.extractedData, null, 2)
      );
    } else {
      console.error("❌ Job processing failed:", response.getContentText());
    }
  } catch (error) {
    console.error("💥 Error in background job processing:", error);
  }
}

/**
 * Process receipt email in background
 */
function processReceiptInBackground(emailData, userApiKey) {
  console.log("🔄 Starting background receipt processing...");
  console.log("💰 DEBUG: Receipt processing called with messageId:", emailData.messageId);
  console.log("💰 DEBUG: BACKEND_API_URL:", BACKEND_API_URL);
  console.log("💰 DEBUG: User API key available:", !!userApiKey);

  try {
    const payload = {
      messageId: emailData.messageId,
      subject: emailData.subject,
      from: emailData.from,
      emailBody: emailData.body,
    };

    console.log("💰 DEBUG: Payload prepared:", JSON.stringify(payload, null, 2));

    // Headers required for Supabase Edge Functions
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "x-user-api-key": userApiKey,
    };

    console.log("💰 DEBUG: Headers prepared (API keys hidden)");
    
    // Call the receipt processing Edge Function
    const response = UrlFetchApp.fetch(
      `${BACKEND_API_URL}/process-receipt`,
      {
      method: "POST",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
      timeout: 30000, // 30 second timeout to prevent hanging
    });

    console.log("💰 DEBUG: Response received. Status code:", response.getResponseCode());
    console.log("💰 DEBUG: Response content:", response.getContentText());

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      console.log(
        "✅ Receipt processed successfully:",
        result.receiptId
      );
      console.log(
        "📊 Extracted data:",
        JSON.stringify(result.extractedData, null, 2)
      );
    } else {
      console.error("❌ Receipt processing failed:", response.getContentText());
    }
  } catch (error) {
    console.error("💥 Error in background receipt processing:", error);
  }
}

/**
 * Check for pre-processed email data from auto-processing
 */
function getPreProcessedEmailData(messageId, userApiKey) {
  try {
    console.log("🔍 Checking for pre-processed data for email:", messageId);

    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "x-user-api-key": userApiKey,
    };

    // Check if email exists in our database with processed data
    const edgeFunctionUrl = `https://whnvhuusxtnuvkhgfxnu.supabase.co/functions/v1/get-processed-email?messageId=${messageId}`;
    const response = UrlFetchApp.fetch(edgeFunctionUrl, {
      method: "GET",
      headers: headers,
      muteHttpExceptions: true,
      timeout: 15000, // 15 second timeout
    });

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      console.log(
        "✅ Pre-processed data found:",
        JSON.stringify(result, null, 2)
      );
      return result;
    } else if (response.getResponseCode() === 404) {
      console.log("📭 No pre-processed data found");
      return null;
    } else {
      console.error(
        "Error checking pre-processed data:",
        response.getContentText()
      );
      return null;
    }
  } catch (error) {
    console.error("Error getting pre-processed data:", error);
    return null;
  }
}

// ============================================================================
// EXPENSE PROCESSING
// ============================================================================

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

// ============================================================================
// TRAVEL PROCESSING
// ============================================================================

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
      from: emailData.from,
    };

    console.log("🔍 Requesting travel comparison...");
    console.log("🌐 BACKEND_API_URL:", BACKEND_API_URL);
    console.log("🎯 Full URL:", `${BACKEND_API_URL}/travel-v2`);

    // Headers required for Supabase Edge Functions
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "x-user-api-key": userApiKey,
    };

    console.log("📋 Headers being sent:", JSON.stringify(headers, null, 2));
    console.log(
      "🔑 User API key:",
      userApiKey ? userApiKey.substring(0, 10) + "..." : "MISSING"
    );

    const response = UrlFetchApp.fetch(`${BACKEND_API_URL}/travel-v2`, {
      method: "POST",
      headers: headers,
      payload: JSON.stringify(payload),
      muteHttpExceptions: true,
    });

    if (response.getResponseCode() === 200) {
      const result = JSON.parse(response.getContentText());
      console.log(
        "✅ Travel comparison received:",
        JSON.stringify(result, null, 2)
      );
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
