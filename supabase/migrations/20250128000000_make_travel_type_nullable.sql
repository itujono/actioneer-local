-- Make travel.type field nullable since we're treating all travel emails uniformly
-- This aligns with the simplified travel email dashboard approach

-- Remove the NOT NULL constraint from the type field
ALTER TABLE travel ALTER COLUMN type DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN travel.type IS 'Travel type field - now optional since all travel emails are treated uniformly in the simplified dashboard approach';

-- Optional: Set existing NULL values to a default if needed (but we'll keep them NULL for simplicity)
-- UPDATE travel SET type = 'general' WHERE type IS NULL; 