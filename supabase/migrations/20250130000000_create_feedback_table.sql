-- Create feedback table
CREATE TABLE feedback (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  user_email TEXT NOT NULL,
  category TEXT NOT NULL,
  feedback_text TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX idx_feedback_user_id ON feedback(user_id);
CREATE INDEX idx_feedback_category ON feedback(category);
CREATE INDEX idx_feedback_created_at ON feedback(created_at);

-- Enable RLS
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can insert their own feedback"
  ON feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own feedback"
  ON feedback FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- Add trigger for updated_at
CREATE OR REPLACE FUNCTION update_feedback_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_feedback_updated_at
  BEFORE UPDATE ON feedback
  FOR EACH ROW
  EXECUTE FUNCTION update_feedback_updated_at(); 