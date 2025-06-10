// CardJobs.js - Job Application and Career Card Components
// All job tracking and career-related card functions

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
        .setSubtitle("Adding to your job tracker")
        .setImageUrl(ICON_URL)
    )
    .setName("job_processed_card");

  // Show extracted job information
  const infoSection = CardService.newCardSection().setHeader(
    "📋 Detected Information"
  );

  if (jobData.company) {
    infoSection.addWidget(
      CardService.newTextParagraph().setText(
        `<b>Company:</b> ${jobData.company}<br>` +
          `<b>Position:</b> ${jobData.position || "Not specified"}<br>` +
          `<b>Status:</b> ${jobData.status || "Applied"}<br>` +
          `<b>Date:</b> ${
            jobData.appliedDate
              ? new Date(jobData.appliedDate).toLocaleDateString()
              : "Today"
          }`
      )
    );
  } else {
    infoSection.addWidget(
      CardService.newTextParagraph().setText(
        "🔍 <b>AI is analyzing this job-related email...</b><br><br>" +
          "We're extracting company details, position information, and application status to add to your job tracker.<br><br>" +
          '<font color="#1a73e8">⚡ This usually takes 10-30 seconds</font>'
      )
    );
  }

  card.addSection(infoSection);

  // Add status section
  const statusSection = CardService.newCardSection().setHeader(
    "✅ Automatic Tracking"
  );

  statusSection.addWidget(
    CardService.newTextParagraph().setText(
      "This job application is being automatically added to your job tracker dashboard where you can:<br><br>" +
        "• View all applications in one place<br>" +
        "• Track status changes and updates<br>" +
        "• Sort and filter by company, status, or date<br>" +
        "• Monitor your application success rate"
    )
  );

  card.addSection(statusSection);

  // Add action buttons
  const actionSection = CardService.newCardSection();
  actionSection.addWidget(
    CardService.newTextButton()
      .setText("📊 View Job Tracker Dashboard")
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

  // Secondary action
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
 * Extract job data from Gmail message
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

  // Extract company from subject first (more reliable for format like "Subject - Company")
  let company = null;

  // Try to extract company from subject after dash
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
        "gmail",
        "yahoo",
        "outlook",
        "hotmail",
        "aol",
        "icloud",
      ];
      if (!commonProviders.includes(domain.toLowerCase())) {
        company = domain.charAt(0).toUpperCase() + domain.slice(1);
      }
    }
  }

  // Try to extract company from body content
  if (!company) {
    const bodyCompanyPatterns = [
      /to\s+the\s+([^,\n\.]+)\s+and\s+your\s+interest/i,
      /best\s+regards,\s*([A-Za-z\s&]+)/i,
      /from\s+([A-Za-z\s&]+)(?:\s+team|\s+careers|\s+hr)/i,
      /at\s+([A-Za-z\s&]+)(?:\s+team|\s+careers|\s+hr)/i,
      /([A-Za-z\s&]+)\s+team/i,
      /([A-Za-z\s&]+)\s+careers/i,
    ];

    for (const pattern of bodyCompanyPatterns) {
      const match = body.match(pattern);
      if (match && match[1] && match[1].trim().length > 2) {
        const companyCandidate = match[1].trim();
        // Filter out common non-company words
        const skipWords = [
          "team",
          "careers",
          "hr",
          "hiring",
          "department",
          "position",
          "role",
          "application",
          "job",
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

  // Extract position/role with improved patterns
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

  // Determine status from subject/body with improved patterns
  let status = "applied";
  const statusKeywords = {
    rejected: [
      "unfortunately",
      "regret",
      "not selected",
      "not moving forward",
      "decided not to",
      "proceed with another candidate",
      "decided to proceed with",
      "not be moving forward",
      "will not be proceeding",
    ],
    interview: [
      "interview",
      "scheduled",
      "meeting",
      "call",
      "zoom",
      "video call",
      "phone screen",
      "next round",
    ],
    offer: [
      "offer",
      "pleased to extend",
      "job offer",
      "congratulations",
      "excited to offer",
      "happy to offer",
    ],
    accepted: [
      "welcome to",
      "excited to have you",
      "looking forward to working",
      "onboarding",
      "start date",
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
 * Create error card for job processing failures
 */
function createJobErrorCard(errorMessage) {
  return CardService.newCardBuilder()
    .setHeader(
      CardService.newCardHeader()
        .setTitle("⚠️ Job Processing Error")
        .setSubtitle("Unable to process job data")
        .setImageUrl(ICON_URL)
    )
    .addSection(
      CardService.newCardSection()
        .addWidget(
          CardService.newTextParagraph().setText(
            `<font color="#ea4335"><b>Error:</b> ${errorMessage}</font><br><br>Please try refreshing or contact support if the issue persists.`
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
    "💼 Job Details Extracted"
  );

  if (data.jobData) {
    let jobInfo = "";
    const jobData = data.jobData;

    if (jobData.company) {
      jobInfo += `<strong>Company:</strong> ${jobData.company}<br>`;
    }
    if (jobData.position) {
      jobInfo += `<strong>Position:</strong> ${jobData.position}<br>`;
    }
    if (jobData.status) {
      jobInfo += `<strong>Status:</strong> ${jobData.status}<br>`;
    }
    if (jobData.appliedDate) {
      jobInfo += `<strong>Applied:</strong> ${new Date(
        jobData.appliedDate
      ).toLocaleDateString()}<br>`;
    }

    section.addWidget(CardService.newTextParagraph().setText(jobInfo));
  }

  section.addWidget(
    CardService.newTextParagraph().setText(
      "<br>✅ <strong>Application automatically tracked!</strong>"
    )
  );

  card.addSection(section);
}
