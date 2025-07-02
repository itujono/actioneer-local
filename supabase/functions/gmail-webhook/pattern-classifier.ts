// Pattern-based email classification (currently unused in AI-first approach)
// Extracted from ai-processors.ts for future reference

import type { ClassificationResult } from "./types.ts";

/**
 * Direct classification using patterns (no external API calls)
 * Currently unused in favor of AI-first approach
 */
// export function classifyEmailDirect(subject: string, from: string, emailBody: string): ClassificationResult | null {
//   const subjectLower = subject.toLowerCase();
//   const fromLower = from.toLowerCase();
//   const bodyLower = emailBody.toLowerCase();

//   // Travel patterns
//   const TRAVEL_PATTERNS = {
//     flights: [
//       /flight\s+(?:confirmation|booking|itinerary|ticket|receipt)/i,
//       /boarding\s+pass/i,
//       /e-ticket/i,
//       /airline\s+(?:confirmation|booking)/i,
//       /check-in\s+(?:reminder|now\s+available|opens)/i,
//     ],
//     hotels: [
//       /hotel\s+(?:confirmation|booking|reservation|receipt)/i,
//       /accommodation\s+(?:confirmation|booking)/i,
//       /room\s+(?:confirmation|booking|reservation)/i,
//       /booking\.com/i,
//       /hotels\.com/i,
//       /expedia/i,
//       /airbnb/i,
//     ],
//     destinations: [
//       /(?:trip|travel|adventure|vacation|holiday|getaway)\s+to\s+[\w\s]+/i,
//       /(?:time\s+to|visit|explore|discover)\s+[\w\s]+[!🇹🇷🌍✈️🏖️]/i,
//       /your\s+(?:next|upcoming)\s+(?:trip|adventure|vacation|getaway)/i,
//       /🧳.*(?:adventure|trip|vacation|travel)/i,
//       /✈️.*(?:adventure|trip|vacation|travel)/i,
//       /🏨.*(?:stay|hotel|accommodation)/i,
//     ],
//     general: [
//       /travel\s+(?:itinerary|confirmation|booking|receipt)/i,
//       /trip\s+(?:confirmation|itinerary|summary)/i,
//       /vacation\s+(?:booking|confirmation)/i,
//       /travel\s+insurance/i,
//       /visa\s+(?:application|confirmation|approval)/i,
//     ],
//     domains: [
//       /booking\.com/i,
//       /expedia/i,
//       /priceline/i,
//       /kayak/i,
//       /tripadvisor/i,
//       /hotels\.com/i,
//       /airbnb/i,
//       /delta\.com/i,
//       /united\.com/i,
//       /american\.com/i,
//       // Enhanced travel sender domains
//       /trip\.com/i,
//       /agoda\.com/i,
//       /trivago/i,
//       /orbitz/i,
//       /travelocity/i,
//       /hotwire/i,
//       /momondo/i,
//       /skyscanner/i,
//       /southwest\.com/i,
//       /jetblue\.com/i,
//       /spirit\.com/i,
//       /frontier\.com/i,
//       /alaska\.com/i,
//       /hawaiian\.com/i,
//       /emirates\.com/i,
//       /lufthansa\.com/i,
//       /britishairways\.com/i,
//       /marriott\.com/i,
//       /hilton\.com/i,
//       /hyatt\.com/i,
//       /ihg\.com/i,
//       /accor\.com/i,
//     ],
//   };

//   // Check travel patterns
//   const hasFlightPattern = TRAVEL_PATTERNS.flights.some(
//     (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
//   );
//   const hasHotelPattern = TRAVEL_PATTERNS.hotels.some(
//     (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
//   );
//   const hasDestinationPattern = TRAVEL_PATTERNS.destinations.some(
//     (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
//   );
//   const hasGeneralTravelPattern = TRAVEL_PATTERNS.general.some(
//     (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
//   );
//   const isFromTravelDomain = TRAVEL_PATTERNS.domains.some((pattern) => pattern.test(fromLower));

//   // Calculate travel confidence
//   let travelConfidence = 0;
//   if (hasFlightPattern || hasHotelPattern) {
//     travelConfidence = 0.9;
//   } else if (hasGeneralTravelPattern) {
//     travelConfidence = 0.8;
//   } else if (hasDestinationPattern) {
//     travelConfidence = 0.7;
//   } else if (isFromTravelDomain && (bodyLower.includes("booking") || bodyLower.includes("travel"))) {
//     travelConfidence = 0.65;
//   }

//   if (travelConfidence > 0.6) {
//     console.log(`🧳 Travel email detected with confidence ${travelConfidence}`);
//     return {
//       type: "travel",
//       confidence: travelConfidence,
//       method: "pattern-based",
//     };
//   }

//   // Receipt patterns - only completed transactions
//   const RECEIPT_PATTERNS = [
//     /receipt.*(?:purchase|order|payment|transaction)/i,
//     /purchase\s+(?:confirmation|receipt|summary)/i,
//     /order\s+(?:confirmation|receipt|summary|complete)/i,
//     /transaction\s+(?:receipt|confirmation|summary|complete)/i,
//     /payment\s+(?:confirmation|receipt|successful|processed)/i,
//     /your\s+(?:receipt|purchase|order)/i,
//     /thank\s+you\s+for\s+your\s+(?:purchase|order)/i,
//     /invoice.*(?:payment|due|amount|billing)/i,
//     /subscription\s+(?:payment|charge)\s+(?:successful|completed|processed|confirmed)/i,
//     /billing\s+(?:statement|summary|notice)/i,
//   ];

//   // CRITICAL: Exclude promotional/marketing/administrative emails
//   const PROMOTIONAL_EXCLUSIONS = [
//     // Administrative and compliance exclusions
//     /\[action\s+required\]/i,
//     /(?:provide|verify|update|add|enter)\s+(?:your|tax|billing|payment)\s+(?:info|information|details|id|npwp)/i,
//     /(?:tax\s+info|tax\s+information|tax\s+id|tax\s+matters|tax\s+adviser)/i,
//     /(?:could\s+not\s+be\s+verified|verification|verify\s+your)/i,
//     /(?:government\s+records|active\/?\s*valid|compliance|regulatory)/i,
//     /(?:how\s+to\s+add|steps\s+to|in\s+order\s+for\s+you\s+to)/i,
//     /(?:sign\s+in\s+to|console|navigation|click|pencil\s+icon)/i,
//     /(?:may\s+take\s+up\s+to|can't\s+advise|consult\s+your)/i,
//     /(?:billing\s+account|payment\s+settings|account\s+settings)/i,
//     /google\s+payments.*(?:provide|verify|update|tax)/i,
//     /(?:npwp|tax\s+id).*(?:could\s+not\s+be|verification|verify)/i,
//     /(?:faktur\s+pajak|tax\s+documentation|tax\s+compliance)/i,
//     /(?:fix\s+any\s+issues|make\s+sure\s+you|ensure\s+accurate)/i,
//     // Free offers and promotions
//     /(?:free|complimentary|no\s+cost|zero\s+cost)\s+(?:for|trial|offer|access|weekend|hours?|days?)/i,
//     /(?:totally|completely|entirely)\s+free/i,
//     /free\s+(?:to\s+use|for\s+the\s+next|this\s+weekend|starting\s+now)/i,
//     /(?:is|are)\s+(?:officially\s+)?free\s+(?:for|starting|this)/i,
//     // Marketing language
//     /(?:run|hurry|limited\s+time|act\s+fast|don't\s+miss|countdown)/i,
//     /(?:promotional|marketing|campaign|announcement|newsletter)/i,
//     /(?:special\s+offer|limited\s+offer|exclusive\s+offer|weekend\s+offer)/i,
//     /(?:giveaway|contest|competition|win\s+\$|chance\s+to\s+win)/i,
//     /(?:bring\s+a\s+friend|share|tag\s+us|show\s+off)/i,
//     // Product announcements and updates
//     /(?:new\s+feature|product\s+update|announcement|launch)/i,
//     /(?:we've\s+partnered|partnership|collaboration)/i,
//     /(?:getting\s+started|walkthrough|tutorial|guide)/i,
//     /(?:community|builders|creating|building)/i,
//     // Unsubscribe and footer indicators
//     /(?:unsubscribe|opt\s+out|email\s+preferences)/i,

//     // Enhanced promotional/incentive exclusion patterns
//     // General promotional language
//     /(?:earn|win|get|claim|receive).*(?:bonus|reward|prize|gift|cashback|points)/i,
//     /(?:bonus|reward|prize|gift|cashback|points).*(?:up\s+to|worth|valued\s+at)/i,
//     /(?:special|limited|exclusive).*(?:offer|deal|promotion|bonus)/i,
//     /(?:sign\s+up|register|join).*(?:bonus|reward|gift)/i,
//     /(?:first|new).*(?:user|customer|account).*(?:bonus|reward|gift)/i,
//     /(?:referral|refer\s+a\s+friend).*(?:bonus|reward)/i,
//     /(?:deposit|trade|swap|invest).*(?:and\s+get|to\s+receive|for\s+a).*(?:bonus|reward)/i,

//     // Indonesian promotional patterns
//     /(?:dapatkan|menangkan|klaim|ambil).*(?:bonus|hadiah|reward|cashback|poin)/i,
//     /(?:bonus|hadiah|reward|cashback|poin).*(?:senilai|hingga|sampai)/i,
//     /(?:promosi|promo|penawaran).*(?:khusus|terbatas|eksklusif)/i,
//     /(?:daftar|bergabung|buat\s+akun).*(?:bonus|hadiah|reward)/i,
//     /(?:pengguna\s+baru|akun\s+baru|first\s+time).*(?:bonus|hadiah|reward)/i,
//     /(?:swap|deposit|trading).*(?:pertama\s+kali|first\s+time).*(?:bonus|hadiah|reward)/i,
//     /(?:mulai\s+sekarang|start\s+now).*(?:bonus|hadiah|reward)/i,

//     // Marketing call-to-action patterns
//     /(?:claim\s+now|get\s+started|start\s+now|join\s+now|sign\s+up\s+now)/i,
//     /(?:limited\s+time|act\s+fast|don't\s+miss|hurry)/i,
//     /(?:terms\s+and\s+conditions|t&c|syarat\s+dan\s+ketentuan)/i,
//     /(?:valid\s+until|expires\s+on|berlaku\s+hingga)/i,
//     /(?:minimum\s+(?:deposit|trade|swap)|syarat\s+minimum)/i,

//     // Crypto promotional patterns
//     /(?:airdrop|mining|staking).*(?:reward|bonus|earn)/i,
//     /(?:new\s+token|token\s+launch).*(?:bonus|reward)/i,
//     /(?:trading\s+competition|contest).*(?:prize|reward)/i,
//     /(?:liquidity\s+mining|yield\s+farming).*(?:reward|apy)/i,
//   ];

//   // CRITICAL: Exclude future billing notifications
//   const FUTURE_BILLING_PATTERNS = [
//     /(?:will|going\s+to|about\s+to)\s+(?:renew|charge|bill|auto-renew)/i,
//     /subscription\s+(?:will|is\s+about\s+to)\s+renew/i,
//     /(?:upcoming|next|future)\s+(?:billing|payment|charge|renewal)/i,
//     /(?:reminder|notice|heads?\s*up).*(?:renewal|billing|payment)/i,
//     /(?:renew|charge|bill).*(?:soon|tomorrow|next\s+\w+|on\s+\w+\s+\d+)/i,
//     /(?:expir|renew).*(?:on|in)\s+\d+/i,
//     /payment\s+method.*(?:update|change|expires?)/i,
//     /billing\s+information.*(?:update|change|expires?)/i,
//   ];

//   // FIRST: Check for promotional/marketing/administrative patterns - EXCLUDE these immediately
//   const isPromotionalEmail = PROMOTIONAL_EXCLUSIONS.some(
//     (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
//   );

//   if (isPromotionalEmail) {
//     console.log("🚫 Pattern classifier: Excluded as promotional/administrative email");
//     return null; // This is a promotional/administrative email, not a receipt
//   }

//   // SECOND: Check for future/reminder patterns - EXCLUDE these immediately
//   const isFutureBilling = FUTURE_BILLING_PATTERNS.some(
//     (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
//   );

//   if (isFutureBilling) {
//     console.log("🚫 Pattern classifier: Excluded as future billing notification");
//     return null; // This is a future notification, not a receipt
//   }

//   // NUCLEAR OPTION: Force revenue classification for clear revenue language
//   const FORCE_REVENUE_KEYWORDS = [
//     /payment\s+deposited\s+to\s+your\s+account/i,
//     /money\s+added\s+to\s+your\s+account/i,
//     /your\s+earnings\s+id/i,
//     /project\s+earnings\s+have\s+been\s+processed/i,
//     /funds\s+are\s+now\s+available\s+in\s+your\s+bank/i,
//     /freelance\s+payment\s+has\s+been\s+successfully\s+deposited/i,
//   ];

//   const hasForceRevenueKeywords = FORCE_REVENUE_KEYWORDS.some(
//     (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
//   );

//   if (hasForceRevenueKeywords) {
//     console.log("🚨 Pattern classifier: FORCE REVENUE - Nuclear option triggered by clear revenue language");
//     return {
//       type: "revenue",
//       confidence: 0.99,
//       method: "force-revenue-keywords",
//     };
//   }

//   // THIRD: Check for revenue patterns FIRST (higher priority than receipts)
//   const REVENUE_PATTERNS = {
//     // Payment received patterns (highest priority)
//     paymentsReceived: [
//       /payment\s+received/i,
//       /money\s+received/i,
//       /funds\s+received/i,
//       /deposit\s+successful/i,
//       /transfer\s+(?:received|completed)/i,
//       /payout\s+processed/i,
//       /freelance.*payment.*received/i,
//       /project.*payment.*received/i,
//       /payment.*freelance.*project/i,
//       /invoice.*payment.*received/i,
//       /consulting.*payment.*received/i,
//       /payment.*processed.*invoice/i,
//       /client\s+payment.*received/i,
//       // Enhanced deposited/earnings language
//       /payment\s+deposited/i,
//       /money\s+(?:added|deposited)\s+to\s+your\s+account/i,
//       /funds.*(?:added|deposited).*your\s+account/i,
//       /deposited\s+to\s+your\s+(?:bank\s+)?account/i,
//       /has\s+been\s+(?:added|deposited)\s+to/i,
//       /your\s+earnings/i,
//       /earnings.*processed/i,
//       /project\s+earnings/i,
//       /freelance.*earnings/i,
//       /successfully\s+deposited/i,
//       /payment.*deposited.*your\s+account/i,
//       /funds\s+are\s+now\s+available/i,
//       /money\s+added\s+to\s+your\s+account/i,
//     ],
//     // Indonesian refund patterns
//     indonesianRefunds: [
//       /pengembalian\s+(?:dana|uang)\s+(?:diproses|disetujui|berhasil|selesai)/i,
//       /refund\s+diproses/i,
//       /dana\s+(?:dikembalikan|ditransfer|telah\s+dikembalikan)/i,
//       /uang\s+(?:dikembalikan|ditransfer|telah\s+dikembalikan)/i,
//       /pembatalan.*(?:pengembalian|refund)/i,
//       /layanan.*dibatalkan.*pengembalian/i,
//     ],
//     // English refund patterns
//     refunds: [
//       /refund\s+(?:issued|processed|completed|successful)/i,
//       /reimbursement\s+(?:issued|processed|approved)/i,
//       /credit\s+(?:issued|applied|processed)/i,
//       /chargeback\s+(?:successful|completed)/i,
//       /return\s+(?:processed|completed|successful)/i,
//       /reversal\s+(?:completed|processed)/i,
//       /money\s+back\s+guarantee/i,
//       /cancelled\s+order.*refund/i,
//       /dispute\s+resolved.*credit/i,
//     ],
//     // Revenue-issuing domains
//     domains: [
//       /hostinger/i,
//       /coinbase/i,
//       /binance/i,
//       /paypal/i,
//       /stripe/i,
//       /square/i,
//       /namecheap/i,
//       /godaddy/i,
//       /digitalocean/i,
//     ],
//   };

//   // Check revenue patterns
//   const hasPaymentReceived = REVENUE_PATTERNS.paymentsReceived.some(
//     (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
//   );
//   const hasIndonesianRefund = REVENUE_PATTERNS.indonesianRefunds.some(
//     (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
//   );
//   const hasEnglishRefund = REVENUE_PATTERNS.refunds.some(
//     (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
//   );
//   const isFromRevenueDomain = REVENUE_PATTERNS.domains.some((pattern) => pattern.test(fromLower));

//   // Calculate revenue confidence
//   let revenueConfidence = 0;
//   if (hasPaymentReceived) {
//     revenueConfidence = 0.95; // Highest priority for payment received
//     console.log("💰 Pattern classifier: STRONG revenue signal detected - payment received patterns");
//   } else if (hasIndonesianRefund || hasEnglishRefund) {
//     revenueConfidence = 0.9;
//     console.log("💰 Pattern classifier: STRONG revenue signal detected - refund patterns");
//   } else if (isFromRevenueDomain && (bodyLower.includes("refund") || bodyLower.includes("pengembalian"))) {
//     revenueConfidence = 0.8;
//     console.log("💰 Pattern classifier: Medium revenue signal detected - domain + refund");
//   }

//   if (revenueConfidence > 0.5) {
//     console.log(`💰 Pattern classifier: Revenue email CONFIRMED with confidence ${revenueConfidence}`);
//     return {
//       type: "revenue",
//       confidence: revenueConfidence,
//       method: "pattern-based",
//     };
//   }

//   // FOURTH: Check for receipt patterns (only after revenue check)
//   const hasReceiptPattern = RECEIPT_PATTERNS.some((pattern) => pattern.test(subjectLower) || pattern.test(bodyLower));

//   // Look for past-tense completion indicators (ONLY past tense, not future)
//   const hasCompletionIndicators =
//     /(?:thank\s+you|thanks).*(?:for\s+your\s+)?(?:payment|purchase|order|transaction)/i.test(bodyLower) ||
//     /(?:successful|completed|processed|confirmed|received).*(?:payment|purchase|order|transaction)/i.test(bodyLower) ||
//     /(?:payment|purchase|order|transaction).*(?:successful|completed|processed|confirmed|received)(?:\s+successfully)?/i.test(
//       bodyLower
//     ) ||
//     /(?:was|has\s+been|have\s+been)\s+(?:charged|paid|processed|completed|confirmed)/i.test(bodyLower) ||
//     /(?:successfully\s+)?(?:charged|paid)(?:\s+successfully)$/i.test(bodyLower);

//   if (hasReceiptPattern && hasCompletionIndicators) {
//     console.log("💰 Pattern classifier: Receipt email detected");
//     return {
//       type: "receipt",
//       confidence: 0.8,
//       method: "pattern-based",
//     };
//   }

//   // Job application patterns
//   const JOB_PATTERNS = [
//     /application/i,
//     /interview/i,
//     /position/i,
//     /role\s+at/i,
//     /job/i,
//     /career/i,
//     /hiring/i,
//     /candidate/i,
//   ];

//   const hasJobPattern = JOB_PATTERNS.some((pattern) => pattern.test(subjectLower) || pattern.test(bodyLower));

//   if (hasJobPattern) {
//     console.log("💼 Pattern classifier: Job application email detected");
//     return {
//       type: "job_application",
//       confidence: 0.75,
//       method: "pattern-based",
//     };
//   }

//   console.log("🤷 Pattern classifier: No specific category matched");
//   return null;
// }
