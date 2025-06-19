-- Clean schema migration pulled from remote database
-- This represents the current production state as of 2025-01-25

-- Create users table
CREATE TABLE IF NOT EXISTS users (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text UNIQUE NOT NULL,
  api_key text UNIQUE NOT NULL,
  name text,
  is_active boolean DEFAULT true,
  source text DEFAULT 'gmail_addon',
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Create email_notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_address text NOT NULL,
  notification_data jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

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

-- Create emails table
CREATE TABLE IF NOT EXISTS emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  message_id text UNIQUE NOT NULL,
  subject text NOT NULL,
  from_email text NOT NULL,
  date timestamptz NOT NULL,
  classification text NOT NULL,
  created_at timestamptz DEFAULT now()
);

-- Create receipts table (with all current columns)
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id text NOT NULL,
  merchant text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  date timestamptz NOT NULL,
  category text NOT NULL,
  items jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now(),
  attachments jsonb DEFAULT '[]',
  attachment_count integer DEFAULT 0,
  description text,
  invoice_number text,
  payment_method text,
  tax_amount numeric(10,2),
  details jsonb
);

-- Create travel table
CREATE TABLE IF NOT EXISTS travel (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id text NOT NULL,
  type text NOT NULL CHECK (type IN ('flight', 'hotel', 'attraction', 'general')),
  destination text NOT NULL,
  start_date date,
  end_date date,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Create job_applications table
CREATE TABLE IF NOT EXISTS job_applications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id text NOT NULL,
  company text NOT NULL,
  position text NOT NULL,
  status text DEFAULT 'applied',
  applied_date date NOT NULL,
  details jsonb DEFAULT '{}',
  created_at timestamptz DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_auth_tokens ENABLE ROW LEVEL SECURITY;
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

-- Create policies for users
CREATE POLICY "Users can read own data"
  ON users
  FOR SELECT
  TO authenticated
  USING (auth.uid()::text = id::text OR email = auth.jwt() ->> 'email');

CREATE POLICY "Service role can manage users"
  ON users
  FOR ALL
  TO service_role
  USING (true);

-- Create policies for email_notifications
CREATE POLICY "Users can insert their own email notifications"
  ON email_notifications
  FOR INSERT
  TO public
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can update their own email notifications"
  ON email_notifications
  FOR UPDATE
  TO public
  USING (user_id = auth.uid())
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "Users can view their own email notifications"
  ON email_notifications
  FOR SELECT
  TO public
  USING (user_id = auth.uid());

CREATE POLICY "Service role can manage all notifications"
  ON email_notifications
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Create policies for user_auth_tokens
CREATE POLICY "Users can access own auth tokens"
  ON user_auth_tokens
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage auth tokens"
  ON user_auth_tokens
  FOR ALL
  TO service_role
  USING (true);

-- Create policies for emails
CREATE POLICY "Users can access own emails"
  ON emails
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage emails"
  ON emails
  FOR ALL
  TO service_role
  USING (true);

-- Create policies for receipts
CREATE POLICY "Users can access own receipts"
  ON receipts
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage receipts"
  ON receipts
  FOR ALL
  TO service_role
  USING (true);

-- Create policies for travel
CREATE POLICY "Users can access own travel"
  ON travel
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage travel"
  ON travel
  FOR ALL
  TO service_role
  USING (true);

-- Create policies for job_applications
CREATE POLICY "Users can access own job applications"
  ON job_applications
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage job applications"
  ON job_applications
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_api_key ON users(api_key);
CREATE INDEX IF NOT EXISTS idx_users_active ON users(is_active) WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_email_address ON email_notifications(email_address);
CREATE INDEX IF NOT EXISTS idx_email_notifications_processed ON email_notifications(processed);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at);

CREATE INDEX IF NOT EXISTS idx_user_auth_tokens_user_id ON user_auth_tokens(user_id);

CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_classification ON emails(classification);
CREATE INDEX IF NOT EXISTS idx_emails_date ON emails(date);

CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS idx_receipts_amount ON receipts(amount);
CREATE INDEX IF NOT EXISTS idx_receipts_attachment_count ON receipts(attachment_count);
CREATE INDEX IF NOT EXISTS idx_receipts_attachments_gin ON receipts USING gin(attachments);

CREATE INDEX IF NOT EXISTS idx_travel_user_id ON travel(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_type ON travel(type);
CREATE INDEX IF NOT EXISTS idx_travel_start_date ON travel(start_date);
CREATE INDEX IF NOT EXISTS idx_travel_destination ON travel(destination);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_date ON job_applications(applied_date);
CREATE INDEX IF NOT EXISTS idx_job_applications_company ON job_applications(company);

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create triggers to automatically update updated_at
CREATE TRIGGER update_users_updated_at
  BEFORE UPDATE ON users
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_email_notifications_updated_at
  BEFORE UPDATE ON email_notifications
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_user_auth_tokens_updated_at
  BEFORE UPDATE ON user_auth_tokens
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at_column();

-- Function to get user by API key
CREATE OR REPLACE FUNCTION get_user_by_api_key(user_api_key text)
RETURNS TABLE(
  id uuid,
  email text,
  name text,
  is_active boolean,
  source text,
  created_at timestamptz,
  updated_at timestamptz
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    u.id,
    u.email,
    u.name,
    u.is_active,
    u.source,
    u.created_at,
    u.updated_at
  FROM users u
  WHERE u.api_key = user_api_key 
    AND u.is_active = true;
END;
$$;

-- Function to insert travel data
CREATE OR REPLACE FUNCTION insert_travel_data(
  p_user_id uuid,
  p_email_id text,
  p_type text,
  p_destination text,
  p_start_date date,
  p_end_date date,
  p_details jsonb
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  travel_id uuid;
BEGIN
  INSERT INTO travel (
    user_id,
    email_id,
    type,
    destination,
    start_date,
    end_date,
    details
  ) VALUES (
    p_user_id,
    p_email_id,
    p_type,
    p_destination,
    p_start_date,
    p_end_date,
    p_details
  ) RETURNING id INTO travel_id;
  
  RETURN travel_id;
END;
$$;

-- Function to insert email classification
CREATE OR REPLACE FUNCTION insert_email_classification(
  p_user_id uuid,
  p_message_id text,
  p_subject text,
  p_from_email text,
  p_date timestamptz,
  p_classification text
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  email_id uuid;
BEGIN
  INSERT INTO emails (
    user_id,
    message_id,
    subject,
    from_email,
    date,
    classification
  ) VALUES (
    p_user_id,
    p_message_id,
    p_subject,
    p_from_email,
    p_date,
    p_classification
  ) RETURNING id INTO email_id;
  
  RETURN email_id;
END;
$$;

-- Grant execute permissions to anon role
GRANT EXECUTE ON FUNCTION get_user_by_api_key(text) TO anon;
GRANT EXECUTE ON FUNCTION insert_travel_data(uuid, text, text, text, date, date, jsonb) TO anon;
GRANT EXECUTE ON FUNCTION insert_email_classification(uuid, text, text, text, timestamptz, text) TO anon;

-- Add comments for documentation
COMMENT ON COLUMN receipts.attachments IS 'JSON array of attachment objects with filename, url, size, and type';
COMMENT ON COLUMN receipts.attachment_count IS 'Number of attachments for quick filtering'; 