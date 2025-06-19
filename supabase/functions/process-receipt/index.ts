import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-api-key",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Initialize Supabase client with service role key for backend operations
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");

Deno.serve(async (req) => {
  console.log("🧾 Receipt processing function called");

  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { messageId, subject, from, emailBody } = await req.json();

    if (!messageId || !subject || !emailBody) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Get user from API key
    const userApiKey = req.headers.get("x-user-api-key");
    if (!userApiKey) {
      return new Response(JSON.stringify({ error: "Missing user API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user by API key
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("api_key", userApiKey)
      .single();

    if (userError || !user) {
      console.error("User lookup error:", userError);
      return new Response(JSON.stringify({ error: "Invalid user API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("✅ User authenticated:", user.email);

    // Extract receipt data using AI
    const receiptData = await extractReceiptDataWithAI(
      subject,
      from,
      emailBody
    );

    if (!receiptData) {
      return new Response(
        JSON.stringify({ error: "Failed to extract receipt data" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("📊 Extracted receipt data:", receiptData);

    // Store receipt in database
    const { data: receipt, error: receiptError } = await supabase
      .from("receipts")
      .insert({
        user_id: user.id,
        email_id: messageId,
        merchant: receiptData.merchant,
        amount: receiptData.amount,
        currency: receiptData.currency || "USD",
        category: receiptData.category || "other",
        description: receiptData.description || subject,
        date: receiptData.date || new Date().toISOString(),
        invoice_number: receiptData.invoice_number,
        payment_method: receiptData.payment_method,
        tax_amount: receiptData.tax_amount,
        details: receiptData,
      })
      .select()
      .single();

    if (receiptError) {
      console.error("Error storing receipt:", receiptError);
      return new Response(
        JSON.stringify({ error: "Failed to store receipt data" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("✅ Receipt stored successfully with ID:", receipt.id);

    return new Response(
      JSON.stringify({
        success: true,
        receiptId: receipt.id,
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

async function extractReceiptDataWithAI(
  subject: string,
  from: string,
  emailBody: string
) {
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
  "currency": "USD/EUR/etc",
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
- Amount should be a number without currency symbols
- Date should be ISO format
- Category should be one of the predefined options
- Be conservative - if unsure, use null or "other"`;

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
        const domain = emailMatch[1].replace(
          /^(www\.|mail\.|noreply\.|no-reply\.)/i,
          ""
        );
        merchant =
          domain.split(".")[0].charAt(0).toUpperCase() +
          domain.split(".")[0].slice(1);
      } else {
        merchant = "Unknown Merchant";
      }
    }

    return {
      merchant,
      amount:
        typeof receiptData.amount === "number" ? receiptData.amount : null,
      currency: receiptData.currency || "USD",
      category: receiptData.category || "other",
      description: receiptData.description || subject,
      date: validateDate(receiptData.date) || new Date().toISOString(),
      invoice_number: receiptData.invoice_number,
      payment_method: receiptData.payment_method,
      tax_amount:
        typeof receiptData.tax_amount === "number"
          ? receiptData.tax_amount
          : null,
    };
  } catch (error) {
    console.error("AI extraction failed:", error);
    console.log("🔄 Falling back to pattern-based extraction");
    return fallbackReceiptExtraction(subject, from, emailBody);
  }
}

function fallbackReceiptExtraction(
  subject: string,
  from: string,
  emailBody: string
) {
  console.log("🔍 Using fallback pattern-based extraction");

  const text = `${subject} ${emailBody}`.toLowerCase();

  // Extract merchant with fallback to a default value
  let merchant = extractVendorFromEmail(from) || extractVendorFromText(text);

  // If no merchant found, create a fallback based on the email or subject
  if (!merchant) {
    // Try to extract from sender domain
    const emailMatch = from.match(/@([^>]+)/);
    if (emailMatch) {
      const domain = emailMatch[1].replace(
        /^(www\.|mail\.|noreply\.|no-reply\.)/i,
        ""
      );
      merchant =
        domain.split(".")[0].charAt(0).toUpperCase() +
        domain.split(".")[0].slice(1);
    } else {
      // Last resort: use "Unknown Merchant"
      merchant = "Unknown Merchant";
    }
  }

  return {
    merchant,
    amount: extractAmountFromText(text),
    currency: "USD", // Default to USD
    category: extractCategoryFromText(text),
    description: subject,
    date: new Date().toISOString(),
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
    "supabase",
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
    /\$(\d+\.?\d*)/g,
    /(\d+\.?\d*)\s*usd/gi,
    /total[:\s]*\$?(\d+\.?\d*)/gi,
    /amount[:\s]*\$?(\d+\.?\d*)/gi,
    /charged[:\s]*\$?(\d+\.?\d*)/gi,
    /paid[:\s]*\$?(\d+\.?\d*)/gi,
  ];

  for (const pattern of patterns) {
    const matches = text.match(pattern);
    if (matches && matches.length > 0) {
      const numericMatch = matches[0].match(/(\d+\.?\d*)/);
      if (numericMatch) {
        const amount = parseFloat(numericMatch[1]);
        if (amount > 0 && amount < 100000) {
          return amount;
        }
      }
    }
  }

  return null;
}

function extractCategoryFromText(text: string): string {
  const categoryKeywords = {
    software: [
      "software",
      "saas",
      "subscription",
      "app",
      "license",
      "vercel",
      "github",
      "adobe",
      "microsoft",
    ],
    food: [
      "restaurant",
      "cafe",
      "food",
      "meal",
      "dining",
      "starbucks",
      "mcdonalds",
      "pizza",
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
    ],
    utilities: ["electric", "gas", "water", "internet", "phone", "utility"],
    entertainment: [
      "netflix",
      "spotify",
      "movie",
      "game",
      "music",
      "streaming",
    ],
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
