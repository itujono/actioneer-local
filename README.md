# Actioneer

> Your personal email autopilot that transforms incoming emails into actionable insights

_Stop drowning in receipts, travel deals, and job applications._ Actioneer turns every email into instant, smart actions—automatically, with just a simple one-time activation.

[IMAGE_HERE: Hero image showing email transformation into organized dashboard]

## What is Actioneer?

Actioneer is an intelligent email processing platform that automatically monitors your Gmail inbox, extracts meaningful data from incoming emails, and organizes everything in a beautiful dashboard. Think of it as having a super-smart assistant working 24/7 in your inbox, turning email chaos into organized clarity.

Whether it's expense tracking from receipts, travel planning from promotional emails, or job application management, Actioneer handles it all seamlessly in the background.

## Key Benefits

- **Minimal Setup Required**: Connect your Gmail account with one click and start immediately—no complex configuration or technical headaches
- **Real-time Processing**: Emails are processed the moment they arrive in your inbox
- **Privacy-First**: Your email data is processed securely with enterprise-grade encryption
- **Universal Compatibility**: Works with any email, from any sender, in any format
- **Intelligent Classification**: Advanced AI accurately categorizes and extracts data from diverse email types
- **Actionable Insights**: Transform raw email data into meaningful, organized information

## How It Works

Actioneer operates on a simple three-step process that requires zero intervention from you:

### 1. Sign In & Activate

Visit [https://actioneer.online/dashboard](https://actioneer.online/dashboard) and sign in with your Google account to see your dashboard. To enable automatic email processing, connect your Gmail account through the web dashboard—this activates the intelligent agent that monitors your incoming emails.

### 2. Agent Takes Over

Like having a super-smart assistant working 24/7, the agent automatically parses receipts, travel promotional emails, and job applications in every incoming email, then organizes everything in your personal dashboard.

### 3. Enjoy the Results

Your dashboard fills up with perfectly structured, actionable data. Expense tracking, travel comparisons, job application status—all updated automatically without you lifting a finger.

[IMAGE_HERE: Flow diagram showing email → AI processing → organized dashboard]

## Supported Categories

Actioneer currently excels at processing three major email categories, with intelligent extraction and organization for each:

### 💰 Finance & Expenses

Imagine when you receive a receipt from your favorite coffee shop, and within seconds, it's automatically categorized as "Food & Dining," added to your monthly expense tracker, and factored into your spending analytics—all without you touching a single button. Or picture getting a refund notification and instantly seeing it reflected in your dashboard with full context about the original purchase. Every financial email that lands in your inbox gets the full treatment automatically, while you focus on what matters most.

**What it handles:**

- Purchase receipts and invoices
- Subscription billing notifications
- Refunds and reimbursements
- Revenue and income notifications
- Business payment confirmations

**What you get:**

- Automatic expense categorization and tracking
- Revenue vs. expense analytics with visual charts
- Detailed transaction history with date grouping
- Merchant and vendor organization
- Real-time financial insights and spending patterns
- Currency breakdown and multi-currency support

[IMAGE_HERE: Finance dashboard showing expense tracking and analytics]

### ✈️ Travel & Promotional Emails

Imagine when you receive an email about "75% off hotels in NYC this weekend" or "Flash sale: flights to Tokyo starting at $299," and instead of letting these deals get buried in your inbox, Actioneer automatically captures and organizes them into your travel dashboard—no manual sorting, no forgotten deals, no effort required. Now you can easily browse all the amazing travel deals you've received, compare destinations, and never miss out on that perfect vacation opportunity again, all while the heavy lifting happens completely behind the scenes.

**What it handles:**

- Travel promotional emails and deals
- Destination-specific travel offers
- Flight and hotel sale notifications
- Travel inspiration and deal alerts
- Tourism board promotional content

**What you get:**

- Centralized travel promotional email dashboard with date organization
- Smart destination extraction and formatting
- Travel recommendation engine powered by real-time data
- Hotel and attraction comparisons with pricing insights
- Trip planning assistance with AI-powered destination suggestions
- Quick access to travel deals and promotional offers

[IMAGE_HERE: Travel dashboard showing trip organization and recommendations]

### 💼 Job Applications & Career

Imagine when you're juggling applications for your dream job at multiple companies, and every application confirmation, interview invitation, and status update is automatically organized into a comprehensive tracking system—without you having to manually update spreadsheets or remember to log details. No more wondering "Did I follow up with that startup?" or "When was my Google interview again?"—everything is perfectly organized and tracked for you while you sleep, eat, and live your life.

**What it handles:**

- Job application confirmations
- Interview scheduling emails
- Application status updates
- Offer letters and rejections
- Career-related correspondence

**What you get:**

- Complete application tracking system with status management
- Company and position organization
- Interview scheduling and follow-up reminders
- Application timeline and progress tracking
- Success rate analytics and insights
- Customizable fields for personal notes and rankings

[IMAGE_HERE: Jobs dashboard showing application tracking and status updates]

## Technical Architecture

Actioneer is built on a modern, scalable architecture designed for performance and reliability:

### Frontend Stack

- **React 18** with TypeScript for type-safe component development
- **TanStack Router** for modern, type-safe routing
- **TanStack Query** for efficient data fetching and caching
- **Tailwind CSS** for utility-first styling and responsive design
- **Shadcn UI** components for consistent, accessible interface elements
- **Lucide React** for beautiful, consistent iconography

### Backend Infrastructure

- **Supabase** as the primary backend-as-a-service platform
- **PostgreSQL** database with Row Level Security (RLS)
- **Supabase Edge Functions** for serverless API endpoints
- **Deno runtime** for modern JavaScript/TypeScript execution
- **OpenAI GPT-4** for intelligent email classification and data extraction

### Email Processing Pipeline

- **Gmail API** integration for real-time email monitoring
- **Gmail Push Notifications** for instant email processing
- **Gmail OAuth** integration for secure email access
- **OAuth 2.0** with refresh token management for secure authentication

### Key Features

- **Real-time Processing**: Gmail webhooks trigger immediate email classification
- **Intelligent Classification**: Multi-pattern AI system with fallback mechanisms
- **Secure Authentication**: Custom API key system with user-specific access control
- **Scalable Architecture**: Edge functions for global performance and low latency
- **Data Privacy**: End-to-end encryption with minimal data retention

## Gmail Integration

Gmail OAuth integration is essential for enabling automatic email processing. Once connected, it provides secure access to your emails for processing:

### Core Functionality

- **Automatic Email Processing**: Enables real-time classification and data extraction
- **User Authentication**: Creates your secure API key for system access
- **Gmail Watch Setup**: Activates push notifications for instant processing

### Enhanced Features

- **Expense Details**: View extracted receipt information in your dashboard
- **Travel Insights**: Get destination recommendations and travel insights from promotional emails
- **Job Tracking**: Update application status through your dashboard
- **Quick Dashboard Access**: One-click navigation to relevant dashboard sections

### Setup

Gmail integration is available directly through the web dashboard. Simply sign in and click "Enable Gmail Processing" to securely connect your account and activate automatic email processing.

## Pricing

Actioneer is **completely free** while in beta mode. You get full access to all features, unlimited email processing, and the entire suite of automation tools without paying a dime.

Future pricing will be designed with affordability in mind, ensuring that email automation remains accessible to everyone.

## Upcoming Features & Roadmap

Actioneer is just getting started. Here's what's on the horizon:

### 🔄 Multi-Account Support (Coming Soon)

Connect up to 2 Gmail accounts (personal + work) for a truly unified dashboard experience. Manage all your email insights from one centralized location.

### 📦 Expanded Categories

- **Medical Appointments**: Automatically track doctor visits, prescriptions, and health-related correspondence
- **Package Deliveries**: Monitor shipping confirmations, tracking updates, and delivery notifications
- **Subscription Management**: Track renewals, cancellations, and subscription lifecycle events
- **Event Tickets**: Organize concert tickets, sports events, and entertainment bookings
- **Financial Services**: Bank statements, investment updates, and financial service notifications

### 🔗 Platform Integrations

- **Calendar Sync**: Automatic event creation for appointments, travel, and deadlines
- **Accounting Software**: Direct export to QuickBooks, Xero, and other accounting platforms
- **Travel Planning**: Integration with popular travel booking and planning services
- **CRM Systems**: Automatic contact and opportunity creation for business emails

### 🎯 Advanced Analytics

- **Spending Insights**: Advanced budgeting tools with predictive analytics
- **Travel Optimization**: Route planning and cost optimization recommendations
- **Career Tracking**: Job market insights and application success analytics
- **Custom Dashboards**: Personalized views and reporting capabilities

### 📧 Email Client Expansion

- **Microsoft Outlook**: Full support for Outlook.com and Office 365 accounts
- **Apple Mail**: Native integration for macOS and iOS users
- **Other Providers**: Support for Yahoo Mail, ProtonMail, and other popular services

## Getting Started

Ready to transform your inbox? _The proof is in the pudding_—try Actioneer today:

1. **Visit**: [https://actioneer.online/dashboard](https://actioneer.online/dashboard)
2. **Sign In**: Use your Google account (takes 30 seconds)
3. **Activate**: Connect your Gmail account through the dashboard
4. **Watch the Magic**: Your emails start getting processed automatically

No credit card required. Simple one-time activation. Then instant email intelligence.

## Testing Actioneer

Want to see Actioneer in action immediately? Here are the best ways to test the system:

### 🧪 **Quick Test Methods**

**Option 1: Send Yourself Test Emails**
The fastest way to see Actioneer work is to send yourself sample emails from another account (or the same account):

- **Receipt Test**: Forward yourself an old receipt email, or compose a new email with subject like "Your Amazon order receipt - $29.99" with some purchase details
- **Travel Test**: Send an email with subject "Amazing travel deal - 50% off NYC hotels" or "Flash sale: Flights to Tokyo starting at $299"
- **Job Test**: Create an email like "Application received - Software Engineer at TechCorp" with application details

**Option 2: Wait for Natural Emails**
If you prefer to see real-world processing:

- **Make a Purchase**: Buy something online and watch the receipt get automatically categorized
- **Book Travel**: Reserve a hotel or flight and see it appear in your travel dashboard
- **Apply for Jobs**: Submit job applications and track responses automatically

### 📧 **Sample Test Email Templates**

While you can definitely create your own test emails, we've made it even easier by providing ready-to-use templates below that you can copy and paste into Gmail.

**Pro tip**: You'll also find convenient test email buttons on each category page within the app when you're getting started.

**Receipt Email:**

```
Subject: Your Amazon Order Confirmation #123-4567890-1234567
From: auto-confirm@amazon.com

Thank you for your Amazon order!

Order Details:
- Order #: 123-4567890-1234567
- Order Date: [Today's date]
- Total: $89.99

Items Ordered:
• Wireless Bluetooth Headphones - $79.99
• USB-C Cable (3ft) - $9.99
• Shipping: FREE

Your order will be delivered by [Date in 2 days].

Track your package: https://amazon.com/track

Thanks for shopping with Amazon!
The Amazon Team
```

**Travel Email:**

```
Subject: 🌴 Amazing Travel Deal: 60% Off Miami Beach Hotels This Weekend!
From: deals@traveldeals.com

Don't miss this incredible travel opportunity!

FLASH SALE: Miami Beach Getaway
🏖️ Up to 60% off luxury hotels
📅 Valid for travel: [Next week dates] - [Two weeks from now]
⏰ Book by: [Three days from now] (Limited time!)

Featured Destinations:
• South Beach - Starting at $129/night (was $320)
• Downtown Miami - Starting at $89/night (was $220)
• Coral Gables - Starting at $159/night (was $380)

What's Included:
- Oceanview rooms with balcony
- Complimentary breakfast
- Pool and beach access
- Free WiFi

✈️ BONUS: Book now and get 25% off flights to Miami!
Flight deals from major cities starting at $199 roundtrip.

Ready for some sun and sand? This deal won't last long!

Book now: https://traveldeals.com/miami-flash-sale
Use code: MIAMI60

Happy travels!
The TravelDeals Team
deals@traveldeals.com
```

**Job Application Email:**

```
Subject: Application Received: Senior Software Engineer - TechCorp
From: careers@techcorp.com

Dear Candidate,

Thank you for applying to the Senior Software Engineer position at TechCorp!

Application Details:
• Position: Senior Software Engineer
• Department: Engineering
• Location: San Francisco, CA / Remote
• Application ID: TC-2024-ENG-001
• Submitted: [Today's date]

Next Steps:
Our recruiting team will review your application and reach out within 5-7 business days if your background aligns with our current needs.

In the meantime, feel free to explore our engineering blog at techcorp.com/blog to learn more about our technical culture and recent projects.

We appreciate your interest in joining our team!

Best regards,
Sarah Johnson
Senior Talent Acquisition Manager
TechCorp
careers@techcorp.com
```

**Revenue/Payment Email:**

```
Subject: Freelance Payment Deposited - Project Completed Successfully
From: freelancer-payments@startupx.com

💰 Payment Deposited to Your Account

Dear Freelancer,

Excellent news! Your freelance payment has been successfully deposited to your bank account.

💸 Money Added to Your Account:
• Project: Website Development for StartupX
• Amount Deposited: $2,500.00
• Deposited On: [Today's date]
• Transfer Method: Direct Bank Deposit
• Your Earnings ID: EARN-[6-digit number]
• Deposit Reference: FREELANCER-INCOME-[4-digit number]

🎯 Work Completed & Paid:
- Frontend development (React/TypeScript)
- Backend API integration
- Mobile responsive design
- 2 rounds of revisions

✅ $2,500.00 has been added to your account ending in ***1234
✅ Funds are now available in your bank account
✅ This confirms your project earnings have been processed
✅ Payment completed - no further action needed

Congratulations on completing another successful project! Your technical expertise and professionalism made this collaboration outstanding. We're excited to work with you on future projects.

Your earnings summary:
- Base project fee: $2,200.00
- Bonus for early delivery: $300.00
- Total deposited: $2,500.00

Best regards,
Alex Chen
Project Manager & Finance
StartupX Inc.
freelancer-payments@startupx.com

---
💡 This is your income confirmation. Keep this email for tax records.
```

### ⚡ **What to Expect**

- **Processing Time**: Emails are typically processed within 10-30 seconds of arrival
- **Dashboard Updates**: Check your dashboard categories (Finance, Travel, Jobs) for new entries
- **Real-time Magic**: Watch as raw emails transform into organized, actionable data

### 🎯 **Pro Testing Tips**

- **Use Realistic Content**: The more realistic your test emails, the better the AI extraction
- **Try Different Formats**: Test various email styles to see Actioneer's versatility
- **Check All Categories**: Send emails for finance, travel, and jobs to see the full system
- **Mobile Friendly**: Test on different devices to see the responsive dashboard

Ready to be amazed? Start with a simple test email and watch Actioneer turn email chaos into organized clarity!

## Privacy & Security

Your privacy is our top priority. Actioneer processes your emails with:

- **End-to-end Encryption**: All data transmission is encrypted in transit
- **Minimal Data Retention**: Only essential information is stored
- **User-controlled Access**: You maintain full control over your data
- **SOC 2 Compliance**: Enterprise-grade security standards
- **GDPR Compliance**: Full compliance with international privacy regulations

### Gmail Permissions Required

For complete transparency, here are the specific Gmail permissions Actioneer requests:

- **Read emails** (`gmail.readonly`): To analyze incoming emails for receipts, travel promotional emails, and job applications
- **OAuth authentication**: To securely access your Gmail account through the web interface
- **Email address** (`email`): To link your processed data to your account and enable authentication
- **Basic profile** (`profile`): To display your name and profile picture in the dashboard

We only access emails relevant to supported categories and never read personal conversations, drafts, or sensitive content.

### Zero Tracking Promise

We don't track anything. No analytics, no pageviews, no behavioral data collection. Your privacy is paramount - we only process what's necessary to provide the email intelligence you signed up for.

## Support & Community

As we're just getting started on this exciting journey, your feedback is worth its weight in gold! We're constantly improving Actioneer and your insights help us build exactly what you need. Whether you've spotted a bug, have a brilliant feature idea, or just want to share your experience, we'd love to hear from you.

**Share Your Thoughts**: Visit our dedicated [feedback page](/feedback) to report issues, suggest improvements, or tell us what's working well. Every piece of feedback helps us make Actioneer better for everyone.

Have questions or need help? We're here to support you:

- **Documentation**: Comprehensive guides at [docs.actioneer.online](https://docs.actioneer.online)
- **Email Support**: Reach us at support@actioneer.online
- **Community**: Join our Discord community for tips and discussions

---

**Actioneer** - Making your emails work for you, not the other way around.

_Built with ❤️ by Riva for productivity enthusiasts who believe email should be intelligent._
