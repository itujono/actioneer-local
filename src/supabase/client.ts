import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

// Get environment variables
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate environment variables
const isValidUrl = (url: string) => {
  try {
    new URL(url);
    return true;
  } catch {
    return false;
  }
};

const hasValidCredentials = supabaseUrl && 
  supabaseAnonKey && isValidUrl(supabaseUrl);

if (!hasValidCredentials) {
  console.error('⚠️ Supabase credentials are missing or invalid.');
  console.error('Please connect to Supabase using the "Connect to Supabase" button in the top right corner.');
}

// Create a single supabase client for interacting with your database
// Use dummy values if credentials are missing to prevent initialization errors
export const supabase = createClient<Database>(
  hasValidCredentials ? supabaseUrl : 'https://placeholder.supabase.co',
  hasValidCredentials ? supabaseAnonKey : 'placeholder-key'
);

// Helper for getting current session/user
export const getCurrentUser = async () => {
  if (!hasValidCredentials) {
    console.warn('Cannot get user: Supabase not configured');
    return null;
  }
  
  try {
    const { data: { session } } = await supabase.auth.getSession();
    return session?.user || null;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
};

// Export validation status for components to check
export const isSupabaseConfigured = hasValidCredentials;