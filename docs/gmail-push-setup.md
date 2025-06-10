# Gmail Push Notifications Setup Guide (Simplified)

This guide will help you set up Gmail Push notifications for your Actioneer app using your existing auth system.

## Overview

The simplified Gmail Push notification system leverages your existing auth system without requiring additional OAuth flows. Here's how it works:

```
Email arrives → Gmail Push → Log notification → Gmail Add-on processes when opened
                                              ↓
                                    Uses existing API key auth system
```

## Key Benefits of Simplified Approach

1. **No Additional OAuth**: Uses your existing auth system
2. **Seamless Integration**: Works with current Gmail add-on flow
3. **Foundation for Future**: Sets up infrastructure for auto-processing later
4. **User Privacy**: No additional permissions required

## Prerequisites

1. **Google Cloud Project** with Gmail API enabled
2. **Google Pub/Sub** topic for receiving notifications
3. **Domain verification** for webhook endpoints
4. **Your existing Supabase auth system** (already implemented)

## Step 1: Google Cloud Setup

### 1.1 Create/Configure Google Cloud Project

```bash
# Install Google Cloud CLI if not already installed
# https://cloud.google.com/sdk/docs/install

# Set your project
gcloud config set project YOUR_PROJECT_ID

# Enable required APIs
gcloud services enable gmail.googleapis.com
gcloud services enable pubsub.googleapis.com
```

### 1.2 Create Pub/Sub Topic

```bash
# Create the topic for Gmail notifications
gcloud pubsub topics create gmail-notifications

# Create a subscription (optional, for testing)
gcloud pubsub subscriptions create gmail-notifications-sub --topic=gmail-notifications
```

## Step 2: Supabase Environment Variables

Add these environment variables to your Supabase project (most should already be set):

```bash
# Google Cloud (new)
GOOGLE_CLOUD_PROJECT_ID=your_project_id

# OpenAI (should already be set)
OPENAI_API_KEY=your_openai_api_key

# Master API Key (should already be set)
MASTER_API_KEY=your_master_key
```

## Step 3: Deploy Supabase Functions

Deploy the new simplified Edge Function:

```bash
# Deploy simplified Gmail webhook handler
supabase functions deploy gmail-webhook

# Deploy processed email retriever (for add-on)
supabase functions deploy get-processed-email

# Apply database migrations (for notification logging)
supabase db push
```

## Step 4: Domain Verification

### 4.1 Verify Your Domain with Google

1. Go to [Google Search Console](https://search.google.com/search-console)
2. Add your domain: `actioneer.online`
3. Verify ownership using one of the provided methods
4. This is required for Gmail Push notifications to work

### 4.2 Configure Pub/Sub Push Subscription

```bash
# Create push subscription pointing to your webhook
gcloud pubsub subscriptions create gmail-push-subscription \
    --topic=gmail-notifications \
    --push-endpoint=https://your-supabase-project.supabase.co/functions/v1/gmail-webhook
```

## Step 5: How It Works (No User Setup Required!)

### 5.1 Automatic User Detection

The system automatically works for any user who:

1. **Installs your Gmail add-on** (they already have this)
2. **Uses the add-on** (creates user account via existing auth system)
3. **Receives Gmail notifications** (automatically logged for their email)

### 5.2 Seamless Integration

```javascript
// No additional frontend code needed!
// Your existing Gmail add-on auth system handles everything:

// 1. User opens email in Gmail
// 2. Add-on gets user email via Session.getActiveUser().getEmail()
// 3. Add-on generates/uses API key via your existing auth system
// 4. Add-on processes email using existing backend functions
```

## Step 6: Testing

### 6.1 Test Notification Logging

1. Send a test email to a Gmail account that has used your add-on
2. Check Supabase logs for:
   - Push notification received
   - User found in database
   - Notification logged successfully
3. Open the email in Gmail add-on to see normal processing

### 6.2 Monitor Logs

```bash
# Monitor Supabase function logs
supabase functions logs gmail-webhook
supabase functions logs get-processed-email
```

## Step 7: Future Enhancements

### 7.1 Phase 2: Auto-Processing (Optional)

Once the foundation is working, you can add:

- Automatic email classification when notifications arrive
- Pre-processing travel/receipt/job emails
- Storing results for instant add-on display

### 7.2 Phase 3: Advanced Features (Optional)

- Real-time notifications to web app
- Email analytics and insights
- Batch processing for high-volume users

## Troubleshooting

### Common Issues

1. **Push notifications not received**

   - Check domain verification for `actioneer.online`
   - Verify Pub/Sub subscription configuration
   - Check webhook endpoint accessibility

2. **User not found errors**

   - Ensure user has used the Gmail add-on at least once
   - Check that user email matches exactly
   - Verify user is active in database

3. **Processing failures**
   - Check that existing auth system is working
   - Verify database permissions
   - Monitor function execution logs
