# Actioneer

> Your personal email autopilot that transforms incoming emails into actionable insights

_Stop drowning in receipts, travel bookings, and job applications._ Actioneer turns every email into instant, smart actions—automatically, with just a simple one-time activation.

[IMAGE_HERE: Hero image showing email transformation into organized dashboard]

## What is Actioneer?

Actioneer is an intelligent email processing platform that automatically monitors your Gmail inbox, extracts meaningful data from incoming emails, and organizes everything in a beautiful dashboard. Think of it as having a super-smart assistant working 24/7 in your inbox, turning email chaos into organized clarity.

Whether it's expense tracking from receipts, travel planning from booking confirmations, or job application management, Actioneer handles it all seamlessly in the background.

## Key Benefits

- **Minimal Setup Required**: Install the Gmail add-on once, activate it, and start immediately—no complex configuration or technical headaches
- **Real-time Processing**: Emails are processed the moment they arrive in your inbox
- **Privacy-First**: Your email data is processed securely with enterprise-grade encryption
- **Universal Compatibility**: Works with any email, from any sender, in any format
- **Intelligent Classification**: Advanced AI accurately categorizes and extracts data from diverse email types
- **Actionable Insights**: Transform raw email data into meaningful, organized information

## How It Works

Actioneer operates on a simple three-step process that requires zero intervention from you:

### 1. Sign In & Activate

Visit [https://actioneer.online/dashboard](https://actioneer.online/dashboard) and sign in with your Google account to see your dashboard. To enable automatic email processing, install the Gmail add-on and open it once in any email—this activates the intelligent agent that monitors your incoming emails.

### 2. Agent Takes Over

Like having a super-smart assistant working 24/7, the agent automatically parses receipts, travel bookings, and job applications in every incoming email, then organizes everything in your personal dashboard.

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

### ✈️ Travel & Booking

Imagine when you receive an email about "75% off hotels in NYC this weekend" or "Flash sale: flights to Tokyo starting at $299," and instead of letting these deals get buried in your inbox, Actioneer automatically captures and organizes them into your travel dashboard—no manual sorting, no forgotten deals, no effort required. Now you can easily browse all the amazing travel deals you've received, compare destinations, and never miss out on that perfect vacation opportunity again, all while the heavy lifting happens completely behind the scenes.

**What it handles:**

- Flight confirmations and boarding passes
- Hotel reservations and accommodation bookings
- Travel attraction and tour bookings
- Transportation and car rental confirmations
- Travel-related receipts and itineraries

**What you get:**

- Centralized travel email dashboard with date organization
- Smart destination extraction and formatting
- Travel recommendation engine powered by real-time data
- Hotel and attraction comparisons with pricing
- Trip planning assistance with AI-powered suggestions
- Calendar integration for travel dates

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
- **Apps Script** add-on for enhanced Gmail interface integration
- **OAuth 2.0** with refresh token management for secure authentication

### Key Features

- **Real-time Processing**: Gmail webhooks trigger immediate email classification
- **Intelligent Classification**: Multi-pattern AI system with fallback mechanisms
- **Secure Authentication**: Custom API key system with user-specific access control
- **Scalable Architecture**: Edge functions for global performance and low latency
- **Data Privacy**: End-to-end encryption with minimal data retention

## Gmail Add-on Integration

The Gmail add-on is essential for enabling automatic email processing. Once installed and activated, it provides both core functionality and enhanced features:

### Core Functionality

- **Automatic Email Processing**: Enables real-time classification and data extraction
- **User Authentication**: Creates your secure API key for system access
- **Gmail Watch Setup**: Activates push notifications for instant processing

### Enhanced Features

- **Expense Details**: View extracted receipt information directly in Gmail
- **Travel Insights**: Get hotel comparisons and recommendations within booking emails
- **Job Tracking**: Update application status without leaving your inbox
- **Quick Dashboard Access**: One-click navigation to relevant dashboard sections

### Installation

The Gmail add-on is available on the Google Workspace Marketplace. Simply search for "Actioneer" and install with one click. After installation, open any email and click the Actioneer icon in your Gmail sidebar to activate automatic email processing.

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
3. **Activate**: Install the Gmail add-on and open it once in any email
4. **Watch the Magic**: Your emails start getting processed automatically

No credit card required. Simple one-time activation. Then instant email intelligence.

## Privacy & Security

Your privacy is our top priority. Actioneer processes your emails with:

- **End-to-end Encryption**: All data transmission is encrypted in transit
- **Minimal Data Retention**: Only essential information is stored
- **User-controlled Access**: You maintain full control over your data
- **SOC 2 Compliance**: Enterprise-grade security standards
- **GDPR Compliance**: Full compliance with international privacy regulations

### Gmail Permissions Required

For complete transparency, here are the specific Gmail permissions Actioneer requests:

- **Read emails** (`gmail.readonly`): To analyze incoming emails for receipts, travel bookings, and job applications
- **Add-on execution** (`gmail.addons.execute`): To display smart actions within Gmail interface
- **User email address** (`userinfo.email`): To link your processed data to your account
- **External requests** (`script.external_request`): To communicate with our secure processing servers

We only access emails relevant to supported categories and never read personal conversations, drafts, or sensitive content.

### Zero Tracking Promise

We don't track anything. No analytics, no pageviews, no behavioral data collection. Your privacy is paramount - we only process what's necessary to provide the email intelligence you signed up for.

## Support & Community

Have questions or need help? We're here to support you:

- **Documentation**: Comprehensive guides at [docs.actioneer.online](https://docs.actioneer.online)
- **Email Support**: Reach us at support@actioneer.online
- **Community**: Join our Discord community for tips and discussions

---

**Actioneer** - Making your emails work for you, not the other way around.

_Built with ❤️ by Riva for productivity enthusiasts who believe email should be intelligent._
