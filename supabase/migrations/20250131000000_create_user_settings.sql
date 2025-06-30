-- Create user_settings table for category preferences
CREATE TABLE IF NOT EXISTS user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  category_settings jsonb DEFAULT '{
    "receipt": true,
    "revenue": true,
    "travel": true,
    "job_application": true
  }'::jsonb,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- Enable RLS
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can access own settings"
  ON user_settings
  FOR ALL
  TO authenticated
  USING (auth.uid()::text = user_id::text);

CREATE POLICY "Service role can manage user settings"
  ON user_settings
  FOR ALL
  TO service_role
  USING (true);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_user_settings_user_id ON user_settings(user_id);

-- Function to get user category settings
CREATE OR REPLACE FUNCTION get_user_category_settings(p_user_id uuid)
RETURNS jsonb
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  settings jsonb;
BEGIN
  SELECT category_settings INTO settings
  FROM user_settings
  WHERE user_id = p_user_id;
  
  -- If no settings exist, create default settings
  IF settings IS NULL THEN
    INSERT INTO user_settings (user_id, category_settings)
    VALUES (p_user_id, '{
      "receipt": true,
      "revenue": true,
      "travel": true,
      "job_application": true
    }'::jsonb)
    RETURNING category_settings INTO settings;
  END IF;
  
  RETURN settings;
END;
$$;

-- Function to update user category settings
CREATE OR REPLACE FUNCTION update_user_category_settings(
  p_user_id uuid,
  p_category_settings jsonb
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_settings (user_id, category_settings, updated_at)
  VALUES (p_user_id, p_category_settings, now())
  ON CONFLICT (user_id) 
  DO UPDATE SET 
    category_settings = p_category_settings,
    updated_at = now();
END;
$$;

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION get_user_category_settings(uuid) TO anon;
GRANT EXECUTE ON FUNCTION update_user_category_settings(uuid, jsonb) TO anon;

-- Add comment for documentation
COMMENT ON TABLE user_settings IS 'Stores user preferences for email category processing';
COMMENT ON COLUMN user_settings.category_settings IS 'JSON object with category enabled/disabled flags: {"receipt": true, "revenue": false, ...}'; 