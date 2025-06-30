-- Add RLS policies for custom_fields table
-- Users can only access their own custom fields

-- Allow users to SELECT their own custom fields
CREATE POLICY "Users can view own custom fields" ON custom_fields
    FOR SELECT USING (auth.uid() = user_id);

-- Allow users to INSERT their own custom fields
CREATE POLICY "Users can insert own custom fields" ON custom_fields
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Allow users to UPDATE their own custom fields
CREATE POLICY "Users can update own custom fields" ON custom_fields
    FOR UPDATE USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Allow users to DELETE their own custom fields
CREATE POLICY "Users can delete own custom fields" ON custom_fields
    FOR DELETE USING (auth.uid() = user_id); 