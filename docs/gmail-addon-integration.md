# Gmail Add-on Integration Guide

This document provides the Google Apps Script code for your Gmail add-on to integrate with the two-tier API key authentication system.

## Overview

The Gmail add-on uses a two-tier authentication approach:
1. **Master Key**: Used once to generate individual user API keys
2. **User API Key**: Used for all subsequent API calls (unique per user)

## Environment Setup

In your Google Apps Script project, set these script properties:

```javascript
// Go to Project Settings > Script Properties and add:
BACKEND_API_URL = "https://your-backend-domain.com/api"
MASTER_API_KEY = "your_master_key_here"
```

## Core Authentication Functions

```javascript
/**
 * Ensures user has a valid API key, generating one if needed
 * Call this before any API operations
 */
function ensureUserApiKey() {
  const userProperties = PropertiesService.getUserProperties();
  let apiKey = userProperties.getProperty('USER_API_KEY');
  
  if (apiKey) {
    // Validate existing key
    if (validateUserApiKey(apiKey)) {
      return apiKey;
    } else {
      // Key is invalid, remove it
      userProperties.deleteProperty('USER_API_KEY');
      apiKey = null;
    }
  }
  
  if (!apiKey) {
    // Generate new API key
    const userEmail = Session.getActiveUser().getEmail();
    apiKey = generateUserApiKey(userEmail);
    
    if (apiKey) {
      userProperties.setProperty('USER_API_KEY', apiKey);
    }
  }
  
  return apiKey;
}

/**
 * Generates a new user API key using the master key
 */
function generateUserApiKey(userEmail) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const backendUrl = scriptProperties.getProperty('BACKEND_API_URL');
  const masterKey = scriptProperties.getProperty('MASTER_API_KEY');
  
  if (!backendUrl || !masterKey) {
    console.error('Missing backend configuration');
    return null;
  }
  
  try {
    const response = UrlFetchApp.fetch(`${backendUrl}/auth/generate-user-key`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${masterKey}`,
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        email: userEmail,
        name: Session.getActiveUser().getEmail().split('@')[0] // Use email prefix as name
      })
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      console.log(`User API key ${data.created ? 'created' : 'retrieved'} for ${userEmail}`);
      return data.api_key;
    } else {
      console.error('Failed to generate user API key:', response.getContentText());
      return null;
    }
  } catch (error) {
    console.error('Error generating user API key:', error);
    return null;
  }
}

/**
 * Validates if a user API key is still active
 */
function validateUserApiKey(apiKey) {
  const scriptProperties = PropertiesService.getScriptProperties();
  const backendUrl = scriptProperties.getProperty('BACKEND_API_URL');
  
  try {
    const response = UrlFetchApp.fetch(`${backendUrl}/auth/validate-user-key`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      payload: JSON.stringify({
        api_key: apiKey
      })
    });
    
    if (response.getResponseCode() === 200) {
      const data = JSON.parse(response.getContentText());
      return data.valid;
    }
    
    return false;
  } catch (error) {
    console.error('Error validating user API key:', error);
    return false;
  }
}

/**
 * Makes authenticated API calls to the backend
 */
function makeAuthenticatedApiCall(endpoint, method = 'GET', payload = null) {
  const apiKey = ensureUserApiKey();
  
  if (!apiKey) {
    throw new Error('Failed to obtain valid API key');
  }
  
  const scriptProperties = PropertiesService.getScriptProperties();
  const backendUrl = scriptProperties.getProperty('BACKEND_API_URL');
  
  const options = {
    method: method,
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json'
    }
  };
  
  if (payload && (method === 'POST' || method === 'PUT')) {
    options.payload = JSON.stringify(payload);
  }
  
  try {
    const response = UrlFetchApp.fetch(`${backendUrl}${endpoint}`, options);
    
    if (response.getResponseCode() === 401) {
      // API key might be revoked, clear it and retry once
      PropertiesService.getUserProperties().deleteProperty('USER_API_KEY');
      const newApiKey = ensureUserApiKey();
      
      if (newApiKey) {
        options.headers['Authorization'] = `Bearer ${newApiKey}`;
        return UrlFetchApp.fetch(`${backendUrl}${endpoint}`, options);
      }
    }
    
    return response;
  } catch (error) {
    console.error('API call failed:', error);
    throw error;
  }
}
```

## Email Processing Functions

```javascript
/**
 * Main function called when user opens an email
 * This is your Gmail add-on entry point
 */
function processEmail(e) {
  try {
    const message = getCurrentMessage(e);
    
    if (!message) {
      return createErrorCard('Unable to access email message');
    }
    
    // Extract email data
    const emailData = {
      messageId: message.getId(),
      subject: message.getSubject(),
      from: message.getFrom(),
      body: message.getPlainBody() || message.getBody(),
      date: message.getDate().toISOString()
    };
    
    // Classify email using backend API
    const classification = classifyEmail(emailData);
    
    if (classification) {
      return createActionCard(classification, emailData);
    } else {
      return createErrorCard('Failed to classify email');
    }
    
  } catch (error) {
    console.error('Error processing email:', error);
    return createErrorCard('An error occurred while processing the email');
  }
}

/**
 * Classifies email using the backend API
 */
function classifyEmail(emailData) {
  try {
    const response = makeAuthenticatedApiCall('/classify-email', 'POST', emailData);
    
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    } else {
      console.error('Classification failed:', response.getContentText());
      return null;
    }
  } catch (error) {
    console.error('Error classifying email:', error);
    return null;
  }
}

/**
 * Parses receipt data from email
 */
function parseReceipt(emailData) {
  try {
    const response = makeAuthenticatedApiCall('/parse-receipt', 'POST', {
      emailId: emailData.messageId,
      messageId: emailData.messageId,
      emailBody: emailData.body
    });
    
    if (response.getResponseCode() === 200) {
      return JSON.parse(response.getContentText());
    } else {
      console.error('Receipt parsing failed:', response.getContentText());
      return null;
    }
  } catch (error) {
    console.error('Error parsing receipt:', error);
    return null;
  }
}
```

## UI Helper Functions

```javascript
/**
 * Creates action card based on email classification
 */
function createActionCard(classification, emailData) {
  const card = CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Actioneer')
      .setSubtitle(`Email Type: ${classification.type}`)
      .setImageUrl('https://your-icon-url.com/icon.png'))
    .addSection(createActionsSection(classification.actions, emailData));
  
  return card.build();
}

/**
 * Creates actions section with buttons
 */
function createActionsSection(actions, emailData) {
  const section = CardService.newCardSection()
    .setHeader('Available Actions');
  
  actions.forEach(action => {
    const button = CardService.newTextButton()
      .setText(action.label)
      .setOnClickAction(CardService.newAction()
        .setFunctionName(action.handler)
        .setParameters({
          emailData: JSON.stringify(emailData),
          actionData: JSON.stringify(action.data)
        }));
    
    section.addWidget(button);
  });
  
  return section;
}

/**
 * Creates error card
 */
function createErrorCard(message) {
  return CardService.newCardBuilder()
    .setHeader(CardService.newCardHeader()
      .setTitle('Actioneer')
      .setSubtitle('Error'))
    .addSection(CardService.newCardSection()
      .addWidget(CardService.newTextParagraph()
        .setText(message)))
    .build();
}

/**
 * Gets current email message from event
 */
function getCurrentMessage(e) {
  if (e && e.messageMetadata) {
    return GmailApp.getMessageById(e.messageMetadata.messageId);
  }
  return null;
}
```

## Action Handlers

```javascript
/**
 * Handle expense tracking action
 */
function handleTrackExpense(e) {
  const emailData = JSON.parse(e.parameters.emailData);
  const receiptData = parseReceipt(emailData);
  
  if (receiptData) {
    // Show success notification
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText(`Expense tracked: ${receiptData.merchant} - ${receiptData.currency}${receiptData.amount}`))
      .build();
  } else {
    return CardService.newActionResponseBuilder()
      .setNotification(CardService.newNotification()
        .setText('Failed to track expense'))
      .build();
  }
}

/**
 * Open financial dashboard
 */
function openFinancialDashboard(e) {
  const url = 'https://your-frontend-domain.com/expenses';
  
  return CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
      .setUrl(url)
      .setOpenAs(CardService.OpenAs.FULL_SIZE))
    .build();
}

/**
 * Handle add to calendar action
 */
function handleAddToCalendar(e) {
  // Implementation for adding travel to calendar
  return CardService.newActionResponseBuilder()
    .setNotification(CardService.newNotification()
      .setText('Calendar integration coming soon'))
    .build();
}

/**
 * Open job tracker
 */
function openJobTracker(e) {
  const url = 'https://your-frontend-domain.com/jobs';
  
  return CardService.newActionResponseBuilder()
    .setOpenLink(CardService.newOpenLink()
      .setUrl(url)
      .setOpenAs(CardService.OpenAs.FULL_SIZE))
    .build();
}
```

## Deployment Checklist

1. **Set Script Properties** in Google Apps Script:
   - `BACKEND_API_URL`: Your backend API URL
   - `MASTER_API_KEY`: Your master API key

2. **Configure OAuth Scopes** in `appsscript.json`:
```json
{
  "oauthScopes": [
    "https://www.googleapis.com/auth/gmail.readonly",
    "https://www.googleapis.com/auth/script.external_request"
  ]
}
```

3. **Set up Gmail Add-on Manifest**:
```json
{
  "gmail": {
    "contextualTriggers": [{
      "unconditional": {},
      "onTriggerFunction": "processEmail"
    }]
  }
}
```

## Security Considerations

- Master API key should be rotated regularly
- User API keys are automatically validated on each request
- Failed authentication triggers automatic key regeneration
- All API calls are logged for audit purposes

## Testing

Use the Apps Script debugger to test individual functions:

```javascript
function testAuthentication() {
  const apiKey = ensureUserApiKey();
  console.log('API Key obtained:', apiKey ? 'Success' : 'Failed');
}

function testClassification() {
  const testEmail = {
    messageId: 'test-123',
    subject: 'Your receipt from Amazon',
    from: 'auto-confirm@amazon.com',
    body: 'Thank you for your order...',
    date: new Date().toISOString()
  };
  
  const result = classifyEmail(testEmail);
  console.log('Classification result:', result);
}
```