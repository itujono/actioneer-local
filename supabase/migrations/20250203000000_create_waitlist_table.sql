-- Create waitlist table for beta user signups
CREATE TABLE IF NOT EXISTS waitlist (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    email text NOT NULL UNIQUE,
    created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
    status text DEFAULT 'pending' CHECK (status IN ('pending', 'invited', 'registered')),
    invited_at timestamp with time zone,
    updated_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- Enable RLS
ALTER TABLE waitlist ENABLE ROW LEVEL SECURITY;

-- Create policies (waitlist entries are publicly insertable but not readable)
CREATE POLICY "Anyone can insert waitlist entries" 
ON waitlist FOR INSERT 
WITH CHECK (true);

-- Only authenticated users (admin) can view waitlist entries
CREATE POLICY "Only authenticated users can view waitlist" 
ON waitlist FOR SELECT 
USING (auth.role() = 'authenticated');

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_waitlist_email ON waitlist(email);
CREATE INDEX IF NOT EXISTS idx_waitlist_status ON waitlist(status);
CREATE INDEX IF NOT EXISTS idx_waitlist_created_at ON waitlist(created_at);

-- Create updated_at trigger
CREATE TRIGGER update_waitlist_updated_at
    BEFORE UPDATE ON waitlist
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Add helpful comment
COMMENT ON TABLE waitlist IS 'Beta waitlist signups for Actioneer. Users join waitlist before getting access to the full product.'; 