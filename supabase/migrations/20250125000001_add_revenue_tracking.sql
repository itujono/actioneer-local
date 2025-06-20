-- Add revenue tracking capabilities
-- Migration to extend financial tracking beyond expenses

-- Create revenue table
CREATE TABLE IF NOT EXISTS revenue (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  email_id text NOT NULL,
  source text NOT NULL, -- Who/where the money came from
  amount numeric(10,2) NOT NULL,
  currency text DEFAULT 'USD',
  date timestamptz NOT NULL,
  category text NOT NULL, -- payment_received, refund, business_income, investment, government, digital_platform, sales
  revenue_type text NOT NULL, -- More specific type within category
  description text,
  reference_number text, -- Invoice number, transaction ID, etc.
  tax_implications jsonb DEFAULT '{}', -- For tax tracking
  details jsonb DEFAULT '{}', -- Additional metadata
  attachments jsonb DEFAULT '[]',
  attachment_count integer DEFAULT 0,
  created_at timestamptz DEFAULT now()
);

-- Add revenue to classification patterns in emails table
ALTER TABLE emails 
ADD COLUMN IF NOT EXISTS revenue_id uuid REFERENCES revenue(id) ON DELETE SET NULL;

-- Enable RLS on revenue table
ALTER TABLE revenue ENABLE ROW LEVEL SECURITY;

-- Create policies for revenue
CREATE POLICY "Users can access own revenue"
  ON revenue
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage revenue"
  ON revenue
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_revenue_user_id ON revenue(user_id);
CREATE INDEX IF NOT EXISTS idx_revenue_date ON revenue(date);
CREATE INDEX IF NOT EXISTS idx_revenue_category ON revenue(category);
CREATE INDEX IF NOT EXISTS idx_revenue_email_id ON revenue(email_id);

-- Add a function to calculate net income (revenue - expenses)
CREATE OR REPLACE FUNCTION calculate_net_income(
  p_user_id uuid,
  p_start_date timestamptz,
  p_end_date timestamptz
)
RETURNS TABLE (
  total_revenue numeric,
  total_expenses numeric,
  net_income numeric,
  revenue_count bigint,
  expense_count bigint
)
LANGUAGE sql
SECURITY DEFINER
AS $$
  SELECT 
    COALESCE(SUM(r.amount), 0) as total_revenue,
    COALESCE(SUM(e.amount), 0) as total_expenses,
    COALESCE(SUM(r.amount), 0) - COALESCE(SUM(e.amount), 0) as net_income,
    COUNT(r.id) as revenue_count,
    COUNT(e.id) as expense_count
  FROM users u
  LEFT JOIN revenue r ON r.user_id = u.id 
    AND r.date >= p_start_date 
    AND r.date <= p_end_date
  LEFT JOIN receipts e ON e.user_id = u.id 
    AND e.date >= p_start_date 
    AND e.date <= p_end_date
  WHERE u.id = p_user_id
  GROUP BY u.id;
$$; 