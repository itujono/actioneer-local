// Job Application Classification Module
import type { EmailData, Classification, Action } from "../types.ts";

export const JOB_APPLICATION_PATTERNS = {
  // Enhanced exclusion patterns - emails that should NOT be classified as job applications
  exclusions: [
    // Job boards and career platforms
    /indeed\.com/i,
    /linkedin\.com/i,
    /glassdoor\.com/i,
    /monster\.com/i,
    /ziprecruiter\.com/i,
    /careerbuilder\.com/i,
    /dice\.com/i,
    /simplyhired\.com/i,
    /workday\.com/i,
    /greenhouse\.io/i,
    /lever\.co/i,
    /bamboohr\.com/i,

    // Job alerts and promotional content
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
    /talent pool/i,
    /we're hiring/i,
    /now hiring/i,
    /open positions/i,
    /career opportunities/i,
    /join our team/i,
    /explore opportunities/i,

    // Cold outreach and generic recruiting
    /would you be interested/i,
    /might be interested/i,
    /looking for new opportunities/i,
    /open to new challenges/i,
    /considering a career change/i,
    /exploring new roles/i,
    /connection request/i,
    /invitation to connect/i,
    /let's connect/i,
    /expand your network/i,

    // Marketing and system emails
    /unsubscribe/i,
    /marketing@/i,
    /newsletter@/i,
    /noreply@/i,
    /no-reply@/i,
    /donotreply@/i,
    /automated@/i,
    /system@/i,
    /notifications@/i,

    // Conference, events, and educational content
    /conference/i,
    /webinar/i,
    /workshop/i,
    /training/i,
    /certification/i,
    /course/i,
    /bootcamp/i,
    /learn/i,
    /education/i,

    // General business/promotional emails
    /partnership/i,
    /collaboration/i,
    /sponsor/i,
    /advertisement/i,
    /promote/i,
    /featured/i,
    /announcement/i,
    /press release/i,
  ],

  // Enhanced positive patterns for legitimate job applications
  application_confirmations: [
    /thank\s+you\s+for\s+(?:your\s+)?(?:applying|application)(?:\s+for)?/i,
    /we\s+(?:have\s+)?received\s+your\s+application\s+for/i,
    /your\s+application\s+for\s+the\s+(?:position|role)\s+of/i,
    /application\s+(?:received|confirmation).*(?:position|role)/i,
    /thanks\s+for\s+applying\s+(?:for\s+the|to)/i,
    /appreciate\s+your\s+(?:interest|application)\s+in/i,
    /application\s+(?:has\s+been\s+)?submitted.*(?:position|role)/i,
    /confirm\s+(?:receipt\s+of\s+)?your\s+application/i,
  ],

  // Follow-up and next steps patterns
  follow_ups: [
    /(?:as\s+)?(?:the\s+)?next\s+step/i,
    /would\s+love\s+(?:for\s+you\s+)?to/i,
    /we'd\s+love\s+(?:for\s+you\s+)?to/i,
    /looking\s+forward\s+to\s+hearing\s+from\s+you/i,
    /please\s+(?:send|share|provide|submit)/i,
    /impressed\s+with\s+your\s+(?:cv|resume|application|profile|background)/i,
    /get\s+to\s+know\s+you\s+better/i,
    /move\s+forward\s+with\s+your\s+application/i,
    /proceed\s+with\s+the\s+(?:interview\s+)?process/i,
    /continue\s+with\s+the\s+(?:hiring\s+)?process/i,
  ],

  // Interview and assessment patterns
  interviews: [
    /interview\s+(?:invitation|request|scheduled|confirmation)/i,
    /(?:phone|video|zoom|teams|skype|google\s+meet)\s+interview/i,
    /would\s+like\s+to\s+schedule.*interview/i,
    /interview\s+for\s+the\s+(?:position|role)\s+of/i,
    /(?:technical|coding|behavioral)\s+interview/i,
    /assessment\s+(?:test|task|challenge)/i,
    /take-home\s+(?:assignment|test|challenge)/i,
    /coding\s+(?:challenge|exercise|test)/i,
    /online\s+assessment/i,
    /screening\s+(?:call|interview)/i,
  ],

  // Video and portfolio requests
  requests: [
    /short\s+(?:\d+(?:-\d+)?\s+)?minute\s+video/i,
    /video\s+introducing\s+yourself/i,
    /introduction\s+video/i,
    /github\s+(?:profile|repository|repo|username)/i,
    /portfolio\s+(?:website|link|url)/i,
    /personal\s+website/i,
    /code\s+samples/i,
    /work\s+samples/i,
    /examples\s+of\s+your\s+work/i,
    /review\s+(?:some\s+of\s+)?your\s+work/i,
    /additional\s+(?:information|materials|documents)/i,
    /references/i,
    /background\s+check/i,
  ],

  // Status updates and decisions
  status_updates: [
    /application\s+status\s+update/i,
    /update\s+on\s+your\s+application/i,
    /status\s+of\s+your\s+application/i,
    /decision\s+on\s+your\s+application/i,
    /regarding\s+your\s+application/i,
    /application\s+review\s+process/i,
  ],

  // Rejection patterns
  rejections: [
    /unfortunately.*not\s+(?:selected|moving\s+forward|proceeding)/i,
    /regret\s+to\s+inform.*(?:position|application)/i,
    /decided\s+to\s+(?:proceed|move\s+forward)\s+with\s+(?:another|other)\s+candidate/i,
    /will\s+not\s+be\s+(?:moving\s+forward|proceeding)\s+with\s+your\s+application/i,
    /not\s+(?:the\s+right\s+)?fit\s+for\s+(?:this\s+)?(?:position|role)/i,
    /chosen\s+(?:another|a\s+different)\s+candidate/i,
    /pursue\s+other\s+candidates/i,
    /thank\s+you.*(?:not\s+selected|declined|unsuccessful)/i,
  ],

  // Offer patterns
  offers: [
    /(?:pleased|excited|happy|delighted)\s+to\s+(?:extend|offer)/i,
    /job\s+offer.*(?:position|role)/i,
    /offer\s+of\s+employment/i,
    /employment\s+offer/i,
    /congratulations.*(?:selected|chosen|offered|successful)/i,
    /welcome\s+to\s+(?:the\s+team|our\s+team)/i,
    /formal\s+offer/i,
    /compensation\s+package/i,
    /start\s+date/i,
    /employment\s+terms/i,
  ],

  // Company-specific patterns (avoid generic recruiting)
  company_context: [
    /position\s+at\s+[\w\s]+(?:inc|llc|ltd|corp|company)/i,
    /role\s+at\s+[\w\s]+(?:inc|llc|ltd|corp|company)/i,
    /this\s+role\s+at\s+[\w\s]+/i,
    /team\s+at\s+[\w\s]+/i,
    /joining\s+(?:our\s+team|us)\s+at\s+[\w\s]+/i,
  ],

  // Position-specific titles (common job titles)
  position_titles: [
    /(?:senior|junior|lead|principal|staff)\s+(?:software\s+)?(?:engineer|developer)/i,
    /(?:frontend|front-end|backend|back-end|full-stack|fullstack)\s+(?:engineer|developer)/i,
    /(?:data\s+scientist|data\s+analyst|data\s+engineer)/i,
    /(?:product\s+manager|project\s+manager|program\s+manager)/i,
    /(?:ui|ux|product)\s+designer/i,
    /(?:devops|sre|infrastructure)\s+engineer/i,
    /(?:qa|quality\s+assurance)\s+engineer/i,
    /(?:business\s+analyst|systems\s+analyst)/i,
    /(?:marketing\s+manager|sales\s+manager)/i,
    /(?:customer\s+success|account\s+manager)/i,
  ],

  // Strong job application indicators
  strong_indicators: [
    /application\s+(?:id|number|reference)/i,
    /candidate\s+(?:id|number|profile)/i,
    /recruitment\s+(?:process|team)/i,
    /hiring\s+(?:manager|team)/i,
    /hr\s+(?:department|team)/i,
    /talent\s+(?:acquisition|team)/i,
    /people\s+(?:operations|team)/i,
    /recruiter/i,
  ],
};

export function buildJobApplicationPrompt(emailData: EmailData): string {
  return `
    Analyze this email to determine if it's related to a job application you submitted.
    
    ⚠️ STRICT CRITERIA - The email MUST be:
    1. From a company/recruiter regarding a SPECIFIC job you applied to
    2. About YOUR job application status, interview, offer, rejection, or follow-up
    3. NOT general career advice, job alerts, recruiting outreach, or promotional emails
    
    INCLUDE (High Confidence):
    - Application confirmations for specific positions ("Thank you for applying for...")
    - Follow-up emails asking for next steps (videos, portfolio, additional info)
    - Interview invitations/scheduling/requests for specific roles
    - Job rejection/offer emails for positions you applied to
    - Status updates on your specific applications
    - Requests for GitHub profiles, portfolios, or additional materials
    - Assessment or coding challenge invitations
    - Background check or reference requests
    - Positive responses expressing interest in your application
    
    INCLUDE (Moderate Confidence):
    - Follow-up emails mentioning specific job titles or companies
    - Emails from company domains (not job boards) about roles
    - Recruiter emails about specific positions (not cold outreach)
    
    🚫 EXCLUDE (Never classify as job applications):
    - Job alerts from job boards (Indeed, LinkedIn, Glassdoor, etc.)
    - General career newsletters or promotional emails
    - LinkedIn connection requests or cold messages
    - General "we're hiring" announcements
    - Emails about positions you didn't apply to
    - Cold outreach emails from recruiters ("Would you be interested...")
    - Conference, webinar, or training invitations
    - Marketing emails from recruiting companies
    - Automated system notifications without specific job context
    
    CONTEXT CLUES TO LOOK FOR:
    - Mentions of specific job titles and company names
    - Reference to your application, CV, or resume
    - Next steps in a hiring process
    - Interview scheduling or assessment requests
    - Application ID or candidate numbers
    - From company email domains (not @gmail, @yahoo, etc.)
    
    EXAMPLES OF WHAT TO INCLUDE:
    ✅ "Thank you for applying for the Frontend Engineer position at TechCorp..."
    ✅ "We were impressed with your CV and would love to get to know you better..."
    ✅ "As the next step, please send a video introducing yourself..."
    ✅ "Please share your GitHub profile so we can review your work..."
    ✅ "We'd like to schedule an interview for the Senior Developer position..."
    ✅ "Unfortunately, we've decided to move forward with another candidate..."
    
    EXAMPLES OF WHAT TO EXCLUDE:
    ❌ "New job opportunities matching your profile..."
    ❌ "Would you be interested in exploring new career opportunities?"
    ❌ "Connect with me on LinkedIn..."
    ❌ "Join our upcoming career webinar..."
    ❌ "We're hiring! Check out our open positions..."
    
    Email Subject: ${emailData.subject}
    From: ${emailData.from}
    Email Body: ${emailData.body.substring(0, 1500)}
    
    Respond with JSON: { "isMatch": boolean, "confidence": 0-1, "reasoning": "explanation" }
  `;
}

export function classifyJobApplication(emailData: EmailData): Classification | null {
  const subjectLower = emailData.subject.toLowerCase();
  const fromLower = emailData.from.toLowerCase();
  const bodyLower = emailData.body.toLowerCase();

  // FIRST: Check exclusions - these should NEVER be job applications
  const shouldExclude = JOB_APPLICATION_PATTERNS.exclusions.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower) || pattern.test(fromLower)
  );

  if (shouldExclude) {
    console.log("🚫 Job App: Excluded as job board/promotional/cold outreach email");
    return null;
  }

  // SECOND: Check for strong indicators first
  const hasStrongIndicator = JOB_APPLICATION_PATTERNS.strong_indicators.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  // Check specific pattern categories
  const hasApplicationConfirmation = JOB_APPLICATION_PATTERNS.application_confirmations.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasFollowUp = JOB_APPLICATION_PATTERNS.follow_ups.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasInterview = JOB_APPLICATION_PATTERNS.interviews.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasRequest = JOB_APPLICATION_PATTERNS.requests.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasStatusUpdate = JOB_APPLICATION_PATTERNS.status_updates.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasRejection = JOB_APPLICATION_PATTERNS.rejections.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasOffer = JOB_APPLICATION_PATTERNS.offers.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasCompanyContext = JOB_APPLICATION_PATTERNS.company_context.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  const hasPositionTitle = JOB_APPLICATION_PATTERNS.position_titles.some(
    (pattern) => pattern.test(subjectLower) || pattern.test(bodyLower)
  );

  // Enhanced context checking - must have job-related context
  const hasJobContext =
    // Direct application context
    ((bodyLower.includes("application") || bodyLower.includes("applied")) &&
      (bodyLower.includes("position") || bodyLower.includes("role") || bodyLower.includes("job")) &&
      !isFromCommonEmailProvider(fromLower)) ||
    // Interview/assessment context
    ((bodyLower.includes("interview") || bodyLower.includes("assessment") || bodyLower.includes("challenge")) &&
      (bodyLower.includes("position") || bodyLower.includes("role") || hasPositionTitle) &&
      !isFromCommonEmailProvider(fromLower)) ||
    // Next steps context with job context
    ((bodyLower.includes("next step") || bodyLower.includes("would love") || bodyLower.includes("we'd love")) &&
      (bodyLower.includes("position") || bodyLower.includes("role") || hasPositionTitle || hasCompanyContext) &&
      !isFromCommonEmailProvider(fromLower)) ||
    // Portfolio/work review context
    ((bodyLower.includes("github") || bodyLower.includes("portfolio") || bodyLower.includes("work samples")) &&
      (bodyLower.includes("position") || bodyLower.includes("role") || bodyLower.includes("review your work")) &&
      !isFromCommonEmailProvider(fromLower));

  // Determine confidence based on pattern strength
  let confidence = 0;

  if (hasStrongIndicator) {
    // High confidence for emails with strong job application indicators
    if (hasApplicationConfirmation || hasOffer || hasInterview) {
      confidence = 0.95;
    } else if (hasRejection || hasStatusUpdate) {
      confidence = 0.9;
    } else if (hasFollowUp || hasRequest) {
      confidence = 0.85;
    } else {
      confidence = 0.8;
    }
  } else if (hasApplicationConfirmation || hasOffer) {
    confidence = 0.9;
  } else if (hasInterview || hasRejection) {
    confidence = 0.85;
  } else if (hasStatusUpdate) {
    confidence = 0.8;
  } else if (hasFollowUp || hasRequest) {
    confidence = 0.75;
  } else if (hasJobContext && (hasPositionTitle || hasCompanyContext)) {
    confidence = 0.7;
  } else if (hasJobContext) {
    confidence = 0.65;
  }

  if (confidence > 0.6) {
    console.log(`✅ Job App: Detected job application email with confidence ${confidence}`);
    return {
      type: "job_application",
      confidence,
      actions: getJobApplicationActions(),
      method: "pattern-based",
      reasoning: `Detected job application email with confidence ${confidence}`,
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
    "live.com",
    "msn.com",
    "protonmail.com",
    "tutanota.com",
  ];
  return commonProviders.some((provider) => fromEmail.includes(provider.toLowerCase()));
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
    {
      type: "simple" as const,
      label: "Set Reminder",
      handler: "setFollowUpReminder",
      data: {},
    },
  ];
}
