import { ConvexError } from 'convex/values';
import { readUploadBlob } from '../files/uploads';
import { ALLOWED_MIME_TYPES } from '../attachments/model';
import type { ActionCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { internal } from '../_generated/api';
import type { FunctionArgs } from 'convex/server';
export async function handleBoundedRequest(
  ctx: ActionCtx,
  request: Request,
  credentialId: Id<'authorizationCredentials'>
) {
  const url = new URL(request.url);
  const path = url.pathname.replace(/^\/api\/v[12]/, '');
  const parts = path.split('/').filter(Boolean).map(decodeURIComponent);
  const method = request.method;
  const isV1 = url.pathname.startsWith('/api/v1/');
  const respond = <T>(data: T, status = 200) =>
    Response.json(isV1 ? { success: true, data } : data, { status });
  const forbidden = () =>
    Response.json(
      {
        ...(isV1 ? { success: false } : {}),
        error: {
          code: 'FORBIDDEN',
          message: 'Credential does not permit this operation.',
        },
      },
      { status: 403 }
    );
  if (
    !isV1 &&
    parts[0] === 'groups' &&
    parts.length === 3 &&
    parts[2] === 'community-context' &&
    method === 'GET'
  ) {
    try {
      return respond(
        await ctx.runQuery(internal.groups.community.readContext, {
          credentialId,
          groupId: parts[1],
          cursor: url.searchParams.get('cursor') ?? undefined,
        })
      );
    } catch (error) {
      if (error instanceof ConvexError) return forbidden();
      return Response.json(
        {
          error: {
            code: 'UNAVAILABLE',
            message: 'Community service unavailable.',
          },
        },
        { status: 503 }
      );
    }
  }
  if (
    !isV1 &&
    parts[0] === 'groups' &&
    parts[2] === 'community-applications' &&
    ((parts.length === 3 && method === 'POST') ||
      (parts.length === 4 && method === 'PATCH') ||
      (parts.length === 5 && parts[4] === 'withdraw' && method === 'POST'))
  ) {
    try {
      return respond(
        await ctx.runMutation(internal.groups.communityApplications.execute, {
          credentialId,
          groupId: parts[1],
          applicationId: parts[3],
          operationId: request.headers.get('Idempotency-Key') ?? '',
          operation:
            parts.length === 3
              ? 'submit'
              : parts.length === 4
                ? 'edit'
                : 'withdraw',
          bodyJson: await request.text(),
        })
      );
    } catch (error) {
      let data: unknown = error instanceof ConvexError ? error.data : null;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          data = null;
        }
      }
      if (data && typeof data === 'object' && 'code' in data) {
        const code = String(data.code);
        if (code === 'FORBIDDEN') return forbidden();
        if (
          [
            'STALE_REVISION',
            'CONFLICT',
            'IDEMPOTENCY_CONFLICT',
            'IDEMPOTENCY_EXPIRED',
            'VALIDATION_ERROR',
          ].includes(code)
        )
          return Response.json(
            { error: data },
            { status: code === 'VALIDATION_ERROR' ? 400 : 409 }
          );
      }
      if (error instanceof SyntaxError)
        return Response.json(
          { error: { code: 'VALIDATION_ERROR', message: 'Invalid JSON.' } },
          { status: 400 }
        );
      return Response.json(
        {
          error: {
            code: 'UNAVAILABLE',
            message: 'Community service unavailable.',
          },
        },
        { status: 503 }
      );
    }
  }
  if (
    !isV1 &&
    parts[0] === 'groups' &&
    parts.length === 3 &&
    parts[2] === 'current-event' &&
    method === 'GET'
  ) {
    try {
      return respond(
        await ctx.runQuery(internal.groups.currentEvent.readCurrentEvent, {
          credentialId,
          groupId: parts[1],
        })
      );
    } catch (error) {
      if (error instanceof ConvexError) return forbidden();
      return Response.json(
        {
          error: {
            code: 'UNAVAILABLE',
            message: 'Current Event service unavailable.',
          },
        },
        { status: 503 }
      );
    }
  }
  if (
    !isV1 &&
    parts[0] === 'groups' &&
    ((parts.length === 3 &&
      parts[2] === 'community-leave' &&
      method === 'POST') ||
      (parts.length === 5 &&
        parts[2] === 'events' &&
        ((['join', 'leave'].includes(parts[4]) && method === 'POST') ||
          (parts[4] === 'own-rsvp' && method === 'PUT'))))
  ) {
    try {
      return respond(
        await ctx.runMutation(internal.groups.communityParticipation.execute, {
          credentialId,
          groupId: parts[1],
          eventId: parts.length === 5 ? parts[3] : undefined,
          operation:
            parts.length === 3
              ? 'leave-group'
              : parts[4] === 'join'
                ? 'join'
                : parts[4] === 'leave'
                  ? 'leave-event'
                  : 'rsvp',
          operationId: request.headers.get('Idempotency-Key') ?? '',
          bodyJson: await request.text(),
        })
      );
    } catch (error) {
      let data: unknown = error instanceof ConvexError ? error.data : null;
      if (typeof data === 'string') {
        try {
          data = JSON.parse(data);
        } catch {
          data = null;
        }
      }
      if (data && typeof data === 'object' && 'code' in data) {
        const code = String(data.code);
        if (code === 'FORBIDDEN') return forbidden();
        if (
          [
            'STALE_REVISION',
            'PROTECTED_OWNER',
            'PROTECTED_ORGANIZER',
            'STAFF_CONFIGURATION_CONFLICT',
            'CONFLICT',
            'IDEMPOTENCY_CONFLICT',
            'IDEMPOTENCY_EXPIRED',
            'VALIDATION_ERROR',
          ].includes(code)
        )
          return Response.json(
            { error: data },
            { status: code === 'VALIDATION_ERROR' ? 400 : 409 }
          );
      }
      return Response.json(
        {
          error: {
            code: 'UNAVAILABLE',
            message: 'Participation service unavailable.',
          },
        },
        { status: 503 }
      );
    }
  }
  if (isV1 && parts[0] === 'uploads') return forbidden();
  if (parts[0] === 'uploads' && parts.length === 1 && method === 'POST') {
    const eventId = url.searchParams.get('eventId');
    if (
      !eventId ||
      (url.searchParams.get('purpose') ?? 'attachment') !== 'attachment'
    )
      return forbidden();
    const blob = await readUploadBlob(request);
    if (
      blob.size <= 0 ||
      blob.size > 10 * 1024 * 1024 ||
      !Object.values(ALLOWED_MIME_TYPES).some(types =>
        (types as readonly string[]).includes(blob.type)
      )
    )
      return Response.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'Unsupported attachment type or size.',
          },
        },
        { status: 400 }
      );
    const filename = request.headers.get('X-Filename') ?? 'upload';
    if (!filename.trim() || filename.length > 255)
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid filename.' } },
        { status: 400 }
      );
    const storageId = await ctx.storage.store(blob);
    try {
      await ctx.runMutation(internal.authorization.uploads.register, {
        credentialId,
        eventId: eventId as Id<'events'>,
        storageId,
        mimeType: blob.type,
        size: blob.size,
      });
    } catch {
      await ctx.storage.delete(storageId);
      return forbidden();
    }
    return Response.json(
      { storageId, filename, mimeType: blob.type, size: blob.size },
      { status: 201 }
    );
  }
  if (
    parts[0] === 'uploads' &&
    parts.length === 2 &&
    ['GET', 'DELETE'].includes(method)
  ) {
    try {
      const args = { credentialId, storageId: parts[1] as Id<'_storage'> };
      if (method === 'DELETE') {
        await ctx.runMutation(internal.authorization.uploads.discard, args);
        return new Response(null, { status: 204 });
      }
      return Response.json(
        await ctx.runMutation(internal.authorization.uploads.read, args)
      );
    } catch {
      return forbidden();
    }
  }
  let input:
    | FunctionArgs<typeof internal.authorization.rest.execute>['request']
    | undefined;
  const paging = {
    limit: url.searchParams.has('limit')
      ? Number(url.searchParams.get('limit'))
      : undefined,
    cursor: url.searchParams.get('cursor') ?? undefined,
    paged:
      url.searchParams.get('pagination') === 'cursor' ||
      url.searchParams.has('cursor') ||
      url.searchParams.has('limit'),
  };
  if (parts[0] === 'events' && parts.length === 1 && method === 'GET')
    input = { operation: 'events.list', ...paging };
  if (
    parts[0] === 'events' &&
    parts.length === 2 &&
    (method === 'GET' || method === 'PATCH')
  )
    input = {
      operation: method === 'GET' ? 'events.read' : 'events.update',
      eventId: parts[1] as Id<'events'>,
    };
  if (
    parts[0] === 'events' &&
    parts[2] === 'members' &&
    parts.length === 3 &&
    method === 'GET'
  )
    input = {
      operation: 'members.read',
      eventId: parts[1] as Id<'events'>,
      ...paging,
    };
  if (parts[0] === 'profile' && method === 'GET')
    input =
      parts.length === 1
        ? { operation: 'identity.read' }
        : parts.length === 2
          ? {
              operation: 'profiles.read',
              username: parts[1],
              eventId: (url.searchParams.get('eventId') ?? undefined) as
                | Id<'events'>
                | undefined,
            }
          : undefined;
  if (
    parts[0] === 'events' &&
    parts[2] === 'posts' &&
    parts.length === 3 &&
    (method === 'GET' || method === 'POST')
  )
    input = {
      operation: method === 'GET' ? 'discussion.list' : 'discussion.create',
      kind: 'posts',
      eventId: parts[1] as Id<'events'>,
      ...paging,
    };
  if (
    parts[0] === 'posts' &&
    parts[2] === 'replies' &&
    parts.length === 3 &&
    (method === 'GET' || method === 'POST')
  )
    input = {
      operation: method === 'GET' ? 'discussion.list' : 'discussion.create',
      kind: 'replies',
      postId: parts[1] as Id<'posts'>,
      ...paging,
    };
  if (
    (parts[0] === 'posts' || parts[0] === 'replies') &&
    parts.length === 2 &&
    ['GET', 'PATCH', 'DELETE'].includes(method)
  )
    input = {
      operation:
        method === 'GET'
          ? 'discussion.read'
          : method === 'PATCH'
            ? 'discussion.update'
            : 'discussion.delete',
      kind: parts[0],
      ...(parts[0] === 'posts'
        ? { postId: parts[1] as Id<'posts'> }
        : { replyId: parts[1] as Id<'replies'> }),
    };
  if (!input) return forbidden();
  try {
    if (method === 'PATCH' || method === 'POST')
      input.body = await request.json();
    const result = await ctx.runMutation(internal.authorization.rest.execute, {
      credentialId,
      request: input,
    });
    return result.status === 204
      ? isV1
        ? respond({
            message:
              input.kind === 'posts'
                ? 'Post deleted successfully'
                : 'Reply deleted successfully',
          })
        : new Response(null, { status: 204 })
      : result.status >= 400
        ? forbidden()
        : respond(result.data, result.status);
  } catch (error) {
    if (error instanceof Error && error.message.includes('VALIDATION_ERROR'))
      return Response.json(
        { error: { code: 'VALIDATION_ERROR', message: 'Invalid request.' } },
        { status: 400 }
      );
    return forbidden();
  }
}

/** Header-only credentials may be used from browser clients without cookies. */
export async function boundedCors(response: Response) {
  const headers = new Headers(response.headers);
  headers.set('Cache-Control', 'private, no-store');
  headers.set('Vary', 'Authorization, x-api-key');
  headers.set('Access-Control-Allow-Origin', '*');
  headers.set('Access-Control-Expose-Headers', 'Content-Length, Retry-After');
  return new Response(
    response.status === 204 ? null : await response.arrayBuffer(),
    { status: response.status, headers }
  );
}
