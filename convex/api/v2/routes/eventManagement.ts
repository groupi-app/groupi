import { OpenAPIHono, createRoute, z } from '@hono/zod-openapi';
import { createValidationHook } from '../validation';
import type { ActionCtx } from '../../../_generated/server';
import type { Id } from '../../../_generated/dataModel';
import { internal } from '../../../_generated/api';
import { ErrorResponseSchema, EventIdParamSchema } from '../schemas/common';
import { EventListQuerySchema } from '../schemas/events';
type Variables = { ctx: ActionCtx; personId: string; userId: string };
const level = z.enum(['EVERYONE', 'MODERATOR', 'ORGANIZER']);
const visibility = z.enum(['PRIVATE', 'FRIENDS', 'PUBLIC']);
const permissions = z.object({
  createPosts: level,
  inviteMembers: level,
  viewAttendeeList: level,
});
const admissionPolicy = z.enum(['INVITATION_ONLY', 'DIRECT', 'APPLY']);
const settings = z.object({
  eventId: z.string(),
  visibility,
  permissions,
  admissionPolicy,
});
const errors = {
  400: {
    description: 'Invalid input or cursor',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  401: {
    description: 'Authentication required',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  403: {
    description: 'Insufficient event authority or eligibility',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
  404: {
    description: 'Event or membership not found',
    content: { 'application/json': { schema: ErrorResponseSchema } },
  },
};
export function createEventManagementRoutes() {
  const app = new OpenAPIHono<{ Variables: Variables }>({
    defaultHook: createValidationHook<{ Variables: Variables }>(),
  });
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/logistics',
      tags: ['Events'],
      security: [{ apiKey: [] }],
      summary: 'Read viewer-safe event logistics before joining',
      description:
        'Audience-qualified viewers can read logistics without membership or RSVP changes. Discussion, attendance, availability responses and tool data remain member-only. Public readability alone does not enable joining.',
      request: { params: EventIdParamSchema },
      responses: {
        ...errors,
        200: {
          description: 'Safe logistics and current admission action',
          content: {
            'application/json': {
              schema: z.object({
                event: z.object({
                  _id: z.string(),
                  _creationTime: z.number(),
                  title: z.string(),
                  description: z.string().nullable(),
                  location: z.string().nullable(),
                  creatorId: z.string(),
                  timezone: z.string(),
                  visibility,
                  admissionPolicy,
                  chosenDateTime: z.number().nullable(),
                  chosenEndDateTime: z.number().nullable(),
                  imageUrl: z.string().nullable(),
                  imageFocalPoint: z
                    .object({ x: z.number(), y: z.number() })
                    .optional(),
                  createdAt: z.number(),
                  updatedAt: z.number(),
                  potentialDateTimeOptions: z.array(
                    z.object({
                      id: z.string(),
                      start: z.number(),
                      end: z.number().nullable(),
                      note: z.string().nullable(),
                    })
                  ),
                }),
                organizer: z
                  .object({
                    personId: z.string(),
                    name: z.string().nullable(),
                    username: z.string().nullable(),
                    image: z.string().nullable(),
                  })
                  .nullable(),
                entryAction: z.enum([
                  'MEMBER',
                  'JOIN',
                  'APPLY',
                  'INVITATION_ONLY',
                  'SIGN_IN',
                  'UNAVAILABLE',
                ]),
              }),
            },
          },
        },
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runQuery(internal.events.managementRest.logistics, {
          personId: c.get('personId') as Id<'persons'>,
          eventId: c.req.valid('param').eventId as Id<'events'>,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/discover',
      tags: ['Events'],
      security: [{ apiKey: [] }],
      summary: 'Discover friends events',
      description:
        'Bounded creation-order cursor pages. Only upcoming friends-visible events from accepted, unblocked friends are returned; existing memberships and bans are excluded. Empty pages may have a continuation cursor. Defaults to 20, maximum 100.',
      request: { query: EventListQuerySchema },
      responses: {
        ...errors,
        200: {
          description: 'Eligible events page',
          content: {
            'application/json': {
              schema: z.object({
                items: z.array(
                  z.object({
                    id: z.string(),
                    title: z.string(),
                    admissionPolicy,
                    entryAction: z.enum(['JOIN', 'APPLY', 'INVITATION_ONLY']),
                    description: z.string().nullable(),
                    location: z.string().nullable(),
                    chosenDateTime: z.number().nullable(),
                    imageUrl: z.string().nullable(),
                    organizer: z
                      .object({
                        personId: z.string(),
                        name: z.string().nullable(),
                        username: z.string().nullable(),
                      })
                      .nullable(),
                  })
                ),
                nextCursor: z.string().nullable(),
              }),
            },
          },
        },
      },
    }),
    async c => {
      const query = c.req.valid('query');
      return c.json(
        await c.get('ctx').runQuery(internal.events.managementRest.discover, {
          personId: c.get('personId') as Id<'persons'>,
          limit: query.limit ?? 20,
          cursor: query.cursor,
          now: Date.now(),
        }),
        200
      );
    }
  );
  app.openapi(
    createRoute({
      method: 'post',
      path: '/events/{eventId}/join',
      tags: ['Events'],
      security: [{ apiKey: [] }],
      summary: 'Join a discoverable event',
      description:
        'Requires Direct admission and current audience eligibility, with block and ban checks; creates Attendee membership with Pending RSVP (joining does not confirm attendance) and dispatches notifications/add-on lifecycle. Not replay-safe.',
      request: { params: EventIdParamSchema },
      responses: {
        ...errors,
        200: {
          description: 'Joined event',
          content: {
            'application/json': {
              schema: z.object({
                membershipId: z.string(),
                success: z.boolean(),
                role: z.literal('ATTENDEE'),
                rsvpStatus: z.literal('PENDING'),
              }),
            },
          },
        },
      },
    }),
    async c =>
      c.json(
        await c.get('ctx').runMutation(internal.events.managementRest.join, {
          personId: c.get('personId') as Id<'persons'>,
          eventId: c.req.valid('param').eventId as Id<'events'>,
        }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'get',
      path: '/events/{eventId}/settings',
      tags: ['Events'],
      security: [{ apiKey: [] }],
      summary: 'Read event visibility, admission and permissions',
      request: { params: EventIdParamSchema },
      responses: {
        ...errors,
        200: {
          description: 'Event settings',
          content: { 'application/json': { schema: settings } },
        },
      },
    }),
    async c =>
      c.json(
        await c
          .get('ctx')
          .runQuery(internal.events.managementRest.getSettings, {
            personId: c.get('personId') as Id<'persons'>,
            eventId: c.req.valid('param').eventId as Id<'events'>,
          }),
        200
      )
  );
  app.openapi(
    createRoute({
      method: 'patch',
      path: '/events/{eventId}/settings',
      tags: ['Events'],
      security: [{ apiKey: [] }],
      summary: 'Update event visibility, admission and permissions',
      description:
        'Requires organizer authority. Admission is independent of visibility; legacy Friends events default Direct and other legacy events default Invitation only. Updating visibility reuses app event-edit notifications; permissions update follows the app. Not replay-safe.',
      request: {
        params: EventIdParamSchema,
        body: {
          content: {
            'application/json': {
              schema: z
                .object({
                  visibility: visibility.optional(),
                  admissionPolicy: admissionPolicy.optional(),
                  permissions: permissions.partial().strict().optional(),
                })
                .strict(),
            },
          },
        },
      },
      responses: {
        ...errors,
        200: {
          description: 'Updated event settings',
          content: { 'application/json': { schema: settings } },
        },
      },
    }),
    async c =>
      c.json(
        await c
          .get('ctx')
          .runMutation(internal.events.managementRest.updateSettings, {
            personId: c.get('personId') as Id<'persons'>,
            eventId: c.req.valid('param').eventId as Id<'events'>,
            body: c.req.valid('json'),
          }),
        200
      )
  );
  return app;
}
