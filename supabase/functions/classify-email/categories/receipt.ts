// Receipt/Expense Classification Module
import type { EmailData, Classification, Action } from "../types.ts";

export const RECEIPT_PATTERNS = {
  // Purchase receipts
  purchases: [
    /receipt.*(?:purchase|order|payment|transaction)/i,
    /purchase\s+(?:confirmation|receipt|summary)/i,
    /order\s+(?:confirmation|receipt|summary|complete)/i,
    /transaction\s+(?:receipt|confirmation|summary|complete)/i,
    /payment\s+(?:confirmation|receipt|successful|processed)/i,
    /your\s+(?:receipt|purchase|order)/i,
    /thank\s+you\s+for\s+your\s+(?:purchase|order)/i,
  ],

  // Enhanced invoices and bills patterns with specific invoice number formats
  invoices: [
    /invoice.*(?:payment|due|amount|billing)/i,
    /bill.*(?:payment|due|amount)/i,
    /billing\s+(?:statement|summary|notice)/i,
    /payment\s+(?:due|reminder|notice)/i,
    /account\s+(?:statement|summary|balance)/i,
    /monthly\s+(?:statement|bill|invoice)/i,
    /subscription\s+(?:renewal|payment|charge)/i,
    // Specific invoice number patterns for Supabase-style receipts
    /receipt\s+\[#[\w-]+\]/i, // Matches "receipt [#1946-4660]"
    /invoice\s+\(#[\w-]+\)/i, // Matches "invoice (#WGTALJ-00010)"
    /payment\s+received.*invoice\s+\(#[\w-]+\)/i, // Matches "Payment received for ... invoice (#...)"
    /your\s+[\w\s]+(?:pte\s+ltd|ltd|llc|inc|corp|corporation)\s+receipt/i, // Company receipt patterns
    /receipt\s+from\s+[\w\s]+(?:pte\s+ltd|ltd|llc|inc|corp)/i,
    // Generic invoice number patterns
    /invoice\s*#[\w-]+/i,
    /receipt\s*#[\w-]+/i,
    /bill\s*#[\w-]+/i,
    /reference\s*#[\w-]+/i,
    /transaction\s*#[\w-]+/i,
  ],

  // Digital receipts and confirmations
  digital: [
    /apple\s+(?:receipt|purchase)/i,
    /google\s+play\s+(?:receipt|purchase)/i,
    /app\s+store\s+(?:receipt|purchase)/i,
    /paypal\s+(?:receipt|payment|transaction)/i,
    /venmo\s+(?:payment|charge)/i,
    /zelle\s+(?:payment|transfer)/i,
    /stripe\s+(?:receipt|payment)/i,
    /square\s+(?:receipt|payment)/i,
  ],

  // Enhanced subscription and recurring payments with SaaS patterns
  subscriptions: [
    /subscription\s+(?:payment|renewal|charge|confirmation)/i,
    /recurring\s+(?:payment|charge|billing)/i,
    /auto-renewal\s+(?:confirmation|notice)/i,
    /membership\s+(?:renewal|payment|fee)/i,
    /annual\s+(?:renewal|subscription|payment)/i,
    /monthly\s+(?:subscription|payment|charge)/i,
    // SaaS specific patterns
    /(?:saas|software)\s+(?:subscription|license|payment)/i,
    /(?:plan|tier)\s+(?:renewal|upgrade|payment)/i,
    /usage\s+(?:bill|invoice|charge)/i,
    /service\s+(?:bill|invoice|payment)/i,
  ],

  // Enhanced domains with SaaS and business service providers
  domains: [
    /paypal/i,
    /stripe/i,
    /square/i,
    /venmo/i,
    /zelle/i,
    /apple\.com/i,
    /google\.com/i,
    /amazon/i,
    /shopify/i,
    /etsy/i,
    /ebay/i,
    /walmart/i,
    /target/i,
    /bestbuy/i,
    /homedepot/i,
    /lowes/i,
    /costco/i,
    /chase\.com/i,
    /bankofamerica/i,
    /wellsfargo/i,
    /citi\.com/i,
    /americanexpress/i,
    // SaaS and business service domains
    /supabase/i,
    /vercel/i,
    /netlify/i,
    /aws\.amazon\.com/i,
    /digitalocean/i,
    /linode/i,
    /cloudflare/i,
    /github/i,
    /gitlab/i,
    /notion/i,
    /slack/i,
    /zoom/i,
    /microsoft/i,
    /office365/i,
    /adobe/i,
    /salesforce/i,
    /hubspot/i,
    /mailchimp/i,
    /canva/i,
    /figma/i,
  ],

  // Expense categories
  categories: [
    /restaurant\s+(?:receipt|bill|payment)/i,
    /grocery\s+(?:receipt|purchase)/i,
    /gas\s+(?:receipt|purchase|station)/i,
    /fuel\s+(?:receipt|purchase)/i,
    /parking\s+(?:receipt|fee|payment)/i,
    /toll\s+(?:receipt|charge|payment)/i,
    /office\s+(?:supplies|equipment|purchase)/i,
    /software\s+(?:license|subscription|purchase)/i,
    /utilities\s+(?:bill|payment|statement)/i,
    /internet\s+(?:bill|payment|service)/i,
    /phone\s+(?:bill|payment|service)/i,
    // Business expense categories
    /cloud\s+(?:hosting|service|storage)/i,
    /domain\s+(?:registration|renewal)/i,
    /ssl\s+(?:certificate|cert)/i,
    /api\s+(?:usage|subscription|fee)/i,
    /database\s+(?:hosting|service)/i,
  ],
};

export function buildReceiptPrompt(emailData: EmailData): string {
  return `
    Analyze this email to determine if it's a receipt, invoice, or financial transaction confirmation.
    
    FINANCIAL EMAIL TYPES:
    - Purchase receipts from online/offline stores
    - Digital receipts (App Store, Google Play, PayPal, etc.)
    - Service invoices and bills (utilities, subscriptions, etc.)
    - Payment confirmations and transaction receipts
    - Subscription renewal notices
    - Banking and credit card statements
    - Expense-related confirmations
    - SaaS platform invoices (Supabase, Vercel, AWS, etc.)
    - Business service receipts with invoice numbers
    
    SPECIFIC PATTERNS TO LOOK FOR:
    - Invoice numbers in brackets: "receipt [#1946-4660]"
    - Invoice numbers in parentheses: "invoice (#WGTALJ-00010)"
    - Company receipts: "Your [Company] Pte Ltd receipt"
    - Payment confirmations: "Payment received for [Company] invoice"
    - Reference numbers: "Receipt #ABC-123", "Transaction #XYZ"
    - SaaS billing: subscription charges, usage bills, plan upgrades
    
    INCLUDE:
    - Any document that shows money was spent or charged
    - Invoices requiring payment or payment confirmations
    - Subscription and recurring payment confirmations
    - Digital purchase confirmations
    - Business expense receipts with clear invoice/reference numbers
    - Service provider billing (cloud hosting, software licenses, etc.)
    
    EXCLUDE:
    - Marketing emails from retailers
    - Promotional offers or discounts
    - Account signup confirmations (without payment)
    - General newsletters from financial institutions
    - Trial signup confirmations (unless paid trial)
    
    Email Subject: ${emailData.subject}
    From: ${emailData.from}
    Email Body: ${emailData.body.substring(0, 1500)}
    
    Respond with JSON: { "isMatch": boolean, "confidence": 0-1, "reasoning": "explanation", "receiptType": "purchase|invoice|subscription|digital" }
  `;
}

export function classifyReceipt(emailData: EmailData): Classification | null {
  const subjectLower = emailData.subject.toLowerCase();
  const fromLower = emailData.from.toLowerCase();
  const bodyLower = emailData.body.toLowerCase();

  // Check for financial domains
  const isFromFinancialDomain = RECEIPT_PATTERNS.domains.some((pattern) =>
    pattern.test(fromLower)
  );

  // Check for specific receipt patterns
  const hasPurchasePattern = RECEIPT_PATTERNS.purchases.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasInvoicePattern = RECEIPT_PATTERNS.invoices.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasDigitalPattern = RECEIPT_PATTERNS.digital.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasSubscriptionPattern = RECEIPT_PATTERNS.subscriptions.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasCategoryPattern = RECEIPT_PATTERNS.categories.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  // Look for monetary amounts
  const hasMoneyAmount =
    /\$\d+|\d+\.\d{2}|total.*\d+|amount.*\d+|charged.*\d+/i.test(bodyLower);

  // Determine confidence and type
  let confidence = 0;
  let receiptType = "purchase";

  if (hasPurchasePattern && hasMoneyAmount) {
    confidence = 0.9;
    receiptType = "purchase";
  } else if (hasInvoicePattern) {
    confidence = 0.85;
    receiptType = "invoice";
  } else if (hasDigitalPattern) {
    confidence = 0.85;
    receiptType = "digital";
  } else if (hasSubscriptionPattern) {
    confidence = 0.8;
    receiptType = "subscription";
  } else if (hasCategoryPattern && hasMoneyAmount) {
    confidence = 0.75;
    receiptType = "purchase";
  } else if (
    isFromFinancialDomain &&
    (hasMoneyAmount ||
      bodyLower.includes("payment") ||
      bodyLower.includes("charge"))
  ) {
    confidence = 0.7;
    receiptType = "purchase";
  }

  if (confidence > 0.6) {
    return {
      type: "receipt",
      confidence,
      actions: getReceiptActions(receiptType),
      method: "pattern-based",
      reasoning: `Detected ${receiptType} receipt with confidence ${confidence}`,
    };
  }

  return null;
}

function getReceiptActions(receiptType: string): Action[] {
  const baseActions: Action[] = [
    {
      type: "simple" as const,
      label: "Track Expense",
      handler: "trackExpense",
      data: { receiptType },
    },
    {
      type: "complex" as const,
      label: "View Financial Dashboard",
      handler: "openFinancialDashboard",
      data: { receiptType },
    },
  ];

  // Add specific actions based on receipt type
  switch (receiptType) {
    case "invoice":
      baseActions.push({
        type: "simple" as const,
        label: "Schedule Payment",
        handler: "schedulePayment",
        data: {},
      });
      break;
    case "subscription":
      baseActions.push({
        type: "simple" as const,
        label: "Manage Subscriptions",
        handler: "manageSubscriptions",
        data: {},
      });
      break;
    case "digital":
      baseActions.push({
        type: "simple" as const,
        label: "Categorize Digital Purchase",
        handler: "categorizeDigitalPurchase",
        data: {},
      });
      break;
    case "purchase":
      baseActions.push({
        type: "simple" as const,
        label: "Add to Budget",
        handler: "addToBudget",
        data: {},
      });
      break;
  }

  return baseActions;
}
