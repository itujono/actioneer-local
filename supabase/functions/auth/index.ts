import { createClient } from 'npm:@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
};

// Initialize Supabase with service role key - bypass RLS for our custom auth
const supabase = createClient(
  Deno.env.get('SUPABASE_URL') ?? '',
  Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false
    },
    db: {
      schema: 'public'
    }
  }
);

const MASTER_API_KEY = Deno.env.get('MASTER_API_KEY') || 'master_key_change_in_production';

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  const url = new URL(req.url);
  const path = url.pathname.replace('/functions/v1/auth', '');

  try {
    // Handle different endpoints based on request body or path
    if (req.method === 'POST') {
      const body = await req.json();
      
      // Check if this is a validation request
      if (body.action === 'validate' && body.api_key) {
        return await handleValidateUserKey(body.api_key);
      }
      
      // Check if this is a user key generation request (has email)
      if (body.email) {
        return await handleGenerateUserKey(req, body);
      }
      
      // Default to validation if only api_key is provided
      if (body.api_key) {
        return await handleValidateUserKey(body.api_key);
      }
    }
    
    // Handle GET requests for profile
    if (req.method === 'GET') {
      return await handleGetProfile(req);
    }
    
    return new Response(
      JSON.stringify({ error: 'Invalid request' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
    
  } catch (error) {
    console.error('Auth function error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function handleGenerateUserKey(req: Request, body: any) {
  // Validate master key
  const authHeader = req.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing or invalid authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const token = authHeader.split(' ')[1];
  if (token !== MASTER_API_KEY) {
    return new Response(
      JSON.stringify({ error: 'Invalid master API key' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { email, name } = body;

  if (!email) {
    return new Response(
      JSON.stringify({ error: 'Email is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(
      JSON.stringify({ error: 'Invalid email format' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const { user, created } = await createOrGetUser(email, name, 'gmail_addon');

  return new Response(
    JSON.stringify({
      success: true,
      api_key: user.api_key,
      user_id: user.id,
      created: created,
      message: created ? 'New user created' : 'Existing user found'
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleValidateUserKey(apiKey: string) {
  if (!apiKey) {
    return new Response(
      JSON.stringify({ error: 'API key is required' }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const user = await getUserByApiKey(apiKey);

  if (!user) {
    return new Response(
      JSON.stringify({ 
        valid: false, 
        error: 'Invalid or inactive API key' 
      }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

async function handleGetProfile(req: Request) {
  const authHeader = req.headers.get('Authorization');

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return new Response(
      JSON.stringify({ error: 'Missing authorization header' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  const apiKey = authHeader.split(' ')[1];
  const user = await getUserByApiKey(apiKey);

  if (!user) {
    return new Response(
      JSON.stringify({ error: 'Invalid API key' }),
      { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }

  return new Response(
    JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        source: user.source,
        created_at: user.created_at,
        updated_at: user.updated_at
      }
    }),
    { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
  );
}

// Helper functions
function generateSecureApiKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const hexString = Array.from(randomBytes)
    .map(b => b.toString(16).padStart(2, '0'))
    .join('');
  return `ak_${hexString}`;
}

async function createOrGetUser(email: string, name: string | null = null, source: string = 'gmail_addon') {
  // First, try to find existing user using service role (bypasses RLS)
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

  // Create new user using service role (bypasses RLS)
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
}

async function getUserByApiKey(apiKey: string) {
  try {
    // Use service role to query directly, bypassing RLS
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