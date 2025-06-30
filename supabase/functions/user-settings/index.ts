import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
};

interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          api_key: string;
          name: string | null;
          is_active: boolean;
          source: string;
          created_at: string;
          updated_at: string;
        };
      };
      user_settings: {
        Row: {
          id: string;
          user_id: string;
          category_settings: any;
          created_at: string;
          updated_at: string;
        };
      };
    };
  };
}

Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const supabase = createClient<Database>(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? ""
    );

    const method = req.method;

    // Extract access token from Authorization header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
      return new Response(JSON.stringify({ error: "Authorization header required" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const accessToken = authHeader.split(" ")[1];

    // Get user from Supabase Auth
    const { data: authData, error: authError } = await supabase.auth.getUser(accessToken);

    if (authError || !authData.user) {
      return new Response(JSON.stringify({ error: "Invalid access token" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get user from our database
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("*")
      .eq("id", authData.user.id)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return new Response(JSON.stringify({ error: "User not found in database" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log(`🔧 Settings request for user: ${user.email}`);

    if (method === "GET") {
      // Get user settings
      const { data: settings, error } = await supabase.rpc("get_user_category_settings", { p_user_id: user.id });

      if (error) {
        console.error("Error getting user settings:", error);
        return new Response(JSON.stringify({ error: "Failed to get settings" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("✅ User settings retrieved");
      return new Response(JSON.stringify({ settings }), {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    } else if (method === "PUT") {
      // Update user settings
      const { categorySettings } = await req.json();

      if (!categorySettings || typeof categorySettings !== "object") {
        return new Response(JSON.stringify({ error: "Invalid category settings format" }), {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      // Validate that all required categories are present
      const requiredCategories = ["receipt", "revenue", "travel", "job_application"];
      const missingCategories = requiredCategories.filter((category) => !(category in categorySettings));

      if (missingCategories.length > 0) {
        return new Response(
          JSON.stringify({
            error: "Missing required categories",
            missing: missingCategories,
          }),
          {
            status: 400,
            headers: { ...corsHeaders, "Content-Type": "application/json" },
          }
        );
      }

      // Update settings
      const { error } = await supabase.rpc("update_user_category_settings", {
        p_user_id: user.id,
        p_category_settings: categorySettings,
      });

      if (error) {
        console.error("Error updating user settings:", error);
        return new Response(JSON.stringify({ error: "Failed to update settings" }), {
          status: 500,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }

      console.log("✅ User settings updated:", categorySettings);
      return new Response(
        JSON.stringify({
          success: true,
          message: "Settings updated successfully",
          settings: categorySettings,
        }),
        {
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    } else {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
  } catch (error) {
    console.error("Settings API error:", error);
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
