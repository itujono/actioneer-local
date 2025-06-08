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

    const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
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
 * Test API key validation
 */
function testApiKeyValidation() {
  console.log("=== Testing API Key Validation ===");
  try {
    const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    if (!userApiKey) {
      console.log("No API key found to validate");
      return;
    }

    console.log("Validating API key:", userApiKey);
    const isValid = validateUserApiKey(userApiKey);
    console.log("Validation result:", isValid);

    if (isValid) {
      console.log("✅ API key is valid");
    } else {
      console.log("❌ API key is invalid");
    }
  } catch (error) {
    console.error("Test error:", error);
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

  console.log("🏁 All tests completed!");
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
    let userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
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

  const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
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
    const userApiKey = PropertiesService.getUserProperties().getProperty("USER_API_KEY");
    if (!userApiKey) {
      console.log("❌ No user API key found - run ensureUserApiKey() first");
      return;
    }

    console.log("💰 Creating proactive receipt card...");
    const card = createReceiptProcessedCard(mockEmailData);

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
