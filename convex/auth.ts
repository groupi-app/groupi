import { createClient, type GenericCtx } from '@convex-dev/better-auth';
import { convex } from '@convex-dev/better-auth/plugins';
import { components } from './_generated/api';
import { DataModel, Id } from './_generated/dataModel';
import { query, QueryCtx, MutationCtx } from './_generated/server';
import { betterAuth, type BetterAuthOptions } from 'better-auth/minimal';
import authConfig from './auth.config';
import { ConvexError } from 'convex/values';
import {
  DEFAULT_EVENT_PERMISSIONS,
  type EventPermissionKey,
  type PermissionLevel,
} from './types';
import { Resend } from 'resend';
import { isAdminRole } from './lib/constants';

/**
 * Extended user type that includes Better Auth plugin fields.
 *
 * Note: This type exists because Better Auth has a known TypeScript issue
 * where plugin fields (like username from the username plugin) are not
 * properly inferred. See: https://github.com/better-auth/better-auth/issues/5159
 *
 * This should be imported from auth.ts wherever user data with plugin fields is needed.
 */
export type ExtendedAuthUser = {
  _id: string;
  name?: string | null;
  email: string;
  image?: string | null;
  username?: string | null;
  role?: string | null;
};

/**
 * Extended identity type for test mode.
 * Used when tests need to pass additional fields (like role) in the identity.
 */
export type ExtendedIdentity = {
  subject: string;
  name?: string;
  email?: string;
  pictureUrl?: string;
  username?: string;
  role?: string;
};

// Import your existing plugins
import {
  username,
  magicLink,
  emailOTP,
  admin,
  oneTap,
  multiSession,
  openAPI,
} from 'better-auth/plugins';
import { apiKey } from '@better-auth/api-key';
import { passkey } from '@better-auth/passkey';
import { expo } from '@better-auth/expo';

// Import local schema for Better Auth component (local install)
import authSchema from './betterAuth/schema';
import { resolvePasskeyConfig } from './lib/passkeyConfig';

// Initialize Resend client for email sending
const resendApiKey = process.env.RESEND_API_KEY;
const resendClient = resendApiKey ? new Resend(resendApiKey) : null;

// Placeholder for auth functions - will be wired up by Convex at runtime
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const authFunctionsPlaceholder = {} as any;

// Create the Better Auth client from the Convex component
// Using local install with custom schema to support admin plugin fields
// Triggers auto-create person record when user signs up
export const authComponent = createClient<DataModel, typeof authSchema>(
  components.betterAuth,
  {
    authFunctions: authFunctionsPlaceholder,
    local: {
      schema: authSchema,
    },
    triggers: {
      user: {
        // Automatically create a person record when a new user signs up
        onCreate: async (ctx, user) => {
          // Check if person already exists (shouldn't, but be safe)
          const existingPerson = await ctx.db
            .query('persons')
            .withIndex('by_user_id', q => q.eq('userId', user._id.toString()))
            .first();

          if (!existingPerson) {
            // Create person record
            const now = Date.now();
            const personId = await ctx.db.insert('persons', {
              userId: user._id.toString(),
              updatedAt: now,
            });

            // Create default settings for the person
            await ctx.db.insert('personSettings', {
              personId,
              updatedAt: now,
            });

            console.log(`Created person record for new user: ${user.email}`);
          }
        },
      },
    },
  }
);

// Export trigger functions - required for triggers to work
// These become internal.auth.onCreate, internal.auth.onUpdate, internal.auth.onDelete
export const { onCreate, onUpdate, onDelete } = authComponent.triggersApi();

// Type for the user returned by Better Auth component
export type AuthUser = Awaited<ReturnType<typeof authComponent.getAuthUser>>;

// Type for Better Auth user IDs - extracted from the component's method signature
// This avoids using Id<'user'> which isn't in our schema (user table is in the component)
export type AuthUserId = Parameters<typeof authComponent.getAnyUserById>[1];

type ResolvedPasskeyConfig = ReturnType<typeof resolvePasskeyConfig>;

const ADAPTER_ANALYSIS_PASSKEY_CONFIG = resolvePasskeyConfig({
  siteUrl: 'https://www.groupi.gg',
});

/**
 * Builds the shared Better Auth option shape. The local Convex component is
 * analyzed without deployment environment variables, so callers provide an
 * already-resolved passkey configuration for their execution context.
 */
const createAuthOptionsInternal = (
  ctx: GenericCtx<DataModel>,
  passkeyConfig: ResolvedPasskeyConfig
): BetterAuthOptions => {
  const siteUrl = passkeyConfig.siteOrigin;

  return {
    baseURL: siteUrl,
    database: authComponent.adapter(ctx),

    // Email & Password (matching your current config)
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },

    // Social providers (matching your current config)
    socialProviders: {
      discord: {
        clientId: process.env.DISCORD_CLIENT_ID!,
        clientSecret: process.env.DISCORD_CLIENT_SECRET!,
        scope: ['identify', 'email', 'guilds'],
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },

    // Session configuration (matching your current 7-day expiry)
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 days
      updateAge: 60 * 60 * 24, // 1 day
      cookieCache: {
        enabled: true,
        maxAge: 5 * 60, // Cache session in cookie for 5 minutes
      },
    },

    // Plugins (matching your current setup)
    plugins: [
      convex({ authConfig }),
      username(),
      magicLink({
        sendMagicLink: async ({ email, url }) => {
          // Log magic link for development if debug logging is enabled
          if (process.env.DEBUG_MAGIC_LINKS === 'true') {
            console.log(`🔗 MAGIC LINK - URL: ${url}`);
            console.log(`   Email: ${email}`);
            console.log(`   (Copy this URL to your browser to sign in)`);
          }

          // Send real email if Resend is configured
          if (resendClient) {
            try {
              await resendClient.emails.send({
                from:
                  process.env.RESEND_FROM_EMAIL || 'Groupi <noreply@groupi.gg>',
                to: email,
                subject: 'Sign in to Groupi',
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #2563eb; margin: 0;">Groupi</h1>
                      </div>
                      <h2 style="color: #1f2937;">Sign in to your account</h2>
                      <p>Click the button below to sign in. This link will expire in 10 minutes.</p>
                      <div style="margin: 30px 0; text-align: center;">
                        <a href="${url}" style="background-color: #2563eb; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; display: inline-block; font-weight: 500;">
                          Sign In to Groupi
                        </a>
                      </div>
                      <p style="color: #6b7280; font-size: 14px;">
                        If you didn't request this email, you can safely ignore it.
                      </p>
                      <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 30px 0;" />
                      <p style="color: #9ca3af; font-size: 12px;">
                        Or copy and paste this URL into your browser:<br/>
                        <span style="color: #6b7280; word-break: break-all;">${url}</span>
                      </p>
                    </body>
                  </html>
                `,
              });
              console.log(`📧 Magic link email sent to ${email}`);
            } catch (error) {
              console.error(
                `Failed to send magic link email to ${email}:`,
                error
              );
              // Don't throw - allow the auth flow to continue even if email fails
              // The user can request a new magic link if needed
            }
          } else if (!process.env.DEBUG_MAGIC_LINKS) {
            // Warn if neither Resend nor debug logging is configured
            console.warn(
              `⚠️ Magic link requested for ${email} but RESEND_API_KEY is not configured and DEBUG_MAGIC_LINKS is not enabled`
            );
          }
        },
      }),
      emailOTP({
        otpLength: 6,
        expiresIn: 15 * 60, // 15 minutes
        async sendVerificationOTP({ email, otp, type }) {
          if (type !== 'sign-in') return;

          if (process.env.DEBUG_MAGIC_LINKS === 'true') {
            console.log(`🔢 OTP CODE for ${email}: ${otp}`);
          }

          if (resendClient) {
            try {
              await resendClient.emails.send({
                from:
                  process.env.RESEND_FROM_EMAIL || 'Groupi <noreply@groupi.gg>',
                to: email,
                subject: `${otp} is your Groupi sign-in code`,
                html: `
                  <!DOCTYPE html>
                  <html>
                    <head>
                      <meta charset="utf-8">
                      <meta name="viewport" content="width=device-width, initial-scale=1.0">
                    </head>
                    <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
                      <div style="text-align: center; margin-bottom: 30px;">
                        <h1 style="color: #8b00b8; margin: 0;">Groupi</h1>
                      </div>
                      <h2 style="color: #1f2937;">Your sign-in code</h2>
                      <p>Enter this code in the app to sign in. It expires in 5 minutes.</p>
                      <div style="margin: 30px 0; text-align: center;">
                        <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #8b00b8; background: #f3e8ff; padding: 16px 32px; border-radius: 12px; display: inline-block;">
                          ${otp}
                        </span>
                      </div>
                      <p style="color: #6b7280; font-size: 14px;">
                        If you didn't request this code, you can safely ignore it.
                      </p>
                    </body>
                  </html>
                `,
              });
              console.log(`📧 OTP email sent to ${email}`);
            } catch (error) {
              console.error(`Failed to send OTP email to ${email}:`, error);
            }
          } else if (!process.env.DEBUG_MAGIC_LINKS) {
            console.warn(
              `⚠️ OTP requested for ${email} but RESEND_API_KEY is not configured`
            );
          }
        },
      }),
      // Conditionally add Google One Tap if client ID is configured
      ...(process.env.GOOGLE_CLIENT_ID
        ? [
            oneTap({
              clientId: process.env.GOOGLE_CLIENT_ID,
            }),
          ]
        : []),
      // Passkey authentication
      passkey({
        rpID: passkeyConfig.rpID,
        rpName: passkeyConfig.rpName,
        origin: passkeyConfig.origin,
      }),
      admin(),
      apiKey(),
      // Adds the native OAuth state proxy and returns session cookies only on
      // trusted non-HTTP callback URLs. Ordinary web callbacks remain intact.
      expo(),
      multiSession({
        maximumSessions: 5,
      }),
      openAPI(),
    ],

    // Additional user fields (matching your current schema)
    user: {
      additionalFields: {
        imageKey: { type: 'string', required: false, input: false },
        pronouns: { type: 'string', required: false, input: false },
        bio: { type: 'string', required: false, input: false },
        additionalEmails: { type: 'string', required: false, input: false },
        imageStorageId: { type: 'string', required: false, input: false },
      },
    },

    // Account linking configuration
    // Enables linking OAuth accounts (Discord, Google) to existing users,
    // even when the OAuth email differs from the account email (multi-session scenario)
    account: {
      accountLinking: {
        enabled: true,
        trustedProviders: ['discord', 'google'],
        allowDifferentEmails: true,
      },
    },

    trustedOrigins: [
      siteUrl,
      ...(siteUrl?.includes('://www.')
        ? [siteUrl.replace('://www.', '://')]
        : []),
      'groupi://',
      'exp://',
      'exp://**',
    ].filter(Boolean),
  };
};

/**
 * Creates runtime Better Auth options with strict environment validation.
 */
export const createAuthOptions = (
  ctx: GenericCtx<DataModel>
): BetterAuthOptions => {
  const passkeyConfig = resolvePasskeyConfig({
    androidOrigins: process.env.PASSKEY_ANDROID_ORIGINS,
    siteUrl:
      process.env.SITE_URL ||
      (process.env.VITEST ? 'http://localhost:3000' : undefined),
    rpId: process.env.PASSKEY_RP_ID,
    rpName: process.env.PASSKEY_RP_NAME,
  });

  return createAuthOptionsInternal(ctx, passkeyConfig);
};

/**
 * Creates the static option shape used while Convex analyzes the locally
 * installed Better Auth component. Component analysis cannot access process
 * environment variables; runtime requests never use these placeholder values.
 */
export const createAuthOptionsForAdapter = (
  ctx: GenericCtx<DataModel>
): BetterAuthOptions => {
  return createAuthOptionsInternal(ctx, ADAPTER_ANALYSIS_PASSKEY_CONFIG);
};

/**
 * Creates the Better Auth instance with full configuration.
 */
export const createAuth = (ctx: GenericCtx<DataModel>) => {
  return betterAuth(createAuthOptions(ctx));
};

// Query to get current authenticated user
export const getCurrentUser = query({
  args: {},
  handler: async ctx => {
    return authComponent.getAuthUser(ctx);
  },
});

/**
 * Helper type for query/mutation contexts
 */
type AuthCtx = QueryCtx | MutationCtx;

/**
 * Convert component user ID to string for storage in our tables
 */
function userIdToString(userId: { toString(): string }): string {
  return userId.toString();
}

/**
 * Helper to get user ID from auth context
 * Works with both Better Auth component (production) and ctx.auth (tests)
 */
async function getAuthUserIdFallback(
  ctx: AuthCtx
): Promise<{ userId: string; user: ExtendedAuthUser } | null> {
  try {
    // Try Better Auth component first (production)
    const user = await authComponent.getAuthUser(ctx);
    if (user) {
      // Cast to ExtendedAuthUser to include plugin fields like role, username
      const extendedUser = user as unknown as ExtendedAuthUser;
      return { userId: userIdToString(user._id), user: extendedUser };
    }
    return null;
  } catch (error) {
    // Handle component not registered (tests) or unauthenticated users
    const errorMessage = error instanceof Error ? error.message : String(error);

    // Component not registered - fall back to ctx.auth (test mode)
    if (errorMessage.includes('not registered')) {
      const identity = await ctx.auth.getUserIdentity();
      if (identity) {
        // In test mode, create a mock user object
        const extendedIdentity = identity as ExtendedIdentity;
        return {
          userId: identity.subject,
          user: {
            _id: identity.subject,
            name: identity.name || null,
            email: identity.email || '',
            image: identity.pictureUrl || null,
            username: extendedIdentity.username || null,
            role: extendedIdentity.role || null,
          },
        };
      }
      return null;
    }

    // Unauthenticated error from Better Auth - user not logged in
    if (errorMessage.includes('Unauthenticated')) {
      return null;
    }

    // Re-throw unexpected errors
    throw error;
  }
}

/**
 * Get the current authenticated person record
 * Returns null if not authenticated or person record doesn't exist
 */
export async function getCurrentPerson(ctx: AuthCtx) {
  const authResult = await getAuthUserIdFallback(ctx);
  if (!authResult) return null;

  // Find the associated person record using string ID
  const person = await ctx.db
    .query('persons')
    .withIndex('by_user_id', q => q.eq('userId', authResult.userId))
    .first();

  return person;
}

/**
 * Get both user and person records for the current authenticated user
 * Returns null if not authenticated or person record doesn't exist
 */
export async function getCurrentUserAndPerson(ctx: AuthCtx) {
  const authResult = await getAuthUserIdFallback(ctx);
  if (!authResult) return null;

  const person = await ctx.db
    .query('persons')
    .withIndex('by_user_id', q => q.eq('userId', authResult.userId))
    .first();

  if (!person) return null;

  return { user: authResult.user, person };
}

/**
 * Require authentication and return the current person
 * Throws ConvexError if not authenticated
 */
export async function requireAuth(ctx: AuthCtx) {
  const result = await getCurrentUserAndPerson(ctx);
  if (!result) {
    throw new ConvexError('Authentication required');
  }
  return result;
}

/**
 * Require authentication and return only the person record
 * Throws ConvexError if not authenticated
 */
export async function requirePerson(ctx: AuthCtx) {
  const result = await requireAuth(ctx);
  return result.person;
}

/**
 * Require authentication and return only the user record
 * Throws ConvexError if not authenticated
 */
export async function requireUser(ctx: AuthCtx) {
  const result = await requireAuth(ctx);
  return result.user;
}

/**
 * Check if the current user is an admin
 * Returns false if not authenticated
 * Note: Admin role is managed by Better Auth admin plugin
 */
export async function isAdmin(ctx: AuthCtx): Promise<boolean> {
  const authResult = await getAuthUserIdFallback(ctx);
  if (!authResult) return false;

  // Check if user has admin role using consistent constant
  return isAdminRole(authResult.user.role);
}

/**
 * Require admin privileges
 * Throws ConvexError if not authenticated or not an admin
 */
export async function requireAdmin(ctx: AuthCtx) {
  const user = await requireUser(ctx);
  if (!(await isAdmin(ctx))) {
    throw new ConvexError('Admin privileges required');
  }
  return user;
}

/**
 * Get user membership for a specific event
 * Returns null if not a member or not authenticated
 */
export async function getEventMembership(ctx: AuthCtx, eventId: string) {
  const person = await getCurrentPerson(ctx);
  if (!person) return null;

  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', eventId as Id<'events'>)
    )
    .first();

  return membership;
}

/**
 * Require event membership and return the membership record
 * Throws ConvexError if not authenticated or not a member
 */
export async function requireEventMembership(ctx: AuthCtx, eventId: string) {
  const membership = await getEventMembership(ctx, eventId);
  if (!membership) {
    throw new ConvexError('Event membership required');
  }
  return membership;
}

/**
 * Check if user has a specific role in an event
 * Returns false if not authenticated or not a member with that role
 */
export async function hasEventRole(
  ctx: AuthCtx,
  eventId: string,
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE'
) {
  const membership = await getEventMembership(ctx, eventId);
  if (!membership) return false;

  // ORGANIZER has all permissions
  if (role === 'ATTENDEE') return true;
  if (role === 'MODERATOR')
    return membership.role === 'ORGANIZER' || membership.role === 'MODERATOR';
  if (role === 'ORGANIZER') return membership.role === 'ORGANIZER';

  return false;
}

/**
 * Require specific event role
 * Throws ConvexError if not authenticated or doesn't have the required role
 * Returns { user, person, membership } for callers that need auth context
 */
export async function requireEventRole(
  ctx: AuthCtx,
  eventId: string,
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE'
) {
  const { user, person } = await requireAuth(ctx);

  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', person._id).eq('eventId', eventId as Id<'events'>)
    )
    .first();

  if (!membership) {
    throw new ConvexError('Event membership required');
  }

  if (role === 'MODERATOR') {
    if (membership.role !== 'ORGANIZER' && membership.role !== 'MODERATOR') {
      throw new ConvexError(`${role} role required for this event`);
    }
  } else if (role === 'ORGANIZER') {
    if (membership.role !== 'ORGANIZER') {
      throw new ConvexError(`${role} role required for this event`);
    }
  }

  return { user, person, membership };
}

const ROLE_HIERARCHY: Record<string, number> = {
  ATTENDEE: 1,
  MODERATOR: 2,
  ORGANIZER: 3,
};

/**
 * Resolve effective permissions for an event, applying defaults for missing values.
 */
export function resolveEventPermissions(event: {
  permissions?: {
    createPosts?: PermissionLevel;
    inviteMembers?: PermissionLevel;
    viewAttendeeList?: PermissionLevel;
  };
}): Record<EventPermissionKey, PermissionLevel> {
  return {
    createPosts:
      event.permissions?.createPosts ?? DEFAULT_EVENT_PERMISSIONS.createPosts,
    inviteMembers:
      event.permissions?.inviteMembers ??
      DEFAULT_EVENT_PERMISSIONS.inviteMembers,
    viewAttendeeList:
      event.permissions?.viewAttendeeList ??
      DEFAULT_EVENT_PERMISSIONS.viewAttendeeList,
  };
}

/**
 * Check if user has a configurable event permission.
 * Reads the event's permission settings and checks against the user's role.
 */
export async function requireEventPermission(
  ctx: AuthCtx,
  eventId: string,
  permission: EventPermissionKey
) {
  const membership = await requireEventMembership(ctx, eventId);

  const event = await ctx.db.get(eventId as Id<'events'>);
  if (!event) {
    throw new ConvexError('Event not found');
  }

  const level: PermissionLevel =
    event.permissions?.[permission] ?? DEFAULT_EVENT_PERMISSIONS[permission];

  const requiredLevel =
    ROLE_HIERARCHY[level === 'EVERYONE' ? 'ATTENDEE' : level] ?? 1;
  const userLevel = ROLE_HIERARCHY[membership.role] ?? 0;

  if (userLevel < requiredLevel) {
    throw new ConvexError(
      `Permission denied: this action requires ${level === 'EVERYONE' ? 'event membership' : `${level} role`}`
    );
  }

  return membership;
}

/**
 * Non-throwing version: returns boolean for conditional checks.
 */
export async function hasEventPermission(
  ctx: AuthCtx,
  eventId: string,
  permission: EventPermissionKey
): Promise<boolean> {
  try {
    await requireEventPermission(ctx, eventId, permission);
    return true;
  } catch {
    return false;
  }
}

/**
 * Get person record by ID
 * Note: Better Auth component only exposes getAuthUser for current user
 * User data from component must be fetched separately via client-side APIs
 */
export async function getPersonById(ctx: AuthCtx, personId: string) {
  const person = await ctx.db.get(personId as Id<'persons'>);
  if (!person) return null;

  return person;
}

/**
 * Helper to get any user by ID
 * Works with both Better Auth component (production) and returns stub in tests
 */
async function getAnyUserByIdFallback(
  ctx: AuthCtx,
  userId: string
): Promise<{
  _id: string;
  name: string | null;
  email: string | null;
  image: string | null;
  username: string | null;
  role?: string | null;
}> {
  try {
    // Try Better Auth component first (production)
    const user = await authComponent.getAnyUserById(ctx, userId as AuthUserId);
    if (user) {
      const extendedUser = user as ExtendedAuthUser;
      return {
        _id: extendedUser._id?.toString() || userId,
        name: extendedUser.name || null,
        email: extendedUser.email,
        image: extendedUser.image || null,
        username: extendedUser.username || null,
        role: extendedUser.role || null,
      };
    }
  } catch (error) {
    // Component not registered (likely in tests) - return stub
    const errorMessage = error instanceof Error ? error.message : String(error);
    if (errorMessage.includes('not registered')) {
      return {
        _id: userId,
        name: null,
        email: null,
        image: null,
        username: null,
        role: null,
      };
    }
    throw error;
  }

  return {
    _id: userId,
    name: null,
    email: null,
    image: null,
    username: null,
    role: null,
  };
}

/**
 * Get person with associated user data by person ID
 *
 * Uses the Better Auth component's getAnyUserById() method to look up
 * user data for any user, not just the current authenticated user.
 */
export async function getPersonWithUser(
  ctx: AuthCtx,
  personId: string | { toString(): string }
) {
  const personIdStr =
    typeof personId === 'string' ? personId : personId.toString();

  const person = await ctx.db.get(personIdStr as Id<'persons'>);

  if (!person) return null;

  // Use Better Auth component (or fallback) to look up user data
  const user = await getAnyUserByIdFallback(ctx, person.userId);

  return { person, user };
}

/**
 * Get the authenticated user without requiring a person record.
 * Used for onboarding flow where person record may not exist yet.
 * Throws ConvexError if not authenticated.
 */
export async function requireAuthUser(ctx: AuthCtx) {
  const authResult = await getAuthUserIdFallback(ctx);
  if (!authResult) {
    throw new ConvexError('Authentication required');
  }
  return authResult;
}

/**
 * Create or update a person record for a user
 * Used during user onboarding or account linking
 */
export async function ensurePersonRecord(ctx: MutationCtx, userId: string) {
  // Check if person already exists
  let person = await ctx.db
    .query('persons')
    .withIndex('by_user_id', q => q.eq('userId', userId))
    .first();

  if (!person) {
    // Create new person record
    const now = Date.now();
    const personId = await ctx.db.insert('persons', {
      userId: userId,
      updatedAt: now,
    });
    person = await ctx.db.get(personId);

    // Create default settings
    if (person) {
      await ctx.db.insert('personSettings', {
        personId: person._id,
        updatedAt: now,
      });
    }
  }

  return person;
}

/**
 * Get the person record for a given user ID
 * Returns null if person doesn't exist
 */
export async function getPersonForUser(ctx: AuthCtx, userId: string) {
  const person = await ctx.db
    .query('persons')
    .withIndex('by_user_id', q => q.eq('userId', userId))
    .first();

  return person;
}
