import { createClient } from 'npm:@supabase/supabase-js@2';
import { OpenAI } from 'npm:openai@4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
};

// Initialize OpenAI
const openai = new OpenAI({
  apiKey: Deno.env.get('OPENAI_API_KEY') || '',
});

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

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Validate user API key
    const authHeader = req.headers.get('Authorization');
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return new Response(
        JSON.stringify({ error: 'Missing or invalid authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const apiKey = authHeader.split(' ')[1];
    
    // Validate API key format
    if (!apiKey.startsWith('ak_') || apiKey.length !== 67) {
      return new Response(
        JSON.stringify({ error: 'Invalid API key format' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Look up user by API key using service role (bypasses RLS)
    const { data: user, error: userError } = await supabase
      .from('users')
      .select('*')
      .eq('api_key', apiKey)
      .eq('is_active', true)
      .single();

    if (userError || !user) {
      console.error('User lookup error:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or inactive API key' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('✅ User authenticated:', user.email);

    // Parse request body
    const { messageId, subject, from, body: emailBody, date } = await req.json();

    if (!messageId || !subject || !from || !emailBody) {
      return new Response(
        JSON.stringify({ error: 'Missing required email data' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log('📧 Classifying email:', { subject, from });

    // Classify email with OpenAI
    const classification = await classifyEmailWithOpenAI(subject, from, emailBody);

    // Store email classification
    await storeEmailClassification(user.id, messageId, subject, from, date, classification.type);

    console.log('✅ Email classified as:', classification.type);

    return new Response(
      JSON.stringify(classification),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Classification error:', error);
    return new Response(
      JSON.stringify({ error: 'Failed to classify email', details: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});

async function classifyEmailWithOpenAI(subject: string, from: string, emailBody: string) {
  const prompt = `
    Analyze this email and classify it into one of these categories:
    - receipt (for purchase receipts or invoices)
    - travel (for flight, hotel, or travel-related emails)
    - job_application (for job-related emails)
    - other (for emails that don't fit the above categories)
    
    Also identify any relevant actions that could be taken based on the email content.
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 1000)}
    
    IMPORTANT: Respond with ONLY valid JSON, no markdown formatting or code blocks.
    
    Format: { "type": "category", "confidence": 0.95, "actions": [] }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.1, // Lower temperature for more consistent JSON output
    });

    let response = completion.choices[0].message.content;
    
    if (!response) {
      throw new Error('Empty response from OpenAI');
    }

    // Clean up the response - remove markdown code blocks if present
    response = response.trim();
    if (response.startsWith('```json')) {
      response = response.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (response.startsWith('```')) {
      response = response.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    console.log('🤖 OpenAI raw response:', response);

    let classification;
    try {
      classification = JSON.parse(response);
    } catch (parseError) {
      console.error('JSON parse error:', parseError);
      console.error('Raw response:', response);
      
      // Fallback classification
      classification = {
        type: 'other',
        confidence: 0.5,
        actions: []
      };
    }

    // Add action handlers based on type
    classification.actions = getActionsByType(classification.type);

    return classification;
  } catch (error) {
    console.error('OpenAI classification error:', error);
    
    // Return fallback classification
    return {
      type: 'other',
      confidence: 0.0,
      actions: [],
      error: 'AI classification failed'
    };
  }
}

function getActionsByType(type: string) {
  switch (type) {
    case 'receipt':
      return [
        { 
          type: 'simple', 
          label: 'Track Expense', 
          handler: 'handleTrackExpense',
          data: {} 
        },
        { 
          type: 'complex', 
          label: 'View Financial Dashboard', 
          handler: 'openFinancialDashboard',
          data: {} 
        }
      ];
    case 'travel':
      return [
        { 
          type: 'complex', 
          label: 'Compare Hotel Prices', 
          handler: 'openHotelComparison',
          data: {} 
        },
        { 
          type: 'simple', 
          label: 'Add to Calendar', 
          handler: 'handleAddToCalendar',
          data: {} 
        }
      ];
    case 'job_application':
      return [
        { 
          type: 'complex', 
          label: 'Track Application', 
          handler: 'openJobTracker',
          data: {} 
        }
      ];
    default:
      return [];
  }
}

async function storeEmailClassification(userId: string, messageId: string, subject: string, from: string, date: string, classification: string) {
  try {
    // Use service role to insert directly, bypassing RLS
    const { error } = await supabase
      .from('emails')
      .insert({
        user_id: userId,
        message_id: messageId,
        subject,
        from_email: from,
        date,
        classification
      });

    if (error) {
      console.error('Error storing email classification:', error);
      // Don't throw - this is not critical for the user experience
    } else {
      console.log('✅ Email classification stored');
    }
  } catch (error) {
    console.error('Failed to store email classification:', error);
    // Don't throw - this is not critical for the user experience
  }
}