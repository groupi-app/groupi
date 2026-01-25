'use node';

import { internalAction } from '../_generated/server';
import { v } from 'convex/values';
import { Resend } from 'resend';

// Initialize Resend client for email sending
const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Send external notifications (email and webhooks)
 * This action is scheduled by mutations to handle HTTP requests
 */
export const sendExternalNotifications = internalAction({
  args: {
    emails: v.array(
      v.object({
        to: v.string(),
        subject: v.string(),
        html: v.string(),
      })
    ),
    webhooks: v.array(
      v.object({
        url: v.string(),
        payload: v.string(), // JSON stringified payload
        headers: v.optional(v.record(v.string(), v.string())),
      })
    ),
  },
  handler: async (_ctx, { emails, webhooks }) => {
    const results = {
      emailsSent: 0,
      emailsFailed: 0,
      webhooksSent: 0,
      webhooksFailed: 0,
    };

    // Send emails
    if (resendClient && emails.length > 0) {
      const fromEmail =
        process.env.RESEND_FROM_EMAIL || 'Groupi <notifications@groupi.gg>';

      for (const email of emails) {
        try {
          const result = await resendClient.emails.send({
            from: fromEmail,
            to: email.to,
            subject: email.subject,
            html: email.html,
          });

          if (result.error) {
            console.error(
              `Resend API error for ${email.to}:`,
              result.error.message,
              result.error
            );
            results.emailsFailed++;
          } else {
            console.log(
              `Notification email sent to ${email.to}, id: ${result.data?.id}`
            );
            results.emailsSent++;
          }
        } catch (error) {
          console.error(
            `Failed to send notification email to ${email.to}:`,
            error
          );
          results.emailsFailed++;
        }
      }
    }

    // Send webhooks
    for (const webhook of webhooks) {
      try {
        const headers: Record<string, string> = {
          'Content-Type': 'application/json',
          ...webhook.headers,
        };

        const response = await fetch(webhook.url, {
          method: 'POST',
          headers,
          body: webhook.payload,
        });

        if (response.ok) {
          console.log(`Webhook notification sent to ${webhook.url}`);
          results.webhooksSent++;
        } else {
          console.error(
            `Webhook notification failed for ${webhook.url}: ${response.status} ${response.statusText}`
          );
          results.webhooksFailed++;
        }
      } catch (error) {
        console.error(
          `Failed to send webhook notification to ${webhook.url}:`,
          error
        );
        results.webhooksFailed++;
      }
    }

    return results;
  },
});
