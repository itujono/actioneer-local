// Receipt/Expense Classification Module
import type { EmailData, Classification, Action } from "../types.ts";

export const RECEIPT_PATTERNS = {
  // Enhanced purchase receipts with more specific patterns
  purchases: [
    /receipt.*(?:purchase|order|payment|transaction)/i,
    /purchase\s+(?:confirmation|receipt|summary)/i,
    /order\s+(?:confirmation|receipt|summary|complete)/i,
    /transaction\s+(?:receipt|confirmation|summary|complete)/i,
    /your\s+(?:receipt|purchase|order)/i,
    /thank\s+you\s+for\s+your\s+(?:purchase|order)/i,
    /order\s+#[\w-]+.*(?:confirmed|shipped)/i,
    /shopping\s+(?:receipt|confirmation)/i,
  ],

  // Enhanced invoices and bills patterns - AVOID revenue conflicts
  invoices: [
    /invoice.*(?:due|amount|billing)/i, // Removed "payment" to avoid revenue conflicts
    /bill.*(?:due|amount)/i,
    /billing\s+(?:statement|summary|notice)/i,
    /payment\s+(?:due|reminder|notice)/i,
    /account\s+(?:statement|summary|balance)/i,
    /monthly\s+(?:statement|bill|invoice)/i,
    /subscription\s+(?:renewal|charge)/i, // Removed "payment" to avoid conflicts
    // Specific invoice number patterns for company receipts
    /receipt\s+\[#[\w-]+\]/i, // Matches "receipt [#1946-4660]"
    /invoice\s+\(#[\w-]+\)/i, // Matches "invoice (#WGTALJ-00010)"
    /your\s+[\w\s]+(?:pte\s+ltd|ltd|llc|inc|corp|corporation)\s+receipt/i,
    /receipt\s+from\s+[\w\s]+(?:pte\s+ltd|ltd|llc|inc|corp)/i,
    // Generic invoice number patterns - but only when NOT revenue context
    /invoice\s*#[\w-]+.*(?:paid|charged|processed)/i, // Past tense only
    /receipt\s*#[\w-]+.*(?:confirmed|processed)/i,
    /bill\s*#[\w-]+.*(?:paid|processed)/i,
    /reference\s*#[\w-]+.*(?:charged|completed)/i,
    /transaction\s*#[\w-]+.*(?:successful|confirmed)/i,
  ],

  // Enhanced digital receipts and confirmations
  digital: [
    /apple\s+(?:receipt|purchase|store)/i,
    /google\s+play\s+(?:receipt|purchase)/i,
    /app\s+store\s+(?:receipt|purchase)/i,
    /steam\s+(?:receipt|purchase)/i,
    /microsoft\s+store\s+(?:receipt|purchase)/i,
    /playstation\s+(?:receipt|purchase)/i,
    /xbox\s+(?:receipt|purchase)/i,
    /digital\s+(?:receipt|purchase|download)/i,
  ],

  // Enhanced subscription and recurring payments - COMPLETED ONLY
  subscriptions: [
    /subscription\s+(?:charge|payment)\s+(?:successful|completed|processed|confirmed)/i,
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

  // ENHANCED REVENUE EXCLUSIONS - These should NEVER be receipts
  revenue_exclusions: [
    /payment\s+received/i,
    /money\s+received/i,
    /funds\s+received/i,
    /refund\s+(?:issued|processed|completed)/i,
    /credit\s+(?:issued|applied)/i,
    /deposit\s+successful/i,
    /transfer\s+(?:received|completed)/i,
    /withdrawal\s+successful/i,
    /payout\s+processed/i,
    /you\s+(?:received|got)\s+(?:a\s+)?payment/i,
    /freelance.*payment.*received/i,
    /invoice.*(?:paid|settled).*you/i, // "Invoice paid to you"
    /commission\s+(?:earned|received)/i,
    /dividend\s+(?:payment|received)/i,
    /tax\s+refund/i,
    /insurance\s+(?:claim|payout)/i,
    /crypto.*withdrawal/i,
    /successfully\s+withdrawn/i,
    // NEW: Specific freelance income patterns that should be revenue
    /payment\s+received.*freelance/i,
    /freelance.*invoice.*(?:paid|payment)/i,
    /project.*payment.*(?:received|completed)/i,
    /invoice.*payment.*received/i,
    /payment.*(?:successfully\s+)?processed.*invoice/i,
    /freelance\s+project.*payment/i,
    // NEW: Payment received with invoice references
    /payment\s+received.*invoice\s*#/i,
    /invoice.*payment.*processed/i,
    /(?:freelance|project|consulting).*payment.*received/i,
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

    // Specific promotional phrases
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

  // Enhanced domains for expense sources - be more specific
  expense_domains: [
    // Retail and shopping
    /amazon(?!.*seller)/i, // Amazon but NOT seller emails
    /shopify(?!.*payout)/i, // Shopify but NOT payout emails
    /etsy(?!.*sale)/i, // Etsy but NOT sale emails
    /ebay(?!.*seller)/i, // eBay but NOT seller emails
    /walmart/i,
    /target/i,
    /bestbuy/i,
    /homedepot/i,
    /lowes/i,
    /costco/i,

    // Digital platforms (as customers, not sellers)
    /apple\.com/i,
    /google\.com/i,

    // Payment processors (when you're charged, not when you receive)
    /paypal(?!.*(?:payment\s+received|money\s+received))/i,
    /stripe(?!.*(?:payout|transfer))/i,
    /square(?!.*(?:payout|deposit))/i,

    // Banks and credit cards
    /chase\.com/i,
    /bankofamerica/i,
    /wellsfargo/i,
    /citi\.com/i,
    /americanexpress/i,

    // SaaS and business services (as customers)
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

  // Enhanced expense categories
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
    // Travel and transportation
    /uber\s+(?:receipt|trip)/i,
    /lyft\s+(?:receipt|trip)/i,
    /taxi\s+(?:receipt|fare)/i,
    /airline\s+(?:ticket|booking)/i,
    /hotel\s+(?:booking|reservation)/i,
  ],

  // STRONG RECEIPT INDICATORS - These strongly suggest outgoing money
  strong_receipt_signals: [
    /thank\s+you\s+for\s+your\s+(?:purchase|order)/i,
    /your\s+(?:order|purchase)\s+(?:has\s+been|was)\s+(?:confirmed|processed)/i,
    /payment\s+(?:confirmed|successful|processed).*(?:order|purchase)/i,
    /order\s+#[\w-]+.*(?:confirmed|shipped)/i,
    /subscription\s+(?:renewed|charged)/i,
    /bill\s+(?:paid|processed)/i,
    /charged.*(?:your|account)/i,
    /deducted\s+from\s+your\s+account/i,
  ],
};

export function buildReceiptPrompt(emailData: EmailData): string {
  return `
    Analyze this email to determine if it's a receipt, invoice, or financial transaction confirmation for money you SPENT.
    
    ⚠️ CRITICAL: ONLY classify as receipt if YOU paid money OUT (expense/outgoing transaction).
    
    ⚠️ NEVER classify as receipt if this is about money coming TO you (revenue/refunds/payments received).
    
    RECEIPT EMAIL TYPES (YOUR EXPENSES ONLY):
    - Purchase receipts from stores where YOU bought something
    - Digital receipts (App Store, Google Play) where YOU paid for apps/services
    - Service invoices where YOU paid for utilities, subscriptions, etc.
    - Payment confirmations where YOUR account was charged
    - Subscription renewals where YOU were charged
    - Banking statements showing YOUR spending
    - SaaS platform invoices where YOU paid for services
    - Business service receipts where YOUR company paid
    
    SPECIFIC PATTERNS TO LOOK FOR (YOUR OUTGOING MONEY):
    - "Thank you for your purchase" (you bought something)
    - "Your payment has been processed" (your money went out)
    - "Order confirmed" or "Payment successful" (you ordered/paid)
    - "Subscription renewed" (you were charged)
    - "Your account has been charged" (money left your account)
    - "Bill paid" or "Payment due" (you owe/paid money)
    - "Invoice #ABC-123 - Payment processed" (you paid the invoice)
    - "Receipt #123 - Purchase confirmed" (you made a purchase)
    - "Your credit card was charged" (money left your account)
    
    INCLUDE ONLY:
    - Notifications that YOU spent money (outgoing transactions)
    - Completed purchases where YOU were the buyer
    - Bills and invoices that YOU paid
    - Subscriptions that YOU were charged for
    - Services that YOU purchased
    
    🚫 STRICTLY EXCLUDE (these are REVENUE, not receipts):
    - "Payment received" (money coming TO you)
    - "Refund issued" (money returning TO you)
    - "You received payment" (income TO you)
    - "Funds deposited" (money added TO your account)
    - "Invoice paid to you" (you earned money)
    - "Commission earned" (you made money)
    - "Dividend payment" (you received money)
    - "Tax refund" (money returned TO you)
    - "Withdrawal successful" (you moved YOUR money)
    - "Transfer completed to your account" (money came TO you)
    - "Freelance payment received" (you earned money)
    - Any email about money coming TO you (that's revenue!)
    
    ALSO EXCLUDE:
    - Future billing notifications ("will be charged", "upcoming renewal")
    - Payment reminders ("payment due", "please pay")
    - Marketing emails and promotions
    - Free trial or promotional offers
    - Account setup or verification emails
    - Administrative notices
    
    TEMPORAL INDICATORS:
    - Receipt language: "charged", "paid", "purchased", "bought", "ordered"
    - Revenue language: "received", "deposited", "credited", "refunded", "earned"
    
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

  // FIRST: Check for revenue patterns - EXCLUDE these immediately
  const isRevenueEmail = RECEIPT_PATTERNS.revenue_exclusions.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (isRevenueEmail) {
    console.log("🚫 Receipt: Excluded as revenue email (money coming IN)");
    return null;
  }

  // SECOND: Check for promotional/marketing patterns - EXCLUDE these immediately
  const isPromotionalEmail = RECEIPT_PATTERNS.promotional_exclusions.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (isPromotionalEmail) {
    console.log("🚫 Receipt: Excluded as promotional/marketing email");
    return null;
  }

  // THIRD: Check for future/reminder patterns - EXCLUDE these immediately
  const isFutureNotification = RECEIPT_PATTERNS.future_notifications.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (isFutureNotification) {
    console.log("🚫 Receipt: Excluded as future billing notification/reminder");
    return null;
  }

  // Check for strong receipt signals first
  const hasStrongReceiptSignal = RECEIPT_PATTERNS.strong_receipt_signals.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  // Check for expense domains
  const isFromExpenseDomain = RECEIPT_PATTERNS.expense_domains.some((pattern) => pattern.test(fromLower));

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

  // Enhanced monetary amount detection
  const hasMoneyAmount =
    /\$\d+[\.,]?\d*|\d+[\.,]\d{2}|total[:\s]+\$?\d+|amount[:\s]+\$?\d+|charged[:\s]+\$?\d+|paid[:\s]+\$?\d+|bill[:\s]+\$?\d+/i.test(
      bodyLower
    );

  // Look for past-tense completion indicators (YOUR money going OUT)
  const hasExpenseIndicators =
    /(?:thank\s+you|thanks).*(?:for\s+your\s+)?(?:payment|purchase|order|subscription)/i.test(bodyLower) ||
    /(?:your\s+)?(?:payment|purchase|order|subscription).*(?:successful|completed|processed|confirmed)/i.test(
      bodyLower
    ) ||
    /(?:was|has\s+been|have\s+been)\s+(?:charged|paid|processed|completed|deducted)/i.test(bodyLower) ||
    /(?:charged|deducted).*(?:your|from\s+your)\s+(?:account|card)/i.test(bodyLower) ||
    /(?:successfully\s+)?(?:charged|paid|purchased|ordered)(?:\s+successfully)?/i.test(bodyLower);

  // Determine confidence and type with enhanced logic
  let confidence = 0;
  let receiptType = "purchase";

  // Strong receipt signals get highest priority
  if (hasStrongReceiptSignal) {
    if (hasPurchasePattern && hasMoneyAmount) {
      confidence = 0.95;
      receiptType = "purchase";
    } else if (hasSubscriptionPattern) {
      confidence = 0.9;
      receiptType = "subscription";
    } else if (hasInvoicePattern) {
      confidence = 0.9;
      receiptType = "invoice";
    } else {
      confidence = 0.85;
      receiptType = "purchase";
    }
  } else {
    // Standard pattern matching
    if (hasPurchasePattern && hasMoneyAmount && hasExpenseIndicators) {
      confidence = 0.85;
      receiptType = "purchase";
    } else if (hasInvoicePattern && hasExpenseIndicators) {
      confidence = 0.8;
      receiptType = "invoice";
    } else if (hasDigitalPattern && hasExpenseIndicators) {
      confidence = 0.8;
      receiptType = "digital";
    } else if (hasSubscriptionPattern && hasExpenseIndicators) {
      confidence = 0.75;
      receiptType = "subscription";
    } else if (hasCategoryPattern && hasMoneyAmount && hasExpenseIndicators) {
      confidence = 0.7;
      receiptType = "purchase";
    } else if (
      isFromExpenseDomain &&
      hasMoneyAmount &&
      hasExpenseIndicators &&
      (bodyLower.includes("order confirmed") ||
        bodyLower.includes("transaction completed") ||
        bodyLower.includes("payment processed"))
    ) {
      confidence = 0.65;
      receiptType = "purchase";
    }
  }

  if (confidence > 0.6) {
    console.log(`✅ Receipt: Detected ${receiptType} with confidence ${confidence}`);
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
