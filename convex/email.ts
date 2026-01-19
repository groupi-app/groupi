// import { components } from "./_generated/api";
// import { Resend } from "@convex-dev/resend";
import { internalMutation } from './_generated/server';
import { v } from 'convex/values';

// TODO: Re-enable after Resend component is deployed
// export const resend = new Resend(components.resend, {
//   testMode: process.env.NODE_ENV !== "production",
// });
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const resend = {} as any;

// Send magic link email (used by Better Auth)
export const sendMagicLinkEmail = internalMutation({
  args: {
    email: v.string(),
    url: v.string(),
  },
  handler: async (ctx, { email, url }) => {
    const isDevelopment = process.env.NODE_ENV === 'development';

    // In development, log magic link URL if debug logging is enabled
    if (isDevelopment && process.env.DEBUG_MAGIC_LINKS === 'true') {
      console.log(`🔗 MAGIC LINK FOR DEVELOPMENT - URL: ${url}`);
      console.log('Copy this URL to your browser (expires in 5 minutes)');
      return;
    } else if (isDevelopment) {
      // Silent in development unless explicitly enabled for debugging
      return;
    }

    // In production, send email using Resend component
    await resend.sendEmail(ctx, {
      from: 'Groupi <noreply@groupi.gg>',
      to: email,
      subject: 'Sign in to Groupi',
      html: `
        <!DOCTYPE html>
        <html>
          <head>
            <meta charset="utf-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
          </head>
          <body style="font-family: sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
            <h1 style="color: #2563eb;">Sign in to Groupi</h1>
            <p>Click the button below to sign in to your account:</p>
            <div style="margin: 30px 0;">
              <a href="${url}" style="background-color: #2563eb; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block;">
                Sign In
              </a>
            </div>
            <p style="color: #666; font-size: 14px;">
              This link will expire in 5 minutes. If you didn't request this email, you can safely ignore it.
            </p>
            <p style="color: #999; font-size: 12px; margin-top: 40px;">
              Or copy and paste this URL into your browser:<br/>
              <span style="color: #666;">${url}</span>
            </p>
          </body>
        </html>
      `,
    });
  },
});

// Send notification emails (for general app notifications)
export const sendNotificationEmail = internalMutation({
  args: {
    to: v.string(),
    subject: v.string(),
    html: v.string(),
  },
  handler: async (ctx, args) => {
    await resend.sendEmail(ctx, {
      from: 'Groupi <notifications@groupi.gg>',
      to: args.to,
      subject: args.subject,
      html: args.html,
    });
  },
});
