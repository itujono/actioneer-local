import { Hono } from 'hono';
import { validateMasterKey, createOrGetUser, revokeUserApiKey, getUserByApiKey } from '../middleware/auth.js';

const auth = new Hono();

/**
 * Generate user API key endpoint
 * Protected by master API key
 * Called by Gmail add-on to create individual user credentials
 */
auth.post('/generate-user-key', validateMasterKey, async (c) => {
  try {
    const body = await c.req.json();
    const { email, name } = body;
    
    if (!email) {
      return c.json({ error: 'Email is required' }, 400);
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return c.json({ error: 'Invalid email format' }, 400);
    }
    
    // Create or get existing user
    const { user, created } = await createOrGetUser(email, name, 'gmail_addon');
    
    return c.json({
      success: true,
      api_key: user.api_key,
      user_id: user.id,
      created: created,
      message: created ? 'New user created' : 'Existing user found'
    });
    
  } catch (error) {
    console.error('Error generating user key:', error);
    return c.json({ 
      error: 'Failed to generate user API key',
      details: error.message 
    }, 500);
  }
});

/**
 * Validate user API key endpoint
 * Allows Gmail add-on to verify if stored key is still valid
 */
auth.post('/validate-user-key', async (c) => {
  try {
    const body = await c.req.json();
    const { api_key } = body;
    
    if (!api_key) {
      return c.json({ error: 'API key is required' }, 400);
    }
    
    const user = await getUserByApiKey(api_key);
    
    if (!user) {
      return c.json({ 
        valid: false, 
        error: 'Invalid or inactive API key' 
      }, 401);
    }
    
    return c.json({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    });
    
  } catch (error) {
    console.error('Error validating user key:', error);
    return c.json({ 
      valid: false,
      error: 'Validation failed' 
    }, 500);
  }
});

/**
 * Revoke user API key endpoint
 * Allows users to deactivate their own API key
 */
auth.post('/revoke-user-key', async (c) => {
  try {
    const body = await c.req.json();
    const { api_key } = body;
    
    if (!api_key) {
      return c.json({ error: 'API key is required' }, 400);
    }
    
    const revokedUser = await revokeUserApiKey(api_key);
    
    return c.json({
      success: true,
      message: 'API key revoked successfully',
      user_id: revokedUser.id
    });
    
  } catch (error) {
    console.error('Error revoking user key:', error);
    return c.json({ 
      error: 'Failed to revoke API key',
      details: error.message 
    }, 500);
  }
});

/**
 * Get user profile endpoint
 * Returns user information for authenticated user
 */
auth.get('/profile', async (c) => {
  try {
    const authHeader = c.req.header('Authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return c.json({ error: 'Missing authorization header' }, 401);
    }
    
    const apiKey = authHeader.split(' ')[1];
    const user = await getUserByApiKey(apiKey);
    
    if (!user) {
      return c.json({ error: 'Invalid API key' }, 401);
    }
    
    return c.json({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        source: user.source,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    });
    
  } catch (error) {
    console.error('Error getting user profile:', error);
    return c.json({ 
      error: 'Failed to get user profile' 
    }, 500);
  }
});

export default auth;