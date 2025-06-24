// Job Application Classification Module
import type { EmailData, Classification, Action } from "../types.ts";

export const JOB_APPLICATION_PATTERNS = {
  // Exclusion patterns - emails that should NOT be classified as job applications
  exclusions: [
    // Job boards and alerts
    /indeed\.com/i,
    /linkedin\.com/i,
    /glassdoor\.com/i,
    /monster\.com/i,
    /ziprecruiter\.com/i,
    /careerbuilder\.com/i,
    /job alert/i,
    /job recommendation/i,
    /new jobs/i,
    /jobs matching/i,
    /job search/i,
    /career newsletter/i,
    /weekly jobs/i,
    /job digest/i,
    /hiring event/i,
    /career fair/i,
    /join our talent/i,
    /talent pool/i,
    /we're hiring/i,
    /now hiring/i,
    /open positions/i,
    /career opportunities/i,
    /would you be interested/i,
    /might be interested/i,
    /connection request/i,
    /invitation to connect/i,
    /unsubscribe/i,
    /marketing@/i,
    /newsletter@/i,
    /noreply@/i,
    /no-reply@/i,
  ],

  // Specific job application patterns
  positive: [
    // Application acknowledgments and thank you emails
    /thank\s+you\s+for\s+(?:your\s+)?(?:applying|application)(?:\s+for)?/i,
    /we\s+have\s+received\s+your\s+application\s+for/i,
    /your\s+application\s+for\s+the\s+(?:position|role)\s+of/i,
    /application\s+received.*position/i,
    /application\s+confirmation.*position/i,
    /thanks\s+for\s+applying/i,
    /appreciate\s+your\s+(?:interest|application)/i,

    // Follow-up and next steps
    /(?:as\s+)?(?:the\s+)?next\s+step/i,
    /would\s+love\s+(?:for\s+you\s+)?to/i,
    /we'd\s+love\s+(?:for\s+you\s+)?to/i,
    /looking\s+forward\s+to\s+hearing\s+from\s+you/i,
    /please\s+(?:send|share|provide)/i,
    /impressed\s+with\s+your\s+(?:cv|resume|application)/i,
    /get\s+to\s+know\s+you\s+better/i,

    // Interview specific patterns
    /interview\s+(?:invitation|request|scheduled|confirmation).*(?:position|role)/i,
    /(?:phone|video|zoom|teams)\s+interview.*(?:position|role)/i,
    /would\s+like\s+to\s+schedule.*interview/i,
    /interview\s+for\s+the\s+(?:position|role)\s+of/i,
    /short\s+(?:\d+(?:-\d+)?\s+)?minute\s+video/i,
    /video\s+introducing\s+yourself/i,

    // Position-specific mentions with company context
    /(?:applying|applied)\s+for\s+the\s+[\w\s]+\s+position\s+at\s+\w+/i,
    /position\s+at\s+[\w\s]+/i,
    /role\s+at\s+[\w\s]+/i,
    /this\s+role\s+at\s+\w+/i,

    // Rejection patterns
    /unfortunately.*not\s+(?:selected|moving\s+forward|proceeding)/i,
    /regret\s+to\s+inform.*(?:position|application)/i,
    /decided\s+to\s+(?:proceed|move\s+forward)\s+with\s+(?:another|other)\s+candidate/i,
    /will\s+not\s+be\s+(?:moving\s+forward|proceeding)\s+with\s+your\s+application/i,

    // Offer patterns
    /(?:pleased|excited|happy)\s+to\s+(?:extend|offer).*(?:position|role)/i,
    /job\s+offer.*(?:position|role)/i,
    /offer\s+of\s+employment/i,
    /congratulations.*(?:selected|chosen|offered)/i,

    // Status update patterns
    /application\s+status\s+update.*(?:position|role)/i,
    /update\s+on\s+your\s+application\s+for/i,
    /status\s+of\s+your\s+application\s+for/i,

    // GitHub/portfolio requests (common in tech interviews)
    /github\s+profile/i,
    /portfolio/i,
    /review\s+(?:some\s+of\s+)?your\s+work/i,
  ],
};

export function buildJobApplicationPrompt(emailData: EmailData): string {
  return `
    Analyze this email to determine if it's related to a job application you submitted.
    
    STRICT CRITERIA - The email MUST be:
    1. From a company/recruiter regarding a SPECIFIC job you applied to
    2. About YOUR job application status, interview, offer, rejection, or follow-up
    3. NOT general career advice, job alerts, or promotional emails
    
    INCLUDE:
    - Application confirmations for specific positions
    - Follow-up emails asking for next steps (videos, portfolio, additional info)
    - Interview invitations/scheduling/requests
    - Job rejection/offer emails for positions you applied to
    - Status updates on your specific applications
    - Requests for GitHub profiles, portfolios, or additional materials
    - "Thank you for applying" messages with next steps
    - Positive responses expressing interest in your application
    
    EXCLUDE:
    - Job alerts from job boards (Indeed, LinkedIn, etc.)
    - General career newsletters or promotional emails
    - LinkedIn connection requests or messages
    - General "we're hiring" announcements
    - Emails about positions you didn't apply to
    - Cold outreach emails from recruiters
    
    EXAMPLES OF WHAT TO INCLUDE:
    - "Thank you for applying for the Frontend Engineer position..."
    - "We were impressed with your CV and would love to get to know you better..."
    - "As the next step, please send a video introducing yourself..."
    - "Please share your GitHub profile so we can review your work..."
    - "We'd like to schedule an interview for the position..."
    
    Email Subject: ${emailData.subject}
    From: ${emailData.from}
    Email Body: ${emailData.body.substring(0, 1500)}
    
    Respond with JSON: { "isMatch": boolean, "confidence": 0-1, "reasoning": "explanation" }
  `;
}

export function classifyJobApplication(
  emailData: EmailData
): Classification | null {
  const subjectLower = emailData.subject.toLowerCase();
  const fromLower = emailData.from.toLowerCase();
  const bodyLower = emailData.body.toLowerCase();

  // Check exclusions first
  const shouldExclude = JOB_APPLICATION_PATTERNS.exclusions.some(
    (pattern) =>
      pattern.test(subjectLower) ||
      pattern.test(bodyLower) ||
      pattern.test(fromLower)
  );

  if (shouldExclude) {
    return null; // Not a job application
  }

  // Check positive patterns
  const hasSpecificJobPattern = JOB_APPLICATION_PATTERNS.positive.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  // Enhanced context checks for follow-up emails and status updates
  const hasJobContext =
    // Original application-related context
    ((bodyLower.includes("application") || bodyLower.includes("applied")) &&
      (bodyLower.includes("position") ||
        bodyLower.includes("role") ||
        bodyLower.includes("job")) &&
      !isFromCommonEmailProvider(fromLower) &&
      (bodyLower.includes("your application") ||
        bodyLower.includes("you applied") ||
        bodyLower.includes("your interest"))) ||
    // Follow-up email context (like your example)
    ((bodyLower.includes("thank you for applying") ||
      bodyLower.includes("thanks for applying") ||
      bodyLower.includes("appreciate your") ||
      bodyLower.includes("impressed with your")) &&
      (bodyLower.includes("position") ||
        bodyLower.includes("role") ||
        bodyLower.includes("cv") ||
        bodyLower.includes("resume")) &&
      !isFromCommonEmailProvider(fromLower)) ||
    // Next steps context
    ((bodyLower.includes("next step") ||
      bodyLower.includes("would love") ||
      bodyLower.includes("we'd love") ||
      bodyLower.includes("looking forward")) &&
      (bodyLower.includes("position") ||
        bodyLower.includes("role") ||
        bodyLower.includes("this role at") ||
        bodyLower.includes("engineer") ||
        bodyLower.includes("developer") ||
        bodyLower.includes("analyst") ||
        bodyLower.includes("manager")) &&
      !isFromCommonEmailProvider(fromLower)) ||
    // Interview/assessment requests
    ((bodyLower.includes("video") ||
      bodyLower.includes("github") ||
      bodyLower.includes("portfolio") ||
      bodyLower.includes("interview")) &&
      (bodyLower.includes("position") ||
        bodyLower.includes("role") ||
        bodyLower.includes("background") ||
        bodyLower.includes("work") ||
        bodyLower.includes("introducing yourself")) &&
      !isFromCommonEmailProvider(fromLower));

  if (hasSpecificJobPattern || hasJobContext) {
    // Higher confidence for specific patterns, moderate for context
    const confidence = hasSpecificJobPattern ? 0.85 : 0.75;

    return {
      type: "job_application",
      confidence: confidence,
      actions: getJobApplicationActions(),
      method: "pattern-based",
    };
  }

  return null;
}

function isFromCommonEmailProvider(fromEmail: string): boolean {
  const commonProviders = [
    "gmail.com",
    "yahoo.com",
    "outlook.com",
    "hotmail.com",
    "aol.com",
    "icloud.com",
  ];
  return commonProviders.some((provider) =>
    fromEmail.includes(provider.toLowerCase())
  );
}

function getJobApplicationActions(): Action[] {
  return [
    {
      type: "complex" as const,
      label: "Track Application",
      handler: "openJobTracker",
      data: {},
    },
    {
      type: "simple" as const,
      label: "Update Status",
      handler: "updateJobStatus",
      data: {},
    },
  ];
}
