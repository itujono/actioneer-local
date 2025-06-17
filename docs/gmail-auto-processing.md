# Gmail Auto-Processing Implementation

## Overview

The Gmail webhook now automatically catches, parses, and stores job applications (and other email types) when emails arrive. This provides real-time processing without requiring users to manually open emails in the Gmail add-on.

## How It Works

```
Email arrives → Gmail Push Notification → Webhook processes → Database storage
```

### 1. Gmail Push Notification

- Gmail sends push notifications to our webhook when new emails arrive
- Webhook receives notification with user email and history ID

### 2. Automatic Email Processing

- System looks up user in database
- Fetches recent emails using Gmail API (if user has OAuth tokens)
- Classifies each email using OpenAI
- Processes and stores relevant data based on classification

### 3. Database Storage

- **Emails**: All processed emails stored in `emails` table
- **Job Applications**: Job-related emails parsed and stored in `job_applications` table
- **Travel**: Travel emails stored in `travel` table (TODO)
- **Receipts**: Receipt emails stored in `receipts` table (TODO)

## Current Implementation Status

### ✅ Completed Features

1. **Gmail Webhook Handler**

   - Receives and processes Gmail push notifications
   - Extracts user email and history ID from notifications
   - Logs notifications for audit trail

2. **Email Fetching**

   - Uses Gmail API to fetch recent emails
   - Supports both history-based and query-based fetching
   - Handles API errors and token expiration gracefully

3. **Email Classification**

   - Uses OpenAI to classify emails into categories:
     - `job_application`
     - `travel`
     - `receipt`
     - `other`

4. **Job Application Processing**

   - Extracts company, position, status, and dates
   - Uses AI with fallback to pattern matching
   - Stores in `job_applications` table with full details
   - Prevents duplicate processing

5. **Database Schema**
   - `emails` table for all processed emails
   - `job_applications` table for job tracking
   - `user_auth_tokens` table for Gmail OAuth tokens
   - `email_notifications` table for audit logging

### 🚧 Partial Implementation

1. **OAuth Token Management**

   - Database schema ready for Gmail access tokens
   - Token refresh logic marked as TODO
   - Currently gracefully handles missing tokens

2. **Travel Email Processing**

   - Framework in place
   - Actual processing logic marked as TODO

3. **Receipt Email Processing**
   - Framework in place
   - Actual processing logic marked as TODO

## Database Tables

### emails

```sql
CREATE TABLE emails (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  message_id text UNIQUE,
  subject text,
  from_email text,
  date timestamptz,
  classification text,
  created_at timestamptz
);
```

### job_applications

```sql
CREATE TABLE job_applications (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  email_id text,
  company text,
  position text,
  status text,
  applied_date date,
  details jsonb,
  created_at timestamptz
);
```

### user_auth_tokens

```sql
CREATE TABLE user_auth_tokens (
  id uuid PRIMARY KEY,
  user_id uuid REFERENCES users(id),
  gmail_access_token text,
  gmail_refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz,
  updated_at timestamptz
);
```

## Current Behavior

### With Gmail OAuth Tokens

1. Email arrives → Push notification received
2. System fetches recent emails via Gmail API
3. Each email is classified and processed
4. Job applications automatically stored in database
5. Users see data immediately in dashboard

### Without Gmail OAuth Tokens (Current Default)

1. Email arrives → Push notification received
2. System logs notification but skips auto-processing
3. Users can still manually process emails via Gmail add-on
4. Clear logging explains why auto-processing was skipped

## Security & Privacy

- Uses service role for database operations (bypasses RLS)
- Gmail access tokens stored securely in database
- Only processes emails for active users in system
- Respects user privacy - no processing without consent
- All operations logged for audit trail

## Performance Considerations

- Processes maximum 10 emails per notification
- Continues processing even if individual emails fail
- Duplicate detection prevents reprocessing
- Efficient database queries with proper indexing

## Next Steps

### Phase 1: OAuth Integration

1. Implement Gmail OAuth flow for users who want auto-processing
2. Add token refresh logic for expired access tokens
3. Create user interface for OAuth consent

### Phase 2: Complete Email Types

1. Implement travel email processing
2. Implement receipt email processing
3. Add more sophisticated classification rules

### Phase 3: Advanced Features

1. Real-time notifications to web app
2. Batch processing for high-volume users
3. Email analytics and insights
4. Custom processing rules per user

## Testing

### Current Testing Approach

1. **Manual Testing**: Send test emails and check logs
2. **Database Verification**: Confirm data stored correctly
3. **Error Handling**: Test with invalid tokens/emails

### Monitoring

- Check Supabase function logs: `supabase functions logs gmail-webhook`
- Monitor database for new entries
- Watch for error patterns in logs

## Deployment

The implementation is ready for deployment:

```bash
# Deploy the updated webhook
supabase functions deploy gmail-webhook

# Apply database migrations
supabase db push
```

## Configuration

Required environment variables:

- `OPENAI_API_KEY`: For email classification
- `SUPABASE_URL`: Database connection
- `SUPABASE_SERVICE_ROLE_KEY`: For database operations

## Troubleshooting

### Common Issues

1. **No auto-processing happening**

   - Check if user has Gmail OAuth tokens
   - Verify push notifications are being received
   - Check function logs for errors

2. **Emails not being classified correctly**

   - Review OpenAI API responses in logs
   - Check if fallback classification is working
   - Verify email content is being fetched properly

3. **Database errors**
   - Ensure migrations are applied
   - Check RLS policies are correct
   - Verify service role permissions

### Debug Commands

```bash
# Check function logs
supabase functions logs gmail-webhook --follow

# Check database entries
psql -c "SELECT * FROM emails ORDER BY created_at DESC LIMIT 10;"
psql -c "SELECT * FROM job_applications ORDER BY created_at DESC LIMIT 10;"

# Check notifications
psql -c "SELECT * FROM email_notifications ORDER BY created_at DESC LIMIT 10;"
```
