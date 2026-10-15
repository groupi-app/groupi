import { secretHash } from '../../authorization/model';
import { HTTPException } from 'hono/http-exception';
import type { ActionCtx } from '../../_generated/server';
import { internal } from '../../_generated/api';

/**
 * API Key authentication for REST API
 *
 * Validates the API key from the x-api-key header and returns user info.
 */

// Verified transport context. Secrets never cross into route variables.
// Add new variants only with an explicit dispatcher and domain enforcement.
export class DelegatedCredentialError extends HTTPException {
  constructor(
    readonly code: 'TOKEN_EXPIRED' | 'CONNECTION_REVOKED' | 'FORBIDDEN'
  ) {
    super(code === 'FORBIDDEN' ? 403 : 401, {
      message: 'Delegated credentials unavailable; reconnect as needed.',
    });
  }
}
export type CredentialContext = {
  kind: 'legacy-api-key' | 'bounded';
  credentialId: string;
};

// Type for authenticated user info
export type AuthenticatedUser = {
  credential: CredentialContext;
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
  apiKey: string | undefined,
  request: Request
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
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore - Type instantiation is excessively deep (TS2589) due to complex internal function types
    const validateFn = internal.api.auth.validateApiKey;
    // Scopes follow the top-level REST collection; read = GET/HEAD, write = all other methods.
    const collection = new URL(request.url).pathname.split('/')[3] ?? '';
    const resource =
      collection === 'event-applications' ? 'events' : collection;
    const action =
      request.method === 'GET' || request.method === 'HEAD' ? 'read' : 'write';
    const result = await ctx.runMutation(validateFn, {
      apiKey,
      resource,
      action,
      ...(request.method === 'POST' &&
      new URL(request.url).pathname === '/api/v2/auth/cli/revoke'
        ? { selfRevoke: true }
        : {}),
    });

    if (!result) {
      throw new HTTPException(401, {
        message: 'Invalid API key.',
      });
    }

    if ('error' in result) {
      throw new HTTPException(result.status ?? 401, {
        message: result.error,
        res: new Response(null, {
          status: result.status ?? 401,
          headers: result.retryAfter
            ? { 'Retry-After': String(result.retryAfter) }
            : {},
        }),
      });
    }

    return {
      userId: result.userId,
      personId: result.personId,
      credential: result.credential,
    };
  } catch (error) {
    if (error instanceof HTTPException) {
      throw error;
    }
    console.error('API key validation failed');
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
  const getMembershipFn = internal.api.auth.getEventMembership;
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
  const canModifyPostFn = internal.api.auth.canModifyPost;
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
  const canModifyReplyFn = internal.api.auth.canModifyReply;
  const result = await ctx.runQuery(canModifyReplyFn, { replyId, personId });
  return result ?? false;
}

/** Distinguish bounded tokens before entering any legacy account adapter. */
export async function validateRequestCredential(
  ctx: ActionCtx,
  request: Request
): Promise<AuthenticatedUser> {
  const key = getApiKey(request.headers);
  const authorization = request.headers.get('Authorization');
  if (key && authorization)
    throw new HTTPException(401, {
      message: 'Present exactly one credential.',
    });
  let token: string | undefined;
  let kind: 'named-key' | 'delegated-access' | undefined;
  if (authorization) {
    if (!new URL(request.url).pathname.startsWith('/api/v2/'))
      throw new HTTPException(401, {
        message: 'Credential audience does not permit this API version.',
      });
    const match = /^Bearer ([^\s]+)$/i.exec(authorization);
    if (!match || match[1].length > 8192)
      throw new HTTPException(401, { message: 'Invalid bearer credential.' });
    token = match[1];
    kind = 'delegated-access';
  } else if (key?.startsWith('grp_b_')) {
    token = key;
    kind = 'named-key';
  }
  if (token && kind) {
    const result = await ctx.runMutation(
      internal.api.auth.validateBoundedToken,
      { tokenHash: await secretHash(token), kind }
    );
    if (!result)
      throw new HTTPException(401, {
        message: 'Invalid or inactive credential.',
      });
    if ('errorCode' in result)
      throw new DelegatedCredentialError(result.errorCode ?? 'FORBIDDEN');
    return result;
  }
  return validateApiKey(ctx, key, request);
}
