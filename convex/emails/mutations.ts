import { mutation } from '../_generated/server';
import { v } from 'convex/values';
import { requireAuth } from '../auth';
import { ConvexError } from 'convex/values';

// Use require to avoid deep type instantiation errors with internal references
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-explicit-any
const internalApi: any = require('../_generated/api').internal;

/**
 * Email management mutations for the Convex backend
 *
 * Note: User email management is handled by Better Auth.
 * These mutations manage app-specific email verification records.
 */

/**
 * Request to add a new additional email address
 * Creates a pending verification record
 * Note: The actual email sending should be done via Better Auth or external service
 */
export const requestAddEmail = mutation({
  args: {
    email: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { email }) => {
    const { user } = await requireAuth(ctx);

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      throw new ConvexError('Invalid email address format');
    }

    // Normalize email (lowercase)
    const normalizedEmail = email.toLowerCase().trim();

    // Check if email is already the user's primary email
    if (user.email === normalizedEmail) {
      throw new ConvexError('This email is already your primary email');
    }

    // Get userId as string
    const userId = user._id.toString();

    // Generate verification token
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000; // 24 hours from now

    // Delete any existing verification for this email/user combo
    const existingVerifications = await ctx.db
      .query('emailVerifications')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('email'), normalizedEmail))
      .collect();

    for (const verification of existingVerifications) {
      await ctx.db.delete(verification._id);
    }

    // Create verification record
    const now = Date.now();
    await ctx.db.insert('emailVerifications', {
      userId,
      email: normalizedEmail,
      token,
      expiresAt,
      createdAt: now,
      updatedAt: now,
    });

    // Send verification email
    await ctx.runMutation(internalApi.email.sendEmailVerificationEmail, {
      email: normalizedEmail,
      token,
    });

    return {
      success: true,
      message: 'Verification email sent',
      ...(process.env.DEBUG_EMAIL_VERIFICATION === 'true' && {
        verificationToken: token,
      }),
    };
  },
});

/**
 * Verify email address using verification token
 */
export const verifyEmail = mutation({
  args: {
    token: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { token }) => {
    // Find verification record
    const verification = await ctx.db
      .query('emailVerifications')
      .withIndex('by_token', q => q.eq('token', token))
      .first();

    if (!verification) {
      throw new ConvexError('Invalid or expired verification token');
    }

    // Check if expired
    if (verification.expiresAt < Date.now()) {
      await ctx.db.delete(verification._id);
      throw new ConvexError('Verification token has expired');
    }

    // Note: To add email to user, must be done via Better Auth client-side API
    // This just marks the verification as complete

    // Delete the verification record
    await ctx.db.delete(verification._id);

    return {
      success: true,
      email: verification.email,
      message: 'Email verified. Use Better Auth client to add to account.',
    };
  },
});

/**
 * Remove an additional email
 * Note: Email management must be done via Better Auth client-side API
 */
export const removeAdditionalEmail = mutation({
  args: {
    email: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { email }) => {
    await requireAuth(ctx);

    // Note: Actual email removal from user record must be done via Better Auth client
    return {
      success: true,
      message: 'Email removal must be completed via Better Auth client API',
      email: email.toLowerCase().trim(),
    };
  },
});

/**
 * Set primary email
 * Note: Email management must be done via Better Auth client-side API
 */
export const setPrimaryEmail = mutation({
  args: {
    email: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { email }) => {
    await requireAuth(ctx);

    // Note: Actual primary email change must be done via Better Auth client
    return {
      success: true,
      message:
        'Primary email change must be completed via Better Auth client API',
      email: email.toLowerCase().trim(),
    };
  },
});

/**
 * Resend verification email
 */
export const resendVerificationEmail = mutation({
  args: {
    email: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { email }) => {
    const { user } = await requireAuth(ctx);
    const userId = user._id.toString();
    const normalizedEmail = email.toLowerCase().trim();

    // Find existing verification
    const existingVerification = await ctx.db
      .query('emailVerifications')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('email'), normalizedEmail))
      .first();

    if (!existingVerification) {
      throw new ConvexError('No pending verification found for this email');
    }

    // Generate new token
    const token = crypto.randomUUID();
    const expiresAt = Date.now() + 24 * 60 * 60 * 1000;

    // Update verification record
    await ctx.db.patch(existingVerification._id, {
      token,
      expiresAt,
      updatedAt: Date.now(),
    });

    // Send verification email
    await ctx.runMutation(internalApi.email.sendEmailVerificationEmail, {
      email: normalizedEmail,
      token,
    });

    return {
      success: true,
      message: 'Verification email resent',
      ...(process.env.DEBUG_EMAIL_VERIFICATION === 'true' && {
        verificationToken: token,
      }),
    };
  },
});
