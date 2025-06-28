import { EmailContent, Attachment } from "./types.ts";
import { GMAIL_API_BASE_URL, RELEVANT_ATTACHMENT_TYPES } from "./constants.ts";
import { tryRefreshToken, supabase } from "./auth-utils.ts";

export async function fetchRecentEmails(
  accessToken: string,
  historyId?: string,
  user?: any,
  emailAddress?: string
) {
  try {
    let url = `${GMAIL_API_BASE_URL}/users/me/messages?maxResults=10&q=is:unread newer_than:1h`;

    // If we have a history ID, we can fetch only emails since that point
    if (historyId) {
      url = `${GMAIL_API_BASE_URL}/users/me/history?startHistoryId=${historyId}&maxResults=10`;
      console.log("📊 Using history ID approach with URL:", url);
    } else {
      console.log("📬 Using recent emails approach with URL:", url);
    }

    console.log("📡 Making Gmail API request...");
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        "Content-Type": "application/json",
      },
    });

    console.log("📨 Gmail API response status:", response.status);

    if (!response.ok) {
      if (response.status === 401) {
        console.log("🔄 Access token expired, attempting automatic refresh...");

        // Try to refresh the token automatically (only if user context is available)
        if (user && emailAddress) {
          const refreshSuccess = await tryRefreshToken(user, emailAddress);

          if (refreshSuccess) {
            console.log(
              "✅ Token refreshed successfully, retrying Gmail API request..."
            );

            // Get the refreshed token and retry the request
            const { data: refreshedAuth } = await supabase
              .from("user_auth_tokens")
              .select("gmail_access_token")
              .eq("user_id", user.id)
              .single();

            if (refreshedAuth?.gmail_access_token) {
              console.log(
                "🔄 Retrying Gmail API request with refreshed token..."
              );

              const retryResponse = await fetch(url, {
                headers: {
                  Authorization: `Bearer ${refreshedAuth.gmail_access_token}`,
                  "Content-Type": "application/json",
                },
              });

              if (retryResponse.ok) {
                const retryData = await retryResponse.json();
                console.log("✅ Gmail API retry successful!");

                // Handle the retry response with the same logic as original
                if (historyId) {
                  if (retryData.history && retryData.history.length > 0) {
                    const messageIds: { id: string }[] = [];
                    for (const historyItem of retryData.history) {
                      if (historyItem.messagesAdded) {
                        for (const messageAdded of historyItem.messagesAdded) {
                          messageIds.push({ id: messageAdded.message.id });
                        }
                      }
                    }
                    console.log(
                      `📊 History retry found ${messageIds.length} messages`
                    );
                    return messageIds;
                  }
                }
                return retryData.messages || [];
              } else {
                console.log(
                  "❌ Gmail API retry also failed with status:",
                  retryResponse.status
                );
              }
            }
          } else {
            console.log(
              "❌ Token refresh failed - user needs to re-authorize via web OAuth"
            );
          }
        } else {
          console.log("⚠️ No user context available for token refresh");
        }

        return [];
      }
      throw new Error(
        `Gmail API error: ${response.status} ${response.statusText}`
      );
    }

    const data = await response.json();
    console.log("🔍 Gmail API response keys:", Object.keys(data));
    console.log("🔍 Has history field:", !!data.history);

    // Try history approach first if we have historyId
    if (historyId) {
      if (data.history && data.history.length > 0) {
        // Extract message IDs from history
        const messageIds: { id: string }[] = [];
        for (const historyItem of data.history) {
          if (historyItem.messagesAdded) {
            for (const messageAdded of historyItem.messagesAdded) {
              messageIds.push({ id: messageAdded.message.id });
            }
          }
        }
        console.log(`📊 History approach found ${messageIds.length} messages`);

        if (messageIds.length > 0) {
          return messageIds;
        }
      }

      // History approach failed or returned no messages - always fall back to recent emails
      console.log(
        "🔄 History approach failed/empty, falling back to recent emails"
      );
      const fallbackUrl = `${GMAIL_API_BASE_URL}/users/me/messages?maxResults=10&q=newer_than:1h`;

      const fallbackResponse = await fetch(fallbackUrl, {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      });

      if (fallbackResponse.ok) {
        const fallbackData = await fallbackResponse.json();
        console.log(
          `🔄 Fallback approach found ${
            (fallbackData.messages || []).length
          } messages`
        );
        return fallbackData.messages || [];
      }
    }

    // Non-history approach (shouldn't reach here in webhook context)
    return data.messages || [];
  } catch (error) {
    console.error("Error fetching recent emails:", error);
    return [];
  }
}

export async function fetchEmailContent(
  messageId: string,
  accessToken: string
): Promise<EmailContent | null> {
  try {
    const response = await fetch(
      `${GMAIL_API_BASE_URL}/users/me/messages/${messageId}?format=full`,
      {
        headers: {
          Authorization: `Bearer ${accessToken}`,
          "Content-Type": "application/json",
        },
      }
    );

    if (!response.ok) {
      throw new Error(
        `Gmail API error: ${response.status} ${response.statusText}`
      );
    }

    const message = await response.json();

    // Extract email data from Gmail API response
    const headers = message.payload.headers;
    const subject = headers.find((h: any) => h.name === "Subject")?.value || "";
    const from = headers.find((h: any) => h.name === "From")?.value || "";
    const date = headers.find((h: any) => h.name === "Date")?.value || "";

    // Extract body content
    let body = "";
    if (message.payload.body?.data) {
      body = atob(
        message.payload.body.data.replace(/-/g, "+").replace(/_/g, "/")
      );
    } else if (message.payload.parts) {
      // Handle multipart messages
      for (const part of message.payload.parts) {
        if (part.mimeType === "text/plain" && part.body?.data) {
          body = atob(part.body.data.replace(/-/g, "+").replace(/_/g, "/"));
          break;
        }
      }
    }

    // Extract attachments
    const attachments = await extractAttachments(message, accessToken);

    return {
      messageId,
      subject,
      from,
      date: new Date(date).toISOString(),
      body,
      attachments,
    };
  } catch (error) {
    console.error("Error fetching email content:", error);
    return null;
  }
}

export async function extractAttachments(
  message: any,
  accessToken: string
): Promise<Attachment[]> {
  const attachments: Attachment[] = [];

  async function processMessageParts(parts: any[]) {
    for (const part of parts) {
      // Check if this part has nested parts (multipart)
      if (part.parts && part.parts.length > 0) {
        await processMessageParts(part.parts);
      }

      // Check if this is an attachment
      if (part.body?.attachmentId) {
        try {
          // Get attachment metadata
          const filename = part.filename || "unknown";
          const mimeType = part.mimeType || "application/octet-stream";
          const size = part.body.size || 0;

          console.log(
            `📎 Found attachment: ${filename} (${mimeType}, ${size} bytes)`
          );

          // Only process relevant file types for receipts
          if (
            RELEVANT_ATTACHMENT_TYPES.some((type) =>
              mimeType.toLowerCase().includes(type.toLowerCase())
            )
          ) {
            // Fetch the actual attachment data
            const attachmentResponse = await fetch(
              `${GMAIL_API_BASE_URL}/users/me/messages/${message.id}/attachments/${part.body.attachmentId}`,
              {
                headers: {
                  Authorization: `Bearer ${accessToken}`,
                  "Content-Type": "application/json",
                },
              }
            );

            if (attachmentResponse.ok) {
              const attachmentData = await attachmentResponse.json();

              // For now, we'll store the attachment metadata and a flag that it exists
              // In a production environment, you'd want to upload to Supabase Storage
              attachments.push({
                filename,
                mimeType,
                size,
                attachmentId: part.body.attachmentId,
                // Note: In production, you'd upload the data to storage and store the URL
                hasData: true,
                downloadUrl: null, // Would be populated after uploading to storage
              });

              console.log(`✅ Attachment processed: ${filename}`);
            } else {
              console.log(
                `⚠️ Failed to fetch attachment data for: ${filename}`
              );
            }
          } else {
            console.log(
              `⏭️ Skipping non-receipt attachment: ${filename} (${mimeType})`
            );
          }
        } catch (error) {
          console.error(`Error processing attachment:`, error);
        }
      }
    }
  }

  // Process message parts if they exist
  if (message.payload.parts) {
    await processMessageParts(message.payload.parts);
  }

  console.log(`📎 Total attachments found: ${attachments.length}`);
  return attachments;
}
