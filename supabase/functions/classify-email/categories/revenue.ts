// Revenue/Income Classification Module
import type { EmailData, Classification, Action } from "../types.ts";

export const REVENUE_PATTERNS = {
  // Payment received patterns
  payments_received: [
    /payment\s+(?:received|successful|completed|processed)/i,
    /money\s+(?:received|sent\s+to\s+you|transferred\s+to)/i,
    /you\s+(?:received|got)\s+(?:a\s+)?payment/i,
    /funds\s+(?:received|added|deposited)/i,
    /deposit\s+(?:successful|completed|received)/i,
    /transfer\s+(?:received|completed|successful)/i,
    /credited\s+to\s+your\s+account/i,
    /has\s+been\s+deposited/i,
    /payment\s+confirmation.*received/i,
  ],

  // Refunds and reimbursements
  refunds: [
    /refund\s+(?:issued|processed|completed|successful)/i,
    /reimbursement\s+(?:issued|processed|approved)/i,
    /credit\s+(?:issued|applied|processed)/i,
    /chargeback\s+(?:successful|completed)/i,
    /return\s+(?:processed|completed|successful)/i,
    /reversal\s+(?:completed|processed)/i,
    /money\s+back\s+guarantee/i,
    /cancelled\s+order.*refund/i,
    /dispute\s+resolved.*credit/i,
  ],

  // Business income patterns
  business_income: [
    /invoice\s+(?:#[\w-]+\s+)?(?:paid|payment\s+received)/i,
    /client\s+payment\s+received/i,
    /freelance\s+payment/i,
    /commission\s+(?:payment|earned)/i,
    /royalty\s+payment/i,
    /consulting\s+fee\s+received/i,
    /project\s+payment\s+completed/i,
    /service\s+payment\s+received/i,
    /contract\s+payment/i,
  ],

  // Investment and passive income
  investments: [
    /dividend\s+(?:payment|received|credited)/i,
    /interest\s+(?:payment|earned|credited)/i,
    /investment\s+(?:return|profit|gain)/i,
    /stock\s+(?:dividend|gain)/i,
    /crypto\s+(?:profit|gain|earnings)/i,
    /trading\s+(?:profit|gain)/i,
    /rental\s+(?:income|payment)/i,
    /bond\s+(?:payment|interest)/i,
  ],

  // Government and benefits
  government: [
    /tax\s+(?:refund|return|credit)/i,
    /stimulus\s+payment/i,
    /unemployment\s+(?:benefit|payment)/i,
    /social\s+security\s+payment/i,
    /government\s+(?:payment|benefit|refund)/i,
    /irs\s+(?:refund|payment)/i,
    /medicare\s+(?:refund|reimbursement)/i,
    /insurance\s+(?:claim|payout|settlement)/i,
  ],

  // Digital platform income
  digital_platforms: [
    /paypal.*(?:payment\s+received|money\s+received)/i,
    /venmo.*(?:payment\s+received|sent\s+you)/i,
    /zelle.*(?:payment\s+received|sent\s+you)/i,
    /stripe.*payment\s+received/i,
    /square.*payment\s+received/i,
    /cashapp.*payment\s+received/i,
    /apple\s+pay.*received/i,
    /google\s+pay.*received/i,
  ],

  // Cryptocurrency and withdrawal patterns
  crypto_withdrawals: [
    /withdrawal\s+(?:successful|completed|processed)/i,
    /successfully\s+withdrawn/i,
    /you\s+have\s+successfully\s+(?:withdrawn|made\s+a\s+withdrawal)/i,
    /crypto\s+withdrawal\s+(?:successful|completed)/i,
    /funds\s+(?:withdrawn|transferred)\s+to\s+(?:your\s+)?bank/i,
    /withdrawal.*to\s+(?:your\s+)?bank\s+account/i,
    /(?:rupiah|usd|dollar|eur|euro)\s+withdrawal\s+successful/i,
    /transferred\s+to\s+your\s+bank\s+account/i,
    /withdrawal\s+confirmation/i,
    /successfully\s+transferred.*to.*bank/i,
  ],

  // Sale and marketplace income
  sales: [
    /sale\s+(?:completed|successful|confirmed)/i,
    /item\s+sold/i,
    /listing\s+sold/i,
    /marketplace\s+sale/i,
    /etsy.*sale/i,
    /ebay.*sale/i,
    /amazon.*seller\s+payment/i,
    /shopify.*payout/i,
    /product\s+purchase.*seller/i,
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
  ],
};

export function buildRevenuePrompt(emailData: EmailData): string {
  return `
    Analyze this email to determine if it represents incoming money/revenue.
    
    REVENUE EMAIL TYPES:
    - Payment received confirmations (clients, customers, etc.)
    - Refunds and reimbursements from merchants
    - Business income (invoices paid, freelance payments, commissions)
    - Investment income (dividends, interest, trading profits)
    - Government payments (tax refunds, benefits, stimulus)
    - Digital platform income (PayPal, Venmo, Stripe received payments)
    - Cryptocurrency withdrawals to bank accounts (money coming to you)
    - Sales income (marketplace sales, product sales)
    - Insurance payouts and settlements
    - Rental income payments
    - Cryptocurrency gains and profits
    
    SPECIFIC PATTERNS TO LOOK FOR:
    - "Payment received" or "Money received"
    - "Refund issued" or "Credit applied"
    - "Funds deposited" or "Transfer completed"
    - "Invoice #ABC-123 paid"
    - "Tax refund processed"
    - "Dividend payment"
    - "Sale completed" or "Item sold"
    - "Insurance claim approved"
    - "Withdrawal successful" or "Successfully withdrawn"
    - "Transferred to your bank account"
    - "Crypto withdrawal completed"
    
    INCLUDE:
    - Any notification that money is coming INTO your account
    - Refunds for previous purchases
    - Payments for services rendered
    - Investment returns and gains
    - Government payments and refunds
    - Marketplace and platform payouts
    - Cryptocurrency withdrawals to your bank account
    - Money transfers from digital platforms to your bank
    
    EXCLUDE:
    - Marketing emails about potential earnings
    - Investment loss notifications
    - Payment due reminders
    - Account maintenance fees
    - Outgoing payment confirmations
    
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

  // Check for revenue domains
  const isFromRevenueDomain = REVENUE_PATTERNS.revenue_domains.some((pattern) =>
    pattern.test(fromLower)
  );

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

  // Look for monetary amounts (incoming money indicators) - comprehensive currency support
  const hasMoneyAmount =
    /(\$|USD|CAD|AUD|NZD|MXN)\s*[\d,\.]+|(€|EUR)\s*[\d,\.]+|(£|GBP)\s*[\d,\.]+|(¥|JPY)\s*[\d,\.]+|(₩|KRW|won)\s*[\d,\.]+|(₹|INR|rupee)\s*[\d,\.]+|(Rp|IDR|rupiah)\s*[\d,\.]+|(S\$|SGD)\s*[\d,\.]+|(HK\$|HKD)\s*[\d,\.]+|(NT\$|TWD)\s*[\d,\.]+|(₱|PHP|peso)\s*[\d,\.]+|(RM|MYR)\s*[\d,\.]+|(฿|THB|baht)\s*[\d,\.]+|(₫|VND|dong)\s*[\d,\.]+|(CHF|franc)\s*[\d,\.]+|(SEK|kr)\s*[\d,\.]+|(R\$|BRL|real)\s*[\d,\.]+|(ZAR|rand)\s*[\d,\.]+|(₦|NGN|naira)\s*[\d,\.]+|total.*\d+|amount.*\d+|received.*\d+|\d+[\.\,]\d+/i.test(
      bodyLower
    );

  // Determine confidence and type
  let confidence = 0;
  let revenueType = "payment_received";

  if (hasPaymentReceivedPattern && hasMoneyAmount) {
    confidence = 0.9;
    revenueType = "payment_received";
  } else if (hasRefundPattern) {
    confidence = 0.85;
    revenueType = "refund";
  } else if (hasBusinessIncomePattern) {
    confidence = 0.85;
    revenueType = "business_income";
  } else if (hasInvestmentPattern) {
    confidence = 0.8;
    revenueType = "investment";
  } else if (hasGovernmentPattern) {
    confidence = 0.8;
    revenueType = "government";
  } else if (hasDigitalPlatformPattern && hasMoneyAmount) {
    confidence = 0.8;
    revenueType = "digital_platform";
  } else if (hasSalesPattern) {
    confidence = 0.75;
    revenueType = "sales";
  } else if (hasCryptoWithdrawalPattern && hasMoneyAmount) {
    confidence = 0.85;
    revenueType = "digital_platform";
  } else if (
    isFromRevenueDomain &&
    (hasMoneyAmount ||
      bodyLower.includes("received") ||
      bodyLower.includes("credited") ||
      bodyLower.includes("withdrawal") ||
      bodyLower.includes("withdrawn"))
  ) {
    confidence = 0.7;
    revenueType = "payment_received";
  }

  if (confidence > 0.6) {
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
