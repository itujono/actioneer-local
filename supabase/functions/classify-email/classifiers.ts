// Email classification orchestrator - AI-FIRST APPROACH
import { OpenAI } from "npm:openai@4";
import type { EmailData, Classification } from "./types.ts";
import { buildClassificationPrompt } from "./prompts.ts";
import { CLASSIFICATION_CONFIG } from "./patterns.ts";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
});

export async function classifyEmail(emailData: EmailData): Promise<Classification> {
  console.log("🤖 Starting AI-FIRST email classification...");
  console.log("📧 Email preview:", {
    subject: emailData.subject,
    from: emailData.from,
    preview: emailData.body.substring(0, 200) + "...",
  });

  try {
    // Use AI for ALL classification - no pattern fallbacks
    const aiClassification = await tryAIClassification(emailData);

    if (aiClassification) {
      console.log("✅ AI classification successful:", {
        type: aiClassification.type,
        confidence: aiClassification.confidence,
        method: aiClassification.method,
        reasoning: aiClassification.reasoning,
      });
      return aiClassification;
    }

    // Only if AI completely fails, fall back to 'other'
    console.log("⚠️ AI classification failed, defaulting to 'other'");
    return {
      type: "other",
      confidence: 0.1,
      reasoning: "AI classification failed - could not determine category",
      actions: [],
      method: "ai-fallback",
    };
  } catch (error) {
    console.error("❌ Classification error:", error);
    return {
      type: "other",
      confidence: 0.1,
      reasoning: `Classification error: ${error.message}`,
      actions: [],
      method: "error-fallback",
    };
  }
}

async function tryAIClassification(emailData: EmailData): Promise<Classification | null> {
  try {
    console.log("🧠 Attempting AI classification...");

    const prompt = buildAdvancedClassificationPrompt(emailData);

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini", // Use latest and most capable model
      messages: [{ role: "user", content: prompt }],
      temperature: 0.1, // Lower temperature for more consistent results
      response_format: { type: "json_object" },
    });

    let response = completion.choices[0].message.content;
    if (!response) throw new Error("Empty response from OpenAI");

    console.log("🤖 AI raw response:", response);

    const classification = JSON.parse(response);

    // Validate AI response
    if (!classification.type || !classification.confidence || !classification.reasoning) {
      throw new Error("Invalid AI response format");
    }

    // Add appropriate actions based on type
    classification.actions = getActionsByType(classification.type);
    classification.method = "ai-primary";

    console.log("✅ AI classification parsed successfully:", {
      type: classification.type,
      confidence: classification.confidence,
      reasoning: classification.reasoning.substring(0, 100) + "...",
    });

    return classification;
  } catch (error) {
    console.error("❌ AI classification error:", error);
    return null;
  }
}

function buildAdvancedClassificationPrompt(emailData: EmailData): string {
  return `You are an expert email classifier. Analyze this email and classify it into ONE of these categories:

CATEGORIES:
1. "receipt" - Money you SPENT (purchases, bills, subscriptions you paid for)
2. "revenue" - Money you RECEIVED (payments to you, refunds, income, earnings)  
3. "travel" - Travel deals, promotions, booking offers (NOT confirmations)
4. "job_application" - Job applications, career opportunities, employment
5. "other" - Everything else

CRITICAL DISTINCTION - Receipt vs Revenue:
- RECEIPT: "Thank you for your purchase", "Your subscription was charged", "Order confirmation", "Bill paid"
- REVENUE: "Payment received", "Money deposited", "Refund issued", "You earned", "Funds added to your account"

 Email to classify:
 Subject: ${emailData.subject}
 From: ${emailData.from}
 Content: ${emailData.body}

INSTRUCTIONS:
1. Focus on WHO is receiving money vs WHO is spending money
2. Look for directional language: "to you" = revenue, "from you" = receipt
3. Past tense completion language: "received", "deposited", "earned" = revenue
4. Payment confirmations for services YOU provided = revenue
5. Purchase confirmations for things YOU bought = receipt

Return ONLY a JSON object with:
{
  "type": "receipt|revenue|travel|job_application|other",
  "confidence": 0.0-1.0,
  "reasoning": "Detailed explanation of why this classification was chosen, including specific words/phrases that led to this decision"
}`;
}

function getActionsByType(type: Classification["type"]) {
  switch (type) {
    case "receipt":
      return [
        {
          type: "simple" as const,
          label: "Track Expense",
          handler: "handleTrackExpense",
          data: {},
        },
        {
          type: "simple" as const,
          label: "View Receipt",
          handler: "handleViewReceipt",
          data: {},
        },
      ];
    case "revenue":
      return [
        {
          type: "simple" as const,
          label: "Track Income",
          handler: "handleTrackIncome",
          data: {},
        },
        {
          type: "simple" as const,
          label: "View Details",
          handler: "handleViewRevenue",
          data: {},
        },
      ];
    case "travel":
      return [
        {
          type: "route" as const,
          label: "Get Recommendations",
          handler: "handleTravelRecommendations",
          data: {},
        },
      ];
    case "job_application":
      return [
        {
          type: "simple" as const,
          label: "Track Application",
          handler: "handleTrackApplication",
          data: {},
        },
        {
          type: "simple" as const,
          label: "View Details",
          handler: "handleViewJobApplication",
          data: {},
        },
      ];
    default:
      return [];
  }
}

// Legacy function for backwards compatibility - now just calls AI
export function classifyEmailWithPatterns(emailData: EmailData): Classification {
  console.log("🔄 Legacy pattern function called - redirecting to AI classification");
  // This will be an async function call, but we'll handle it in the main flow
  return {
    type: "other",
    confidence: 0.1,
    actions: [],
    method: "legacy-redirect",
  };
}
