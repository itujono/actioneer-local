// CardBuilders.js - Gmail Add-on UI Components Hub
// This file serves as a central hub that includes all specialized card builders
// 
// IMPORTANT: This file now delegates to specialized card builder files:
// - CardCommon.js    - Debug utilities and smart actions (shared components)
// - CardExpenses.js  - Expense and receipt related cards
// - CardTravel.js    - Travel comparison and booking related cards
// - CardJobs.js      - Job application and career related cards
// - CardPreProcessed.js - Pre-processed email cards and caching

// ============================================================================
// INCLUDES - All specialized card builder files
// ============================================================================

// Note: In Apps Script, files are automatically included if they're in the same project
// The following files contain the actual card building functions:

/**
 * CardCommon.js - Contains:
 * - createDebugCard()
 * - createSmartActionsCard()
 */

/**
 * CardExpenses.js - Contains:
 * - createReceiptProcessedCard()
 * - addReceiptPreProcessedSection()
 */

/**
 * CardTravel.js - Contains:
 * - createTravelProcessedCard()
 * - createCachedTravelCard()
 * - createTravelErrorCard()
 * - addTravelDetailsSection()
 * - addPriceComparisonSection()
 * - addTravelInsightsSection()
 * - addTravelFallbackSection()
 * - addTravelActionSection()
 * - addCachedTravelActionSection()
 * - createTravelDetailsWidget()
 * - createTravelTypeBadge()
 * - createComparisonWidget()
 * - createBookingButton()
 * - addHotelBookingOptions()
 * - addFlightBookingOptions()
 * - addAttractionBookingOptions()
 * - sortComparisonsByPrice()
 * - getPriceRange()
 * - getTravelTypeDisplayName()
 * - generateTravelInsights()
 * - refreshTravelAnalysis()
 * - reprocessTravelEmail()
 */

/**
 * CardJobs.js - Contains:
 * - createJobProcessedCard()
 * - addJobPreProcessedSection()
 */

/**
 * CardPreProcessed.js - Contains:
 * - createPreProcessedCard()
 * - addGenericPreProcessedSection()
 */

// ============================================================================
// MIGRATION NOTE
// ============================================================================
/*
This file has been split into specialized modules for better maintainability:

OLD STRUCTURE (CardBuilders.js - 1159 lines):
├── Debug & Utility Cards
├── Smart Actions Card  
├── Auto-Processed Cards (Receipt, Travel, Job)
├── Pre-Processed Email Cards
└── Utility Functions

NEW STRUCTURE (Split into 5 files):
├── CardCommon.js (94 lines) - Shared components
├── CardExpenses.js (105 lines) - Expense tracking
├── CardTravel.js (768 lines) - Travel comparisons
├── CardJobs.js (76 lines) - Job applications
└── CardPreProcessed.js (87 lines) - Pre-processed emails

BENEFITS:
✅ Each file focuses on a single responsibility
✅ Easier to maintain and debug specific features
✅ Better code organization and readability
✅ Facilitates team collaboration on different features
✅ Faster development and testing of individual components

USAGE:
All functions remain globally accessible in Apps Script.
No changes needed in calling code - all function names are preserved.
*/ 