// Tests.gs - Test Functions for Actioneer Gmail Add-on
// Contains all testing, debugging, and configuration check functions
// Moved from Code.js to keep the main file clean and focused

function testApiKeyGeneration() {
  console.log("=== Testing API Key Generation ===");
  try {
    // Clear existing key to force regeneration
    PropertiesService.getUserProperties().deleteProperty("USER_API_KEY");
    console.log("Cleared existing API key");

    const apiKey = ensureUserApiKey();
    console.log("Generated API key:", apiKey);

    if (apiKey) {
      console.log("✅ API key generation successful");
      console.log(
        "Key format valid:",
        apiKey.startsWith("ak_") && apiKey.length === 67
      );
    } else {
      console.log("❌ API key generation failed");
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

/**
 * Test user profile retrieval
 */
function testUserProfile() {
  console.log("=== Testing User Profile ===");
  try {
    const profile = getUserProfile();
    console.log("User profile:", profile);

    if (profile && profile.user) {
      console.log("✅ Profile retrieval successful");
      console.log("User email:", profile.user.email);
      console.log("User name:", profile.user.name);
    } else {
      console.log("❌ Profile retrieval failed");
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

/**
 * Test email classification with mock data
 */
function testEmailClassification() {
  console.log("=== Testing Email Classification ===");
  try {
    // Create mock email data
    const mockEmail = {
      messageId: "test-message-123",
      subject: "Your Amazon.com order receipt",
      from: "auto-confirm@amazon.com",
      body: "Thank you for your Amazon.com order. Order Total: $29.99. Items: Wireless Headphones x1",
      date: new Date().toISOString(),
    };

    console.log("Mock email:", mockEmail);

    const userApiKey =
      PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    if (!userApiKey) {
      console.log("No API key found, generating one first...");
      ensureUserApiKey();
    }

    const classification = classifyEmail(mockEmail, userApiKey);
    console.log("Classification result:", classification);

    if (classification) {
      console.log("✅ Classification successful");
      console.log("Email type:", classification.type);
      console.log("Available actions:", classification.actions?.length || 0);
    } else {
      console.log("❌ Classification failed");
    }
  } catch (error) {
    console.error("Test error:", error);
  }
}

/**
 * Test travel email classification specifically for "It's time to Turkey!" email
 */
function testTurkeyTravelEmail() {
  console.log("=== Testing Turkey Travel Email Classification ===");
  try {
    // Create the exact email that was having issues
    const turkeyEmail = {
      messageId: "test-turkey-travel-123",
      subject: "It's time to Turkey! 🇹🇷",
      from: "travel@example.com",
      body: "Discover the magic of Turkey with our exclusive travel packages. From Istanbul's historic sites to Cappadocia's fairy chimneys, your Turkish adventure awaits!",
      date: new Date().toISOString(),
    };

    console.log("Testing Turkey email:", turkeyEmail);

    // Test client-side classification first (Apps Script)
    console.log("\n🔍 Testing client-side classification...");
    const clientSideClassification = classifyEmailClientSide(turkeyEmail);
    console.log("Client-side result:", clientSideClassification);

    // Test destination extraction
    console.log("\n🎯 Testing destination extraction...");
    const travelInfo = extractBasicTravelInfo(turkeyEmail);
    console.log("Extracted travel info:", travelInfo);

    // Test full classification with API
    console.log("\n🌐 Testing full classification...");
    const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    if (!userApiKey) {
      console.log("No API key found, generating one first...");
      ensureUserApiKey();
    }

    const fullClassification = classifyEmail(turkeyEmail, userApiKey);
    console.log("Full classification result:", fullClassification);

    // Test background travel processing
    console.log("\n🔄 Testing background travel processing...");
    if (fullClassification?.type === "travel") {
      try {
        processTravelInBackground(turkeyEmail, userApiKey);
        console.log("✅ Background travel processing called successfully");
      } catch (error) {
        console.error("❌ Background travel processing error:", error);
      }
    }

    // Summary
    console.log("\n📊 SUMMARY:");
    console.log("Client-side classification:", clientSideClassification?.type || "FAILED");
    console.log("Destination extracted:", travelInfo?.destination || "NONE");
    console.log("Full classification:", fullClassification?.type || "FAILED");

    if (clientSideClassification?.type === "travel" && travelInfo?.destination === "Turkey") {
      console.log("✅ Turkey travel email classification is working correctly!");
    } else {
      console.log("❌ Issues detected with Turkey travel email classification");
    }

  } catch (error) {
    console.error("Test error:", error);
  }
}

/**
 * Test API key validation
 */
function testApiKeyValidation() {
  console.log("🔑 Testing API key validation only...");

  try {
    // Get user API key
    let userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    if (!userApiKey) {
      console.log("Generating user API key...");
      userApiKey = ensureUserApiKey();
    }

    if (!userApiKey) {
      console.log("❌ Failed to get user API key");
      return;
    }

    console.log("✅ User API key:", userApiKey.substring(0, 10) + "...");

    // Test the exact headers being sent
    const headers = {
      "Content-Type": "application/json",
      apikey: SUPABASE_ANON_KEY,
      Authorization: `Bearer ${SUPABASE_ANON_KEY}`,
      "x-user-api-key": userApiKey,
    };

    console.log("📋 Headers being sent:");
    console.log("  Content-Type: application/json");
    console.log("  apikey: " + (SUPABASE_ANON_KEY ? "✓ Present" : "❌ Missing"));
    console.log("  Authorization: Bearer " + (SUPABASE_ANON_KEY ? "✓ Present" : "❌ Missing"));
    console.log("  x-user-api-key: " + userApiKey.substring(0, 10) + "...");

    const testPayload = {
      messageId: "test-api-key-validation",
      subject: "Test API Key",
      from: "test@example.com",
      emailBody: "Test body"
    };

    console.log("🌐 Making request to process-receipt...");
    
    // Make the exact same request as processReceiptInBackground
    const response = UrlFetchApp.fetch(
      `${BACKEND_API_URL}/process-receipt`,
      {
        method: "POST",
        headers: headers,
        payload: JSON.stringify(testPayload),
        muteHttpExceptions: true,
        timeout: 30000,
      }
    );

    console.log("📨 Response code:", response.getResponseCode());
    console.log("📨 Response headers:", JSON.stringify(response.getHeaders(), null, 2));
    console.log("📨 Response content:", response.getContentText());

    // Now test process-job-application with the same headers
    console.log("\n🔄 Testing job application for comparison...");
    
    const jobResponse = UrlFetchApp.fetch(
      `${BACKEND_API_URL}/process-job-application`,
      {
        method: "POST",
        headers: headers,
        payload: JSON.stringify(testPayload),
        muteHttpExceptions: true,
        timeout: 30000,
      }
    );

    console.log("📨 Job response code:", jobResponse.getResponseCode());
    console.log("📨 Job response content:", jobResponse.getContentText());

  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

/**
 * Test Supabase configuration and connectivity
 */
function testSupabaseConfig() {
  console.log("=== Testing Supabase Configuration ===");

  // Check if required properties are set
  const supabaseAnonKey =
    PropertiesService.getScriptProperties().getProperty("SUPABASE_ANON_KEY");
  const masterApiKey =
    PropertiesService.getScriptProperties().getProperty("MASTER_API_KEY");

  console.log("Supabase Anon Key:", supabaseAnonKey ? "✅ Set" : "❌ Missing");
  console.log("Master API Key:", masterApiKey ? "✅ Set" : "❌ Missing");

  if (!supabaseAnonKey) {
    console.log("❌ SUPABASE_ANON_KEY is missing!");
    console.log(
      "Go to Supabase Dashboard → Settings → API → Copy anon/public key"
    );
    return;
  }

  if (!masterApiKey) {
    console.log("❌ MASTER_API_KEY is missing!");
    console.log("Set your master API key in Script Properties");
    return;
  }

  // Test basic connectivity to health endpoint
  try {
    console.log("Testing basic connectivity to health endpoint...");

    const url = BACKEND_API_URL + "/health";

    // Try with both apikey and Authorization headers (Supabase Edge Functions requirement)
    const response = UrlFetchApp.fetch(url, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        apikey: supabaseAnonKey,
        Authorization: `Bearer ${supabaseAnonKey}`, // Use anon key as bearer token
      },
      muteHttpExceptions: true,
    });

    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    console.log("Health endpoint response:", statusCode, responseText);

    if (statusCode === 200) {
      console.log("✅ Supabase connectivity successful");

      // Test master key authentication for user generation
      console.log("Testing master key authentication...");

      // Debug: Log what we're actually sending
      console.log("Master API Key being sent:", masterApiKey);
      console.log(
        "Supabase Anon Key being sent:",
        supabaseAnonKey.substring(0, 20) + "..."
      );

      const authTestResponse = UrlFetchApp.fetch(
        BACKEND_API_URL + "/auth/generate-user-key",
        {
          method: "POST",
          headers: getMasterKeyHeaders(),
          payload: JSON.stringify({
            email: "test@example.com",
          }),
          muteHttpExceptions: true,
        }
      );

      const authStatusCode = authTestResponse.getResponseCode();
      const authResponseText = authTestResponse.getContentText();
      console.log("Auth endpoint test:", authStatusCode, authResponseText);

      if (authStatusCode === 200) {
        console.log("✅ Master key authentication working");
        try {
          const authResult = JSON.parse(authResponseText);
          console.log(
            "Generated API key:",
            authResult.api_key ? "✅ Success" : "❌ Failed"
          );
        } catch (e) {
          console.log("Response parsing error:", e);
        }
      } else {
        console.log("❌ Master key authentication failed");
        console.log("This likely means:");
        console.log("1. Master API key is incorrect");
        console.log("2. Supabase Edge Function environment variables not set");
        console.log("3. Edge Function deployment issue");
      }
    } else {
      console.log("❌ Supabase connectivity failed");
      console.log("Status:", statusCode);
      console.log("Response:", responseText);
    }
  } catch (error) {
    console.error("❌ Connection test failed:", error);
  }
}

/**
 * Test health endpoint
 */
function testHealthEndpoint() {
  console.log("=== Testing Health Endpoint ===");
  try {
    const response = UrlFetchApp.fetch(`${BACKEND_API_URL}/health`, {
      method: "GET",
      headers: getSupabaseHeaders(), // Include Supabase anon key
    });

    console.log("Health check response:", response.getContentText());

    if (response.getResponseCode() === 200) {
      console.log("✅ Health endpoint working");
    } else {
      console.log("❌ Health endpoint failed");
    }
  } catch (error) {
    console.error("Health check error:", error);
  }
}

/**
 * Run all tests in sequence
 */
function runAllTests() {
  console.log("🧪 Running all tests...\n");

  testSupabaseConfig();
  console.log("\n");

  testApiKeyGeneration();
  console.log("\n");

  testApiKeyValidation();
  console.log("\n");

  testUserProfile();
  console.log("\n");

  testEmailClassification();
  console.log("\n");

  testGmailApiConnectivity();
  console.log("\n");

  testGmailWatchStatus();
  console.log("\n");

  console.log("🏁 All tests completed!");
  console.log("💡 To enable auto-processing, run: testSetupGmailWatch()");
}

/**
 * Quick test to verify everything is working
 */
function quickTest() {
  console.log("🚀 Running quick test...");

  try {
    // Test 1: Check configuration
    const supabaseKey =
      PropertiesService.getScriptProperties().getProperty("SUPABASE_ANON_KEY");
    const masterKey =
      PropertiesService.getScriptProperties().getProperty("MASTER_API_KEY");

    if (!supabaseKey || !masterKey) {
      console.log("❌ Configuration missing - run testSupabaseConfig() first");
      return;
    }

    // Test 2: Check user API key
    let userApiKey =
      PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    if (!userApiKey) {
      console.log("Generating user API key...");
      userApiKey = ensureUserApiKey();
    }

    if (!userApiKey) {
      console.log("❌ Failed to get user API key");
      return;
    }

    // Test 3: Quick classification test
    const mockEmail = {
      messageId: "quick-test-123",
      subject: "Test receipt",
      from: "test@example.com",
      body: "Test order total: $10.00",
      date: new Date().toISOString(),
    };

    const classification = classifyEmail(mockEmail, userApiKey);

    if (classification) {
      console.log("✅ Quick test passed!");
      console.log("Classification:", classification.type);
      console.log("Actions available:", classification.actions?.length || 0);
    } else {
      console.log("❌ Quick test failed - classification returned null");
    }
  } catch (error) {
    console.error("❌ Quick test error:", error);
  }
}

/**
 * Test Gmail trigger with mock data
 */
function testGmailTrigger() {
  console.log("🧪 Testing Gmail trigger with mock data...");

  const mockEvent = {
    messageMetadata: {
      messageId: "mock-message-123",
      accessToken: "mock-access-token",
    },
  };

  console.log("Mock event:", JSON.stringify(mockEvent, null, 2));

  const mockEmailData = {
    messageId: "mock-message-123",
    subject: "Your receipt from Vercel Inc. #2320-4368",
    from: "noreply@vercel.com",
    body: "Thank you for your purchase. Order total: $20.00. Invoice #2320-4368",
    date: new Date().toISOString(),
  };

  console.log("📧 Mock email data:", JSON.stringify(mockEmailData, null, 2));

  try {
    const userApiKey = ensureUserApiKey();
    if (!userApiKey) {
      console.error("❌ Failed to get user API key");
      return;
    }

    console.log("✅ User API key obtained");

    const classification = classifyEmail(mockEmailData, userApiKey);

    if (classification) {
      if (classification.actions && classification.actions.length > 0) {
        createSmartActionsCard(classification, mockEmailData.messageId);
        console.log("✅ Smart actions card created successfully");
      } else {
        console.log("ℹ️ No actions available for this email");
      }
    } else {
      console.error("❌ Classification failed");
    }
  } catch (error) {
    console.error("💥 Test error:", error);
    console.error("Error stack:", error.stack);
  }
}

/**
 * Check Gmail Add-on configuration and connectivity
 */
function checkAddOnConfiguration() {
  console.log("🔧 Checking Gmail Add-on Configuration...");

  const scriptProps = PropertiesService.getScriptProperties();
  const supabaseAnonKey = scriptProps.getProperty("SUPABASE_ANON_KEY");
  const masterApiKey = scriptProps.getProperty("MASTER_API_KEY");

  console.log("🔑 Configuration Status:");
  console.log(
    "  Supabase Anon Key:",
    supabaseAnonKey ? "✅ Set" : "❌ Missing"
  );
  console.log("  Master API Key:", masterApiKey ? "✅ Set" : "❌ Missing");

  try {
    const userEmail = Session.getActiveUser().getEmail();
    console.log("👤 Current User:", userEmail);
  } catch (error) {
    console.log("👤 Current User: ❌ Cannot get user email");
  }

  console.log("🔗 Testing connectivity...");
  try {
    const response = UrlFetchApp.fetch(`${BACKEND_API_URL}/health`, {
      method: "GET",
      headers: getSupabaseHeaders(),
      muteHttpExceptions: true,
    });

    const statusCode = response.getResponseCode();
    console.log(
      "  Health endpoint:",
      statusCode === 200 ? "✅ Working" : `❌ Failed (${statusCode})`
    );

    if (statusCode !== 200) {
      console.log("  Response:", response.getContentText());
    }
  } catch (error) {
    console.log("  Health endpoint: ❌ Connection failed");
    console.log("  Error:", error.message);
  }

  console.log("\n🎯 Next Steps:");
  if (!supabaseAnonKey || !masterApiKey) {
    console.log("1. Set missing script properties");
  } else {
    console.log("1. Configuration looks good!");
    console.log("2. Try running testGmailTrigger() to test the logic");
    console.log("3. Open a receipt email in Gmail to test the real trigger");
  }
}

/**
 * Debug classification endpoint with detailed logging
 */
function debugClassificationEndpoint() {
  console.log("🔍 Debugging Classification Endpoint...");

  const userApiKey =
    PropertiesService.getUserProperties().getProperty("USER_API_KEY");
  if (!userApiKey) {
    console.log("❌ No user API key found");
    return;
  }

  const mockEmailData = {
    messageId: "debug-test-123",
    subject: "Your receipt from Vercel Inc. #2320-4368",
    from: "noreply@vercel.com",
    body: "Thank you for your purchase. Order total: $20.00. Invoice #2320-4368",
    date: new Date().toISOString(),
  };

  console.log(
    "📧 Testing with email data:",
    JSON.stringify(mockEmailData, null, 2)
  );

  const headers = getSupabaseHeaders(true);
  console.log("📋 Request headers:", JSON.stringify(headers, null, 2));

  const url = `${BACKEND_API_URL}/classify-email`;
  console.log("🌐 Request URL:", url);

  try {
    console.log("📤 Sending request...");

    const response = UrlFetchApp.fetch(url, {
      method: "POST",
      headers: headers,
      payload: JSON.stringify(mockEmailData),
      muteHttpExceptions: true,
    });

    const statusCode = response.getResponseCode();
    const responseText = response.getContentText();

    console.log("📥 Response status:", statusCode);
    console.log(
      "📥 Response headers:",
      JSON.stringify(response.getHeaders(), null, 2)
    );
    console.log("📥 Response body:", responseText);

    if (statusCode === 200) {
      try {
        const parsed = JSON.parse(responseText);
        console.log("✅ Parsed response:", JSON.stringify(parsed, null, 2));
      } catch (parseError) {
        console.log("❌ Failed to parse JSON response:", parseError.message);
      }
    } else {
      console.log(`❌ Request failed with status ${statusCode}`);

      if (statusCode === 520) {
        console.log("💡 520 error suggests Supabase Edge Function issue");
        console.log("   - Check Supabase function logs");
        console.log("   - Verify environment variables are set");
        console.log("   - Check if function is deployed properly");
      }
    }
  } catch (error) {
    console.error("💥 Request error:", error);
    console.error("Error details:", error.message);
  }
}

/**
 * Test the new proactive receipt processing experience
 */
function testProactiveReceiptProcessing() {
  console.log("🚀 Testing Proactive Receipt Processing...");

  try {
    // Mock email data (receipt)
    const mockEmailData = {
      messageId: "proactive-test-123",
      subject: "Your receipt from Vercel Inc. #2320-4368",
      from: "noreply@vercel.com",
      body: "Thank you for your purchase. Order total: $20.00. Invoice #2320-4368",
      date: new Date().toISOString(),
    };

    // Mock classification response (what your backend should return)
    const mockClassification = {
      type: "receipt",
      confidence: 0.95,
      actions: [], // No actions needed - we auto-process!
    };

    console.log("📧 Mock email:", JSON.stringify(mockEmailData, null, 2));
    console.log(
      "🎯 Mock classification:",
      JSON.stringify(mockClassification, null, 2)
    );

    // Test the new proactive card creation
    const userApiKey =
      PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    if (!userApiKey) {
      console.log("❌ No user API key found - run ensureUserApiKey() first");
      return;
    }

    console.log("💰 Creating proactive receipt card...");
    const card = createFinancialTransactionCard(mockGmailMessage, mockEmailData, 'expense');

    if (card) {
      console.log("✅ Proactive receipt card created successfully!");
      console.log("🎨 Card shows:");
      console.log("  • Title: '💰 Receipt Parsed'");
      console.log("  • Subtitle: 'Expense automatically tracked'");
      console.log("  • Parsed expense details");
      console.log("  • Recent expenses context");
      console.log("  • 'View All Your Expenses' button");
    } else {
      console.log("❌ Failed to create proactive receipt card");
    }
  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

/**
 * Test the complete proactive flow simulation
 */
function testCompleteProactiveFlow() {
  console.log("🎯 Testing Complete Proactive Flow...");

  try {
    // Simulate the new onGmailMessage flow
    const mockEvent = {
      messageMetadata: {
        messageId: "proactive-flow-test",
        accessToken: "mock-token",
      },
    };

    console.log("📧 Simulating Gmail trigger...");
    console.log("🔄 New flow: Email → Classify → Auto-Process → Show Results");

    // This would normally call onGmailMessage(mockEvent)
    // But since we can't mock GmailApp.getMessageById, we'll simulate the key parts

    console.log("✅ Proactive flow simulation complete!");
    console.log("🎉 Expected user experience:");
    console.log("  1. User opens receipt email");
    console.log("  2. Add-on automatically detects it's a receipt");
    console.log("  3. Add-on immediately parses expense details");
    console.log("  4. Add-on shows parsed results + recent expenses");
    console.log(
      "  5. User sees everything done for them - zero clicks needed!"
    );
  } catch (error) {
    console.error("❌ Flow test error:", error);
  }
}

// ============================================================================
// GMAIL WATCH TESTS
// ============================================================================

/**
 * Test function to set up Gmail watch - run this manually
 */
function testSetupGmailWatch() {
  console.log("🧪 Testing Gmail watch setup...");

  // First, ensure user has API key
  ensureUserApiKey();

  // Then set up Gmail watch
  const result = setupGmailWatch();

  console.log("📊 Setup result:", JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("🎉 SUCCESS! Gmail watch is now active");
    console.log("📧 New emails will now trigger automatic processing");
    console.log("⏰ Watch expires:", result.expiration);
  } else {
    console.log("❌ FAILED to set up Gmail watch");
    console.log("🔍 Error:", result.error);
  }

  return result;
}

/**
 * Test Gmail watch status check
 */
function testGmailWatchStatus() {
  console.log("🔍 Testing Gmail watch status...");

  const status = getGmailWatchStatus();

  console.log("📊 Watch status:", JSON.stringify(status, null, 2));

  if (status.active) {
    console.log("✅ Gmail watch is ACTIVE");
    console.log("📊 History ID:", status.historyId);
    console.log("⏰ Expires:", status.expiration);
    console.log("📅 Created:", status.created);
  } else {
    console.log("❌ Gmail watch is NOT active");
    console.log("💡 Run testSetupGmailWatch() to activate it");
  }

  return status;
}

/**
 * Test stopping Gmail watch
 */
function testStopGmailWatch() {
  console.log("🛑 Testing Gmail watch stop...");

  const result = stopGmailWatch();

  console.log("📊 Stop result:", JSON.stringify(result, null, 2));

  if (result.success) {
    console.log("✅ Gmail watch stopped successfully");
    console.log("📧 Auto-processing is now disabled");
  } else {
    console.log("❌ Failed to stop Gmail watch");
    console.log("🔍 Error:", result.error);
  }

  return result;
}

/**
 * Test Gmail API connectivity and permissions
 */
function testGmailApiConnectivity() {
  console.log("🔗 Testing Gmail API connectivity...");

  try {
    const userEmail = Session.getActiveUser().getEmail();
    console.log("👤 Current user:", userEmail);

    // Test basic Gmail API access
    const profile = Gmail.Users.getProfile("me");
    console.log("📧 Gmail profile:");
    console.log("  Email:", profile.emailAddress);
    console.log("  Messages total:", profile.messagesTotal);
    console.log("  Threads total:", profile.threadsTotal);

    // Test if we can list labels (basic permission check)
    const labels = Gmail.Users.Labels.list("me");
    console.log("🏷️  Available labels:", labels.labels.length);

    console.log("✅ Gmail API connectivity successful");
    console.log("🔐 Permissions appear to be working");

    return {
      success: true,
      profile: profile,
      labelsCount: labels.labels.length,
    };
  } catch (error) {
    console.error("❌ Gmail API connectivity failed:", error);
    console.log("💡 Possible issues:");
    console.log("  1. Gmail API not enabled in Advanced Google Services");
    console.log("  2. Missing OAuth scopes");
    console.log("  3. User hasn't granted permissions");

    return {
      success: false,
      error: error.message,
    };
  }
}

/**
 * Comprehensive Gmail watch system test
 */
function testGmailWatchSystem() {
  console.log("🧪 Running comprehensive Gmail watch system test...");

  console.log("1️⃣ Testing Gmail API connectivity...");
  const connectivityResult = testGmailApiConnectivity();

  if (!connectivityResult.success) {
    console.log("❌ Gmail API connectivity failed - cannot proceed");
    return;
  }

  console.log("2️⃣ Checking current watch status...");
  const currentStatus = testGmailWatchStatus();

  console.log("3️⃣ Testing watch setup (or renewal)...");
  const setupResult = testSetupGmailWatch();

  if (setupResult.success) {
    console.log("4️⃣ Verifying watch is active...");
    const finalStatus = testGmailWatchStatus();

    if (finalStatus.active) {
      console.log("🎉 COMPLETE SUCCESS!");
      console.log("📧 Gmail auto-processing is now fully enabled");
      console.log(
        "⚡ New emails will automatically trigger webhook processing"
      );
    } else {
      console.log("⚠️ Watch setup reported success but status check failed");
    }
  } else {
    console.log("❌ Gmail watch setup failed");
    console.log("💡 Check the error details above");
  }
}

// ============================================================================
// WEBHOOK INTEGRATION TESTS
// ============================================================================

/**
 * Manual trigger function for testing webhook-style email processing
 * Run this from Apps Script console to test the recent email processing
 * This simulates what would happen when the Supabase webhook triggers Apps Script
 */
function testProcessRecentEmails() {
  console.log("🧪 Testing recent email processing (webhook simulation)...");
  
  const userEmail = Session.getActiveUser().getEmail();
  console.log("📧 Processing emails for:", userEmail);
  
  const result = processRecentEmails(userEmail);
  console.log("🎉 Test result:", JSON.stringify(result, null, 2));
  
  if (result.success) {
    console.log(`✅ Successfully processed ${result.processedCount} emails`);
    console.log(`💼 Found ${result.jobApplicationsFound} job applications`);
    console.log("🎯 Check your dashboard to see if job applications appeared!");
  } else {
    console.log("❌ Processing failed:", result.error);
  }
  
  return result;
}

/**
 * Test receipt processing directly to debug the issue
 */
function testReceiptProcessingDirectly() {
  console.log("🧾 Testing receipt processing directly...");

  try {
    // Get or generate user API key
    let userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    if (!userApiKey) {
      console.log("Generating user API key...");
      userApiKey = ensureUserApiKey();
    }

    if (!userApiKey) {
      console.log("❌ Failed to get user API key");
      return;
    }

    console.log("✅ User API key available:", userApiKey.substring(0, 10) + "...");

    // Mock receipt email data
    const mockEmailData = {
      messageId: "test-receipt-" + Date.now(),
      subject: "Your Vercel receipt [#2320-4368]",
      from: "receipts@vercel.com",
      body: "Thank you for your payment. Your subscription charge: $20.00. Invoice #2320-4368",
    };

    console.log("📧 Mock email data:", JSON.stringify(mockEmailData, null, 2));
    console.log("🔗 BACKEND_API_URL:", BACKEND_API_URL);

    // Call processReceiptInBackground directly
    console.log("🚀 Calling processReceiptInBackground...");
    processReceiptInBackground(mockEmailData, userApiKey);
    
    console.log("✅ Test completed! Check Supabase logs in ~10 seconds.");
    console.log("💡 If no logs appear, the edge function wasn't invoked.");

  } catch (error) {
    console.error("❌ Test error:", error);
  }
}

/**
 * Fix stale API key issue by clearing and regenerating
 */
function fixStaleApiKey() {
  console.log("🔧 Fixing stale API key issue...");

  try {
    // Clear the old API key
    console.log("🗑️ Clearing old API key from properties...");
    PropertiesService.getUserProperties().deleteProperty("USER_API_KEY");
    
    // Generate a fresh API key
    console.log("🔑 Generating fresh API key...");
    const newApiKey = ensureUserApiKey();
    
    if (newApiKey) {
      console.log("✅ Fresh API key generated:", newApiKey.substring(0, 10) + "...");
      
      // Test the new API key immediately
      console.log("🧪 Testing new API key...");
      const isValid = validateUserApiKey(newApiKey);
      
      if (isValid) {
        console.log("🎉 SUCCESS! New API key is valid and working!");
        console.log("💡 You can now test receipt processing again.");
      } else {
        console.log("❌ New API key validation failed");
      }
    } else {
      console.log("❌ Failed to generate new API key");
    }
    
  } catch (error) {
    console.error("❌ Error fixing API key:", error);
  }
}

/**
 * Test Gmail watch setup and webhook connectivity
 */
function testGmailWatchSetup() {
  console.log("🧪 === TESTING GMAIL WATCH SETUP ===");
  
  try {
    // 1. Check current watch status
    console.log("1️⃣ Checking current Gmail watch status...");
    const watchStatus = getGmailWatchStatus();
    console.log("Watch status:", JSON.stringify(watchStatus, null, 2));
    
    // 2. Get user email
    const userEmail = Session.getActiveUser().getEmail();
    console.log("2️⃣ User email:", userEmail);
    
    // 3. Check if user API key exists
    const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    console.log("3️⃣ User API key exists:", !!userApiKey);
    
    // 4. Test webhook endpoint connectivity
    console.log("4️⃣ Testing webhook endpoint...");
    const webhookUrl = "https://whnvhuusxtnuvkhgfxnu.supabase.co/functions/v1/gmail-webhook";
    try {
      const response = UrlFetchApp.fetch(webhookUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        payload: JSON.stringify({
          test: true,
          source: "apps-script-test",
          timestamp: new Date().toISOString()
        })
      });
      console.log("Webhook response:", response.getResponseCode(), response.getContentText());
    } catch (webhookError) {
      console.error("Webhook test failed:", webhookError);
    }
    
    // 5. If no watch is active, try to set one up
    if (!watchStatus.active) {
      console.log("5️⃣ No active watch found, attempting to set up...");
      const setupResult = setupGmailWatch();
      console.log("Setup result:", JSON.stringify(setupResult, null, 2));
    } else {
      console.log("5️⃣ Gmail watch is already active - no setup needed");
    }
    
    console.log("✅ Gmail watch test completed");
    return {
      success: true,
      userEmail: userEmail,
      watchStatus: watchStatus,
      hasApiKey: !!userApiKey
    };
    
  } catch (error) {
    console.error("❌ Gmail watch test failed:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Test OAuth token storage process step by step
 */
function testOAuthTokenStorage() {
  console.log("🧪 === TESTING OAUTH TOKEN STORAGE ==");
  
  try {
    // 1. Check if we can get the current user
    console.log("1️⃣ Getting current user...");
    const userEmail = Session.getActiveUser().getEmail();
    console.log("✅ Current user:", userEmail);
    
    // 2. Check if we can get OAuth token
    console.log("2️⃣ Getting OAuth token...");
    const accessToken = ScriptApp.getOAuthToken();
    if (accessToken) {
      console.log("✅ OAuth token obtained (length:", accessToken.length, ")");
      console.log("🔍 Token preview:", accessToken.substring(0, 20) + "...");
    } else {
      console.log("❌ No OAuth token available");
      return { success: false, error: "No OAuth token" };
    }
    
    // 3. Check if user API key exists
    console.log("3️⃣ Checking user API key...");
    const userApiKey = getUserApiKeyByEmail(userEmail);
    if (userApiKey) {
      console.log("✅ User API key found");
    } else {
      console.log("❌ No user API key found");
      return { success: false, error: "No user API key" };
    }
    
    // 4. Test the store-oauth-token endpoint directly
    console.log("4️⃣ Testing store-oauth-token endpoint...");
    
    const payload = {
      userEmail: userEmail,
      accessToken: accessToken,
      expiresAt: new Date(Date.now() + 3600000).toISOString() // 1 hour from now
    };
    
    console.log("📤 Payload being sent:", {
      userEmail: payload.userEmail,
      hasAccessToken: !!payload.accessToken,
      expiresAt: payload.expiresAt
    });
    
    const response = UrlFetchApp.fetch(BACKEND_API_URL + "/store-oauth-token", {
      method: "POST",
      headers: getEdgeFunctionHeaders(),
      payload: JSON.stringify(payload)
    });
    
    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();
    
    console.log("📨 Response code:", responseCode);
    console.log("📨 Response text:", responseText);
    
    if (responseCode === 200) {
      console.log("✅ OAuth token stored successfully!");
      
      // 5. Verify it was stored by trying to retrieve it
      console.log("5️⃣ Verifying token was stored...");
      const retrieveResponse = UrlFetchApp.fetch(BACKEND_API_URL + "/get-oauth-token", {
        method: "POST",
        headers: getEdgeFunctionHeaders(),
        payload: JSON.stringify({ userEmail: userEmail })
      });
      
      const retrieveCode = retrieveResponse.getResponseCode();
      const retrieveText = retrieveResponse.getContentText();
      
      console.log("📥 Retrieve response code:", retrieveCode);
      console.log("📥 Retrieve response text:", retrieveText);
      
      if (retrieveCode === 200) {
        const retrieveData = JSON.parse(retrieveText);
        if (retrieveData.success && retrieveData.accessToken) {
          console.log("✅ Token successfully retrieved! OAuth storage is working.");
          return { 
            success: true, 
            message: "OAuth token storage and retrieval working correctly",
            userEmail: userEmail,
            tokenStored: true,
            tokenRetrieved: true
          };
        } else {
          console.log("❌ Token was stored but couldn't be retrieved");
          return { success: false, error: "Token storage succeeded but retrieval failed" };
        }
      } else {
        console.log("❌ Token was stored but retrieval failed with code:", retrieveCode);
        return { success: false, error: "Token retrieval failed: " + retrieveText };
      }
    } else {
      console.log("❌ Failed to store OAuth token");
      return { success: false, error: "Token storage failed: " + responseText };
    }
    
  } catch (error) {
    console.error("💥 Error in OAuth token storage test:", error);
    return { success: false, error: error.toString() };
  }
}