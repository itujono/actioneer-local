// CardJobs.js - Job Application and Career Card Components
// All job tracking and career-related card functions

// ============================================================================
// DESIGN SYSTEM CONSTANTS - Now imported from CardCommon.js
// ============================================================================

// All design constants are now centralized in CardCommon.js to avoid global scope conflicts
// Available constants: CARD_COLORS, JOB_STATUS_COLORS, JOB_EMOJIS

// ============================================================================
// JOB PROCESSING CARDS
// ============================================================================

/**
 * Auto-process job email
 */
function createJobProcessedCard(gmailMessage, emailData) {
  console.log("💼 Auto-processing job email...");

  // Try to extract job data from the email
  const jobData = extractJobDataFromEmail(gmailMessage);

  const card = CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("💼 Job Application Detected")
        .setSubtitle("AI-powered career tracking")
        .setImageUrl(ICON_URL)
    )
    .setName("job_processed_card");

  // Show extracted job information with enhanced styling
  const infoSection = CardService.newCardSection().setHeader(
    "🎯 Extracted Information"
  );

  if (jobData.company) {
    const statusEmoji = JOB_EMOJIS[jobData.status] || '📝';
    const statusColor = JOB_STATUS_COLORS[jobData.status] || CARD_COLORS.PRIMARY;
    
    infoSection.addWidget(
      CardService.newTextParagraph().setText(
        `<b><font color="${CARD_COLORS.PRIMARY}">${jobData.company}</font></b><br>` +
        `<font color="${CARD_COLORS.SECONDARY}"><b>Position:</b> ${jobData.position || "Not specified"}</font><br>` +
        `<font color="${statusColor}"><b>Status:</b> ${statusEmoji} ${jobData.status || "Applied"}</font><br>` +
        `<font color="${CARD_COLORS.MUTED}"><b>Applied:</b> ${
          jobData.appliedDate
            ? new Date(jobData.appliedDate).toLocaleDateString()
            : "Today"
        }</font>`
      )
    );
  } else {
    infoSection.addWidget(
      CardService.newTextParagraph().setText(
        `<font color="${CARD_COLORS.ACCENT}"><b>🤖 AI Analysis in Progress...</b></font><br><br>` +
        `<font color="${CARD_COLORS.SECONDARY}">Our intelligent system is extracting:</font><br>` +
        `<font color="${CARD_COLORS.SECONDARY}">• Company details & position info</font><br>` +
        `<font color="${CARD_COLORS.SECONDARY}">• Application status & timeline</font><br>` +
        `<font color="${CARD_COLORS.SECONDARY}">• Contact information & next steps</font><br><br>` +
        `<font color="${CARD_COLORS.PRIMARY}">⚡ <b>Usually completes in 10-30 seconds</b></font>`
      )
    );
  }

  card.addSection(infoSection);

  // Add enhanced status section
  const statusSection = CardService.newCardSection().setHeader(
    "🚀 Automatic Tracking"
  );

  statusSection.addWidget(
    CardService.newTextParagraph().setText(
      `<font color="${CARD_COLORS.SUCCESS}"><b>✅ Successfully added to your job tracker!</b></font><br><br>` +
      `<font color="${CARD_COLORS.SECONDARY}">Your comprehensive job dashboard now includes:</font><br>` +
      `<font color="${CARD_COLORS.SECONDARY}">📊 <b>Application overview</b> - All applications in one place</font><br>` +
      `<font color="${CARD_COLORS.SECONDARY}">📈 <b>Status tracking</b> - Real-time progress updates</font><br>` +
      `<font color="${CARD_COLORS.SECONDARY}">🔍 <b>Smart filtering</b> - Sort by company, status, or date</font><br>` +
      `<font color="${CARD_COLORS.SECONDARY}">📋 <b>Success metrics</b> - Track your application success rate</font>`
    )
  );

  card.addSection(statusSection);

  // Add enhanced action buttons
  const actionSection = CardService.newCardSection().setHeader(
    "🎯 Quick Actions"
  );
  
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("📊 Open Job Tracker Dashboard")
      .setOpenLink(
        CardService.newOpenLink()
          .setUrl(
            `${BASE_URL}/jobs?from=gmail&messageId=${
              emailData.messageId
            }&email=${encodeURIComponent(Session.getActiveUser().getEmail())}`
          )
          .setOpenAs(CardService.OpenAs.OVERLAY)
      )
  );

  // Secondary action with better styling
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("🔄 Re-analyze Email")
      .setOnClickAction(
        CardService.newAction()
          .setFunctionName("reprocessJobEmail")
          .setParameters({ messageId: emailData.messageId })
      )
  );

  card.addSection(actionSection);
  return card.build();
}

// ============================================================================
// JOB DATA EXTRACTION
// ============================================================================

/**
 * Extract job data from Gmail message with enhanced patterns
 */
function extractJobDataFromEmail(gmailMessage) {
  if (!gmailMessage) {
    return {
      company: null,
      position: null,
      status: "applied",
      appliedDate: new Date().toISOString().split("T")[0],
    };
  }

  const subject = gmailMessage.getSubject() || "";
  const body = gmailMessage.getBody() || "";
  const from = gmailMessage.getFrom() || "";

  console.log("🔍 Extracting job data from email...");
  console.log("Subject:", subject);
  console.log("From:", from);

  // Enhanced company extraction with better patterns
  let company = null;

  // Try to extract company from subject first (more reliable for format like "Subject - Company")
  const subjectCompanyMatch = subject.match(/-\s*([A-Za-z\s&]+)\s*$/);
  if (subjectCompanyMatch && subjectCompanyMatch[1]) {
    company = subjectCompanyMatch[1].trim();
  }

  // If not found in subject, try sender email domain
  if (!company) {
    const emailMatch = from.match(/@([^.]+)/);
    if (emailMatch && emailMatch[1]) {
      const domain = emailMatch[1];
      // Skip common email providers
      const commonProviders = [
        "gmail", "yahoo", "outlook", "hotmail", "aol", "icloud", "noreply", "no-reply"
      ];
      if (!commonProviders.includes(domain.toLowerCase())) {
        company = domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    }
  }

  // Enhanced company extraction from body content
  if (!company) {
    const bodyCompanyPatterns = [
      /to\s+the\s+([^,\n\.]+)\s+and\s+your\s+interest/i,
      /best\s+regards,\s*([A-Za-z\s&]+)/i,
      /from\s+([A-Za-z\s&]+)(?:\s+team|\s+careers|\s+hr)/i,
      /at\s+([A-Za-z\s&]+)(?:\s+team|\s+careers|\s+hr)/i,
      /([A-Za-z\s&]+)\s+team/i,
      /([A-Za-z\s&]+)\s+careers/i,
      /([A-Za-z\s&]+)\s+hiring/i,
      /([A-Za-z\s&]+)\s+talent/i,
    ];

    for (const pattern of bodyCompanyPatterns) {
      const match = body.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        const companyCandidate = match[1].trim();
        // Filter out common non-company words
        const skipWords = [
          "team", "careers", "hr", "hiring", "department", "position", 
          "role", "application", "job", "talent", "recruiting"
        ];
        if (
          !skipWords.some((word) =>
            companyCandidate.toLowerCase().includes(word)
          )
        ) {
          company = companyCandidate;
          break;
        }
      }
    }
  }

  // Enhanced position extraction with improved patterns
  let position = null;
  const positionPatterns = [
    // Match "Position (Details) - Company" format like "Senior Mobile Developer (React Native) - SmartEye"
    /to\s+the\s+([^,\n\-]+?)(?:\s*\([^)]*\))?\s*-\s*[A-Za-z\s&]+\s+and/i,
    // Match "for the Position position"
    /for\s+the\s+([^,\n\.]+)\s+(?:position|role)/i,
    // Match "as a/an Position"
    /as\s+(?:a|an)\s+([^,\n\.]+)/i,
    // Match "Position:" format
    /(?:position|role):\s*([^,\n\.]+)/i,
    // Match "applying for Position"
    /applying\s+for\s+([^,\n\.]+)/i,
    // Match "application to the Position"
    /application\s+to\s+the\s+([^,\n\.]+)/i,
    // Match "Position at Company"
    /([^,\n\.]+)\s+at\s+[A-Za-z\s&]+/i,
  ];

  const textToSearch = subject + " " + body;
  for (const pattern of positionPatterns) {
    const match = textToSearch.match(pattern);
    if (match && match[1] && match[1].trim().length > 2) {
      let positionCandidate = match[1].trim();
      // Clean up the position text
      positionCandidate = positionCandidate
        .replace(/\s*\([^)]*\)\s*/g, "") // Remove parenthetical content
        .replace(/\s*-\s*.*$/, "") // Remove everything after dash
        .trim();

      if (positionCandidate.length > 2) {
        position = positionCandidate;
        break;
      }
    }
  }

  // Enhanced status determination with better patterns
  let status = "applied";
  const statusKeywords = {
    rejected: [
      "unfortunately", "regret", "not selected", "not moving forward", 
      "decided not to", "proceed with another candidate", "decided to proceed with",
      "not be moving forward", "will not be proceeding", "unable to move forward",
      "have decided to", "will not be moving", "not the right fit"
    ],
    interview: [
      "interview", "scheduled", "meeting", "call", "zoom", "video call",
      "phone screen", "next round", "would like to speak", "schedule a call",
      "discuss further", "next step", "screening call", "technical interview"
    ],
    offer: [
      "offer", "pleased to extend", "job offer", "congratulations",
      "excited to offer", "happy to offer", "formal offer", "extend an offer",
      "offer letter", "compensation package"
    ],
    accepted: [
      "welcome to", "excited to have you", "looking forward to working",
      "onboarding", "start date", "first day", "welcome aboard",
      "joining the team", "orientation"
    ],
  };

  const textToCheck = (subject + " " + body).toLowerCase();

  for (const [statusType, keywords] of Object.entries(statusKeywords)) {
    if (keywords.some((keyword) => textToCheck.includes(keyword))) {
      status = statusType;
      break;
    }
  }

  // Use email date as applied date
  const emailDate = gmailMessage.getDate();
  const appliedDate = emailDate
    ? emailDate.toISOString().split("T")[0]
    : new Date().toISOString().split("T")[0];

  const extractedData = {
    company: company,
    position: position,
    status: status,
    appliedDate: appliedDate,
    emailFrom: from,
    emailSubject: subject,
  };

  console.log("📊 Extracted job data:", JSON.stringify(extractedData, null, 2));

  return extractedData;
}

// ============================================================================
// JOB ACTION HANDLERS
// ============================================================================

/**
 * Re-process job email with fresh analysis
 */
function reprocessJobEmail(e) {
  const messageId = e && e.parameter ? e.parameter.messageId : null;
  if (!messageId) {
    console.error("No messageId provided for reprocess");
    return createJobErrorCard("Unable to reprocess - missing email ID");
  }

  console.log("🔄 Reprocessing job email:", messageId);
  return createJobProcessedCard(null, { messageId: messageId });
}

/**
 * Create enhanced error card for job processing failures
 */
function createJobErrorCard(errorMessage) {
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("⚠️ Job Processing Error")
        .setSubtitle("Temporary analysis issue")
        .setImageUrl(ICON_URL)
    )
    .addSection(
      CardService.newCardSection()
        .setHeader("🔧 What Happened?")
        .addWidget(
          CardService.newTextParagraph().setText(
            `<font color="${CARD_COLORS.ERROR}"><b>❌ Error Details:</b></font><br>` +
            `<font color="${CARD_COLORS.SECONDARY}">${errorMessage}</font><br><br>` +
            `<font color="${CARD_COLORS.SECONDARY}"><b>💡 Quick Fixes:</b></font><br>` +
            `<font color="${CARD_COLORS.SECONDARY}">• Try refreshing the email</font><br>` +
            `<font color="${CARD_COLORS.SECONDARY}">• Check your internet connection</font><br>` +
            `<font color="${CARD_COLORS.SECONDARY}">• Contact support if issue persists</font>`
          )
        )
        .addWidget(
          CardService.newTextButton()
            .setText("🔄 Try Again")
            .setOnClickAction(
              CardService.newAction().setFunctionName("reprocessJobEmail")
            )
        )
    )
    .build();
}

// ============================================================================
// JOB PRE-PROCESSED SECTIONS
// ============================================================================

function addJobPreProcessedSection(card, data) {
  const section = CardService.newCardSection().setHeader(
    "💼 Job Application Tracked"
  );

  if (data.jobData) {
    let jobInfo = "";
    const jobData = data.jobData;
    
    const statusEmoji = JOB_EMOJIS[jobData.status] || '📝';
    const statusColor = JOB_STATUS_COLORS[jobData.status] || CARD_COLORS.PRIMARY;

    if (jobData.company) {
      jobInfo += `<font color="${CARD_COLORS.PRIMARY}"><b>Company:</b> ${jobData.company}</font><br>`;
    }
    if (jobData.position) {
      jobInfo += `<font color="${CARD_COLORS.SECONDARY}"><b>Position:</b> ${jobData.position}</font><br>`;
    }
    if (jobData.status) {
      jobInfo += `<font color="${statusColor}"><b>Status:</b> ${statusEmoji} ${jobData.status}</font><br>`;
    }
    if (jobData.appliedDate) {
      jobInfo += `<font color="${CARD_COLORS.MUTED}"><b>Applied:</b> ${new Date(
        jobData.appliedDate
      ).toLocaleDateString()}</font><br>`;
    }

    section.addWidget(CardService.newTextParagraph().setText(jobInfo));
  }

  section.addWidget(
    CardService.newTextParagraph().setText(
      `<br><font color="${CARD_COLORS.SUCCESS}">✅ <b>Application automatically tracked!</b></font><br>` +
      `<font color="${CARD_COLORS.SECONDARY}">View your complete job search progress in the dashboard.</font>`
    )
  );

  card.addSection(section);
}
