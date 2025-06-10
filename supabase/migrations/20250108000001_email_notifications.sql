/*
  # Add email notifications table for Gmail Push logging

  1. New Table
    - `email_notifications` 
      - `id` (uuid, primary key)
      - `user_id` (uuid, foreign key to users)
      - `email_address` (text)
      - `notification_data` (jsonb)
      - `processed` (boolean)
      - `created_at` (timestamp)

  2. Security
    - Enable RLS
    - Add policies for users to access their own notifications only
    - Service role can manage all notifications

  3. Indexes
    - Add performance indexes for user lookups and processing status
*/

-- Create email_notifications table
CREATE TABLE IF NOT EXISTS email_notifications (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_address text NOT NULL,
  notification_data jsonb DEFAULT '{}',
  processed boolean DEFAULT false,
  created_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE email_notifications ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can access own notifications"
  ON email_notifications
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage notifications"
  ON email_notifications
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_email_notifications_user_id ON email_notifications(user_id);
CREATE INDEX IF NOT EXISTS idx_email_notifications_email_address ON email_notifications(email_address);
CREATE INDEX IF NOT EXISTS idx_email_notifications_processed ON email_notifications(processed);
CREATE INDEX IF NOT EXISTS idx_email_notifications_created_at ON email_notifications(created_at); 