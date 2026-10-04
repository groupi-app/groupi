import { OpenAPIHono, createRoute } from '@hono/zod-openapi';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { createValidationHook } from '../validation';
import { ErrorResponseSchema } from '../schemas/common';
import {
  CreateInviteListSchema,
  InviteListCollectionSchema,
  InviteListDetailSchema,
  InviteListIdParamSchema,
  InviteListPeopleSchema,
  InviteListSearchQuerySchema,
  UpdateInviteListSchema,
  DeleteInviteListSchema,
  InviteListSendSchema,
  InviteListSendResultSchema,
  InviteListSendHeadersSchema,
} from '../schemas/inviteLists';

type Variables = { ctx: ActionCtx; userId: string; personId: string };
const errors = {
  400: {
    description: 'Invalid request or Invite list limit reached',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  401: {
    description: 'Authentication required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'API key does not permit this resource and action',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
} as const;

export function createInviteListRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  app.openapi(
    createRoute({
      method: 'post',
      path: '/invite-lists/{inviteListId}/invite-to-event',
      tags: ['Invite lists'],
      summary: 'Invite a list’s current people to an event',
      description:
        'Explicitly expand the caller-owned list and send ordinary pending invitations. Requires invite-lists:write scope and current event invitation authority; grants do not bypass event roles. Attendee is the default; Moderator is organizer-only. At most 100 distinct recipients. Deleted people are anonymized and skipped using UNAVAILABLE. A Needs attention list with no existing people rejects fresh sends until repaired with an existing user. Confidential skips use UNAVAILABLE. No membership or RSVP is created. A protected retry returns its original outcome and recipient snapshot even after list edits/deletion or recipient account deletion; current event authority is still checked. Zero sentCount means no invitations were sent.',
      security: [{ apiKey: [] }],
      request: {
        params: InviteListIdParamSchema,
        headers: InviteListSendHeadersSchema,
        body: {
          required: true,
          content: { 'application/json': { schema: InviteListSendSchema } },
        },
      },
      responses: {
        200: {
          description: 'Truthful sent/skipped result',
          content: {
            'application/json': { schema: InviteListSendResultSchema },
          },
        },
        ...errors,
        404: {
          description: 'Invite list not found',
          content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        409: {
          description: 'Changed-input or expired protected request identifier',
          content: { 'application/json': { schema: ErrorResponseSchema } },
        },
      },
    }),
    async c =>
      c.json(
        await c
          .get('ctx')
          .runMutation(internal.inviteLists.rest.inviteToEvent, {
            personId: c.get('personId') as Id<'persons'>,
            userId: c.get('userId'),
            inviteListId: c.req.valid('param').inviteListId,
            ...c.req.valid('json'),
            requestId: c.req.header('Idempotency-Key'),
          }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/invite-lists/{inviteListId}',
      tags: ['Invite lists'],
      summary: 'Edit a private Invite list',
      description:
        'Replace only supplied fields and validate the final saved selection. At least one current existing user is required on save. Previously saved deleted identities may remain as anonymous unavailable entries alongside existing users; newly submitted missing identities are rejected. Repair a Needs attention list by adding an existing user. Changes are silent. Requires invite-lists:write scope.',
      security: [{ apiKey: [] }],
      request: {
        params: InviteListIdParamSchema,
        body: {
          required: true,
          content: { 'application/json': { schema: UpdateInviteListSchema } },
        },
      },
      responses: {
        200: {
          description: 'Updated Invite list',
          content: { 'application/json': { schema: InviteListDetailSchema } },
        },
        ...errors,
        404: {
          description: 'Invite list not found',
          content: { 'application/json': { schema: ErrorResponseSchema } },
        },
        409: {
          description: 'A list with this name already exists',
          content: { 'application/json': { schema: ErrorResponseSchema } },
        },
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.inviteLists.rest.update, {
          creatorId: c.get('personId') as Id<'persons'>,
          inviteListId: c.req.valid('param').inviteListId,
          ...c.req.valid('json'),
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'delete',
      path: '/invite-lists/{inviteListId}',
      tags: ['Invite lists'],
      summary: 'Delete a private Invite list',
      description:
        'Remove a future picker choice without changing existing invitations or event participation. Requires invite-lists:write scope.',
      security: [{ apiKey: [] }],
      request: { params: InviteListIdParamSchema },
      responses: {
        200: {
          description: 'Deletion receipt',
          content: { 'application/json': { schema: DeleteInviteListSchema } },
        },
        ...errors,
        404: {
          description: 'Invite list not found',
          content: { 'application/json': { schema: ErrorResponseSchema } },
        },
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.inviteLists.rest.remove, {
          creatorId: c.get('personId') as Id<'persons'>,
          inviteListId: c.req.valid('param').inviteListId,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/invite-lists/people/search',
      tags: ['Invite lists'],
      summary: 'Search existing people by username',
      description:
        'Use the existing username picker without an event or friendship prerequisite. Excludes self and blocked users. Requires invite-lists:read scope.',
      security: [{ apiKey: [] }],
      request: { query: InviteListSearchQuerySchema },
      responses: {
        200: {
          description: 'Selectable existing people',
          content: { 'application/json': { schema: InviteListPeopleSchema } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.inviteLists.rest.searchPeople, {
          personId: c.get('personId') as Id<'persons'>,
          searchTerm: c.req.valid('query').q,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/invite-lists/people/friends',
      tags: ['Invite lists'],
      summary: 'List accepted friend choices',
      description:
        'Selectable accepted friends without an event prerequisite. Requires invite-lists:read scope.',
      security: [{ apiKey: [] }],
      responses: {
        200: {
          description: 'Selectable accepted friends',
          content: { 'application/json': { schema: InviteListPeopleSchema } },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.inviteLists.rest.friendChoices, {
          personId: c.get('personId') as Id<'persons'>,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/invite-lists',
      tags: ['Invite lists'],
      summary: 'List private Invite lists',
      description:
        'Read only the authenticated creator’s lists. Maximum 100 lists per creator. Requires invite-lists:read scope.',
      security: [{ apiKey: [] }],
      responses: {
        200: {
          description: 'Creator-owned Invite lists',
          content: {
            'application/json': { schema: InviteListCollectionSchema },
          },
        },
        ...errors,
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.inviteLists.rest.list, {
          creatorId: c.get('personId') as Id<'persons'>,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/invite-lists',
      tags: ['Invite lists'],
      summary: 'Create a private Invite list',
      description:
        'Save existing people without invitations, notifications or event participation changes. Maximum 100 lists per creator and 100 distinct people per list. Requires invite-lists:write scope.',
      security: [{ apiKey: [] }],
      request: {
        body: {
          required: true,
          content: { 'application/json': { schema: CreateInviteListSchema } },
        },
      },
      responses: {
        201: {
          description: 'Created Invite list',
          content: { 'application/json': { schema: InviteListDetailSchema } },
        },
        ...errors,
        409: {
          description: 'A list with this name already exists for this creator',
          content: { 'application/json': { schema: ErrorResponseSchema } },
        },
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.inviteLists.rest.create, {
          creatorId: c.get('personId') as Id<'persons'>,
          ...c.req.valid('json'),
        }),
        201
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/invite-lists/{inviteListId}',
      tags: ['Invite lists'],
      summary: 'Inspect a private Invite list',
      description:
        'Resolve current display data for saved people. Deleted people retain their stable identity with null name, username, and image and available:false. A named list with no existing people is retained with needsAttention:true and cannot be used until repaired. Missing and other-creator lists have the same not-found response. Requires invite-lists:read scope.',
      security: [{ apiKey: [] }],
      request: { params: InviteListIdParamSchema },
      responses: {
        200: {
          description: 'Creator-owned Invite list detail',
          content: { 'application/json': { schema: InviteListDetailSchema } },
        },
        ...errors,
        404: {
          description: 'Invite list not found',
          content: { 'application/json': { schema: ErrorResponseSchema } },
        },
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.inviteLists.rest.get, {
          creatorId: c.get('personId') as Id<'persons'>,
          inviteListId: c.req.valid('param').inviteListId,
        }),
        200
      )
  );
  return app;
}
