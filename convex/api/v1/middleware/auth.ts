import { HTTPException } from 'hono/http-exception';
import type { ActionCtx } from '../../../_generated/server';
import { internal } from '../../../_generated/api';

/**
 * API Key authentication for REST API
 *
 * Validates the API key from the x-api-key header and returns user info.
 */

// Type for authenticated user info
export type AuthenticatedUser = {
  userId: string;
  personId: string;
};

/**
 * Validate API key and return authenticated user info
 *
 * @param ctx - Convex action context
 * @param apiKey - The API key from the request header
 * @returns Authenticated user info or throws HTTPException
 */
export async function validateApiKey(
  ctx: ActionCtx,
  apiKey: string | undefined
): Promise<AuthenticatedUser> {
  if (!apiKey) {
    throw new HTTPException(401, {
      message: 'Missing API key. Include x-api-key header with your request.',
    });
  }

  // Validate API key format (should start with grp_ or similar prefix)
  // Better Auth uses various prefixes, so we'll be flexible
  if (apiKey.length < 10) {
    throw new HTTPException(401, {
      message: 'Invalid API key format.',
    });
  }

  try {
    // Use internal mutation to validate the API key
    // (mutation allows using ctx.runQuery for Better Auth adapter access)
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589) due to complex internal function types
    const validateFn = internal.api.v1.internal.auth.validateApiKey;
    const result = (await ctx.runMutation(validateFn, { apiKey })) as
      | { userId: string; personId: string }
      | { error: string }
      | null;

    if (!result) {
      throw new HTTPException(401, {
        message: 'Invalid API key.',
      });
    }

    if ('error' in result) {
      throw new HTTPException(401, {
        message: result.error,
      });
    }

    return {
      userId: result.userId,
      personId: result.personId,
    };
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('API key validation error:', error);
    throw new HTTPException(500, {
      message: 'Authentication error.',
    });
  }
}

/**
 * Get API key from request headers
 */
export function getApiKey(headers: Headers): string | undefined {
  return headers.get('x-api-key') ?? undefined;
}

/**
 * Require event membership for a user
 */
export async function requireEventMembership(
  ctx: ActionCtx,
  eventId: string,
  personId: string
): Promise<{
  membershipId: string;
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
}> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Type instantiation is excessively deep (TS2589)
  const getMembershipFn = internal.api.v1.internal.auth.getEventMembership;
  const membership = await ctx.runQuery(getMembershipFn, { eventId, personId });

  if (!membership) {
    throw new HTTPException(403, {
      message: 'You are not a member of this event.',
    });
  }

  return membership;
}

/**
 * Require a minimum role level in an event
 */
export async function requireEventRole(
  ctx: ActionCtx,
  eventId: string,
  personId: string,
  minimumRole: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE'
): Promise<{
  membershipId: string;
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
}> {
  const membership = await requireEventMembership(ctx, eventId, personId);

  const roleHierarchy: Record<string, number> = {
    ORGANIZER: 3,
    MODERATOR: 2,
    ATTENDEE: 1,
  };

  const userLevel = roleHierarchy[membership.role] ?? 0;
  const requiredLevel = roleHierarchy[minimumRole] ?? 0;

  if (userLevel < requiredLevel) {
    throw new HTTPException(403, {
      message: `${minimumRole} role or higher required for this action.`,
    });
  }

  return membership;
}

/**
 * Check if user can modify a post (author or moderator+)
 */
export async function canModifyPost(
  ctx: ActionCtx,
  postId: string,
  personId: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Type instantiation is excessively deep (TS2589)
  const canModifyPostFn = internal.api.v1.internal.auth.canModifyPost;
  const result = await ctx.runQuery(canModifyPostFn, { postId, personId });
  return result ?? false;
}

/**
 * Check if user can modify a reply (author or moderator+)
 */
export async function canModifyReply(
  ctx: ActionCtx,
  replyId: string,
  personId: string
): Promise<boolean> {
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore - Type instantiation is excessively deep (TS2589)
  const canModifyReplyFn = internal.api.v1.internal.auth.canModifyReply;
  const result = await ctx.runQuery(canModifyReplyFn, { replyId, personId });
  return result ?? false;
}
