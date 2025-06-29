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

  console.log("🔍 Debug - Full URL:", req.url);
  console.log("🔍 Debug - Parsed pathname:", url.pathname);
  console.log("🔍 Debug - Final path:", path);
  console.log("🔍 Debug - Request method:", req.method);

  try {
    // Handle path-based endpoints first (before body parsing)

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

    // Admin endpoint to cleanup auth users (for testing)
    if (req.method === "POST" && path === "/admin/cleanup-auth-users") {
      console.log("🔍 Admin cleanup request detected");
      return await handleCleanupAuthUsers(req, {});
    }

    // Handle different endpoints based on request body
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

  const { user, created } = await createOrGetUser(email, name, "web_oauth");

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
  try {
    console.log("🔍 OAuth sign-in request started");

    // Get the user session from Supabase Auth
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      console.error("❌ Missing or invalid authorization header");
      return new Response(
        JSON.stringify({ error: "Missing authorization header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const token = authHeader.split(" ")[1];

    // Get user data from Supabase Auth
    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser(token);

    if (userError || !user) {
      console.error("❌ Invalid token or user not found:", userError);
      return new Response(
        JSON.stringify({ error: "Invalid authentication token" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    const email = user.email;
    const name =
      user.user_metadata?.full_name || user.user_metadata?.name || null;
    const authUserId = user.id;

    if (!email) {
      console.error("❌ No email found in user data");
      return new Response(
        JSON.stringify({ error: "Email not found in user data" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log("📧 Syncing user with auth system:", email, "->", authUserId);

    // Instead of using RPC, directly create/update the user record
    // First check if user exists
    const { data: existingUser, error: findError } = await supabase
      .from("users")
      .select("*")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    let actioneerUser;
    let wasCreated = false;

    if (existingUser && !findError) {
      console.log(
        "✅ Found existing user, updating with auth ID:",
        existingUser.id
      );

      // Update existing user to use auth ID if not already synced
      if (existingUser.id !== authUserId) {
        const { data: updatedUser, error: updateError } = await supabase
          .from("users")
          .update({
            id: authUserId,
            auth_synced: true,
          })
          .eq("email", email)
          .eq("is_active", true)
          .select()
          .single();

        if (updateError) {
          console.error("❌ Error updating user with auth ID:", updateError);
          return new Response(
            JSON.stringify({
              error: "Failed to sync existing user",
              details: updateError.message,
            }),
            {
              status: 500,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        actioneerUser = updatedUser;
      } else {
        actioneerUser = existingUser;
      }
    } else {
      console.log("🆕 Creating new user with auth ID:", authUserId);

      // Create new user with auth ID
      const { data: newUser, error: createError } = await supabase
        .from("users")
        .insert({
          id: authUserId, // Use Supabase Auth user ID
          email: email,
          api_key: generateSecureApiKey(),
          name: name || email.split("@")[0],
          source: "web_oauth",
          is_active: true,
          onboarding_completed: false,
          auth_synced: true,
        })
        .select()
        .single();

      if (createError) {
        console.error("❌ Error creating new user:", createError);
        return new Response(
          JSON.stringify({
            error: "Failed to create user account",
            details: createError.message,
          }),
          {
            status: 500,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      actioneerUser = newUser;
      wasCreated = true;
    }

    console.log(
      `✅ User ${wasCreated ? "created" : "synced"} successfully with ID: ${
        actioneerUser.id
      }`
    );

    // Note: Gmail watch setup will be handled separately via dedicated endpoint
    console.log("📝 OAuth user synced - Gmail setup to be handled separately");

    return new Response(
      JSON.stringify({
        success: true,
        user_id: actioneerUser.id,
        api_key: actioneerUser.api_key,
        created: wasCreated,
        gmail_setup_required: true, // Indicates frontend should handle Gmail setup
        message: wasCreated
          ? "User account created"
          : "User signed in successfully",
      }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("💥 Error in OAuth sign-in:", error);
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
  source: string = "web_oauth"
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

  // Create custom user in public.users table (OAuth flow)
  // Note: This creates a separate UUID for users, they can link to auth users later via email
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
      email_confirm: true, // Auto-confirm since we trust OAuth
      user_metadata: {
        name: name || email.split("@")[0],
        created_via: "web_oauth",
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

// Admin function to cleanup auth users (for testing)
async function handleCleanupAuthUsers(req: Request, body: any) {
  console.log("🔍 handleCleanupAuthUsers called");

  // Validate master key for admin access
  const masterKeyHeader = req.headers.get("X-Master-Key");

  if (!masterKeyHeader || masterKeyHeader !== MASTER_API_KEY) {
    console.error("❌ Invalid or missing master key for admin operation");
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  console.log("✅ Master key validated for admin operation");

  try {
    // List all auth users
    const { data: authUsers, error: listError } =
      await supabase.auth.admin.listUsers();

    if (listError) {
      console.error("❌ Error listing auth users:", listError);
      return new Response(
        JSON.stringify({ error: "Failed to list auth users" }),
        {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    if (!authUsers?.users || authUsers.users.length === 0) {
      console.log("✅ No auth users to delete");
      return new Response(
        JSON.stringify({
          success: true,
          message: "No auth users found",
          deleted_count: 0,
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    console.log(`🔍 Found ${authUsers.users.length} auth users to delete`);

    // Delete each auth user
    const deletePromises = authUsers.users.map(async (user) => {
      try {
        const { error } = await supabase.auth.admin.deleteUser(user.id);
        if (error) {
          console.error(`❌ Failed to delete user ${user.id}:`, error);
          return {
            id: user.id,
            email: user.email,
            success: false,
            error: error.message,
          };
        } else {
          console.log(`✅ Deleted user ${user.id} (${user.email})`);
          return { id: user.id, email: user.email, success: true };
        }
      } catch (err) {
        console.error(`❌ Exception deleting user ${user.id}:`, err);
        return {
          id: user.id,
          email: user.email,
          success: false,
          error: err.toString(),
        };
      }
    });

    const results = await Promise.all(deletePromises);
    const successCount = results.filter((r) => r.success).length;
    const failedResults = results.filter((r) => !r.success);

    console.log(`✅ Successfully deleted ${successCount} auth users`);
    if (failedResults.length > 0) {
      console.log(
        `❌ Failed to delete ${failedResults.length} users:`,
        failedResults
      );
    }

    return new Response(
      JSON.stringify({
        success: true,
        message: `Deleted ${successCount} auth users`,
        deleted_count: successCount,
        failed_count: failedResults.length,
        results: results,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("❌ Error in cleanup operation:", error);
    return new Response(
      JSON.stringify({ error: "Internal server error during cleanup" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
}
