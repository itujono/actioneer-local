/*
  # Add user_auth_tokens table for Gmail API access

  1. New Table
    - `user_auth_tokens` 
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `gmail_access_token` (text, encrypted)
      - `gmail_refresh_token` (text, encrypted)
      - `token_expires_at` (timestamp)
      - `created_at` (timestamp)
      - `updated_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for users to access their own tokens only
    - Service role can manage all tokens

  3. Indexes
    - Add performance indexes for user lookups
*/

-- Create user_auth_tokens table
CREATE TABLE IF NOT EXISTS user_auth_tokens (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  gmail_access_token text,
  gmail_refresh_token text,
  token_expires_at timestamptz,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_auth_tokens ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can access own tokens"
  ON user_auth_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage tokens"
  ON user_auth_tokens
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_auth_tokens_user_id ON user_auth_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_user_auth_tokens_expires_at ON user_auth_tokens(token_expires_at);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_user_auth_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at
CREATE TRIGGER update_user_auth_tokens_updated_at_trigger
  BEFORE UPDATE ON user_auth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_user_auth_tokens_updated_at(); 