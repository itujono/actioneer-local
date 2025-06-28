-- Update default source from gmail_addon to web_oauth
-- This reflects the transition to pure web OAuth authentication

-- Update the default value for the source column
ALTER TABLE users ALTER COLUMN source SET DEFAULT 'web_oauth';

-- Update existing users with gmail_addon source to web_oauth
UPDATE users SET source = 'web_oauth' WHERE source = 'gmail_addon'; 