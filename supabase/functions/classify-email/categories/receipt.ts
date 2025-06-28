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

  // Enhanced subscription and recurring payments with SaaS patterns - COMPLETED ONLY
  subscriptions: [
    /subscription\s+(?:payment|charge)\s+(?:successful|completed|processed|confirmed)/i,
    /recurring\s+(?:payment|charge)\s+(?:successful|completed|processed)/i,
    /auto-renewal\s+(?:completed|successful|processed)/i,
    /membership\s+(?:payment|fee)\s+(?:paid|processed|completed)/i,
    /annual\s+(?:subscription|payment)\s+(?:processed|completed|paid)/i,
    /monthly\s+(?:subscription|payment|charge)\s+(?:processed|completed|paid)/i,
    // SaaS specific patterns - must indicate completion
    /(?:saas|software)\s+(?:subscription|license|payment)\s+(?:processed|completed|confirmed)/i,
    /(?:plan|tier)\s+(?:payment|charge)\s+(?:successful|completed|processed)/i,
    /usage\s+(?:bill|invoice|charge)\s+(?:paid|processed|completed)/i,
    /service\s+(?:bill|invoice|payment)\s+(?:paid|processed|completed)/i,
    // Past tense patterns indicating completed transactions
    /subscription\s+(?:renewed|charged|paid)/i,
    /(?:thank\s+you|thanks)\s+for\s+your\s+(?:subscription|payment)/i,
    /your\s+(?:subscription|payment)\s+(?:has\s+been|was)\s+(?:processed|completed|charged)/i,
  ],

  // EXCLUSION PATTERNS - Future notifications, reminders, and upcoming charges
  future_notifications: [
    /(?:will|going\s+to|about\s+to)\s+(?:renew|charge|bill|auto-renew)/i,
    /subscription\s+(?:will|is\s+about\s+to)\s+renew/i,
    /(?:upcoming|next|future)\s+(?:billing|payment|charge|renewal)/i,
    /(?:reminder|notice|heads?\s*up).*(?:renewal|billing|payment)/i,
    /(?:renew|charge|bill).*(?:soon|tomorrow|next\s+\w+|on\s+\w+\s+\d+)/i,
    /(?:expir|renew).*(?:on|in)\s+\d+/i,
    /payment\s+method.*(?:update|change|expires?)/i,
    /billing\s+information.*(?:update|change|expires?)/i,
  ],

  // MARKETING AND PROMOTIONAL EXCLUSIONS - These are NOT receipts
  promotional_exclusions: [
    // Free offers and promotions
    /(?:free|complimentary|no\s+cost|zero\s+cost)\s+(?:for|trial|offer|access|weekend|hours?|days?)/i,
    /(?:totally|completely|entirely)\s+free/i,
    /free\s+(?:to\s+use|for\s+the\s+next|this\s+weekend|starting\s+now)/i,
    /(?:is|are)\s+(?:officially\s+)?free\s+(?:for|starting|this)/i,

    // Marketing language
    /(?:run|hurry|limited\s+time|act\s+fast|don't\s+miss|countdown)/i,
    /(?:promotional|marketing|campaign|announcement|newsletter)/i,
    /(?:special\s+offer|limited\s+offer|exclusive\s+offer|weekend\s+offer)/i,
    /(?:giveaway|contest|competition|win\s+\$|chance\s+to\s+win)/i,
    /(?:bring\s+a\s+friend|share|tag\s+us|show\s+off)/i,

    // Product announcements and updates
    /(?:new\s+feature|product\s+update|announcement|launch)/i,
    /(?:we've\s+partnered|partnership|collaboration)/i,
    /(?:getting\s+started|walkthrough|tutorial|guide)/i,
    /(?:community|builders|creating|building)/i,

    // Unsubscribe and footer indicators
    /(?:unsubscribe|opt\s+out|email\s+preferences)/i,
    /(?:inc\.|llc|ltd\.|corp\.|corporation).*(?:unsubscribe|opt\s+out)/i,

    // Time-limited free access
    /(?:\d+\s+hours?|\d+\s+days?|\d+\s+weeks?).*free/i,
    /free.*(?:until|through|this\s+weekend|next\s+\w+)/i,
    /(?:weekend|temporary|limited\s+time).*free/i,

    // Specific promotional phrases from the Bolt example
    /(?:it's\s+go\s+time|run\s+don't\s+walk|countdown\s+is\s+on)/i,
    /(?:starting\s+now|officially\s+free|partnered\s+with)/i,
    /(?:boost|tokens|rate\s+limits|peak\s+hours)/i,
    /(?:build\s+something|build\s+an\s+app|single\s+prompt)/i,

    // Administrative and compliance exclusions
    /\[action\s+required\]/i,
    /(?:provide|verify|update|add|enter)\s+(?:your|tax|billing|payment)\s+(?:info|information|details|id|npwp)/i,
    /(?:tax\s+info|tax\s+information|tax\s+id|tax\s+matters|tax\s+adviser)/i,
    /(?:could\s+not\s+be\s+verified|verification|verify\s+your)/i,
    /(?:government\s+records|active\/?\s*valid|compliance|regulatory)/i,
    /(?:how\s+to\s+add|steps\s+to|in\s+order\s+for\s+you\s+to)/i,
    /(?:sign\s+in\s+to|console|navigation|click|pencil\s+icon)/i,
    /(?:may\s+take\s+up\s+to|can't\s+advise|consult\s+your)/i,
    /(?:billing\s+account|payment\s+settings|account\s+settings)/i,

    // Specific Google administrative patterns
    /google\s+payments.*(?:provide|verify|update|tax)/i,
    /(?:npwp|tax\s+id).*(?:could\s+not\s+be|verification|verify)/i,
    /(?:faktur\s+pajak|tax\s+documentation|tax\s+compliance)/i,
    /(?:fix\s+any\s+issues|make\s+sure\s+you|ensure\s+accurate)/i,
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
    
    ⚠️ CRITICAL: ONLY classify as receipt if the transaction has ALREADY HAPPENED (past tense).
    
    FINANCIAL EMAIL TYPES (COMPLETED TRANSACTIONS ONLY):
    - Purchase receipts from online/offline stores (payment already processed)
    - Digital receipts (App Store, Google Play, PayPal, etc.) - transaction complete
    - Service invoices and bills (utilities, subscriptions) - payment already processed
    - Payment confirmations and transaction receipts - money already charged
    - Subscription renewal confirmations - charge already completed
    - Banking and credit card statements - transactions already occurred
    - Expense-related confirmations - payment already made
    - SaaS platform invoices (Supabase, Vercel, AWS, etc.) - billing already processed
    - Business service receipts with invoice numbers - payment completed
    
    SPECIFIC PATTERNS TO LOOK FOR (PAST TENSE ONLY):
    - "Thank you for your purchase" or "Payment successful"
    - "Your payment has been processed" or "Transaction completed"
    - "Invoice paid" or "Payment received"
    - "Subscription renewed" or "Charge successful"
    - Invoice numbers with confirmation: "Payment for invoice (#XYZ) processed"
    - Reference numbers: "Receipt #ABC-123 - Payment confirmed"
    - SaaS billing: "Your subscription has been charged" or "Payment processed"
    
    INCLUDE ONLY:
    - Emails confirming money was ALREADY spent or charged (past tense)
    - Completed transactions with confirmation language
    - Receipts showing payment was successfully processed
    - Invoices with payment confirmation or "paid" status
    - Subscription charges that have been completed
    
    🚫 STRICTLY EXCLUDE:
    - Future billing notifications ("will renew", "will be charged", "upcoming billing")
    - Payment reminders or due notices ("payment due", "renews soon")
    - Billing information update requests
    - Subscription expiration warnings
    - Marketing emails from retailers
    - Promotional offers or discounts ("free for 48 hours", "special offer", "limited time")
    - Free trial announcements or free access promotions
    - Product announcements, feature launches, or company updates
    - Contest/giveaway announcements ("chance to win", "competition")
    - Newsletter content or marketing campaigns
    - Community building emails ("bring a friend", "show us what you build")
    - Partnership announcements ("we've partnered with...")
    - Account signup confirmations (without payment)
    - Trial signup confirmations (unless paid trial completed)
    - Any email talking about FUTURE transactions
    - Emails with unsubscribe links that are clearly promotional
    - Time-limited free offers or weekend promotions
    - Administrative notices requiring action ("[Action required]", "provide your tax info")
    - Tax compliance or verification emails ("verify your NPWP", "tax information")
    - Account settings or billing setup instructions ("sign in to console", "click navigation")
    - Government compliance notices ("government records", "regulatory requirements")
    - Help/tutorial emails with step-by-step instructions ("how to add", "steps to")
    - System notifications about account verification or setup
    
    TEMPORAL INDICATORS TO CHECK:
    - Past tense: "was charged", "has been processed", "payment completed", "thank you for"
    - Future tense: "will be charged", "will renew", "upcoming", "soon", "next billing"
    - Reminder language: "reminder", "notice", "heads up", "expiring"
    
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

  // FIRST: Check for promotional/marketing patterns - EXCLUDE these immediately
  const isPromotionalEmail = RECEIPT_PATTERNS.promotional_exclusions.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (isPromotionalEmail) {
    console.log("🚫 Excluded as promotional/marketing email");
    return null; // This is a promotional email, not a receipt
  }

  // SECOND: Check for future/reminder patterns - EXCLUDE these immediately
  const isFutureNotification = RECEIPT_PATTERNS.future_notifications.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (isFutureNotification) {
    console.log("🚫 Excluded as future billing notification/reminder");
    return null; // This is a future notification, not a receipt
  }

  // Check for financial domains (but this will be overridden by exclusions)
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

  // Look for monetary amounts (more specific patterns)
  const hasMoneyAmount =
    /\$\d+[\.,]?\d*|\d+[\.,]\d{2}|total[:\s]+\$?\d+|amount[:\s]+\$?\d+|charged[:\s]+\$?\d+|paid[:\s]+\$?\d+/i.test(
      bodyLower
    );

  // Look for past-tense completion indicators (ONLY past tense, not future)
  const hasCompletionIndicators =
    /(?:thank\s+you|thanks).*(?:for\s+your\s+)?(?:payment|purchase|order|transaction)/i.test(
      bodyLower
    ) ||
    /(?:successful|completed|processed|confirmed|received).*(?:payment|purchase|order|transaction)/i.test(
      bodyLower
    ) ||
    /(?:payment|purchase|order|transaction).*(?:successful|completed|processed|confirmed|received)(?:\s+successfully)?/i.test(
      bodyLower
    ) ||
    /(?:was|has\s+been|have\s+been)\s+(?:charged|paid|processed|completed|confirmed)/i.test(
      bodyLower
    ) ||
    /(?:successfully\s+)?(?:charged|paid)(?:\s+successfully)$/i.test(bodyLower);

  // Determine confidence and type
  let confidence = 0;
  let receiptType = "purchase";

  if (hasPurchasePattern && hasMoneyAmount && hasCompletionIndicators) {
    confidence = 0.9;
    receiptType = "purchase";
  } else if (hasInvoicePattern && hasCompletionIndicators) {
    confidence = 0.85;
    receiptType = "invoice";
  } else if (hasDigitalPattern && hasCompletionIndicators) {
    confidence = 0.85;
    receiptType = "digital";
  } else if (hasSubscriptionPattern && hasCompletionIndicators) {
    confidence = 0.8;
    receiptType = "subscription";
  } else if (hasCategoryPattern && hasMoneyAmount && hasCompletionIndicators) {
    confidence = 0.75;
    receiptType = "purchase";
  } else if (
    isFromFinancialDomain &&
    hasMoneyAmount &&
    hasCompletionIndicators &&
    (bodyLower.includes("payment received") ||
      bodyLower.includes("transaction completed") ||
      bodyLower.includes("order confirmed"))
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
