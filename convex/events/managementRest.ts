import { internalMutation, internalQuery } from '../_generated/server';
import { v, ConvexError } from 'convex/values';
import { eventViewer } from './attendance';
import { resolveEventPermissions, getPersonWithUser } from '../auth';
import { updateEventForPerson, requireWriteRole } from './writes';
import { attendanceMember } from '../availability/contracts';
import { attendeeSummary } from '../availability/reads';
import {
  updateEventPermissionsForPerson,
  canDiscoverEventForPerson,
  deleteEventForPerson,
  updateMemberRoleForPerson,
  removeMemberForPerson,
  leaveEventForPerson,
  joinDiscoverableEventForPerson,
} from './management';
const level = v.union(
  v.literal('EVERYONE'),
  v.literal('MODERATOR'),
  v.literal('ORGANIZER')
);
const visibility = v.union(
  v.literal('PRIVATE'),
  v.literal('FRIENDS'),
  v.literal('PUBLIC')
);
const permissions = v.object({
  createPosts: level,
  inviteMembers: level,
  viewAttendeeList: level,
});
const settings = v.object({ eventId: v.id('events'), visibility, permissions });
const actorEvent = { eventId: v.id('events'), personId: v.id('persons') };
export const getSettings = internalQuery({
  args: actorEvent,
  returns: settings,
  handler: async (ctx, args) => {
    const { event } = await eventViewer(ctx, args.eventId, args.personId);
    return {
      eventId: event._id,
      visibility: event.visibility ?? 'PRIVATE',
      permissions: resolveEventPermissions(event),
    };
  },
});
export const updateSettings = internalMutation({
  args: {
    ...actorEvent,
    body: v.object({
      visibility: v.optional(visibility),
      permissions: v.optional(
        v.object({
          createPosts: v.optional(level),
          inviteMembers: v.optional(level),
          viewAttendeeList: v.optional(level),
        })
      ),
    }),
  },
  returns: settings,
  handler: async (ctx, { personId, eventId, body }) => {
    await requireWriteRole(ctx, eventId, personId, 'ORGANIZER');
    if (
      body.visibility === undefined &&
      (!body.permissions || Object.keys(body.permissions).length === 0)
    )
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Provide visibility or at least one permission',
      });
    if (body.visibility !== undefined)
      await updateEventForPerson(ctx, personId, {
        eventId,
        visibility: body.visibility,
      });
    if (body.permissions)
      await updateEventPermissionsForPerson(ctx, personId, {
        eventId,
        ...body.permissions,
      });
    const { event } = await eventViewer(ctx, eventId, personId);
    return {
      eventId,
      visibility: event.visibility ?? 'PRIVATE',
      permissions: resolveEventPermissions(event),
    };
  },
});
const target = { ...actorEvent, membershipId: v.id('memberships') };
export const updateRole = internalMutation({
  args: {
    ...target,
    newRole: v.union(
      v.literal('ORGANIZER'),
      v.literal('MODERATOR'),
      v.literal('ATTENDEE')
    ),
  },
  returns: attendanceMember,
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.membershipId);
    if (!member || member.eventId !== args.eventId)
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Member not found in this event',
      });
    const result = await updateMemberRoleForPerson(
      ctx,
      args.personId,
      args.membershipId,
      args.newRole
    );
    const viewer = await eventViewer(ctx, args.eventId, args.personId);
    return attendeeSummary(ctx, result.membership!, viewer.membership);
  },
});
export const remove = internalMutation({
  args: target,
  returns: v.null(),
  handler: async (ctx, args) => {
    const member = await ctx.db.get(args.membershipId);
    if (!member || member.eventId !== args.eventId)
      throw new ConvexError({
        code: 'NOT_FOUND',
        message: 'Member not found in this event',
      });
    await removeMemberForPerson(ctx, args.personId, args.membershipId);
    return null;
  },
});
export const leave = internalMutation({
  args: actorEvent,
  returns: v.null(),
  handler: async (ctx, args) => {
    await leaveEventForPerson(ctx, args.personId, args.eventId);
    return null;
  },
});
export const removeEvent = internalMutation({
  args: actorEvent,
  returns: v.null(),
  handler: async (ctx, args) => {
    await deleteEventForPerson(ctx, args.personId, args.eventId);
    return null;
  },
});
export const join = internalMutation({
  args: actorEvent,
  returns: v.object({
    membershipId: v.id('memberships'),
    success: v.boolean(),
    role: v.literal('ATTENDEE'),
    rsvpStatus: v.literal('PENDING'),
  }),
  handler: async (ctx, args) =>
    joinDiscoverableEventForPerson(ctx, args.personId, args.eventId),
});
const discoveredEvent = v.object({
  id: v.id('events'),
  title: v.string(),
  description: v.union(v.string(), v.null()),
  location: v.union(v.string(), v.null()),
  chosenDateTime: v.union(v.number(), v.null()),
  imageUrl: v.union(v.string(), v.null()),
  organizer: v.union(
    v.object({
      personId: v.id('persons'),
      name: v.union(v.string(), v.null()),
      username: v.union(v.string(), v.null()),
    }),
    v.null()
  ),
});
export const discover = internalQuery({
  args: {
    personId: v.id('persons'),
    limit: v.number(),
    cursor: v.optional(v.string()),
    now: v.number(),
  },
  returns: v.object({
    items: v.array(discoveredEvent),
    nextCursor: v.union(v.string(), v.null()),
  }),
  handler: async (ctx, args) => {
    if (!Number.isInteger(args.limit) || args.limit < 1 || args.limit > 100)
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Limit must be 1–100',
      });
    let page;
    try {
      page = await ctx.db
        .query('events')
        .order('desc')
        .paginate({ numItems: args.limit, cursor: args.cursor ?? null });
    } catch {
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Invalid discovery cursor; start without a cursor',
      });
    }
    const items = [];
    for (const event of page.page) {
      if (
        !(await canDiscoverEventForPerson(ctx, args.personId, event, args.now))
      )
        continue;
      const organizer = await getPersonWithUser(ctx, event.creatorId);
      items.push({
        id: event._id,
        title: event.title,
        description: event.description ?? null,
        location: event.location ?? null,
        chosenDateTime: event.chosenDateTime ?? null,
        imageUrl: event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null,
        organizer: organizer
          ? {
              personId: event.creatorId,
              name: organizer.user.name ?? null,
              username: organizer.user.username ?? null,
            }
          : null,
      });
    }
    return { items, nextCursor: page.isDone ? null : page.continueCursor };
  },
});
