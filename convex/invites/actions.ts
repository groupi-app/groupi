'use node';

import { internalAction } from '../_generated/server';
import { v } from 'convex/values';
import { Resend } from 'resend';

// Initialize Resend client for email sending
const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

/**
 * Format date/time for display in email
 */
function formatDateTime(timestamp?: number): string | undefined {
  if (!timestamp) return undefined;
  const date = new Date(timestamp);
  return date.toLocaleDateString('en-US', {
    weekday: 'long',
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  });
}

/**
 * Generate the invite email HTML
 */
function generateInviteEmailHtml(params: {
  recipientName?: string;
  eventTitle: string;
  eventDescription?: string;
  eventLocation?: string;
  eventDateTime?: number;
  eventEndDateTime?: number;
  customMessage?: string;
  inviteUrl: string;
  plusOnes: number;
}): string {
  const {
    recipientName,
    eventTitle,
    eventDescription,
    eventLocation,
    eventDateTime,
    eventEndDateTime,
    customMessage,
    inviteUrl,
    plusOnes,
  } = params;

  const siteUrl = process.env.SITE_URL || 'https://groupi.gg';
  const greeting = recipientName ? `Hey ${recipientName}` : 'Hey';
  const dateTimeStr = formatDateTime(eventDateTime);
  const endTimeStr = formatDateTime(eventEndDateTime);

  // Build event details section
  let eventDetails = '';
  if (dateTimeStr) {
    eventDetails += `<p style="margin: 8px 0; color: #666;"><strong>When:</strong> ${dateTimeStr}`;
    if (endTimeStr) {
      eventDetails += ` - ${endTimeStr}`;
    }
    eventDetails += '</p>';
  }
  if (eventLocation) {
    eventDetails += `<p style="margin: 8px 0; color: #666;"><strong>Where:</strong> ${eventLocation}</p>`;
  }

  // +1s messaging
  let plusOnesMessage = '';
  if (plusOnes > 0) {
    const guestWord = plusOnes === 1 ? 'guest' : 'guests';
    plusOnesMessage = `<p style="margin: 16px 0; padding: 12px; background-color: #f0f9ff; border-radius: 8px; color: #0369a1;">
      <strong>🎉 This invite allows you to bring ${plusOnes} ${guestWord}!</strong>
    </p>`;
  }

  // Custom message section
  let customMessageSection = '';
  if (customMessage) {
    customMessageSection = `<div style="margin: 20px 0; padding: 16px; background-color: #f9fafb; border-left: 4px solid #8b5cf6; border-radius: 4px;">
      <p style="margin: 0; white-space: pre-wrap;">${customMessage}</p>
    </div>`;
  }

  // Event description
  let descriptionSection = '';
  if (eventDescription) {
    descriptionSection = `<p style="margin: 16px 0; color: #666;">${eventDescription}</p>`;
  }

  return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
      </head>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #ffffff;">
        <div style="text-align: center; margin-bottom: 32px;">
          <h1 style="color: #8b5cf6; margin: 0; font-size: 28px;">You're Invited!</h1>
        </div>

        <p style="font-size: 18px; margin-bottom: 8px;">
          ${greeting}, you're invited to <strong style="color: #8b5cf6;">${eventTitle}</strong>!
        </p>

        ${descriptionSection}

        <div style="margin: 24px 0; padding: 16px; background-color: #fafafa; border-radius: 12px;">
          ${eventDetails || '<p style="margin: 0; color: #999;">Event details to be announced</p>'}
        </div>

        ${customMessageSection}

        ${plusOnesMessage}

        <p style="font-size: 16px; margin: 24px 0;">
          <strong>Can you make it?</strong> RSVP and see more details:
        </p>

        <div style="margin: 32px 0; text-align: center;">
          <a href="${inviteUrl}" style="background-color: #8b5cf6; color: white; padding: 16px 32px; text-decoration: none; border-radius: 12px; display: inline-block; font-weight: 600; font-size: 16px;">
            View Invite & RSVP
          </a>
        </div>

        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;">

        <p style="color: #999; font-size: 12px; text-align: center;">
          This invite was sent via <a href="${siteUrl}" style="color: #8b5cf6;">Groupi</a>.
          <br/>
          If you didn't expect this email, you can safely ignore it.
        </p>
      </body>
    </html>
  `;
}

/**
 * Send invite emails to recipients
 * Called by sendPendingEmailInvites mutation
 */
export const sendInviteEmails = internalAction({
  args: {
    eventId: v.id('events'),
    eventTitle: v.string(),
    eventDescription: v.optional(v.string()),
    eventLocation: v.optional(v.string()),
    eventDateTime: v.optional(v.number()),
    eventEndDateTime: v.optional(v.number()),
    invites: v.array(
      v.object({
        inviteId: v.id('invites'),
        email: v.string(),
        recipientName: v.optional(v.string()),
        token: v.string(),
        customMessage: v.optional(v.string()),
        plusOnes: v.number(),
      })
    ),
  },
  handler: async (_ctx, args) => {
    const {
      eventTitle,
      eventDescription,
      eventLocation,
      eventDateTime,
      eventEndDateTime,
      invites,
    } = args;

    const siteUrl = process.env.SITE_URL || 'https://groupi.gg';
    const fromEmail =
      process.env.RESEND_FROM_EMAIL || 'Groupi <invites@groupi.gg>';

    const results = {
      emailsSent: 0,
      emailsFailed: 0,
    };

    if (!resendClient) {
      console.error('Resend client not configured - RESEND_API_KEY missing');
      results.emailsFailed = invites.length;
      return results;
    }

    for (const invite of invites) {
      const inviteUrl = `${siteUrl}/invite/${invite.token}`;

      const html = generateInviteEmailHtml({
        recipientName: invite.recipientName,
        eventTitle,
        eventDescription,
        eventLocation,
        eventDateTime,
        eventEndDateTime,
        customMessage: invite.customMessage,
        inviteUrl,
        plusOnes: invite.plusOnes,
      });

      const subject = `You're invited to ${eventTitle}`;

      try {
        const result = await resendClient.emails.send({
          from: fromEmail,
          to: invite.email,
          subject,
          html,
        });

        if (result.error) {
          console.error(
            `Resend API error for ${invite.email}:`,
            result.error.message,
            result.error
          );
          results.emailsFailed++;
        } else {
          console.log(
            `Invite email sent to ${invite.email}, id: ${result.data?.id}`
          );
          results.emailsSent++;
        }
      } catch (error) {
        console.error(`Failed to send invite email to ${invite.email}:`, error);
        results.emailsFailed++;
      }
    }

    return results;
  },
});
