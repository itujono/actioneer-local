/*
  # Create travel and related tables

  1. New Tables
    - `emails` (if not exists)
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `message_id` (text, unique)
      - `subject` (text)
      - `from` (text)
      - `date` (timestamp)
      - `classification` (text)
      - `created_at` (timestamp)

    - `receipts` (if not exists)
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `email_id` (text)
      - `merchant` (text)
      - `amount` (numeric)
      - `currency` (text)
      - `date` (date)
      - `category` (text)
      - `items` (jsonb)
      - `created_at` (timestamp)

    - `travel` (if not exists)
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `email_id` (text)
      - `type` (text) - flight, hotel, attraction, general
      - `destination` (text)
      - `start_date` (date)
      - `end_date` (date)
      - `details` (jsonb) - stores extracted travel data and comparisons
      - `created_at` (timestamp)

    - `job_applications` (if not exists)
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `email_id` (text)
      - `company` (text)
      - `position` (text)
      - `status` (text)
      - `applied_date` (date)
      - `details` (jsonb)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS on all tables
    - Add policies for users to access their own data only

  3. Indexes
    - Add performance indexes for common queries
*/

-- Create emails table if not exists
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

-- Create receipts table if not exists
CREATE TABLE IF NOT EXISTS receipts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id text NOT NULL,
  merchant text NOT NULL,
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  date date NOT NULL,
  category text NOT NULL,
  items jsonb DEFAULT '[]',
  created_at timestamptz DEFAULT now()
);

-- Create travel table if not exists
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

-- Create job_applications table if not exists
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
ALTER TABLE emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE receipts ENABLE ROW LEVEL SECURITY;
ALTER TABLE travel ENABLE ROW LEVEL SECURITY;
ALTER TABLE job_applications ENABLE ROW LEVEL SECURITY;

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
CREATE INDEX IF NOT EXISTS idx_emails_user_id ON emails(user_id);
CREATE INDEX IF NOT EXISTS idx_emails_message_id ON emails(message_id);
CREATE INDEX IF NOT EXISTS idx_emails_classification ON emails(classification);
CREATE INDEX IF NOT EXISTS idx_emails_date ON emails(date);

CREATE INDEX IF NOT EXISTS idx_receipts_user_id ON receipts(user_id);
CREATE INDEX IF NOT EXISTS idx_receipts_date ON receipts(date);
CREATE INDEX IF NOT EXISTS idx_receipts_category ON receipts(category);
CREATE INDEX IF NOT EXISTS idx_receipts_amount ON receipts(amount);

CREATE INDEX IF NOT EXISTS idx_travel_user_id ON travel(user_id);
CREATE INDEX IF NOT EXISTS idx_travel_type ON travel(type);
CREATE INDEX IF NOT EXISTS idx_travel_start_date ON travel(start_date);
CREATE INDEX IF NOT EXISTS idx_travel_destination ON travel(destination);

CREATE INDEX IF NOT EXISTS idx_job_applications_user_id ON job_applications(user_id);
CREATE INDEX IF NOT EXISTS idx_job_applications_status ON job_applications(status);
CREATE INDEX IF NOT EXISTS idx_job_applications_applied_date ON job_applications(applied_date);
CREATE INDEX IF NOT EXISTS idx_job_applications_company ON job_applications(company);