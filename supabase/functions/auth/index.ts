import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, OPTIONS",
};

// Initialize Supabase with service role key - bypass RLS for our custom auth
const supabase = createClient(
  Deno.env.get("SUPABASE_URL") ?? "",
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
    db: {
      schema: "public",
    },
  }
);

const MASTER_API_KEY =
  Deno.env.get("MASTER_API_KEY") || "master_key_change_in_production";

Deno.serve(async (req) => {
  console.log("🚀 Auth function called!");
  console.log("📍 Method:", req.method);
  console.log("📍 URL:", req.url);
  console.log("📍 Headers:", Object.fromEntries(req.headers.entries()));

  if (req.method === "OPTIONS") {
    console.log("✅ CORS preflight request");
    return new Response("ok", { headers: corsHeaders });
  }

  // Add a simple test endpoint
  const url = new URL(req.url);
  if (url.pathname.includes("/test")) {
    console.log("🧪 Test endpoint called");
    return new Response(
      JSON.stringify({
        message: "Auth function is working!",
        timestamp: new Date().toISOString(),
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  const path = url.pathname.replace("/functions/v1/auth", "");

  try {
    // Handle different endpoints based on request body or path
    if (req.method === "POST") {
      const body = await req.json();
      console.log("📦 Request body:", body);

      // Check if this is a validation request
      if (body.action === "validate" && body.api_key) {
        console.log("🔍 Validation request detected");
        return await handleValidateUserKey(body.api_key);
      }

      // Check if this is a user key generation request (has email)
      if (body.email) {
        console.log("🔑 User key generation request detected");
        return await handleGenerateUserKey(req, body);
      }

      // Default to validation if only api_key is provided
      if (body.api_key) {
        console.log("🔍 Default validation request");
        return await handleValidateUserKey(body.api_key);
      }
    }

    // Handle GET requests for profile
    if (req.method === "GET") {
      console.log("👤 Profile request detected");
      return await handleGetProfile(req);
    }

    // Handle OAuth sign-in from dashboard - creates public.users entry for existing auth.users
    if (req.method === "POST" && path === "/oauth-signin") {
      console.log("🔍 OAuth sign-in request detected");
      return await handleOAuthSignIn(req, {});
    }

    console.log("❌ Invalid request - no matching endpoint");
    return new Response(JSON.stringify({ error: "Invalid request" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Auth function error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function handleGenerateUserKey(req: Request, body: any) {
  console.log("🔍 handleGenerateUserKey called");
  console.log("📋 All headers:", Object.fromEntries(req.headers.entries()));
  console.log("📦 Body:", body);
  console.log("🔑 Expected MASTER_API_KEY:", MASTER_API_KEY);

  // Validate master key - support both Authorization header and X-Master-Key header
  const authHeader = req.headers.get("Authorization");
  const masterKeyHeader = req.headers.get("X-Master-Key");

  console.log("🔐 Authorization header:", authHeader);
  console.log("🔐 X-Master-Key header:", masterKeyHeader);

  let masterKey = null;

  if (authHeader && authHeader.startsWith("Bearer ")) {
    masterKey = authHeader.split(" ")[1];
    console.log(
      "🔐 Using Authorization Bearer header, extracted key:",
      masterKey
    );
  } else if (masterKeyHeader) {
    masterKey = masterKeyHeader;
    console.log("🔐 Using X-Master-Key header, key:", masterKey);
  } else {
    console.error("❌ No valid master key header found");
    console.log("📋 Available headers:", Array.from(req.headers.keys()));
    return new Response(
      JSON.stringify({ error: "Missing or invalid authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log("🔍 Comparing keys:");
  console.log("  Received:", masterKey);
  console.log("  Expected:", MASTER_API_KEY);
  console.log("  Match:", masterKey === MASTER_API_KEY);

  if (masterKey !== MASTER_API_KEY) {
    console.error("❌ Invalid master key provided");
    return new Response(JSON.stringify({ error: "Invalid master API key" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("✅ Master key validated successfully");

  const { email, name } = body;

  if (!email) {
    return new Response(JSON.stringify({ error: "Email is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  // Validate email format
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    return new Response(JSON.stringify({ error: "Invalid email format" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("📧 Creating/finding user for:", email);

  const { user, created } = await createOrGetUser(email, name, "gmail_addon");

  console.log(`✅ User ${created ? "created" : "found"} successfully`);

  return new Response(
    JSON.stringify({
      success: true,
      api_key: user.api_key,
      user_id: user.id,
      created: created,
      message: created ? "New user created" : "Existing user found",
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleValidateUserKey(apiKey: string) {
  if (!apiKey) {
    return new Response(JSON.stringify({ error: "API key is required" }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  const user = await getUserByApiKey(apiKey);

  if (!user) {
    return new Response(
      JSON.stringify({
        valid: false,
        error: "Invalid or inactive API key",
      }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  return new Response(
    JSON.stringify({
      valid: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        created_at: user.created_at,
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

async function handleGetProfile(req: Request) {
  const authHeader = req.headers.get("Authorization");

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const apiKey = authHeader.split(" ")[1];
  const user = await getUserByApiKey(apiKey);

  if (!user) {
    return new Response(JSON.stringify({ error: "Invalid API key" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  return new Response(
    JSON.stringify({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        source: user.source,
        created_at: user.created_at,
        updated_at: user.updated_at,
      },
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Handle OAuth sign-in from dashboard - creates public.users entry for existing auth.users
async function handleOAuthSignIn(req: Request, body: any) {
  console.log("🔍 handleOAuthSignIn called");

  // This endpoint expects a Supabase Auth JWT token
  const authHeader = req.headers.get("Authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return new Response(
      JSON.stringify({ error: "Missing authorization header" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  const token = authHeader.split(" ")[1];

  // Verify the JWT and get user info
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser(token);

  if (userError || !user) {
    console.error("❌ Invalid JWT token:", userError);
    return new Response(
      JSON.stringify({ error: "Invalid authentication token" }),
      {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log("✅ Valid auth user:", user.id, user.email);

  // Check if user already exists in public.users
  const { data: existingUser, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("email", user.email)
    .eq("is_active", true)
    .single();

  if (existingUser && !findError) {
    console.log("✅ User already exists in public.users:", existingUser.id);
    return new Response(
      JSON.stringify({
        success: true,
        user_id: existingUser.id,
        api_key: existingUser.api_key,
        message: "User already exists",
        created: false,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }

  console.log("🆕 Creating public.users entry for OAuth user");

  // Generate API key for the user
  const apiKey = generateSecureApiKey();

  // Create public.users entry using the auth user's ID
  const { data: newUser, error: createError } = await supabase
    .from("users")
    .insert({
      id: user.id, // Use the Supabase Auth user ID
      email: user.email,
      api_key: apiKey,
      name: user.user_metadata?.name || user.email?.split("@")[0],
      source: "oauth_dashboard",
      is_active: true,
    })
    .select()
    .single();

  if (createError) {
    console.error("❌ Error creating public.users entry:", createError);
    return new Response(
      JSON.stringify({ error: "Failed to create user record" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }

  console.log("✅ Created public.users entry:", newUser.id);

  return new Response(
    JSON.stringify({
      success: true,
      user_id: newUser.id,
      api_key: newUser.api_key,
      message: "User created successfully",
      created: true,
    }),
    { headers: { ...corsHeaders, "Content-Type": "application/json" } }
  );
}

// Helper functions
function generateSecureApiKey(): string {
  const randomBytes = crypto.getRandomValues(new Uint8Array(32));
  const hexString = Array.from(randomBytes)
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return `ak_${hexString}`;
}

async function createOrGetUser(
  email: string,
  name: string | null = null,
  source: string = "gmail_addon"
) {
  console.log("🔍 createOrGetUser called for:", email);

  // First, try to find existing user using service role (bypasses RLS)
  const { data: existingUser, error: findError } = await supabase
    .from("users")
    .select("*")
    .eq("email", email)
    .eq("is_active", true)
    .single();

  if (existingUser && !findError) {
    console.log("✅ Found existing custom user:", existingUser.id);
    return { user: existingUser, created: false };
  }

  console.log("🆕 Creating new user for:", email);

  // Generate new API key
  const apiKey = generateSecureApiKey();

  // Create custom user in public.users table (Gmail add-on flow)
  // Note: This creates a separate UUID for Gmail add-on users, they can link to auth users later via email
  const { data: newUser, error: createError } = await supabase
    .from("users")
    .insert({
      email,
      api_key: apiKey,
      name,
      source,
      is_active: true,
    })
    .select()
    .single();

  if (createError) {
    console.error("❌ Error creating custom user:", createError);
    throw createError;
  }

  console.log("✅ Custom user created successfully:", newUser.id);
  return { user: newUser, created: true };
}

async function getOrCreateAuthUser(
  email: string,
  name?: string | null
): Promise<string | null> {
  try {
    console.log("🔍 Checking for existing Supabase Auth user:", email);

    // First, check if user exists in auth.users
    const { data: existingUser } = await supabase.auth.admin.getUserByEmail(
      email
    );

    if (existingUser?.user?.id) {
      console.log(
        "✅ Found existing Supabase Auth user:",
        existingUser.user.id
      );
      return existingUser.user.id;
    }

    console.log("🆕 Creating new Supabase Auth user for:", email);

    // Create a new auth user with a random password (they'll sign in via Google OAuth)
    const { data: newUser, error } = await supabase.auth.admin.createUser({
      email,
      email_confirm: true, // Auto-confirm since we trust Gmail addon
      user_metadata: {
        name: name || email.split("@")[0],
        created_via: "gmail_addon",
        created_at: new Date().toISOString(),
      },
    });

    if (error) {
      console.error("❌ Error creating Supabase Auth user:", error);
      return null;
    }

    if (newUser?.user?.id) {
      console.log("✅ Created new Supabase Auth user:", newUser.user.id);
      return newUser.user.id;
    }

    console.error("❌ No user ID returned from Supabase Auth creation");
    return null;
  } catch (error) {
    console.error("❌ Error in getOrCreateAuthUser:", error);
    return null;
  }
}

async function getUserByApiKey(apiKey: string) {
  try {
    // Use service role to query directly, bypassing RLS
    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    if (error) throw error;
    return user;
  } catch (error) {
    console.error("Error getting user by API key:", error);
    return null;
  }
}
