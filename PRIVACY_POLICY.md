# Privacy Policy

**Effective Date:** June 27, 2025  
**Last Updated:** June 27, 2025

## Introduction

Welcome to Actioneer ("we," "our," or "us"). This Privacy Policy explains how we collect, use, protect, and share your information when you use our email intelligence platform and Gmail add-on (collectively, the "Service").

We believe that privacy isn't just a feature—it's a fundamental right. This policy is written in plain English because transparency should never be hidden behind legal jargon. When it comes to your data, we practice what we preach: minimal collection, maximum protection.

## Information We Collect

### Email Data

**What We Access:**

- Email content from specific categories only (receipts, travel bookings, job applications)
- Email metadata (sender, subject, date, message ID)
- Attachments related to supported categories (receipts, boarding passes, etc.)

**What We Don't Access:**

- Personal conversations or correspondence
- Draft emails
- Sent emails (unless they contain relevant category data)
- Emails outside our supported categories
- Email contents unrelated to finance, travel, or job applications

**How We Access It:**

- Through Gmail API with explicit user consent
- Via Gmail add-on integration when activated
- Real-time processing through Gmail push notifications
- OAuth 2.0 authentication with refresh token management

### Account Information

- **Google Account Details:** Email address, profile information
- **Authentication Data:** OAuth tokens, API keys, session information
- **Usage Data:** Dashboard interactions, feature usage patterns (aggregated only)

### Extracted Data

From processed emails, we extract and store:

- **Financial Data:** Transaction amounts, merchants, categories, dates
- **Travel Information:** Destinations, dates, booking references, accommodation details
- **Job Application Data:** Company names, positions, application status, interview dates

### Technical Data

- **Device Information:** Browser type, operating system, IP address
- **Performance Data:** Error logs, response times, system performance metrics
- **Security Data:** Authentication logs, access patterns for fraud prevention

## How We Use Your Information

### Primary Functions

1. **Email Classification:** AI-powered categorization of incoming emails
2. **Data Extraction:** Intelligent parsing of relevant information from emails
3. **Dashboard Population:** Organizing extracted data in your personal dashboard
4. **Insights Generation:** Creating analytics and recommendations based on your data

### Secondary Functions

1. **Service Improvement:** Analyzing usage patterns to enhance features
2. **Security Monitoring:** Detecting and preventing unauthorized access
3. **Technical Support:** Troubleshooting issues and providing customer assistance
4. **Legal Compliance:** Meeting regulatory requirements and legal obligations

### AI Processing

We use OpenAI GPT-4 for:

- Email content analysis and classification
- Data extraction from various email formats
- Travel recommendations and insights generation
- Financial categorization and analytics

**Important:** All AI processing is conducted with strict privacy controls. Your email content is processed only for the specific purpose of data extraction and is not used to train AI models or shared with third parties.

## Data Sharing and Third Parties

### Service Providers

We work with carefully selected third-party providers:

- **Supabase:** Database hosting and backend infrastructure
- **OpenAI:** AI-powered email classification and data extraction
- **Google:** Gmail API integration and authentication services
- **Vercel/Netlify:** Web hosting and content delivery

### Data Sharing Principles

- **No Sale of Data:** We never sell your personal information to anyone
- **Minimal Sharing:** Only essential data is shared with service providers
- **Contractual Protection:** All providers are bound by strict data protection agreements
- **Purpose Limitation:** Data is only used for providing our specific services

### Legal Requirements

We may disclose information when required by law, such as:

- Valid legal process (subpoenas, court orders)
- National security requirements
- Protection of rights, property, or safety

## Data Security

### Technical Safeguards

- **End-to-End Encryption:** All data transmission is encrypted in transit
- **Database Security:** PostgreSQL with Row Level Security (RLS)
- **Access Controls:** User-specific API keys and authentication
- **Infrastructure Security:** Enterprise-grade cloud hosting with SOC 2 compliance

### Operational Security

- **Minimal Access:** Only authorized personnel can access user data
- **Audit Logs:** All data access is logged and monitored
- **Regular Reviews:** Security practices are regularly audited and updated
- **Incident Response:** Comprehensive plan for potential security breaches

### Data Retention

- **Minimal Retention:** We keep only essential information
- **Automatic Deletion:** Unused data is automatically purged
- **User Control:** You can delete your data at any time
- **Backup Security:** All backups are encrypted and access-controlled

## Your Privacy Rights

### Access and Control

- **Data Export:** Download all your processed data in standard formats
- **Correction Rights:** Update or correct any inaccurate information
- **Deletion Rights:** Delete your account and all associated data
- **Processing Control:** Pause or resume email processing at any time

### Regional Rights

**GDPR (EU Users):**

- Right to access, rectify, erase, and port your data
- Right to restrict or object to processing
- Right to withdraw consent at any time
- Right to lodge complaints with supervisory authorities

**CCPA (California Users):**

- Right to know what personal information is collected
- Right to delete personal information
- Right to opt-out of sale (we don't sell data)
- Right to non-discrimination for exercising privacy rights

**Other Jurisdictions:**
We respect privacy rights regardless of location and apply the highest standards globally.

## Gmail Add-on and Permissions

### Required Permissions

For complete transparency, here are the specific Gmail permissions we request:

1. **`gmail.readonly`** - Read emails for analysis

   - **Purpose:** Analyze incoming emails for receipts, travel bookings, and job applications
   - **Scope:** Only emails relevant to supported categories

2. **`gmail.addons.execute`** - Add-on execution

   - **Purpose:** Display smart actions within Gmail interface
   - **Scope:** Gmail sidebar integration only

3. **`userinfo.email`** - User email address

   - **Purpose:** Link processed data to your account
   - **Scope:** Email address only, no additional profile data

4. **`script.external_request`** - External requests

   - **Purpose:** Communicate with our secure processing servers
   - **Scope:** Actioneer servers only

5. **`script.locale`** - Localization
   - **Purpose:** Display interface in appropriate language
   - **Scope:** Language preference only

### Permission Principles

- **Minimal Permissions:** We request only what's absolutely necessary
- **Purpose-Limited:** Each permission has a specific, documented purpose
- **User Control:** You can revoke permissions at any time
- **Transparency:** All permissions are clearly explained

## Cookies and Tracking

### Our Zero-Tracking Promise

We don't track you. Period. Here's what we **don't** collect:

- Analytics or pageview data
- Behavioral tracking information
- Marketing or advertising data
- Cross-site tracking cookies
- Third-party tracking pixels

### Essential Cookies Only

We use minimal, essential cookies for:

- **Authentication:** Keeping you logged in securely
- **Preferences:** Remembering your dashboard settings
- **Security:** Preventing fraud and unauthorized access

## International Data Transfers

### Data Locations

Your data may be processed in:

- **United States:** Primary hosting and AI processing
- **European Union:** Regional hosting for EU users
- **Other Regions:** As needed for service delivery

### Transfer Safeguards

- **Standard Contractual Clauses:** EU-approved data transfer mechanisms
- **Adequacy Decisions:** Transfers only to countries with adequate protection
- **Additional Safeguards:** Extra protections for sensitive data transfers

## Children's Privacy

Actioneer is not intended for users under 13 years old. We do not knowingly collect personal information from children under 13. If we discover that we have collected information from a child under 13, we will delete it immediately.

## Changes to This Policy

### Notification Process

- **Advance Notice:** 30 days notice for material changes
- **Email Notifications:** Direct notification to all users
- **Dashboard Notices:** Prominent notification in your dashboard
- **Version History:** All previous versions available for reference

### Your Options

When we update this policy:

- **Review Changes:** We'll clearly highlight what's changed
- **Continued Use:** Using the service after changes means acceptance
- **Opt-Out Option:** You can delete your account if you disagree

## Beta Program Considerations

During our beta phase:

- **Enhanced Monitoring:** We may collect additional technical data for improvement
- **Feedback Collection:** We may request feedback on features and functionality
- **Data Retention:** Beta data may be retained longer for service development
- **Same Protections:** All privacy protections remain in full effect

## Future Features and Privacy

### Upcoming Capabilities

As we expand Actioneer, we're committed to:

- **Privacy by Design:** Building privacy into every new feature
- **Minimal Data Expansion:** Only collecting what's necessary for new features
- **User Consent:** Explicit consent for any new data collection
- **Granular Controls:** Fine-grained privacy controls for all features

### Multi-Account Support

Our planned multi-account feature will:

- **Separate Data:** Keep data from different accounts completely separate
- **Individual Controls:** Separate privacy settings for each connected account
- **Unified Dashboard:** Display combined insights while maintaining data separation
- **Account-Specific Permissions:** Independent permission grants for each account

## Contact and Support

### Privacy Questions

For privacy-related questions or concerns:

- **Email:** privacy@actioneer.online
- **Response Time:** Within 48 hours
- **Escalation:** Direct access to privacy team

### Data Rights Requests

To exercise your privacy rights:

- **Email:** rights@actioneer.online
- **Request Form:** Available at actioneer.online/privacy-requests
- **Processing Time:** Within 30 days (as required by law)
- **Verification:** Secure identity verification process

### General Support

- **Documentation:** Comprehensive guides at docs.actioneer.online
- **Email Support:** support@actioneer.online
- **Community:** Discord community for tips and discussions

## Company Information

**Actioneer**  
Email: privacy@actioneer.online  
Website: https://actioneer.online

This Privacy Policy is governed by the laws of the United States and applicable international privacy regulations.

---

**Your Privacy, Our Priority**

At Actioneer, we believe that email intelligence shouldn't come at the cost of your privacy. We're committed to building trust through transparency, giving you control over your data, and protecting your information with the highest standards of security.

_Making your emails work for you, not the other way around—privately and securely._
