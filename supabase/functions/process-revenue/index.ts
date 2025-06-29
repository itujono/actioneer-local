import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-api-key",
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

Deno.serve(async (req) => {
  console.log("💰 Revenue processing function called");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract user API key from custom header
    const userApiKey = req.headers.get("x-user-api-key");
    if (!userApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing user API key header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate user API key
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
    const { messageId, subject, from, emailBody, emailDate } = body;

    if (!messageId || !subject || !from || !emailBody) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🟢 Processing revenue email:");
    console.log("📧 Subject:", subject);
    console.log("👤 From:", from);
    console.log("🆔 Message ID:", messageId);
    console.log("📅 Email Date:", emailDate);
    console.log("👤 User:", user.email);

    // Create Supabase client with service role key for admin operations
    const supabaseAdmin = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false,
        },
      }
    );

    // Check if this email has already been processed
    console.log("🔍 Checking for existing revenue with email_id:", messageId);
    const { data: existingRevenue, error: existingError } = await supabase
      .from("revenue")
      .select("*")
      .eq("email_id", messageId)
      .eq("user_id", user.id)
      .single();

    if (existingRevenue && !existingError) {
      console.log(
        "✅ Revenue already exists for this email:",
        existingRevenue.id
      );
      return new Response(
        JSON.stringify({
          success: true,
          revenueId: existingRevenue.id,
          extractedData: {
            source: existingRevenue.source,
            amount: existingRevenue.amount,
            currency: existingRevenue.currency,
            category: existingRevenue.category,
            date: existingRevenue.date,
          },
          message: "Revenue already processed for this email",
          duplicate: true,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🆕 No existing revenue found, processing new email...");

    // Extract revenue data using AI and patterns
    const revenueData = await extractRevenueDataWithAI(
      subject,
      from,
      emailBody,
      emailDate
    );

    console.log("💰 Extracted revenue data:", revenueData);

    if (!revenueData) {
      return new Response(
        JSON.stringify({ error: "Failed to extract revenue data" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("🔄 Inserting revenue for user:", user.email);
    console.log("🔍 User ID being used:", user.id);
    console.log("🔍 Auth user ID:", user.auth_user_id);
    console.log("🔍 Custom user ID:", user.custom_user_id);

    // Store in database using the user ID (should be Supabase Auth ID after mapping)
    // Use supabaseAdmin to bypass RLS policies
    const { data: storedData, error: storeError } = await supabaseAdmin
      .from("revenue")
      .insert({
        user_id: user.id, // This should now be the Supabase Auth user ID
        email_id: messageId,
        source: revenueData.source || "Unknown Source",
        amount: revenueData.amount || 0,
        currency: revenueData.currency || "USD",
        category: revenueData.category || "payment_received",
        revenue_type: revenueData.revenue_type || "other",
        description: revenueData.description || subject,
        date: revenueData.date || new Date().toISOString(),
        reference_number: revenueData.reference_number,
        tax_implications: revenueData.tax_implications || {},
        details: {
          ...revenueData,
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
      console.error("Error storing revenue:", storeError);
      return new Response(
        JSON.stringify({ error: "Failed to store revenue data" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Revenue stored successfully:", storedData.id);
    console.log("✅ Stored with user_id:", storedData.user_id);

    return new Response(
      JSON.stringify({
        success: true,
        revenueId: storedData.id,
        extractedData: revenueData,
        message: "Revenue processed successfully",
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error processing revenue:", error);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});

async function getUserByApiKey(apiKey: string) {
  try {
    console.log(
      "🔍 Starting user lookup with API key:",
      apiKey.substring(0, 10) + "..."
    );

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
      const { data: authUsers, error: authError } =
        await supabaseAdmin.auth.admin.listUsers();

      if (authError) {
        console.log("⚠️ Auth users list error:", authError.message);
        console.log("⚠️ Falling back to custom user ID:", data.id);
        return data;
      }

      // Find user by email in the list
      const authUser = authUsers.users?.find(
        (user) => user.email === data.email
      );

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

async function extractRevenueDataWithAI(
  subject: string,
  from: string,
  emailBody: string,
  emailDate?: string
) {
  const prompt = `
    Extract revenue/income information from this email. This represents money coming INTO the account.
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 2000)}
    
    IMPORTANT CONTEXT:
    - If this is a Hostinger refund email (subject contains "Hostinger" or "pengembalian"), the source should be "Hostinger" 
    - If the email contains Indonesian text like "pengembalian uang" or "dana dikembalikan", this is a REFUND
    - Look for currency indicators like "IDR", "Rp", or "rupiah" for Indonesian Rupiah
    - Amount patterns like "170,000.10 IDR" should be parsed as 170000.10 IDR (not JPY!)
    
    Extract the following information and return as JSON:
    {
      "source": "who/where the money came from (e.g., 'Hostinger', 'PayPal', 'Coinbase')",
      "amount": 123.45,
      "currency": "USD|EUR|IDR|JPY|etc",
      "category": "payment_received|refund|business_income|investment|government|digital_platform|sales",
      "revenue_type": "specific type within category",
      "description": "brief description",
      "date": "YYYY-MM-DD",
      "reference_number": "transaction/invoice/reference number if any",
      "tax_implications": {
        "taxable": true/false,
        "category": "business_income|investment_gain|etc"
      }
    }
    
    Categories explained:
    - payment_received: General payments received from clients/customers
    - refund: Money returned from previous purchases (pengembalian uang)
    - business_income: Freelance, consulting, invoice payments
    - investment: Dividends, interest, trading profits
    - government: Tax refunds, benefits, stimulus payments
    - digital_platform: PayPal, Venmo, Stripe payments received
    - sales: Marketplace sales, product sales
    
    CURRENCY DETECTION RULES:
    - "IDR", "Rp", "rupiah" = IDR (Indonesian Rupiah)
    - "USD", "$" = USD
    - "JPY", "¥" = JPY (Japanese Yen)
    - "EUR", "€" = EUR
    
    Important: Only extract if this is clearly about money coming IN, not going out.
    Return null if no revenue information is found.
  `;

  try {
    const openaiApiKey = Deno.env.get("OPENAI_API_KEY");
    if (!openaiApiKey) {
      throw new Error("OpenAI API key not configured");
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${openaiApiKey}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1,
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

    const revenueData = JSON.parse(jsonMatch[0]);
    console.log("✅ AI extraction successful:", revenueData);

    // Validate and clean up the data with enhanced source detection
    let source = revenueData.source;

    // Enhanced source detection - prioritize content over email domain
    if (
      !source ||
      source.toLowerCase() === "gmail" ||
      source.toLowerCase() === "unknown"
    ) {
      // First check for company names in subject and body
      source =
        extractSourceFromText(`${subject} ${emailBody}`.toLowerCase()) ||
        extractSourceFromEmail(from);
    }

    // Ensure source is never null
    if (!source) {
      const emailMatch = from.match(/@([^>]+)/);
      if (emailMatch) {
        const domain = emailMatch[1].replace(
          /^(www\.|mail\.|noreply\.|no-reply\.)/i,
          ""
        );
        source =
          domain.split(".")[0].charAt(0).toUpperCase() +
          domain.split(".")[0].slice(1);
      } else {
        source = "Unknown Source";
      }
    }

    // Enhanced currency detection with fallback
    let detectedCurrency = revenueData.currency;
    if (!detectedCurrency || detectedCurrency === "JPY") {
      // Re-detect currency from text to avoid AI mistakes
      detectedCurrency =
        detectCurrencyFromText(`${subject} ${emailBody}`) ||
        detectCurrencyFromSource(source) ||
        "USD";
      console.log(`🔄 Currency re-detected as: ${detectedCurrency}`);
    }

    return {
      source,
      amount:
        typeof revenueData.amount === "number" ? revenueData.amount : null,
      currency: detectedCurrency,
      category: revenueData.category || "payment_received",
      revenue_type: revenueData.revenue_type || "other",
      description: revenueData.description || subject,
      date:
        validateDate(revenueData.date) || emailDate || new Date().toISOString(),
      reference_number: revenueData.reference_number,
      tax_implications: revenueData.tax_implications || {},
    };
  } catch (error) {
    console.error("Error with OpenAI revenue extraction:", error);
    return fallbackRevenueExtraction(subject, from, emailBody, emailDate);
  }
}

function fallbackRevenueExtraction(
  subject: string,
  from: string,
  emailBody: string,
  emailDate?: string
) {
  console.log("🔍 Using fallback pattern-based revenue extraction");

  const text = `${subject} ${emailBody}`.toLowerCase();

  // Extract source with fallback to a default value
  let source = extractSourceFromEmail(from) || extractSourceFromText(text);

  if (!source) {
    const emailMatch = from.match(/@([^>]+)/);
    if (emailMatch) {
      const domain = emailMatch[1].replace(
        /^(www\.|mail\.|noreply\.|no-reply\.)/i,
        ""
      );
      source =
        domain.split(".")[0].charAt(0).toUpperCase() +
        domain.split(".")[0].slice(1);
    } else {
      source = "Unknown Source";
    }
  }

  const detectedCurrency =
    detectCurrencyFromText(text) || detectCurrencyFromSource(source) || "USD";

  return {
    source,
    amount: extractAmountFromText(text),
    currency: detectedCurrency,
    category: extractRevenueCategoryFromText(text),
    revenue_type: "other",
    description: subject,
    date: emailDate || new Date().toISOString(),
    reference_number: extractReferenceNumber(text),
    tax_implications: {},
  };
}

function extractSourceFromEmail(from: string): string | null {
  // Extract company name from email
  const patterns = [
    /(\w+)@(\w+)\.(com|org|net)/i,
    /noreply@(\w+)/i,
    /no-reply@(\w+)/i,
  ];

  for (const pattern of patterns) {
    const match = from.match(pattern);
    if (match) {
      return match[2] || match[1];
    }
  }

  return null;
}

function extractSourceFromText(text: string): string | null {
  const sourcePatterns = [
    // Company name patterns - check for common service providers first
    /hostinger/i,
    /paypal/i,
    /stripe/i,
    /coinbase/i,
    /binance/i,
    /grab/i,
    /gojek/i,
    /tokopedia/i,
    /shopee/i,
    /lazada/i,
    /pintu/i,
    /indodax/i,
    /namecheap/i,
    /godaddy/i,
    /digitalocean/i,

    // Generic patterns
    /payment from ([^\.]+)/i,
    /received from ([^\.]+)/i,
    /refund from ([^\.]+)/i,
    /transfer from ([^\.]+)/i,
    /withdrawal from ([^\.]+)/i,
    /payout from ([^\.]+)/i,
    /deposit from ([^\.]+)/i,
  ];

  for (const pattern of sourcePatterns) {
    const match = text.match(pattern);
    if (match) {
      // If it's a direct company name match, return it capitalized
      if (typeof match[0] === "string" && !match[1]) {
        return (
          match[0].charAt(0).toUpperCase() + match[0].slice(1).toLowerCase()
        );
      }
      // If it's a pattern with capture group, return the captured text
      if (match[1]) {
        return match[1].trim();
      }
    }
  }

  return null;
}

function extractAmountFromText(text: string): number | null {
  const patterns = [
    // USD patterns
    /\$(\d+\.?\d*)/g,
    /(\d+\.?\d*)\s*usd/gi,
    /received[:\s]*\$?(\d+\.?\d*)/gi,
    /amount[:\s]*\$?(\d+\.?\d*)/gi,
    /credited[:\s]*\$?(\d+\.?\d*)/gi,
    /deposited[:\s]*\$?(\d+\.?\d*)/gi,

    // IDR (Indonesian Rupiah) patterns - most common for Pintu
    /withdrawal.*rp\s*([\d,\.]+)/gi, // withdrawal of Rp 30.527.500
    /withdrawn\s*rp\s*([\d,\.]+)/gi, // withdrawn Rp 30.527.500
    /successfully.*withdrawn\s*rp\s*([\d,\.]+)/gi, // successfully withdrawn Rp 30.527.500
    /rp\s*([\d,\.]+).*(?:withdrawn|transferred|deposited)/gi, // Rp 30.527.500 withdrawn
    /rp\s*([\d,\.]+)/gi, // General Rp amounts

    // Other international currency patterns
    /€\s*([\d,\.]+)/gi, // Euro amounts
    /£\s*([\d,\.]+)/gi, // Pound amounts
    /¥\s*([\d,\.]+)/gi, // Yen amounts
    /₹\s*([\d,\.]+)/gi, // Rupee amounts
    /₱\s*([\d,\.]+)/gi, // Peso amounts
    /rm\s*([\d,\.]+)/gi, // Malaysian Ringgit
    /s\$\s*([\d,\.]+)/gi, // Singapore Dollar

    // Generic amount patterns
    /(\d+[,\.]\d+[,\.]\d+)/g, // Large numbers with separators like 16,550,500 or 16.550.500
    /(\d{4,})/g, // Numbers with 4+ digits (for large amounts without separators)
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const numericMatch = matches[0].match(/([\d,\.]+)/);
      if (numericMatch) {
        let amountStr = numericMatch[1];

        // Handle different number formats
        const currency = detectCurrencyFromText(text);

        if (
          currency === "IDR" &&
          amountStr.includes(".") &&
          !amountStr.includes(",")
        ) {
          // Indonesian format: dots as thousands separators, no decimal places
          amountStr = amountStr.replace(/\./g, "");
        } else if (amountStr.includes(",") && amountStr.includes(".")) {
          // European format: 1.234.567,89 or US format: 1,234,567.89
          const lastDotIndex = amountStr.lastIndexOf(".");
          const lastCommaIndex = amountStr.lastIndexOf(",");

          if (lastCommaIndex > lastDotIndex) {
            // European format: remove dots, keep comma as decimal
            amountStr = amountStr.replace(/\./g, "").replace(",", ".");
          } else {
            // US format: remove commas, keep dot as decimal
            amountStr = amountStr.replace(/,/g, "");
          }
        } else {
          // Simple format: just remove commas
          amountStr = amountStr.replace(/,/g, "");
        }

        const amount = parseFloat(amountStr);
        if (amount > 0 && amount < 100000000) {
          // Increased upper limit for IDR
          return amount;
        }
      }
    }
  }

  return null;
}

function extractRevenueCategoryFromText(text: string): string {
  const categoryKeywords = {
    refund: [
      "refund",
      "return",
      "credit",
      "reimbursement",
      "chargeback",
      // Indonesian refund terms
      "pengembalian",
      "dikembalikan",
      "refund diproses",
      "dana dikembalikan",
    ],
    business_income: [
      "invoice",
      "freelance",
      "consulting",
      "client",
      "project",
      "service",
    ],
    investment: ["dividend", "interest", "profit", "gain", "trading"],
    government: ["tax", "refund", "stimulus", "benefit", "irs"],
    digital_platform: ["paypal", "venmo", "zelle", "stripe", "cashapp"],
    sales: ["sale", "sold", "purchase", "buyer", "marketplace"],
  };

  for (const [category, keywords] of Object.entries(categoryKeywords)) {
    if (keywords.some((keyword) => text.includes(keyword))) {
      console.log(`📊 Category detected: ${category} from keyword match`);
      return category;
    }
  }

  return "payment_received";
}

function extractReferenceNumber(text: string): string | null {
  const patterns = [
    /invoice[:\s]*#?([a-z0-9-]+)/i,
    /transaction[:\s]*#?([a-z0-9-]+)/i,
    /reference[:\s]*#?([a-z0-9-]+)/i,
    /confirmation[:\s]*#?([a-z0-9-]+)/i,
  ];

  for (const pattern of patterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1];
    }
  }

  return null;
}

function validateDate(dateString: string): string | null {
  try {
    const date = new Date(dateString);
    if (isNaN(date.getTime())) {
      return null;
    }
    return date.toISOString();
  } catch {
    return null;
  }
}

function detectCurrencyFromText(text: string): string | null {
  const lowerText = text.toLowerCase();

  // Currency symbol patterns - IDR patterns should be checked FIRST
  const currencyPatterns = [
    // Indonesian Rupiah patterns (check first to avoid conflicts)
    { pattern: /rp\s*[\d,\.]+|[\d,\.]+\s*idr\b|rupiah/i, currency: "IDR" },

    // Other currency patterns
    { pattern: /\$\d|usd|\busd\b/i, currency: "USD" },
    { pattern: /€\d|eur|\beur\b/i, currency: "EUR" },
    { pattern: /£\d|gbp|\bgbp\b/i, currency: "GBP" },
    { pattern: /¥\d|jpy|\bjpy\b/i, currency: "JPY" },
    { pattern: /₹\d|inr|\binr\b/i, currency: "INR" },
    { pattern: /s\$\d|sgd|\bsgd\b/i, currency: "SGD" },
    { pattern: /rm\s*\d|myr|\bmyr\b/i, currency: "MYR" },
    { pattern: /₿\d|btc|\bbtc\b|bitcoin/i, currency: "BTC" },
    { pattern: /eth|\beth\b|ethereum/i, currency: "ETH" },
    { pattern: /cad|\bcad\b/i, currency: "CAD" },
    { pattern: /aud|\baud\b/i, currency: "AUD" },
    { pattern: /chf|\bchf\b/i, currency: "CHF" },
    { pattern: /cny|\bcny\b|yuan/i, currency: "CNY" },
    { pattern: /krw|\bkrw\b|won/i, currency: "KRW" },
    { pattern: /thb|\bthb\b|baht/i, currency: "THB" },
    { pattern: /vnd|\bvnd\b|dong/i, currency: "VND" },
    { pattern: /php|\bphp\b|peso/i, currency: "PHP" },
  ];

  for (const { pattern, currency } of currencyPatterns) {
    if (pattern.test(lowerText)) {
      console.log(`💱 Currency detected: ${currency} from pattern: ${pattern}`);
      return currency;
    }
  }

  return null;
}

function detectCurrencyFromSource(source: string): string | null {
  const lowerSource = source.toLowerCase();

  // Country/region-based currency detection
  const sourceCurrencyMap: Record<string, string> = {
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

    // UK companies
    revolut: "GBP",
    monzo: "GBP",
    starling: "GBP",

    // European companies
    wise: "EUR",
    klarna: "EUR",
    adyen: "EUR",

    // Indonesian companies
    hostinger: "IDR",
    gojek: "IDR",
    tokopedia: "IDR",
    pintu: "IDR",
    indodax: "IDR",

    // Asian companies
    grab: "SGD",
    shopee: "SGD",
    lazada: "SGD",

    // Crypto exchanges
    coinbase: "USD",
    binance: "USD",
    kraken: "USD",
    gemini: "USD",
  };

  for (const [company, currency] of Object.entries(sourceCurrencyMap)) {
    if (lowerSource.includes(company)) {
      console.log(
        `🏢 Source-based currency detected: ${currency} for ${company}`
      );
      return currency;
    }
  }

  return null;
}
