import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { cors } from 'hono/cors';
import { secureHeaders } from 'hono/secure-headers';
import { createClient } from '@supabase/supabase-js';
import { OpenAI } from 'openai';
import { validateUserApiKey } from './middleware/auth.js';
import authRoutes from './routes/auth.js';

// Initialize Supabase client - in production use environment variables
const supabaseUrl = process.env.SUPABASE_URL || '';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabase = createClient(supabaseUrl, supabaseServiceKey);

const AI_MODEL = "gpt-4o-mini"

// Initialize OpenAI - in production use environment variables
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY || '',
});

// Create the Hono app
const app = new Hono();

// Middleware
app.use('*', cors({
  origin: '*',
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowHeaders: ['Content-Type', 'Authorization'],
  maxAge: 86400,
}));

app.use('*', secureHeaders());

// Health check endpoint (no authentication required) - MUST be before auth middleware
app.get('/api/health', async (c) => {
  return c.json({ 
    status: 'healthy', 
    timestamp: new Date().toISOString(),
    version: '1.0.0'
  });
});

// Mount auth routes (these handle their own authentication)
app.route('/api/auth', authRoutes);

// User API key authentication middleware for protected routes
app.use('/api/*', validateUserApiKey);

// Email classification endpoint
app.post('/api/classify-email', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  // Extract email data
  const { messageId, subject, from, body: emailBody, date } = body;
  
  if (!messageId || !subject || !from || !emailBody) {
    return c.json({ error: 'Missing required email data' }, 400);
  }
  
  try {
    // Use OpenAI to classify the email
    const classification = await classifyEmailWithOpenAI(subject, from, emailBody);
    
    // Store the email and classification in the database
    await storeEmailClassification(user.id, messageId, subject, from, date, classification.type);
    
    // Return the classification and available actions
    return c.json(classification);
  } catch (error) {
    console.error('Classification error:', error);
    return c.json({ error: 'Failed to classify email' }, 500);
  }
});

// Travel comparison endpoint
app.post('/api/travel/compare', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const { emailId, messageId, emailBody, subject, from } = body;
  
  if (!emailId || !messageId || !emailBody) {
    return c.json({ error: 'Missing required data' }, 400);
  }
  
  try {
    // Extract travel data using OpenAI
    const travelData = await extractTravelDataWithOpenAI(subject, from, emailBody);
    
    if (!travelData || !travelData.type) {
      return c.json({ error: 'Could not extract travel information from email' }, 400);
    }

    // Get price comparisons based on travel type
    let comparisonData;
    
    if (travelData.type === 'flight') {
      comparisonData = await getFlightComparisons(travelData);
    } else if (travelData.type === 'hotel') {
      comparisonData = await getHotelComparisons(travelData);
    } else if (travelData.type === 'attraction') {
      comparisonData = await getAttractionComparisons(travelData);
    } else {
      // Generic travel comparison
      comparisonData = await getGenericTravelComparisons(travelData);
    }

    // Store travel data in database
    await storeTravelData(user.id, emailId, travelData, comparisonData);

    return c.json({
      success: true,
      travelData,
      comparisons: comparisonData,
      message: 'Travel comparison completed successfully'
    });
  } catch (error) {
    console.error('Travel comparison error:', error);
    return c.json({ error: 'Failed to process travel comparison' }, 500);
  }
});

// Receipt parsing endpoint
app.post('/api/parse-receipt', async (c) => {
  const user = c.get('user');
  const body = await c.req.json();
  
  const { emailId, messageId, emailBody } = body;
  
  if (!emailId || !messageId || !emailBody) {
    return c.json({ error: 'Missing required data' }, 400);
  }
  
  try {
    // Parse receipt using OpenAI
    const receiptData = await parseReceiptWithOpenAI(emailBody);
    
    // Store receipt data in database
    await storeReceiptData(user.id, emailId, receiptData);
    
    return c.json(receiptData);
  } catch (error) {
    console.error('Receipt parsing error:', error);
    return c.json({ error: 'Failed to parse receipt' }, 500);
  }
});

// Get user receipts endpoint
app.get('/api/receipts', async (c) => {
  const user = c.get('user');
  
  try {
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .order('date', { ascending: false });
    
    if (error) throw error;
    
    return c.json(data);
  } catch (error) {
    console.error('Error fetching receipts:', error);
    return c.json({ error: 'Failed to fetch receipts' }, 500);
  }
});

// Get recent expenses endpoint
app.get('/api/expenses/recent', async (c) => {
  const user = c.get('user');
  
  try {
    // Get receipts from the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    
    const { data, error } = await supabase
      .from('receipts')
      .select('*')
      .eq('user_id', user.id)
      .gte('date', thirtyDaysAgo.toISOString())
      .order('date', { ascending: false })
      .limit(5);
    
    if (error) throw error;
    
    return c.json({ expenses: data });
  } catch (error) {
    console.error('Error fetching recent expenses:', error);
    return c.json({ error: 'Failed to fetch recent expenses' }, 500);
  }
});

// Get user travel info endpoint
app.get('/api/travel', async (c) => {
  const user = c.get('user');
  
  try {
    const { data, error } = await supabase
      .from('travel')
      .select('*')
      .eq('user_id', user.id)
      .order('start_date', { ascending: false });
    
    if (error) throw error;
    
    return c.json(data);
  } catch (error) {
    console.error('Error fetching travel data:', error);
    return c.json({ error: 'Failed to fetch travel data' }, 500);
  }
});

// Get user job applications endpoint
app.get('/api/job-applications', async (c) => {
  const user = c.get('user');
  
  try {
    const { data, error } = await supabase
      .from('job_applications')
      .select('*')
      .eq('user_id', user.id)
      .order('applied_date', { ascending: false });
    
    if (error) throw error;
    
    return c.json(data);
  } catch (error) {
    console.error('Error fetching job applications:', error);
    return c.json({ error: 'Failed to fetch job applications' }, 500);
  }
});

// Helper function to classify email with OpenAI
async function classifyEmailWithOpenAI(subject, from, emailBody) {
  const prompt = `
    Analyze this email and classify it into one of these categories:
    - receipt (for purchase receipts or invoices)
    - travel (for flight, hotel, or travel-related emails)
    - job_application (for job-related emails)
    - other (for emails that don't fit the above categories)
    
    Also identify any relevant actions that could be taken based on the email content.
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 1000)} // Limit body to first 1000 chars
    
    Respond in JSON format with: { "type": "category", "confidence": 0-1, "actions": [] }
  `;
  
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
    });
    
    const response = completion.choices[0].message.content;
    const classification = JSON.parse(response);
    
    // Enrich with action handlers based on type
    classification.actions = getActionsByType(classification.type);
    
    return classification;
  } catch (error) {
    console.error('OpenAI classification error:', error);
    throw new Error('Failed to classify email with AI');
  }
}

// Helper function to parse receipt with OpenAI
async function parseReceiptWithOpenAI(emailBody) {
  const prompt = `
    Extract the following information from this receipt email:
    - Merchant/Company name
    - Total amount
    - Currency
    - Date of purchase
    - Category (e.g., food, travel, entertainment)
    - Individual items if present (with prices)
    
    Email Body: ${emailBody.substring(0, 2000)} // Limit body to first 2000 chars
    
    Respond in JSON format with: 
    { 
      "merchant": "", 
      "amount": 0, 
      "currency": "", 
      "date": "YYYY-MM-DD", 
      "category": "", 
      "items": [{"name": "", "price": 0}] 
    }
  `;
  
  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: "user", content: prompt }],
    });
    
    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('OpenAI receipt parsing error:', error);
    throw new Error('Failed to parse receipt with AI');
  }
}

// Helper function to extract travel data with OpenAI
async function extractTravelDataWithOpenAI(subject, from, emailBody) {
  const prompt = `
    Extract travel information from this email and classify the type of travel booking:
    
    Email Subject: ${subject}
    From: ${from}
    Email Body: ${emailBody.substring(0, 2000)}
    
    Determine:
    1. Travel type: "flight", "hotel", "attraction", or "general"
    2. Destination(s)
    3. Dates (departure, return, check-in, check-out)
    4. Number of travelers/guests
    5. Origin (for flights)
    6. Any specific preferences mentioned
    
    Respond in JSON format:
    {
      "type": "flight|hotel|attraction|general",
      "origin": "city/airport code",
      "destination": "city/airport code or hotel name",
      "departureDate": "YYYY-MM-DD",
      "returnDate": "YYYY-MM-DD",
      "checkInDate": "YYYY-MM-DD", 
      "checkOutDate": "YYYY-MM-DD",
      "travelers": 1,
      "guests": 1,
      "preferences": "any specific requirements",
      "bookingReference": "confirmation number if found"
    }
  `;

  try {
    const completion = await openai.chat.completions.create({
      model: AI_MODEL,
      messages: [{ role: 'user', content: prompt }],
    });

    const response = completion.choices[0].message.content;
    return JSON.parse(response);
  } catch (error) {
    console.error('OpenAI travel extraction error:', error);
    // Return mock data if AI fails
    return {
      type: 'general',
      destination: 'Unknown',
      travelers: 1,
      preferences: 'Extracted from email'
    };
  }
}

// Travel comparison functions
async function getFlightComparisons(travelData) {
  // Return mock flight comparisons since we don't have Amadeus API configured
  return {
    type: 'flight',
    comparisons: [
      {
        provider: 'Expedia',
        airline: 'Delta',
        price: '299',
        currency: 'USD',
        duration: '5h 30m',
        stops: 0,
        bookingUrl: `https://www.expedia.com/Flights-Search?trip=oneway&leg1=from:${travelData.origin || 'NYC'},to:${travelData.destination || 'LAX'},departure:${travelData.departureDate || '2024-07-01'}TANYT&passengers=adults:${travelData.travelers || 1}`,
        details: {
          departure: { at: '08:00', iataCode: travelData.origin || 'NYC' },
          arrival: { at: '13:30', iataCode: travelData.destination || 'LAX' },
        }
      },
      {
        provider: 'Kayak',
        airline: 'American',
        price: '325',
        currency: 'USD',
        duration: '6h 15m',
        stops: 1,
        bookingUrl: `https://www.kayak.com/flights/${travelData.origin || 'NYC'}-${travelData.destination || 'LAX'}/${travelData.departureDate || '2024-07-01'}`,
        details: {
          departure: { at: '10:15', iataCode: travelData.origin || 'NYC' },
          arrival: { at: '16:30', iataCode: travelData.destination || 'LAX' },
        }
      },
      {
        provider: 'Google Flights',
        airline: 'United',
        price: '289',
        currency: 'USD',
        duration: '5h 45m',
        stops: 0,
        bookingUrl: `https://www.google.com/travel/flights/search?tfs=CBwQAhooEgoyMDI0LTA3LTAxagcIARIDTllDcgcIARIDTEFYGgEBIAFAAUgBmAEB`,
        details: {
          departure: { at: '14:20', iataCode: travelData.origin || 'NYC' },
          arrival: { at: '20:05', iataCode: travelData.destination || 'LAX' },
        }
      },
    ],
    searchCriteria: travelData,
  };
}

async function getHotelComparisons(travelData) {
  return {
    type: 'hotel',
    comparisons: [
      {
        provider: 'Booking.com',
        hotelName: 'Grand Plaza Hotel',
        price: '150',
        currency: 'USD',
        rating: '4.5',
        location: travelData.destination || 'Downtown',
        bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(travelData.destination || 'New York')}&checkin=${travelData.checkInDate || '2024-07-01'}&checkout=${travelData.checkOutDate || '2024-07-03'}`,
        details: {
          checkIn: travelData.checkInDate,
          checkOut: travelData.checkOutDate,
          roomType: 'Deluxe Room',
          amenities: ['WiFi', 'Pool', 'Gym'],
        }
      },
      {
        provider: 'Expedia',
        hotelName: 'City Center Inn',
        price: '120',
        currency: 'USD',
        rating: '4.0',
        location: travelData.destination || 'City Center',
        bookingUrl: `https://www.expedia.com/Hotels-Search?destination=${encodeURIComponent(travelData.destination || 'New York')}&startDate=${travelData.checkInDate || '2024-07-01'}&endDate=${travelData.checkOutDate || '2024-07-03'}`,
        details: {
          checkIn: travelData.checkInDate,
          checkOut: travelData.checkOutDate,
          roomType: 'Standard Room',
          amenities: ['WiFi', 'Breakfast'],
        }
      },
      {
        provider: 'Hotels.com',
        hotelName: 'Luxury Suites',
        price: '220',
        currency: 'USD',
        rating: '5.0',
        location: travelData.destination || 'Premium District',
        bookingUrl: `https://www.hotels.com/search.do?destination-id=${encodeURIComponent(travelData.destination || 'New York')}&q-check-in=${travelData.checkInDate || '2024-07-01'}&q-check-out=${travelData.checkOutDate || '2024-07-03'}`,
        details: {
          checkIn: travelData.checkInDate,
          checkOut: travelData.checkOutDate,
          roomType: 'Executive Suite',
          amenities: ['WiFi', 'Spa', 'Concierge', 'Pool'],
        }
      },
    ],
    searchCriteria: travelData,
  };
}

async function getAttractionComparisons(travelData) {
  return {
    type: 'attraction',
    comparisons: [
      {
        provider: 'Viator',
        name: 'City Museum',
        price: '25',
        currency: 'USD',
        rating: '4.3',
        category: 'Museum',
        bookingUrl: `https://www.viator.com/searchResults/all?text=${encodeURIComponent(travelData.destination || 'New York')}`,
        details: {
          description: 'Explore the rich history and culture of the city',
          duration: '2-3 hours',
          location: travelData.destination,
        }
      },
      {
        provider: 'GetYourGuide',
        name: 'Scenic City Tour',
        price: '45',
        currency: 'USD',
        rating: '4.7',
        category: 'Tour',
        bookingUrl: `https://www.getyourguide.com/s/?q=${encodeURIComponent(travelData.destination || 'New York')}`,
        details: {
          description: 'Guided tour of the city\'s top landmarks',
          duration: '4 hours',
          location: travelData.destination,
        }
      },
      {
        provider: 'TripAdvisor',
        name: 'Adventure Park',
        price: '35',
        currency: 'USD',
        rating: '4.5',
        category: 'Entertainment',
        bookingUrl: `https://www.tripadvisor.com/Search?q=${encodeURIComponent(travelData.destination || 'New York')}`,
        details: {
          description: 'Thrilling outdoor activities and adventures',
          duration: 'Full day',
          location: travelData.destination,
        }
      },
    ],
    searchCriteria: travelData,
  };
}

async function getGenericTravelComparisons(travelData) {
  // For general travel emails, provide a mix of suggestions
  return {
    type: 'general',
    comparisons: [
      {
        provider: 'Google Flights',
        type: 'flight',
        name: 'Flight Search',
        description: 'Search for flights to your destination',
        bookingUrl: `https://www.google.com/travel/flights?q=flights%20to%20${encodeURIComponent(travelData.destination || 'destination')}`,
      },
      {
        provider: 'Booking.com',
        type: 'hotel',
        name: 'Hotel Search',
        description: 'Find hotels in your destination',
        bookingUrl: `https://www.booking.com/searchresults.html?ss=${encodeURIComponent(travelData.destination || 'destination')}`,
      },
      {
        provider: 'TripAdvisor',
        type: 'attraction',
        name: 'Activities & Attractions',
        description: 'Discover things to do',
        bookingUrl: `https://www.tripadvisor.com/Attractions-g${encodeURIComponent(travelData.destination || 'destination')}`,
      },
    ],
    searchCriteria: travelData,
  };
}

// Helper function to get actions based on email type
function getActionsByType(type) {
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
          label: 'Compare Prices', 
          handler: 'openTravelComparison',
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

// Database helpers
async function storeEmailClassification(userId, messageId, subject, from, date, classification) {
  const { data, error } = await supabase
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
    throw error;
  }
  
  return data;
}

async function storeReceiptData(userId, emailId, receiptData) {
  const { data, error } = await supabase
    .from('receipts')
    .insert({
      user_id: userId,
      email_id: emailId,
      merchant: receiptData.merchant,
      amount: receiptData.amount,
      currency: receiptData.currency,
      date: receiptData.date,
      category: receiptData.category,
      items: receiptData.items
    });
  
  if (error) {
    console.error('Error storing receipt data:', error);
    throw error;
  }
  
  return data;
}

async function storeTravelData(userId, emailId, travelData, comparisonData) {
  try {
    const { error } = await supabase
      .from('travel')
      .insert({
        user_id: userId,
        email_id: emailId,
        type: travelData.type,
        destination: travelData.destination,
        start_date: travelData.departureDate || travelData.checkInDate,
        end_date: travelData.returnDate || travelData.checkOutDate,
        details: {
          ...travelData,
          comparisons: comparisonData,
        }
      });

    if (error) {
      console.error('Error storing travel data:', error);
      // Don't throw - this is not critical for the user experience
    }
  } catch (error) {
    console.error('Failed to store travel data:', error);
    // Don't throw - this is not critical for the user experience
  }
}

// Start the server
const port = process.env.PORT || 3000;
console.log(`Server is running on port ${port}`);

serve({
  fetch: app.fetch,
  port
});