import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-user-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Create Supabase client with service role for admin operations
const supabaseUrl = Deno.env.get("SUPABASE_URL") ?? "";
const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "";
const supabaseAnonKey = Deno.env.get("SUPABASE_ANON_KEY") ?? "";

// Regular client for normal operations
const supabase = createClient(supabaseUrl, supabaseAnonKey);

// Admin client for auth operations
const supabaseAdmin = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false,
  },
});

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

Deno.serve(async (req) => {
  console.log("🧾 Receipt processing function called");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract user API key from custom header
    const userApiKey = req.headers.get("x-user-api-key");
    if (!userApiKey) {
      return new Response(JSON.stringify({ error: "Missing user API key header" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Validate user API key using the same logic as job applications
    const user = await getUserByApiKey(userApiKey);
    if (!user) {
      console.log("❌ API key validation failed - no user found");
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Parse request body
    const body = await req.json();
    const { messageId, subject, from, emailBody } = body;

    if (!messageId || !subject || !from || !emailBody) {
      return new Response(JSON.stringify({ error: "Missing required fields" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("🔍 Processing receipt email:", {
      messageId,
      subject,
      from,
      userId: user.id,
    });

    // Check if this email has already been processed
    console.log("🔍 Checking for existing receipt with email_id:", messageId);
    const { data: existingReceipt, error: existingError } = await supabase
      .from("receipts")
      .select("*")
      .eq("email_id", messageId)
      .eq("user_id", user.id)
      .single();

    if (existingReceipt && !existingError) {
      console.log("✅ Receipt already exists for this email:", existingReceipt.id);
      return new Response(
        JSON.stringify({
          success: true,
          receiptId: existingReceipt.id,
          extractedData: {
            merchant: existingReceipt.merchant,
            amount: existingReceipt.amount,
            currency: existingReceipt.currency,
            category: existingReceipt.category,
            date: existingReceipt.date,
          },
          message: "Receipt already processed for this email",
          duplicate: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🆕 No existing receipt found, processing new email...");

    // Extract receipt data using AI - use email date as fallback
    const emailDate = new Date().toISOString(); // Current processing time as fallback
    const receiptData = await extractReceiptDataWithAI(subject, from, emailBody, emailDate);

    if (!receiptData) {
      return new Response(JSON.stringify({ error: "Failed to extract receipt data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("📊 Extracted receipt data:", receiptData);

    // Store receipt in database using the Supabase Auth user ID (mapped from custom user)
    console.log("🔄 Inserting receipt for user:", user.email);
    console.log("🔍 User ID being used:", user.id);
    console.log("🔍 Auth user ID:", user.auth_user_id);
    console.log("🔍 Custom user ID:", user.custom_user_id);

    // Store in database using the user ID (should be Supabase Auth ID after mapping)
    // Use supabaseAdmin to bypass RLS policies
    const { data: storedData, error: storeError } = await supabaseAdmin
      .from("receipts")
      .insert({
        user_id: user.id, // This should now be the Supabase Auth user ID
        email_id: messageId,
        merchant: receiptData.merchant || "Unknown Merchant",
        amount: receiptData.amount || 0,
        currency: receiptData.currency || "USD",
        category: receiptData.category || "other",
        description: receiptData.description || subject,
        date: receiptData.date || new Date().toISOString(),
        invoice_number: receiptData.invoice_number,
        payment_method: receiptData.payment_method,
        tax_amount: receiptData.tax_amount,
        details: {
          ...receiptData,
          originalEmail: {
            subject,
            from,
            processedAt: new Date().toISOString(),
          },
        },
      })
      .select()
      .single();

    if (storeError) {
      console.error("Error storing receipt:", storeError);
      return new Response(JSON.stringify({ error: "Failed to store receipt data" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ Receipt stored successfully:", storedData.id);
    console.log("✅ Stored with user_id:", storedData.user_id);

    return new Response(
      JSON.stringify({
        success: true,
        receiptId: storedData.id,
        extractedData: receiptData,
        message: "Receipt processed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Receipt processing error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getUserByApiKey(apiKey: string) {
  try {
    console.log("🔍 Starting user lookup with API key:", apiKey.substring(0, 10) + "...");

    // Use admin client for users table access (has service role permissions)
    const { data, error } = await supabaseAdmin
      .from("users")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    if (error) {
      console.log("❌ User lookup error:", error.message);
      console.log("❌ Error details:", JSON.stringify(error, null, 2));
      return null;
    }

    if (!data) {
      console.log("❌ No user data returned");
      return null;
    }

    console.log("✅ Found custom user:", data.email, "with ID:", data.id);

    // If we found a custom user, try to find the corresponding Supabase Auth user by email
    console.log("🔍 Looking up Supabase Auth user for email:", data.email);

    try {
      // Use the correct method to get user by email
      const { data: authUsers, error: authError } = await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        console.log("⚠️ Auth users list error:", authError.message);
        console.log("⚠️ Falling back to custom user ID:", data.id);
        return data;
      }

      // Find user by email in the list
      const authUser = authUsers.users?.find((user) => user.email === data.email);

      if (authUser?.id) {
        console.log("✅ Found Supabase Auth user:", authUser.id);
        // Return a modified user object with the Supabase Auth ID
        const modifiedUser = {
          ...data,
          id: authUser.id, // Use Supabase Auth ID instead of custom user ID
          auth_user_id: authUser.id,
          custom_user_id: data.id,
        };
        console.log("✅ Using Supabase Auth user ID:", modifiedUser.id);
        return modifiedUser;
      } else {
        console.log("⚠️ No Supabase Auth user found for email:", data.email);
        console.log("⚠️ Falling back to custom user ID:", data.id);
        return data;
      }
    } catch (authLookupError) {
      console.error("❌ Error during auth user lookup:", authLookupError);
      console.log("⚠️ Falling back to custom user ID:", data.id);
      return data;
    }
  } catch (error) {
    console.error("❌ Error validating API key:", error);
    return null;
  }
}

async function extractReceiptDataWithAI(subject: string, from: string, emailBody: string, emailDate?: string) {
  if (!OPENAI_API_KEY) {
    console.log("⚠️ No OpenAI API key, using fallback extraction");
    return fallbackReceiptExtraction(subject, from, emailBody);
  }

  try {
    console.log("🤖 Using AI to extract receipt data");

    const prompt = `Extract receipt/purchase information from this email. Return a JSON object with the following fields:

Email Details:
Subject: ${subject}
From: ${from}
Body: ${emailBody}

Extract:
{
  "merchant": "Vendor/Company name",
  "amount": number (just the number, no currency symbols),
  "currency": "USD/EUR/IDR/SGD/etc",
  "category": "software/food/travel/utilities/entertainment/shopping/other",
  "description": "Brief description of purchase",
  "date": "ISO date string (YYYY-MM-DD)",
  "invoice_number": "Invoice/order number if available",
  "payment_method": "credit card/paypal/etc if mentioned",
  "tax_amount": number (if mentioned)
}

Important rules:
- Only extract information that is clearly present in the email
- Use null for missing fields
- Amount should be a number without currency symbols (e.g., for "Rp 30300" use 30300)
- For Indonesian Rupiah "Rp" use currency "IDR"
- For Singapore Dollar "S$" use currency "SGD"
- For Malaysian Ringgit "RM" use currency "MYR"
- Date should be extracted from email content, or use email received date if not clearly specified
- Category should be one of the predefined options
- Be conservative - if unsure, use null or "other"

Currency Detection Examples:
- "Rp 30300" → amount: 30300, currency: "IDR"
- "$15.99" → amount: 15.99, currency: "USD"
- "€25.50" → amount: 25.50, currency: "EUR"
- "£10.00" → amount: 10.00, currency: "GBP"
`;

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content:
              "You are a precise receipt data extractor. Extract information exactly as requested, using null for missing data.",
          },
          {
            role: "user",
            content: prompt,
          },
        ],
        temperature: 0.1,
        max_tokens: 500,
      }),
    });

    if (!response.ok) {
      throw new Error(`OpenAI API error: ${response.status}`);
    }

    const result = await response.json();
    const extractedText = result.choices[0]?.message?.content;

    if (!extractedText) {
      throw new Error("No content in OpenAI response");
    }

    console.log("🤖 AI extracted text:", extractedText);

    // Parse JSON from AI response
    const jsonMatch = extractedText.match(/\{[\s\S]*\}/);
    if (!jsonMatch) {
      throw new Error("No JSON found in AI response");
    }

    const receiptData = JSON.parse(jsonMatch[0]);
    console.log("✅ AI extraction successful:", receiptData);

    // Validate and clean up the data
    let merchant =
      receiptData.merchant ||
      extractVendorFromEmail(from) ||
      extractVendorFromText(`${subject} ${emailBody}`.toLowerCase());

    // Ensure merchant is never null
    if (!merchant) {
      // Try to extract from sender domain as last resort
      const emailMatch = from.match(/@([^>]+)/);
      if (emailMatch) {
        const domain = emailMatch[1].replace(/^(www\.|mail\.|noreply\.|no-reply\.)/i, "");
        merchant = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
      } else {
        merchant = "Unknown Merchant";
      }
    }

    // Enhanced currency detection
    const detectedCurrency =
      receiptData.currency || detectCurrencyFromText(subject) || detectCurrencyFromMerchant(merchant) || "USD";

    return {
      merchant,
      amount: typeof receiptData.amount === "number" ? receiptData.amount : null,
      currency: detectedCurrency,
      category: receiptData.category || "other",
      description: receiptData.description || subject,
      date: validateDate(receiptData.date) || extractDateFromText(emailBody) || emailDate || new Date().toISOString(),
      invoice_number: receiptData.invoice_number,
      payment_method: receiptData.payment_method,
      tax_amount: typeof receiptData.tax_amount === "number" ? receiptData.tax_amount : null,
    };
  } catch (error) {
    console.error("AI extraction failed:", error);
    console.log("🔄 Falling back to pattern-based extraction");
    return fallbackReceiptExtraction(subject, from, emailBody);
  }
}

function fallbackReceiptExtraction(subject: string, from: string, emailBody: string) {
  console.log("🔍 Using fallback pattern-based extraction");

  const text = `${subject} ${emailBody}`.toLowerCase();

  // Extract merchant with fallback to a default value
  let merchant = extractVendorFromEmail(from) || extractVendorFromText(text);

  // If no merchant found, create a fallback based on the email or subject
  if (!merchant) {
    // Try to extract from sender domain
    const emailMatch = from.match(/@([^>]+)/);
    if (emailMatch) {
      const domain = emailMatch[1].replace(/^(www\.|mail\.|noreply\.|no-reply\.)/i, "");
      merchant = domain.split(".")[0].charAt(0).toUpperCase() + domain.split(".")[0].slice(1);
    } else {
      // Last resort: use "Unknown Merchant"
      merchant = "Unknown Merchant";
    }
  }

  const detectedCurrency = detectCurrencyFromText(text) || detectCurrencyFromMerchant(merchant) || "USD";

  // Try to extract date from email content, fallback to current date
  const extractedDate = extractDateFromText(emailBody) || new Date().toISOString();

  return {
    merchant,
    amount: extractAmountFromText(text),
    currency: detectedCurrency,
    category: extractCategoryFromText(text),
    description: subject,
    date: extractedDate,
    invoice_number: extractInvoiceNumber(text),
    payment_method: null,
    tax_amount: null,
  };
}

function extractVendorFromEmail(from: string): string | null {
  if (!from) return null;

  // Extract domain and clean it up
  const emailMatch = from.match(/@([^>]+\.[^>]+)/);
  if (!emailMatch) return null;

  const domain = emailMatch[1];

  // Remove common email domains
  if (/(gmail|yahoo|outlook|hotmail|icloud|aol)\.com/i.test(domain)) {
    return null;
  }

  // Clean up domain to get vendor name
  const cleanDomain = domain
    .replace(/^(www\.|mail\.|noreply\.|no-reply\.)/i, "")
    .replace(/\.(com|org|net|co\.uk|io)$/i, "")
    .split(".")[0];

  return cleanDomain.charAt(0).toUpperCase() + cleanDomain.slice(1);
}

function extractVendorFromText(text: string): string | null {
  const vendors = [
    "amazon",
    "walmart",
    "target",
    "costco",
    "starbucks",
    "mcdonalds",
    "uber",
    "lyft",
    "airbnb",
    "booking",
    "hotels",
    "expedia",
    "netflix",
    "spotify",
    "apple",
    "google",
    "microsoft",
    "adobe",
    "vercel",
    "github",
    "stripe",
    "paypal",
  ];

  for (const vendor of vendors) {
    if (text.includes(vendor)) {
      return vendor.charAt(0).toUpperCase() + vendor.slice(1);
    }
  }

  return null;
}

function extractAmountFromText(text: string): number | null {
  const patterns = [
    // USD patterns
    /\$(\d+\.?\d*)/g,
    /(\d+\.?\d*)\s*usd/gi,
    // Indonesian Rupiah patterns
    /rp\s*(\d+(?:\.\d{3})*(?:,\d{2})?)/gi,
    /rp\s*(\d+)/gi,
    // Generic amount patterns
    /total[:\s]*\$?(\d+\.?\d*)/gi,
    /amount[:\s]*\$?(\d+\.?\d*)/gi,
    /charged[:\s]*\$?(\d+\.?\d*)/gi,
    /paid[:\s]*\$?(\d+\.?\d*)/gi,
    // More flexible patterns for various currencies
    /(?:total|amount|charged|paid)[:\s]*[^\d]*(\d+(?:[,\.\s]\d{3})*(?:[,\.]\d{2})?)/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const numericMatch = matches[0].match(/(\d+(?:[,\.\s]\d{3})*(?:[,\.]\d{2})?)/);
      if (numericMatch) {
        // Clean up the number (remove spaces, handle Indonesian comma formatting)
        const cleanNumber = numericMatch[1].replace(/[\s,]/g, "");
        const amount = parseFloat(cleanNumber);
        if (amount > 0 && amount < 10000000) {
          // Increased limit for IDR amounts
          return amount;
        }
      }
    }
  }

  return null;
}

function extractCategoryFromText(text: string): string {
  const categoryKeywords = {
    software: ["software", "saas", "subscription", "app", "license", "vercel", "github", "adobe", "microsoft"],
    food: [
      "restaurant",
      "cafe",
      "food",
      "meal",
      "dining",
      "starbucks",
      "mcdonalds",
      "pizza",
      "grab", // Grab is primarily food delivery in many regions
      "grabfood",
      "gojek",
      "delivery",
      "makanan", // Indonesian for food
      "pesanan", // Indonesian for order
      "kopi", // Indonesian for coffee
      "mie", // Indonesian for noodles
    ],
    travel: [
      "hotel",
      "flight",
      "airbnb",
      "booking",
      "travel",
      "uber",
      "lyft",
      "taxi",
      "grabcar", // Grab car service
      "grabbike", // Grab bike service
    ],
    utilities: ["electric", "gas", "water", "internet", "phone", "utility"],
    entertainment: ["netflix", "spotify", "movie", "game", "music", "streaming"],
    shopping: ["amazon", "walmart", "target", "purchase", "order", "shopping"],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      return category;
    }
  }

  return "other";
}

function extractInvoiceNumber(text: string): string | null {
  const patterns = [
    /invoice[#\s]*([a-zA-Z0-9-]+)/i,
    /order[#\s]*([a-zA-Z0-9-]+)/i,
    /receipt[#\s]*([a-zA-Z0-9-]+)/i,
    /#([a-zA-Z0-9-]{6,})/,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match && match[1]) {
      return match[1];
    }
  }

  return null;
}

function detectCurrencyFromText(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Currency symbol patterns - prioritize more specific patterns first
  const currencyPatterns = [
    // Indonesian Rupiah - check first since it's commonly missed
    { pattern: /rp\s*\d|idr|\bidr\b|rupiah|indonesian/i, currency: "IDR" },
    // Other Asian currencies
    { pattern: /s\$\s*\d|sgd|\bsgd\b|singapore/i, currency: "SGD" },
    { pattern: /rm\s*\d|myr|\bmyr\b|ringgit|malaysian/i, currency: "MYR" },
    { pattern: /₹\s*\d|inr|\binr\b|rupee|indian/i, currency: "INR" },
    { pattern: /¥\s*\d|jpy|\bjpy\b|yen|japanese/i, currency: "JPY" },
    { pattern: /₩\s*\d|krw|\bkrw\b|won|korean/i, currency: "KRW" },
    { pattern: /฿\s*\d|thb|\bthb\b|baht|thai/i, currency: "THB" },
    { pattern: /₫\s*\d|vnd|\bvnd\b|dong|vietnamese/i, currency: "VND" },
    { pattern: /₱\s*\d|php|\bphp\b|peso|philippine/i, currency: "PHP" },
    // Western currencies
    { pattern: /\$\s*\d|usd|\busd\b|dollar|american/i, currency: "USD" },
    { pattern: /€\s*\d|eur|\beur\b|euro|european/i, currency: "EUR" },
    { pattern: /£\s*\d|gbp|\bgbp\b|pound|british/i, currency: "GBP" },
    { pattern: /c\$\s*\d|cad|\bcad\b|canadian/i, currency: "CAD" },
    { pattern: /a\$\s*\d|aud|\baud\b|australian/i, currency: "AUD" },
    { pattern: /chf|\bchf\b|franc|swiss/i, currency: "CHF" },
    // Crypto
    { pattern: /₿\s*\d|btc|\bbtc\b|bitcoin/i, currency: "BTC" },
    { pattern: /eth|\beth\b|ethereum/i, currency: "ETH" },
  ];

  for (const { pattern, currency } of currencyPatterns) {
    if (pattern.test(lowerText)) {
      return currency;
    }
  }

  return null;
}

function detectCurrencyFromMerchant(merchant: string): string | null {
  const lowerMerchant = merchant.toLowerCase();

  // Country/region-based currency detection for merchants
  const merchantCurrencyMap: Record<string, string> = {
    // US companies
    paypal: "USD",
    stripe: "USD",
    apple: "USD",
    google: "USD",
    amazon: "USD",
    microsoft: "USD",
    github: "USD",
    vercel: "USD",
    netlify: "USD",
    uber: "USD",
    lyft: "USD",
    doordash: "USD",

    // UK companies
    revolut: "GBP",
    monzo: "GBP",
    starling: "GBP",
    deliveroo: "GBP",

    // European companies
    wise: "EUR",
    klarna: "EUR",
    adyen: "EUR",
    spotify: "EUR",

    // Southeast Asian companies
    grab: "IDR", // Default to IDR for Grab, but context-aware
    gojek: "IDR",
    tokopedia: "IDR",
    bukalapak: "IDR",
    shopee: "SGD", // Shopee operates across SEA, but Singapore-based
    lazada: "SGD",
    foodpanda: "SGD",

    // Crypto exchanges
    coinbase: "USD",
    binance: "USD",
    kraken: "USD",
    gemini: "USD",
  };

  for (const [company, currency] of Object.entries(merchantCurrencyMap)) {
    if (lowerMerchant.includes(company)) {
      return currency;
    }
  }

  return null;
}

function validateDate(dateStr: string): string | null {
  if (!dateStr) return null;

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return null;
    return date.toISOString();
  } catch {
    return null;
  }
}

// Add a new function to extract dates from email content
function extractDateFromText(text: string): string | null {
  // Try to find dates in various formats
  const datePatterns = [
    // YYYY-MM-DD format
    /(\d{4}-\d{2}-\d{2})/,
    // DD/MM/YYYY or MM/DD/YYYY format
    /(\d{1,2}\/\d{1,2}\/\d{4})/,
    // DD MMM YYYY format (e.g., "29 Jun 2025")
    /(\d{1,2}\s+(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{4})/i,
    // Month DD, YYYY format
    /(?:jan|feb|mar|apr|may|jun|jul|aug|sep|oct|nov|dec)\s+\d{1,2},?\s+\d{4}/i,
  ];

  for (const pattern of datePatterns) {
    const match = text.match(pattern);
    if (match) {
      const dateStr = match[0];
      const parsedDate = new Date(dateStr);

      // Check if it's a valid date and not too far in the past/future
      if (!isNaN(parsedDate.getTime())) {
        const now = new Date();
        const diffYears = Math.abs(now.getFullYear() - parsedDate.getFullYear());

        // Only accept dates within 2 years of current date
        if (diffYears <= 2) {
          return parsedDate.toISOString();
        }
      }
    }
  }

  return null;
}
