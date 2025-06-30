// Revenue/Income Classification Module
import type { EmailData, Classification, Action } from "../types.ts";

export const REVENUE_PATTERNS = {
  // Enhanced payment received patterns with more variations
  payments_received: [
    /payment\s+(?:received|successful|completed|processed|confirmed)/i,
    /money\s+(?:received|sent\s+to\s+you|transferred\s+to|deposited|added)/i,
    /you\s+(?:received|got)\s+(?:a\s+)?payment/i,
    /funds\s+(?:received|added|deposited|credited)/i,
    /deposit\s+(?:successful|completed|received|confirmed)/i,
    /transfer\s+(?:received|completed|successful|confirmed)/i,
    /credited\s+to\s+your\s+account/i,
    /has\s+been\s+deposited/i,
    /payment\s+confirmation.*received/i,
    /successfully\s+(?:received|transferred|deposited)/i,
    /(?:income|earnings|revenue)\s+(?:received|credited|deposited)/i,
    /(?:payout|disbursement)\s+(?:successful|completed|processed)/i,
  ],

  // Enhanced refunds and reimbursements with more coverage
  refunds: [
    /refund\s+(?:issued|processed|completed|successful|approved|confirmed)/i,
    /reimbursement\s+(?:issued|processed|approved|completed)/i,
    /credit\s+(?:issued|applied|processed|added|returned)/i,
    /chargeback\s+(?:successful|completed|approved)/i,
    /return\s+(?:processed|completed|successful|approved)/i,
    /reversal\s+(?:completed|processed|successful)/i,
    /money\s+back\s+(?:guarantee|processed|issued)/i,
    /cancelled\s+(?:order|subscription).*refund/i,
    /dispute\s+resolved.*(?:credit|refund)/i,
    /(?:partial|full)\s+refund\s+(?:issued|processed)/i,
    /refund.*(?:your\s+account|has\s+been|successfully)/i,
    // Indonesian refund patterns
    /pengembalian\s+(?:dana|uang)\s+(?:diproses|disetujui|berhasil|selesai)/i,
    /refund\s+diproses/i,
    /dana\s+(?:dikembalikan|ditransfer|telah\s+dikembalikan)/i,
    /uang\s+(?:dikembalikan|ditransfer|telah\s+dikembalikan)/i,
    /pembatalan.*(?:pengembalian|refund)/i,
    /layanan.*dibatalkan.*pengembalian/i,
  ],

  // Enhanced business income patterns
  business_income: [
    /invoice\s+(?:#[\w-]+\s+)?(?:paid|payment\s+received|settled)/i,
    /client\s+payment\s+(?:received|processed|completed)/i,
    /freelance\s+(?:payment|invoice)\s+(?:received|paid)/i,
    /project\s+(?:payment|invoice)\s+(?:completed|received|paid)/i,
    /commission\s+(?:payment|earned|received)/i,
    /royalty\s+(?:payment|received|credited)/i,
    /consulting\s+fee\s+(?:received|paid|processed)/i,
    /service\s+payment\s+(?:received|completed)/i,
    /contract\s+payment\s+(?:received|completed)/i,
    /professional\s+services.*(?:payment|paid)/i,
    /(?:work|services)\s+completed.*payment/i,
    /milestone\s+payment\s+received/i,
    // NEW: Enhanced freelance and project payment patterns
    /payment\s+received.*freelance/i,
    /freelance.*(?:project|invoice).*payment/i,
    /project.*payment.*(?:received|completed|processed)/i,
    /payment.*freelance.*project/i,
    /invoice.*(?:paid|payment\s+received).*freelance/i,
    /consulting.*payment.*received/i,
    /contractor.*payment.*received/i,
    /payment\s+confirmation.*freelance/i,
    /website\s+development.*payment/i,
    /development.*project.*payment/i,
    // NEW: Payment received with invoice number patterns
    /payment\s+received.*invoice\s*#/i,
    /invoice\s*#[\w-]+.*payment.*(?:received|processed)/i,
    /payment.*processed.*invoice\s*#/i,
  ],

  // Enhanced investment and passive income
  investments: [
    /dividend\s+(?:payment|received|credited|distributed)/i,
    /interest\s+(?:payment|earned|credited|received)/i,
    /investment\s+(?:return|profit|gain|payout)/i,
    /stock\s+(?:dividend|gain|profit)/i,
    /crypto\s+(?:profit|gain|earnings|payout)/i,
    /trading\s+(?:profit|gain|commission)/i,
    /rental\s+(?:income|payment|received)/i,
    /bond\s+(?:payment|interest|coupon)/i,
    /portfolio\s+(?:earnings|gains|returns)/i,
    /(?:mutual\s+fund|etf)\s+(?:dividend|distribution)/i,
  ],

  // Enhanced government and benefits
  government: [
    /tax\s+(?:refund|return|credit|rebate)/i,
    /stimulus\s+(?:payment|check|deposit)/i,
    /unemployment\s+(?:benefit|payment|compensation)/i,
    /social\s+security\s+(?:payment|benefit)/i,
    /government\s+(?:payment|benefit|refund|grant)/i,
    /irs\s+(?:refund|payment|deposit)/i,
    /medicare\s+(?:refund|reimbursement|payment)/i,
    /insurance\s+(?:claim|payout|settlement|reimbursement)/i,
    /disability\s+(?:payment|benefit)/i,
    /veteran\s+(?:benefit|payment)/i,
  ],

  // Enhanced digital platform income
  digital_platforms: [
    /paypal.*(?:payment\s+received|money\s+received|you\s+received)/i,
    /venmo.*(?:payment\s+received|sent\s+you|paid\s+you)/i,
    /zelle.*(?:payment\s+received|sent\s+you|paid\s+you)/i,
    /stripe.*(?:payment\s+received|payout|transfer)/i,
    /square.*(?:payment\s+received|payout|deposit)/i,
    /cashapp.*(?:payment\s+received|sent\s+you)/i,
    /apple\s+pay.*(?:received|payment)/i,
    /google\s+pay.*(?:received|payment)/i,
    /(?:wise|transferwise).*(?:received|transferred)/i,
    /remitly.*(?:received|delivered)/i,
  ],

  // EXCLUSION PATTERNS - Future notifications, pending transfers, failed transactions
  future_notifications: [
    /(?:will|going\s+to|about\s+to)\s+(?:receive|transfer|send|deposit)/i,
    /(?:upcoming|next|future|scheduled)\s+(?:payment|transfer|deposit|payout)/i,
    /(?:pending|processing|in\s+progress).*(?:transfer|payment|deposit)/i,
    /(?:failed|declined|rejected|cancelled).*(?:transfer|payment|deposit)/i,
    /(?:on\s+hold|delayed|suspended).*(?:transfer|payment|deposit)/i,
    /transfer.*(?:on\s+hold|delayed|suspended)/i,
    /payment.*(?:method|verification).*(?:required|needed)/i,
    /(?:awaiting|waiting\s+for).*(?:approval|confirmation)/i,
  ],

  // Enhanced cryptocurrency and withdrawal patterns
  crypto_withdrawals: [
    /withdrawal\s+(?:successful|completed|processed|confirmed)/i,
    /successfully\s+withdrawn/i,
    /you\s+have\s+successfully\s+(?:withdrawn|made\s+a\s+withdrawal)/i,
    /crypto\s+withdrawal\s+(?:successful|completed|confirmed)/i,
    /funds\s+(?:withdrawn|transferred)\s+to\s+(?:your\s+)?bank/i,
    /withdrawal.*to\s+(?:your\s+)?bank\s+account/i,
    /(?:rupiah|usd|dollar|eur|euro)\s+withdrawal\s+successful/i,
    /transferred\s+to\s+your\s+bank\s+account/i,
    /withdrawal\s+confirmation/i,
    /successfully\s+transferred.*to.*bank/i,
    /cash\s+out\s+(?:successful|completed)/i,
    /converted.*to.*(?:bank|fiat)/i,
  ],

  // Enhanced sale and marketplace income
  sales: [
    /sale\s+(?:completed|successful|confirmed|finalized)/i,
    /item\s+(?:sold|purchased)/i,
    /listing\s+(?:sold|completed)/i,
    /marketplace\s+(?:sale|payout)/i,
    /etsy.*(?:sale|payout|payment)/i,
    /ebay.*(?:sale|payout|payment)/i,
    /amazon.*seller\s+(?:payment|payout)/i,
    /shopify.*(?:payout|payment)/i,
    /product\s+(?:purchase|sale).*(?:seller|revenue)/i,
    /(?:booking|reservation).*payment\s+received/i,
    /commission.*(?:earned|received)/i,
  ],

  // Enhanced domains for revenue sources
  revenue_domains: [
    // Payment processors
    /paypal/i,
    /stripe/i,
    /square/i,
    /venmo/i,
    /zelle/i,
    /cashapp/i,

    // Banks and financial institutions
    /chase\.com/i,
    /bankofamerica/i,
    /wellsfargo/i,
    /citi\.com/i,
    /americanexpress/i,

    // Government
    /irs\.gov/i,
    /treasury\.gov/i,
    /ssa\.gov/i,

    // Marketplaces
    /etsy/i,
    /ebay/i,
    /amazon.*seller/i,
    /shopify/i,
    /upwork/i,
    /fiverr/i,
    /freelancer/i,

    // Investment platforms
    /robinhood/i,
    /schwab/i,
    /fidelity/i,
    /vanguard/i,
    /tdameritrade/i,

    // Crypto exchanges
    /coinbase/i,
    /binance/i,
    /kraken/i,
    /gemini/i,
    /pintu/i,
    /tokocrypto/i,
    /indodax/i,
    /bitget/i,
    /kucoin/i,
    /bybit/i,

    // Web hosting and SaaS that issue refunds
    /hostinger/i,
    /namecheap/i,
    /godaddy/i,
    /bluehost/i,
    /digitalocean/i,
  ],

  // KEY REVENUE INDICATORS - These are strong signals of incoming money
  strong_revenue_signals: [
    /payment\s+received/i,
    /money\s+received/i,
    /funds\s+received/i,
    /refund\s+(?:issued|processed)/i,
    /deposit\s+successful/i,
    /transfer\s+completed/i,
    /withdrawal\s+successful/i,
    /payout\s+processed/i,
    /invoice.*paid/i,
    /commission\s+earned/i,
    // NEW: Enhanced freelance and business income signals
    /freelance.*payment.*received/i,
    /project.*payment.*received/i,
    /payment.*freelance.*project/i,
    /invoice.*payment.*received/i,
    /consulting.*payment.*received/i,
  ],
};

export function buildRevenuePrompt(emailData: EmailData): string {
  return `
    Analyze this email to determine if it represents incoming money/revenue.
    
    ⚠️ CRITICAL: ONLY classify as revenue if money has ALREADY been received/deposited (past tense).
    
    REVENUE EMAIL TYPES (COMPLETED TRANSACTIONS ONLY):
    - Payment received confirmations (clients, customers, etc.) - money already in account
    - Refunds and reimbursements from merchants - refund already processed
    - Business income (invoices paid, freelance payments, commissions) - payment completed
    - Investment income (dividends, interest, trading profits) - already credited
    - Government payments (tax refunds, benefits, stimulus) - funds already deposited
    - Digital platform income (PayPal, Venmo, Stripe received payments) - money received
    - Cryptocurrency withdrawals to bank accounts - transfer already completed
    - Sales income (marketplace sales, product sales) - payment already received
    - Insurance payouts and settlements - claim already paid
    - Rental income payments - rent already received
    - Cryptocurrency gains and profits - already realized
    
    SPECIFIC PATTERNS TO LOOK FOR (PAST TENSE ONLY):
    - "Payment received" or "Money has been received"
    - "Refund has been issued" or "Credit applied to your account"
    - "Funds deposited" or "Transfer completed successfully"
    - "Invoice #ABC-123 has been paid"
    - "Tax refund processed and deposited"
    - "Dividend payment credited"
    - "Sale completed" or "Item sold - payment received"
    - "Insurance claim approved and paid"
    - "Withdrawal successful" or "Successfully withdrawn to your account"
    - "Transferred to your bank account" or "Deposit completed"
    - "Crypto withdrawal completed"
    
    INDONESIAN PATTERNS (for Indonesian emails):
    - "Pengembalian dana diproses" (Refund processed)
    - "Pengembalian uang disetujui" (Money refund approved)
    - "Dana dikembalikan" (Funds returned)
    - "Refund diproses" (Refund processed)
    - "Layanan dibatalkan... pengembalian dana" (Service cancelled... refund)
    
    INCLUDE ONLY:
    - Notifications that money has ALREADY arrived in your account (past tense)
    - Completed refunds with confirmation language
    - Payments for services already rendered and confirmed received
    - Investment returns and gains already credited
    - Government payments and refunds already deposited
    - Marketplace and platform payouts already completed
    - Cryptocurrency withdrawals already completed to your bank
    
    🚫 STRICTLY EXCLUDE:
    - Future payment notifications ("will receive", "upcoming payment", "scheduled transfer")
    - Pending transactions ("processing", "in progress", "pending approval")
    - Failed or declined transactions
    - Payment due reminders or invoices
    - Marketing emails about potential earnings
    - Investment loss notifications
    - Account maintenance fees
    - Outgoing payment confirmations
    - Any email talking about FUTURE income
    
    TEMPORAL INDICATORS TO CHECK:
    - Past tense: "received", "deposited", "completed", "credited", "transferred", "paid"
    - Future tense: "will receive", "upcoming", "scheduled", "pending"
    - Failure indicators: "failed", "declined", "rejected", "on hold"
    
    Email Subject: ${emailData.subject}
    From: ${emailData.from}
    Email Body: ${emailData.body.substring(0, 1500)}
    
    Respond with JSON: { "isMatch": boolean, "confidence": 0-1, "reasoning": "explanation", "revenueType": "payment_received|refund|business_income|investment|government|digital_platform|sales|crypto_withdrawal" }
  `;
}

export function classifyRevenue(emailData: EmailData): Classification | null {
  const subjectLower = emailData.subject.toLowerCase();
  const fromLower = emailData.from.toLowerCase();
  const bodyLower = emailData.body.toLowerCase();

  // FIRST: Check for future/pending/failed patterns - EXCLUDE these immediately
  const isFutureNotification = REVENUE_PATTERNS.future_notifications.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  if (isFutureNotification) {
    console.log("🚫 Revenue: Excluded as future/pending/failed payment notification");
    return null;
  }

  // SECOND: Check for strong revenue signals first - these are high confidence
  const hasStrongRevenueSignal = REVENUE_PATTERNS.strong_revenue_signals.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  // Check for revenue domains
  const isFromRevenueDomain = REVENUE_PATTERNS.revenue_domains.some((pattern) => pattern.test(fromLower));

  // Check for specific revenue patterns
  const hasPaymentReceivedPattern = REVENUE_PATTERNS.payments_received.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasRefundPattern = REVENUE_PATTERNS.refunds.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasBusinessIncomePattern = REVENUE_PATTERNS.business_income.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasInvestmentPattern = REVENUE_PATTERNS.investments.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasGovernmentPattern = REVENUE_PATTERNS.government.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasDigitalPlatformPattern = REVENUE_PATTERNS.digital_platforms.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasSalesPattern = REVENUE_PATTERNS.sales.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasCryptoWithdrawalPattern = REVENUE_PATTERNS.crypto_withdrawals.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  // Enhanced monetary amount detection with better currency support
  const hasMoneyAmount =
    /(\$|USD|CAD|AUD|NZD|MXN)\s*[\d,\.]+|(€|EUR)\s*[\d,\.]+|(£|GBP)\s*[\d,\.]+|(¥|JPY)\s*[\d,\.]+|(₩|KRW|won)\s*[\d,\.]+|(₹|INR|rupee)\s*[\d,\.]+|(Rp|IDR|rupiah)\s*[\d,\.]+|(S\$|SGD)\s*[\d,\.]+|(HK\$|HKD)\s*[\d,\.]+|(NT\$|TWD)\s*[\d,\.]+|(₱|PHP|peso)\s*[\d,\.]+|(RM|MYR)\s*[\d,\.]+|(฿|THB|baht)\s*[\d,\.]+|(₫|VND|dong)\s*[\d,\.]+|(CHF|franc)\s*[\d,\.]+|(SEK|kr)\s*[\d,\.]+|(R\$|BRL|real)\s*[\d,\.]+|(ZAR|rand)\s*[\d,\.]+|(₦|NGN|naira)\s*[\d,\.]+|total.*\d+|amount.*\d+|received.*\d+|\d+[\.\,]\d+/i.test(
      bodyLower
    );

  // Determine confidence and type with enhanced logic
  let confidence = 0;
  let revenueType = "payment_received";

  // Strong revenue signals get highest priority
  if (hasStrongRevenueSignal) {
    if (hasPaymentReceivedPattern && hasMoneyAmount) {
      confidence = 0.95;
      revenueType = "payment_received";
    } else if (hasRefundPattern) {
      confidence = 0.9;
      revenueType = "refund";
    } else if (hasBusinessIncomePattern) {
      confidence = 0.9;
      revenueType = "business_income";
    } else {
      confidence = 0.8;
      revenueType = "payment_received";
    }
  } else {
    // Standard pattern matching
    if (hasPaymentReceivedPattern && hasMoneyAmount) {
      confidence = 0.85;
      revenueType = "payment_received";
    } else if (hasRefundPattern) {
      confidence = 0.8;
      revenueType = "refund";
    } else if (hasBusinessIncomePattern) {
      confidence = 0.8;
      revenueType = "business_income";
    } else if (hasInvestmentPattern) {
      confidence = 0.75;
      revenueType = "investment";
    } else if (hasGovernmentPattern) {
      confidence = 0.75;
      revenueType = "government";
    } else if (hasDigitalPlatformPattern && hasMoneyAmount) {
      confidence = 0.75;
      revenueType = "digital_platform";
    } else if (hasSalesPattern) {
      confidence = 0.7;
      revenueType = "sales";
    } else if (hasCryptoWithdrawalPattern && hasMoneyAmount) {
      confidence = 0.8;
      revenueType = "crypto_withdrawal";
    } else if (
      isFromRevenueDomain &&
      (hasMoneyAmount ||
        bodyLower.includes("received") ||
        bodyLower.includes("credited") ||
        bodyLower.includes("withdrawal") ||
        bodyLower.includes("withdrawn"))
    ) {
      confidence = 0.65;
      revenueType = "payment_received";
    }
  }

  if (confidence > 0.6) {
    console.log(`✅ Revenue: Detected ${revenueType} with confidence ${confidence}`);
    return {
      type: "revenue",
      confidence,
      actions: getRevenueActions(revenueType),
      method: "pattern-based",
      reasoning: `Detected ${revenueType} revenue with confidence ${confidence}`,
    };
  }

  return null;
}

function getRevenueActions(revenueType: string): Action[] {
  const baseActions: Action[] = [
    {
      type: "simple" as const,
      label: "Track Income",
      handler: "trackIncome",
      data: { revenueType },
    },
    {
      type: "complex" as const,
      label: "View Financial Dashboard",
      handler: "openFinancialDashboard",
      data: { revenueType },
    },
  ];

  // Add specific actions based on revenue type
  switch (revenueType) {
    case "refund":
      baseActions.push({
        type: "simple" as const,
        label: "Link to Original Purchase",
        handler: "linkToOriginalPurchase",
        data: {},
      });
      break;
    case "business_income":
      baseActions.push({
        type: "simple" as const,
        label: "Update Invoice Status",
        handler: "updateInvoiceStatus",
        data: {},
      });
      break;
    case "investment":
      baseActions.push({
        type: "simple" as const,
        label: "Track Investment Performance",
        handler: "trackInvestmentPerformance",
        data: {},
      });
      break;
    case "government":
      baseActions.push({
        type: "simple" as const,
        label: "File for Tax Records",
        handler: "fileForTaxRecords",
        data: {},
      });
      break;
    case "sales":
      baseActions.push({
        type: "simple" as const,
        label: "Update Inventory",
        handler: "updateInventory",
        data: {},
      });
      break;
    case "digital_platform":
      baseActions.push({
        type: "simple" as const,
        label: "Track Crypto Activity",
        handler: "trackCryptoActivity",
        data: {},
      });
      break;
  }

  return baseActions;
}
