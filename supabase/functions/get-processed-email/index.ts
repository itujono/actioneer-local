import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-user-api-key",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
};

// Initialize Supabase with service role key
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    // Extract user API key from custom header
    const userApiKey = req.headers.get("x-user-api-key");
    if (!userApiKey) {
      return new Response(
        JSON.stringify({ error: "Missing user API key header" }),
        {
          status: 401,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    // Validate user API key
    const user = await getUserByApiKey(userApiKey);
    if (!user) {
      return new Response(JSON.stringify({ error: "Invalid API key" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Get messageId from query parameters
    const url = new URL(req.url);
    const messageId = url.searchParams.get("messageId");

    if (!messageId) {
      return new Response(
        JSON.stringify({ error: "Missing messageId parameter" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        }
      );
    }

    console.log(
      "🔍 Looking for processed email:",
      messageId,
      "for user:",
      user.email
    );

    // Check if email exists and get its classification
    const { data: emailData, error: emailError } = await supabase
      .from("emails")
      .select("*")
      .eq("message_id", messageId)
      .eq("user_id", user.id)
      .single();

    if (emailError || !emailData) {
      console.log("📭 Email not found in database");
      return new Response(JSON.stringify({ error: "Email not found" }), {
        status: 404,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    console.log("📧 Email found, classification:", emailData.classification);

    // Get processed data based on classification
    let processedData = {
      type: emailData.classification,
      messageId: messageId,
      processedAt: emailData.created_at,
    };

    switch (emailData.classification) {
      case "travel":
        const travelData = await getTravelData(user.id, messageId);
        if (travelData) {
          processedData.travelData = travelData.details?.travelData || {};
          processedData.comparisons = travelData.details?.comparisons || [];
        }
        break;

      case "receipt":
        const receiptData = await getReceiptData(user.id, messageId);
        if (receiptData) {
          processedData.receiptData = {
            merchant: receiptData.merchant,
            amount: receiptData.amount,
            currency: receiptData.currency,
            date: receiptData.date,
            category: receiptData.category,
            items: receiptData.items,
          };
        }
        break;

      case "revenue":
        const revenueData = await getRevenueData(user.id, messageId);
        if (revenueData) {
          processedData.revenueData = {
            source: revenueData.source,
            amount: revenueData.amount,
            currency: revenueData.currency,
            date: revenueData.date,
            category: revenueData.category,
            revenue_type: revenueData.revenue_type,
            description: revenueData.description,
          };
        } else {
          // If no revenue data found, this email should be reprocessed
          console.log("❌ No revenue data found, email should be reprocessed");
          return new Response(
            JSON.stringify({ error: "Revenue data not found" }),
            {
              status: 404,
              headers: { ...corsHeaders, "Content-Type": "application/json" },
            }
          );
        }
        break;

      case "job_application":
        const jobData = await getJobData(user.id, messageId);
        if (jobData) {
          processedData.jobData = {
            company: jobData.company,
            position: jobData.position,
            status: jobData.status,
            appliedDate: jobData.applied_date,
            details: jobData.details,
          };
        }
        break;
    }

    console.log(
      "✅ Returning processed data:",
      JSON.stringify(processedData, null, 2)
    );

    return new Response(JSON.stringify(processedData), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error) {
    console.error("Error getting processed email:", error);
    return new Response(
      JSON.stringify({
        error: "Failed to get processed email",
        details: error.message,
      }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});

async function getUserByApiKey(apiKey: string) {
  try {
    if (!apiKey.startsWith("ak_") || apiKey.length !== 67) {
      return null;
    }

    const { data: user, error } = await supabase
      .from("users")
      .select("*")
      .eq("api_key", apiKey)
      .eq("is_active", true)
      .single();

    if (error || !user) {
      return null;
    }

    return user;
  } catch (error) {
    console.error("Error getting user by API key:", error);
    return null;
  }
}

async function getTravelData(userId: string, emailId: string) {
  try {
    const { data, error } = await supabase
      .from("travel")
      .select("*")
      .eq("user_id", userId)
      .eq("email_id", emailId)
      .single();

    if (error) {
      console.log("No travel data found:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting travel data:", error);
    return null;
  }
}

async function getReceiptData(userId: string, emailId: string) {
  try {
    const { data, error } = await supabase
      .from("receipts")
      .select("*")
      .eq("user_id", userId)
      .eq("email_id", emailId)
      .single();

    if (error) {
      console.log("No receipt data found:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting receipt data:", error);
    return null;
  }
}

async function getRevenueData(userId: string, emailId: string) {
  try {
    const { data, error } = await supabase
      .from("revenue")
      .select("*")
      .eq("user_id", userId)
      .eq("email_id", emailId)
      .single();

    if (error) {
      console.log("No revenue data found:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting revenue data:", error);
    return null;
  }
}

async function getJobData(userId: string, emailId: string) {
  try {
    const { data, error } = await supabase
      .from("job_applications")
      .select("*")
      .eq("user_id", userId)
      .eq("email_id", emailId)
      .single();

    if (error) {
      console.log("No job data found:", error.message);
      return null;
    }

    return data;
  } catch (error) {
    console.error("Error getting job data:", error);
    return null;
  }
}
