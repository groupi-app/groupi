import { query } from '../_generated/server';
import { v } from 'convex/values';
import { authComponent } from '../auth';

/**
 * Email management queries for the Convex backend
 *
 * Note: User email data is managed by Better Auth.
 * These queries manage app-specific email verification records.
 */

/**
 * Get all email addresses for current user with verification status
 * Note: Additional emails must be fetched via Better Auth client-side API
 */
export const getCurrentUserEmails = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return null;
    }

    const userId = user._id.toString();

    // Get pending verifications for this user
    const pendingVerifications = await ctx.db
      .query('emailVerifications')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.gt(q.field('expiresAt'), Date.now())) // Only non-expired
      .collect();

    // Return structured data for the UI
    // Note: Additional emails must be fetched via Better Auth client
    return {
      primaryEmail: {
        address: user.email,
        isPrimary: true,
        isVerified: user.emailVerified,
      },
      // Note: Additional emails are managed by Better Auth and must be fetched client-side
      additionalEmails: [],
      pendingVerifications: pendingVerifications.map(verification => ({
        address: verification.email,
        isPrimary: false,
        isVerified: false,
        isExpired: Date.now() > verification.expiresAt,
        createdAt: verification.createdAt,
        expiresAt: verification.expiresAt,
      })),
      // Flat list for easier iteration in UI
      allEmails: [
        {
          address: user.email,
          isPrimary: true,
          isVerified: user.emailVerified,
          status: 'verified' as const,
        },
        ...pendingVerifications.map(verification => ({
          address: verification.email,
          isPrimary: false,
          isVerified: false,
          status: 'pending' as const,
          expiresAt: verification.expiresAt,
        })),
      ],
    };
  },
});

/**
 * Check if a specific email is available to add
 * Note: This only checks our app's emailVerifications table
 * Full availability check must be done via Better Auth client
 */
export const checkEmailAvailability = query({
  args: {
    email: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { email }) => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return { available: false, reason: 'Not authenticated' };
    }

    const userId = user._id.toString();

    // Normalize email
    const normalizedEmail = email.toLowerCase().trim();

    // Basic validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(normalizedEmail)) {
      return { available: false, reason: 'Invalid email format' };
    }

    // Check if it's the user's primary email
    if (user.email === normalizedEmail) {
      return { available: false, reason: 'This is already your primary email' };
    }

    // Check if there's a pending verification
    const pendingVerification = await ctx.db
      .query('emailVerifications')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.eq(q.field('email'), normalizedEmail))
      .first();

    if (pendingVerification) {
      const isExpired = Date.now() > pendingVerification.expiresAt;
      if (!isExpired) {
        return {
          available: false,
          reason: 'Verification email already sent for this address',
          canResend: false,
        };
      } else {
        return {
          available: false,
          reason: 'Previous verification expired',
          canResend: true,
        };
      }
    }

    // Note: Full availability check (against other users) must be done via Better Auth client
    return { available: true };
  },
});

/**
 * Get verification status for a specific token (for verify-email page)
 */
export const getVerificationStatus = query({
  args: {
    token: v.string(),
    _traceId: v.optional(v.string()),
  },
  handler: async (ctx, { token }) => {
    const verification = await ctx.db
      .query('emailVerifications')
      .withIndex('by_token', q => q.eq('token', token))
      .first();

    if (!verification) {
      return {
        status: 'invalid' as const,
        message: 'Invalid verification token',
      };
    }

    const isExpired = Date.now() > verification.expiresAt;

    if (isExpired) {
      return {
        status: 'expired' as const,
        message: 'Verification token has expired',
        email: verification.email,
      };
    }

    return {
      status: 'valid' as const,
      email: verification.email,
      expiresAt: verification.expiresAt,
    };
  },
});

/**
 * Get count of pending email verifications for current user
 */
export const getPendingVerificationCount = query({
  args: {
    _traceId: v.optional(v.string()),
  },
  handler: async ctx => {
    const user = await authComponent.getAuthUser(ctx);
    if (!user) {
      return 0;
    }

    const userId = user._id.toString();

    const pendingVerifications = await ctx.db
      .query('emailVerifications')
      .withIndex('by_user', q => q.eq('userId', userId))
      .filter(q => q.gt(q.field('expiresAt'), Date.now())) // Only non-expired
      .collect();

    return pendingVerifications.length;
  },
});
