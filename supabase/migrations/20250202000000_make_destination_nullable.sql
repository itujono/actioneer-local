-- Make destination column nullable in travel table
-- This allows storing travel emails even when destination extraction fails

ALTER TABLE public.travel 
ALTER COLUMN destination DROP NOT NULL;

-- Add a comment explaining the change
COMMENT ON COLUMN public.travel.destination IS 'Extracted travel destination - nullable since extraction may fail for some email types'; 