import { createClient } from '@supabase/supabase-js';
import crypto from 'node:crypto';

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

// Master key for user generation (should be in environment variables)
const MASTER_API_KEY = process.env.MASTER_API_KEY || 'master_key_change_in_production';

/**
 * Middleware to validate master API key
 * Used only for user key generation endpoint
 */
export async function validateMasterKey(c, next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }
  
  const token = authHeader.split(' ')[1];
  
  if (token !== MASTER_API_KEY) {
    return c.json({ error: 'Invalid master API key' }, 401);
  }
  
  // Add master key indicator to context
  c.set('authType', 'master');
  await next();
}

/**
 * Middleware to validate individual user API keys
 * Used for all regular API operations
 */
export async function validateUserApiKey(c, next) {
  const authHeader = c.req.header('Authorization');
  
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return c.json({ error: 'Missing or invalid authorization header' }, 401);
  }
  
  const apiKey = authHeader.split(' ')[1];
  
  // Validate API key format (should start with ak_ and be 67 characters total)
  if (!apiKey.startsWith('ak_') || apiKey.length !== 67) {
    return c.json({ error: 'Invalid API key format' }, 401);
  }
  
  try {
    // Look up user by API key
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();
    
    if (error || !user) {
      return c.json({ error: 'Invalid or inactive API key' }, 401);
    }
    
    // Add user to request context
    c.set('user', user);
    c.set('authType', 'user');
    await next();
  } catch (error) {
    console.error('API key validation error:', error);
    return c.json({ error: 'Authentication failed' }, 401);
  }
}

/**
 * Generate a secure API key for a user
 * Format: ak_[64-character-hex]
 */
export function generateSecureApiKey() {
  const randomBytes = crypto.randomBytes(32);
  const hexString = randomBytes.toString('hex');
  return `ak_${hexString}`;
}

/**
 * Create or get user with API key
 */
export async function createOrGetUser(email, name = null, source = 'gmail_addon') {
  try {
    // First, try to find existing user
    const { data: existingUser, error: findError } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('is_active', true)
      .single();
    
    if (existingUser && !findError) {
      return { user: existingUser, created: false };
    }
    
    // Generate new API key
    const apiKey = generateSecureApiKey();
    
    // Create new user
    const { data: newUser, error: createError } = await supabase
      .from('users')
      .insert({
        email,
        api_key: apiKey,
        name,
        source,
        is_active: true
      })
      .select()
      .single();
    
    if (createError) {
      throw createError;
    }
    
    return { user: newUser, created: true };
  } catch (error) {
    console.error('Error creating/getting user:', error);
    throw new Error('Failed to create or retrieve user');
  }
}

/**
 * Revoke user API key (deactivate user)
 */
export async function revokeUserApiKey(apiKey) {
  try {
    const { data, error } = await supabase
      .from('users')
      .update({ is_active: false, updated_at: new Date().toISOString() })
      .eq('api_key', apiKey)
      .select()
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Error revoking API key:', error);
    throw new Error('Failed to revoke API key');
  }
}

/**
 * Get user by API key
 */
export async function getUserByApiKey(apiKey) {
  try {
    const { data: user, error } = await supabase
      .from('users')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();
    
    if (error) throw error;
    return user;
  } catch (error) {
    console.error('Error getting user by API key:', error);
    return null;
  }
}