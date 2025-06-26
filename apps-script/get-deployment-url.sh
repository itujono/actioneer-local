#!/bin/bash

echo "🔗 Getting Gmail Add-on deployment URL..."

# Get the script ID from .clasp.json
if [ ! -f ".clasp.json" ]; then
    echo "❌ No .clasp.json file found. Make sure you're in the Apps Script directory and have run 'clasp login' and 'clasp create' or 'clasp clone'."
    exit 1
fi

SCRIPT_ID=$(cat .clasp.json | grep -o '"scriptId"[[:space:]]*:[[:space:]]*"[^"]*"' | cut -d'"' -f4)

if [ -z "$SCRIPT_ID" ]; then
    echo "❌ No script ID found in .clasp.json. Make sure the file is properly formatted."
    exit 1
fi

echo "📋 Script ID: $SCRIPT_ID"

# Create the deployment URL
DEPLOYMENT_URL="https://script.google.com/macros/d/$SCRIPT_ID/addons"

echo ""
echo "🎯 Gmail Add-on Installation URL:"
echo "$DEPLOYMENT_URL"
echo ""

# Try to get deployment info
echo "📦 Getting deployment info..."
clasp deployments

echo ""
echo "💡 To use this URL in your web app:"
echo "   1. Copy the URL above"
echo "   2. Update the ADDON_INSTALL_URL in src/components/dashboard/GmailAddonActivation.tsx"
echo "   3. Test the installation flow"
echo ""
echo "🚀 Users can now install your Gmail add-on directly!" 