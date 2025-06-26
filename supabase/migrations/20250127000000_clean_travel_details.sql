-- Clean up travel details column to keep only essential data
-- This migration extracts useful info and removes the bloated comparison data

-- Step 1: Add a subject column to store email subject directly (optional but useful)
ALTER TABLE travel ADD COLUMN IF NOT EXISTS subject TEXT;

-- Step 2: Extract essential data and clean up details
UPDATE travel 
SET 
  -- Extract subject from details if it exists, otherwise keep NULL
  subject = CASE 
    WHEN details->>'subject' IS NOT NULL THEN details->>'subject'
    ELSE NULL 
  END,
  
  -- Clean up details to keep only essential fields
  details = jsonb_build_object(
    'travelers', COALESCE((details->>'travelers')::integer, (details->>'guests')::integer, 1),
    'origin', details->>'origin',
    'email_date', details->>'email_date',
    'from_email', details->>'from_email',
    'preferences', details->>'preferences',
    'booking_reference', details->>'bookingReference'
  )
  
-- Only update rows that have the bloated comparison data
WHERE details ? 'comparisons' OR jsonb_typeof(details->'comparisons') IS NOT NULL;

-- Step 3: Remove the type constraint since we're treating all travel emails the same
ALTER TABLE travel DROP CONSTRAINT IF EXISTS travel_type_check;

-- Step 4: Allow type to be more flexible (keep existing data but allow anything)
-- We can keep the type column for backward compatibility but make it flexible

-- Optional: Clean up any remaining null values in details
UPDATE travel 
SET details = '{}'::jsonb 
WHERE details IS NULL;

-- Add a comment to document the cleanup
COMMENT ON COLUMN travel.details IS 'Essential travel email data: travelers, origin, email_date, from_email, preferences, booking_reference. Cleaned up from previous bloated comparison data.';
COMMENT ON COLUMN travel.subject IS 'Email subject line for display in travel history dashboard'; 