// AI prompts for email classification
import type { EmailData } from "./types.ts";

export function buildClassificationPrompt(emailData: EmailData): string {
  return `
    Analyze this email and classify it into one of these categories:
    - receipt (for purchase receipts or invoices)
    - revenue (for incoming money, payments received, refunds, crypto withdrawals to bank)
    - travel (for flight, hotel, or travel-related emails)
    - job_application (ONLY for emails directly related to actual job applications you submitted)
    - other (for emails that don't fit the above categories)
    
    ⚠️ CRITICAL: REVENUE vs PROMOTIONAL OFFERS - This is the most important distinction!
    
    REVENUE (money ALREADY received/deposited):
    - Payment received confirmations (PayPal, Stripe, bank transfers) - money already arrived
    - Refunds from merchants or service providers - money already returned
    - Cryptocurrency withdrawal confirmations to bank accounts - money already transferred
    - Business income (invoices paid, freelance payments) - client already paid you
    - Investment income (dividends, interest, trading profits) - already credited
    - Government payments (tax refunds, benefits) - funds already deposited
    - Digital platform income (sales, marketplace earnings) - payment already received
    - Insurance payouts and settlements - claim already paid
    
    PROMOTIONAL OFFERS (classify as "other" - these are marketing, not actual money):
    - "Get bonus worth $X" - offering potential money
    - "Earn rewards up to $X" - promising potential earnings  
    - "Claim your prize" - invitation to claim, not actual receipt
    - "Dapatkan hadiah" (Indonesian: "Get reward") - offering reward
    - "Bonus senilai" (Indonesian: "Bonus worth") - promotional offer
    - "First time bonus" - promotional incentive
    - "Sign up and get" - registration incentive
    - "Trade and earn" - conditional earning opportunity
    - "Swap crypto and receive" - activity-based reward offer
    - Any email with call-to-action buttons like "Claim Now", "Get Started", "Join Now"
    - Any email with terms like "minimum deposit", "requirements", "valid until"
    
    KEY DETECTION: Is this about money ALREADY received vs money OFFERED conditionally?
    
    STRICT CRITERIA for job_application classification:
    The email MUST be:
    1. From a company/recruiter regarding a SPECIFIC job you applied to
    2. About YOUR job application status, interview, offer, or rejection
    3. NOT general career advice, job alerts, or promotional emails
    
    Job application emails include:
    - Application confirmations ("We received your application for [specific position]")
    - Interview invitations/scheduling for positions you applied to
    - Job rejection emails for positions you applied to
    - Job offer emails for positions you applied to
    - Status updates on your specific applications
    - Thank you emails from companies after you applied
    
    DO NOT classify as job_application:
    - Job alerts from job boards (Indeed, LinkedIn, etc.)
    - General career newsletters or tips
    - Promotional emails from recruiting companies
    - LinkedIn connection requests or messages
    - General "we're hiring" announcements
    - Emails about positions you didn't apply to
    - Career fair invitations
    - University career services emails
    - Emails asking if you're interested in positions (unless you already applied)
    - Company newsletters mentioning job openings
    - Automated job recommendations
    
    Email Subject: ${emailData.subject}
    From: ${emailData.from}
    Email Body: ${emailData.body.substring(0, 1500)}
    
    Consider the sender's domain and context. Job application emails typically come from:
    - Company HR departments (@company.com)
    - Recruiting firms with specific position references
    - Application tracking systems (Greenhouse, Workday, etc.)
    
    IMPORTANT: 
    - Be VERY conservative with job_application classification
    - When in doubt, classify as "other"
    - Only classify as job_application if you're confident it's about a specific application
    - Respond with ONLY valid JSON, no markdown formatting or code blocks
    
    Format: { "type": "category", "confidence": 0.95, "reasoning": "brief explanation", "actions": [] }
  `;
}

export function buildJobExtractionPrompt(emailData: EmailData): string {
  return `
    Analyze this job-related email and extract the following information:
    
    Email Subject: ${emailData.subject}
    From: ${emailData.from}
    Email Body: ${emailData.body.substring(0, 2000)}
    
    Please extract and return a JSON object with:
    {
      "company": "Company name (extracted from email domain, subject, or body)",
      "position": "Job position/title mentioned in the email",
      "status": "One of: applied, interview, offer, rejected, accepted",
      "appliedDate": "Date in YYYY-MM-DD format (use today's date if not found)",
      "confidence": "Your confidence level (0-1) in the extraction",
      "details": {
        "workLocation": "Remote/On-site/Hybrid if mentioned",
        "salary": "Salary range if mentioned",
        "department": "Department if mentioned",
        "applicationDeadline": "Deadline if mentioned",
        "nextSteps": "Next steps mentioned in the email"
      }
    }
    
    Status determination rules:
    - "applied": Initial application confirmation, acknowledgment
    - "interview": Interview invitation, scheduling, or confirmation
    - "offer": Job offer, contract, or acceptance letter
    - "rejected": Rejection, regret letter, or "not moving forward"
    - "accepted": Welcome messages, onboarding, or acceptance confirmation
    
    IMPORTANT: Respond with ONLY valid JSON, no markdown formatting or code blocks.
  `;
}
