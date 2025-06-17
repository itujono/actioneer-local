#!/bin/bash

echo "🚀 Starting Apps Script deployment..."

# Step 1: Rename specific Apps Script files to .gs
echo "🔄 Converting Apps Script files to .gs..."

if [ -f "CardBuilders.js" ]; then
    mv "CardBuilders.js" "CardBuilders.gs"
    echo "   CardBuilders.js → CardBuilders.gs"
fi

if [ -f "CardCommon.js" ]; then
    mv "CardCommon.js" "CardCommon.gs"
    echo "   CardCommon.js → CardCommon.gs"
fi

if [ -f "CardExpenses.js" ]; then
    mv "CardExpenses.js" "CardExpenses.gs"
    echo "   CardExpenses.js → CardExpenses.gs"
fi

if [ -f "CardJobs.js" ]; then
    mv "CardJobs.js" "CardJobs.gs"
    echo "   CardJobs.js → CardJobs.gs"
fi

if [ -f "CardPreProcessed.js" ]; then
    mv "CardPreProcessed.js" "CardPreProcessed.gs"
    echo "   CardPreProcessed.js → CardPreProcessed.gs"
fi

if [ -f "CardTravel.js" ]; then
    mv "CardTravel.js" "CardTravel.gs"
    echo "   CardTravel.js → CardTravel.gs"
fi

if [ -f "Code.js" ]; then
    mv "Code.js" "Code.gs"
    echo "   Code.js → Code.gs"
fi

if [ -f "Tests.js" ]; then
    mv "Tests.js" "Tests.gs"
    echo "   Tests.js → Tests.gs"
fi

# Step 2: Deploy
echo ""
echo "📤 Deploying to Apps Script..."
clasp push

# Step 3: Convert back to .js
echo ""
echo "🔄 Converting back to .js..."

if [ -f "CardBuilders.gs" ]; then
    mv "CardBuilders.gs" "CardBuilders.js"
    echo "   CardBuilders.gs → CardBuilders.js"
fi

if [ -f "CardCommon.gs" ]; then
    mv "CardCommon.gs" "CardCommon.js"
    echo "   CardCommon.gs → CardCommon.js"
fi

if [ -f "CardExpenses.gs" ]; then
    mv "CardExpenses.gs" "CardExpenses.js"
    echo "   CardExpenses.gs → CardExpenses.js"
fi

if [ -f "CardJobs.gs" ]; then
    mv "CardJobs.gs" "CardJobs.js"
    echo "   CardJobs.gs → CardJobs.js"
fi

if [ -f "CardPreProcessed.gs" ]; then
    mv "CardPreProcessed.gs" "CardPreProcessed.js"
    echo "   CardPreProcessed.gs → CardPreProcessed.js"
fi

if [ -f "CardTravel.gs" ]; then
    mv "CardTravel.gs" "CardTravel.js"
    echo "   CardTravel.gs → CardTravel.js"
fi

if [ -f "Code.gs" ]; then
    mv "Code.gs" "Code.js"
    echo "   Code.gs → Code.js"
fi

if [ -f "Tests.gs" ]; then
    mv "Tests.gs" "Tests.js"
    echo "   Tests.gs → Tests.js"
fi

echo ""
echo "✅ Deployment complete! All files back to .js format for development." 