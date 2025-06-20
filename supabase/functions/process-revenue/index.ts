import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const { emailData, user } = await req.json();

    if (!emailData || !user) {
      return new Response(
        JSON.stringify({ error: "Missing email data or user information" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const { subject, from, body, messageId } = emailData;

    console.log("🟢 Processing revenue email:");
    console.log("📧 Subject:", subject);
    console.log("👤 From:", from);
    console.log("🆔 Message ID:", messageId);
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

    // Extract revenue data using AI and patterns
    const revenueData = await extractRevenueDataWithAI(subject, from, body);

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

    // Store in database using the user ID
    const { data: storedData, error: storeError } = await supabaseAdmin
      .from("revenue")
      .insert({
        user_id: user.id,
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

async function extractRevenueDataWithAI(
  subject: string,
  from: string,
  emailBody: string
) {
  const prompt = `
    Extract revenue/income information from this email. This represents money coming INTO the account.
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 2000)}
    
    Extract the following information and return as JSON:
    {
      "source": "who/where the money came from",
      "amount": 123.45,
      "currency": "USD",
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
    - refund: Money returned from previous purchases
    - business_income: Freelance, consulting, invoice payments
    - investment: Dividends, interest, trading profits
    - government: Tax refunds, benefits, stimulus payments
    - digital_platform: PayPal, Venmo, Stripe payments received
    - sales: Marketplace sales, product sales
    
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

    // Validate and clean up the data
    let source =
      revenueData.source ||
      extractSourceFromEmail(from) ||
      extractSourceFromText(`${subject} ${emailBody}`.toLowerCase());

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

    return {
      source,
      amount:
        typeof revenueData.amount === "number" ? revenueData.amount : null,
      currency: revenueData.currency || "USD",
      category: revenueData.category || "payment_received",
      revenue_type: revenueData.revenue_type || "other",
      description: revenueData.description || subject,
      date: validateDate(revenueData.date) || new Date().toISOString(),
      reference_number: revenueData.reference_number,
      tax_implications: revenueData.tax_implications || {},
    };
  } catch (error) {
    console.error("Error with OpenAI revenue extraction:", error);
    return fallbackRevenueExtraction(subject, from, emailBody);
  }
}

function fallbackRevenueExtraction(
  subject: string,
  from: string,
  emailBody: string
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

  return {
    source,
    amount: extractAmountFromText(text),
    currency: "USD",
    category: extractRevenueCategoryFromText(text),
    revenue_type: "other",
    description: subject,
    date: new Date().toISOString(),
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
    /payment from ([^\.]+)/i,
    /received from ([^\.]+)/i,
    /refund from ([^\.]+)/i,
    /([a-z\s]+) sent you/i,
  ];

  for (const pattern of sourcePatterns) {
    const match = text.match(pattern);
    if (match) {
      return match[1].trim();
    }
  }

  return null;
}

function extractAmountFromText(text: string): number | null {
  const patterns = [
    /\$(\d+\.?\d*)/g,
    /(\d+\.?\d*)\s*usd/gi,
    /received[:\s]*\$?(\d+\.?\d*)/gi,
    /amount[:\s]*\$?(\d+\.?\d*)/gi,
    /credited[:\s]*\$?(\d+\.?\d*)/gi,
    /deposited[:\s]*\$?(\d+\.?\d*)/gi,
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

function extractRevenueCategoryFromText(text: string): string {
  const categoryKeywords = {
    refund: ["refund", "return", "credit", "reimbursement"],
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
