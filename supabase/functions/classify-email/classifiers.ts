// Email classification orchestrator
import { OpenAI } from "npm:openai@4";
import type { EmailData, Classification } from "./types.ts";
import { buildClassificationPrompt } from "./prompts.ts";
import {
  CLASSIFICATION_CONFIG,
  COMMON_EMAIL_PROVIDERS,
  ATS_DOMAINS,
} from "./patterns.ts";

// Import category-specific classifiers
import {
  classifyJobApplication,
  buildJobApplicationPrompt,
} from "./categories/job-application.ts";
import { classifyTravel, buildTravelPrompt } from "./categories/travel.ts";
import { classifyReceipt, buildReceiptPrompt } from "./categories/receipt.ts";

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get("OPENAI_API_KEY") || "",
});

export async function classifyEmailWithOpenAI(
  emailData: EmailData
): Promise<Classification> {
  console.log("🤖 Starting AI-powered classification...");

  // First, try category-specific AI classification for better accuracy
  const categoryClassification = await trySpecificCategoryClassification(
    emailData
  );
  if (categoryClassification) {
    console.log(
      "✅ Category-specific AI classification successful:",
      categoryClassification.type
    );
    return categoryClassification;
  }

  // Fallback to general AI classification
  const generalClassification = await tryGeneralAIClassification(emailData);
  if (generalClassification && generalClassification.type !== "other") {
    console.log(
      "✅ General AI classification successful:",
      generalClassification.type
    );
    return generalClassification;
  }

  // Final fallback to pattern-based classification
  console.log("🔄 Falling back to pattern-based classification...");
  return classifyEmailWithPatterns(emailData);
}

async function trySpecificCategoryClassification(
  emailData: EmailData
): Promise<Classification | null> {
  try {
    // Try each category with specialized prompts for better accuracy
    const categoryTests = [
      { name: "job_application", prompt: buildJobApplicationPrompt(emailData) },
      { name: "travel", prompt: buildTravelPrompt(emailData) },
      { name: "receipt", prompt: buildReceiptPrompt(emailData) },
    ];

    for (const test of categoryTests) {
      try {
        const completion = await openai.chat.completions.create({
          model: CLASSIFICATION_CONFIG.openai.model,
          messages: [{ role: "user", content: test.prompt }],
          temperature: CLASSIFICATION_CONFIG.openai.temperature,
        });

        const response = completion.choices[0].message.content?.trim();
        if (!response) continue;

        // Clean up response
        const cleanResponse = response
          .replace(/^```json\s*/, "")
          .replace(/\s*```$/, "");
        const result = JSON.parse(cleanResponse);

        if (result.isMatch && result.confidence > 0.7) {
          console.log(
            `🎯 Specific ${test.name} classification: confidence ${result.confidence}`
          );

          // Get actions using category-specific logic
          const actions = getActionsByType(test.name as Classification["type"]);

          return {
            type: test.name as Classification["type"],
            confidence: result.confidence,
            reasoning: result.reasoning,
            actions,
            method: "ai-specific",
          };
        }
      } catch (error) {
        console.error(`Error in ${test.name} classification:`, error);
        continue;
      }
    }

    return null;
  } catch (error) {
    console.error("Error in specific category classification:", error);
    return null;
  }
}

async function tryGeneralAIClassification(
  emailData: EmailData
): Promise<Classification | null> {
  try {
    const prompt = buildClassificationPrompt(emailData);

    const completion = await openai.chat.completions.create({
      model: CLASSIFICATION_CONFIG.openai.model,
      messages: [{ role: "user", content: prompt }],
      temperature: CLASSIFICATION_CONFIG.openai.temperature,
    });

    let response = completion.choices[0].message.content;
    if (!response) throw new Error("Empty response from OpenAI");

    // Clean up the response
    response = response.trim();
    if (response.startsWith("```json")) {
      response = response.replace(/^```json\s*/, "").replace(/\s*```$/, "");
    } else if (response.startsWith("```")) {
      response = response.replace(/^```\s*/, "").replace(/\s*```$/, "");
    }

    const classification = JSON.parse(response);

    if (classification.reasoning) {
      console.log("🤖 General AI reasoning:", classification.reasoning);
    }

    // Add appropriate actions
    classification.actions = getActionsByType(classification.type);
    classification.method = "ai-general";

    return classification;
  } catch (error) {
    console.error("General AI classification error:", error);
    return null;
  }
}

export function classifyEmailWithPatterns(
  emailData: EmailData
): Classification {
  console.log("🔍 Using pattern-based classification...");

  // Try each category-specific classifier
  const classifiers = [classifyJobApplication, classifyTravel, classifyReceipt];

  for (const classifier of classifiers) {
    const result = classifier(emailData);
    if (result) {
      console.log(
        `✅ Pattern-based classification: ${result.type} (confidence: ${result.confidence})`
      );
      return result;
    }
  }

  // Default to 'other' if no category matches
  console.log(
    "✅ Pattern-based classification: other (no specific category matched)"
  );
  return {
    type: "other",
    confidence: 0.5,
    actions: [],
    method: "pattern-based-default",
  };
}

function isFromCommonEmailProvider(fromEmail: string): boolean {
  return COMMON_EMAIL_PROVIDERS.some((provider) =>
    fromEmail.includes(provider.toLowerCase())
  );
}

function isFromATS(fromEmail: string): boolean {
  return ATS_DOMAINS.some((domain) => fromEmail.includes(domain.toLowerCase()));
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
          type: "complex" as const,
          label: "View Financial Dashboard",
          handler: "openFinancialDashboard",
          data: {},
        },
      ];
    case "travel":
      return [
        {
          type: "complex" as const,
          label: "Compare Hotel Prices",
          handler: "openHotelComparison",
          data: {},
        },
        {
          type: "simple" as const,
          label: "Add to Calendar",
          handler: "handleAddToCalendar",
          data: {},
        },
      ];
    case "job_application":
      return [
        {
          type: "complex" as const,
          label: "Track Application",
          handler: "openJobTracker",
          data: {},
        },
      ];
    default:
      return [];
  }
}
