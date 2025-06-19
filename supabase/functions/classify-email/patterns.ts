// Classification patterns and rules
import type { ClassificationConfig } from "./types.ts";

export const CLASSIFICATION_CONFIG: ClassificationConfig = {
  openai: {
    model: "gpt-4o-mini",
    temperature: 0.05,
    maxTokens: 1000,
  },
  patterns: {
    // Exclusion patterns - emails that should NOT be classified as job applications
    exclusions: [
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
    ],

    // Specific job application patterns
    jobApplication: [
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
    ],

    // Travel patterns (more specific)
    travel: [
      /flight\s+(?:confirmation|booking|itinerary|ticket)/i,
      /boarding\s+pass/i,
      /hotel\s+(?:confirmation|booking|reservation)/i,
      /booking\s+confirmation.*(?:flight|hotel|car|rental)/i,
      /itinerary.*(?:flight|hotel|trip)/i,
      /reservation\s+confirmation/i,
      /travel\s+itinerary/i,
      /check-in\s+(?:reminder|now\s+available)/i,
    ],

    // Receipt patterns (enhanced for Supabase-style invoices)
    receipt: [
      /receipt.*(?:purchase|order|payment)/i,
      /invoice.*(?:payment|due|amount)/i,
      /payment\s+(?:confirmation|receipt|successful)/i,
      /order\s+(?:confirmation|receipt|summary)/i,
      /transaction\s+(?:receipt|confirmation|summary)/i,
      /purchase\s+(?:confirmation|receipt|summary)/i,
      /your\s+(?:receipt|invoice|bill)/i,
      // Enhanced patterns for business invoices
      /receipt\s+\[#[\w-]+\]/i, // Matches "receipt [#1946-4660]"
      /invoice\s+\(#[\w-]+\)/i, // Matches "invoice (#WGTALJ-00010)"
      /payment\s+received.*invoice\s+\(#[\w-]+\)/i,
      /your\s+[\w\s]+(?:pte\s+ltd|ltd|llc|inc|corp)\s+receipt/i,
      /invoice\s*#[\w-]+/i,
      /receipt\s*#[\w-]+/i,
    ],
  },
};

// Common email provider domains to exclude from job classification
export const COMMON_EMAIL_PROVIDERS = [
  "gmail.com",
  "yahoo.com",
  "outlook.com",
  "hotmail.com",
  "aol.com",
  "icloud.com",
];

// Application tracking system domains (likely to be legitimate job emails)
export const ATS_DOMAINS = [
  "greenhouse.io",
  "workday.com",
  "lever.co",
  "smartrecruiters.com",
  "bamboohr.com",
  "successfactors.com",
  "icims.com",
  "jobvite.com",
  "taleo.net",
  "ultipro.com",
];
