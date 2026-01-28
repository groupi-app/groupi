import { internalQuery, internalMutation } from '../../../_generated/server';
import { v } from 'convex/values';
import { Id } from '../../../_generated/dataModel';
import { getPersonWithUser } from '../../../auth';

/**
 * Internal queries and mutations for event routes
 */

export const listUserEvents = internalQuery({
  args: {
    personId: v.string(),
  },
  handler: async (ctx, { personId }) => {
    // Get all memberships for this person
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_person', q => q.eq('personId', personId as Id<'persons'>))
      .collect();

    // Get event data for each membership
    const events = await Promise.all(
      memberships.map(async membership => {
        const event = await ctx.db.get(membership.eventId);
        if (!event) return null;

        // Get member count
        const memberCount = await ctx.db
          .query('memberships')
          .withIndex('by_event', q => q.eq('eventId', event._id))
          .collect()
          .then(m => m.length);

        // Get image URL
        const imageUrl = event.imageStorageId
          ? await ctx.storage.getUrl(event.imageStorageId)
          : null;

        return {
          id: event._id,
          title: event.title,
          description: event.description ?? null,
          location: event.location ?? null,
          imageUrl,
          chosenDateTime: event.chosenDateTime ?? null,
          chosenEndDateTime: event.chosenEndDateTime ?? null,
          createdAt: event._creationTime,
          updatedAt: event.updatedAt,
          memberCount,
          userRole: membership.role,
          userRsvpStatus: membership.rsvpStatus,
        };
      })
    );

    return {
      events: events.filter(e => e !== null),
    };
  },
});

export const getEventDetail = internalQuery({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId as Id<'events'>);
    if (!event) return null;

    // Get creator data
    const creatorData = await getPersonWithUser(ctx, event.creatorId);

    // Get image URL
    const imageUrl = event.imageStorageId
      ? await ctx.storage.getUrl(event.imageStorageId)
      : null;

    return {
      id: event._id,
      title: event.title,
      description: event.description ?? null,
      location: event.location ?? null,
      imageUrl,
      timezone: event.timezone,
      chosenDateTime: event.chosenDateTime ?? null,
      chosenEndDateTime: event.chosenEndDateTime ?? null,
      reminderOffset: event.reminderOffset ?? null,
      createdAt: event._creationTime,
      updatedAt: event.updatedAt,
      creator: creatorData
        ? {
            id: creatorData.person._id,
            user: {
              id: creatorData.user._id,
              name: creatorData.user.name ?? null,
              email: creatorData.user.email ?? null,
              image: creatorData.user.image ?? null,
              username: creatorData.user.username ?? null,
            },
          }
        : null,
    };
  },
});

export const createEvent = internalMutation({
  args: {
    personId: v.string(),
    title: v.string(),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    potentialDateTimeOptions: v.optional(
      v.array(
        v.object({
          start: v.string(),
          end: v.optional(v.string()),
        })
      )
    ),
    chosenDateTime: v.optional(v.string()),
    chosenEndDateTime: v.optional(v.string()),
    reminderOffset: v.optional(
      v.union(
        v.literal('30_MINUTES'),
        v.literal('1_HOUR'),
        v.literal('2_HOURS'),
        v.literal('4_HOURS'),
        v.literal('1_DAY'),
        v.literal('2_DAYS'),
        v.literal('3_DAYS'),
        v.literal('1_WEEK'),
        v.literal('2_WEEKS'),
        v.literal('4_WEEKS')
      )
    ),
  },
  handler: async (
    ctx,
    {
      personId,
      title,
      description,
      location,
      potentialDateTimeOptions,
      chosenDateTime,
      chosenEndDateTime,
      reminderOffset,
    }
  ) => {
    const now = Date.now();

    // Parse date times
    const chosenTimestamp = chosenDateTime
      ? new Date(chosenDateTime).getTime()
      : undefined;
    const chosenEndTimestamp = chosenEndDateTime
      ? new Date(chosenEndDateTime).getTime()
      : undefined;

    // Parse potential date times
    const dateTimeOptions =
      potentialDateTimeOptions?.map(opt => ({
        start: new Date(opt.start).getTime(),
        end: opt.end ? new Date(opt.end).getTime() : undefined,
      })) ?? [];

    // Create the event
    const eventId = await ctx.db.insert('events', {
      title: title.trim(),
      description: description?.trim() ?? '',
      location: location?.trim() ?? '',
      creatorId: personId as Id<'persons'>,
      createdAt: now,
      updatedAt: now,
      timezone: 'UTC',
      potentialDateTimes: dateTimeOptions.map(opt => opt.start),
      chosenDateTime: chosenTimestamp,
      chosenEndDateTime: chosenEndTimestamp,
      reminderOffset,
    });

    // Create membership for creator
    const membershipId = await ctx.db.insert('memberships', {
      personId: personId as Id<'persons'>,
      eventId,
      role: 'ORGANIZER',
      rsvpStatus: 'YES',
      updatedAt: now,
    });

    // Create potential date time records
    if (dateTimeOptions.length > 0) {
      const potentialDateTimeIds = await Promise.all(
        dateTimeOptions.map(async opt => {
          return await ctx.db.insert('potentialDateTimes', {
            eventId,
            dateTime: opt.start,
            endDateTime: opt.end,
            updatedAt: now,
          });
        })
      );

      // Create YES availabilities for organizer
      await Promise.all(
        potentialDateTimeIds.map(async pdtId => {
          await ctx.db.insert('availabilities', {
            membershipId,
            potentialDateTimeId: pdtId,
            status: 'YES',
            updatedAt: now,
          });
        })
      );
    }

    return {
      eventId,
      membershipId,
    };
  },
});

export const updateEvent = internalMutation({
  args: {
    eventId: v.string(),
    title: v.optional(v.string()),
    description: v.optional(v.string()),
    location: v.optional(v.string()),
    reminderOffset: v.optional(
      v.union(
        v.literal('30_MINUTES'),
        v.literal('1_HOUR'),
        v.literal('2_HOURS'),
        v.literal('4_HOURS'),
        v.literal('1_DAY'),
        v.literal('2_DAYS'),
        v.literal('3_DAYS'),
        v.literal('1_WEEK'),
        v.literal('2_WEEKS'),
        v.literal('4_WEEKS'),
        v.null()
      )
    ),
  },
  handler: async (
    ctx,
    { eventId, title, description, location, reminderOffset }
  ) => {
    const event = await ctx.db.get(eventId as Id<'events'>);
    if (!event) {
      throw new Error('Event not found');
    }

    const updateData: Record<string, unknown> = {
      updatedAt: Date.now(),
    };

    if (title !== undefined) {
      updateData.title = title.trim();
    }
    if (description !== undefined) {
      updateData.description = description.trim();
    }
    if (location !== undefined) {
      updateData.location = location.trim();
    }
    if (reminderOffset !== undefined) {
      updateData.reminderOffset =
        reminderOffset === null ? undefined : reminderOffset;
    }

    await ctx.db.patch(eventId as Id<'events'>, updateData);

    // Return updated event detail
    const updatedEvent = await ctx.db.get(eventId as Id<'events'>);
    const creatorData = updatedEvent
      ? await getPersonWithUser(ctx, updatedEvent.creatorId)
      : null;

    const imageUrl = updatedEvent?.imageStorageId
      ? await ctx.storage.getUrl(updatedEvent.imageStorageId)
      : null;

    return {
      id: updatedEvent!._id,
      title: updatedEvent!.title,
      description: updatedEvent!.description ?? null,
      location: updatedEvent!.location ?? null,
      imageUrl,
      timezone: updatedEvent!.timezone,
      chosenDateTime: updatedEvent!.chosenDateTime ?? null,
      chosenEndDateTime: updatedEvent!.chosenEndDateTime ?? null,
      reminderOffset: updatedEvent!.reminderOffset ?? null,
      createdAt: updatedEvent!._creationTime,
      updatedAt: updatedEvent!.updatedAt,
      creator: creatorData
        ? {
            id: creatorData.person._id,
            user: {
              id: creatorData.user._id,
              name: creatorData.user.name ?? null,
              email: creatorData.user.email ?? null,
              image: creatorData.user.image ?? null,
              username: creatorData.user.username ?? null,
            },
          }
        : null,
    };
  },
});

export const deleteEvent = internalMutation({
  args: {
    eventId: v.string(),
  },
  handler: async (ctx, { eventId }) => {
    const event = await ctx.db.get(eventId as Id<'events'>);
    if (!event) {
      throw new Error('Event not found');
    }

    // Delete image if exists
    if (event.imageStorageId) {
      try {
        await ctx.storage.delete(event.imageStorageId);
      } catch {
        // Ignore
      }
    }

    // Delete all related data
    const memberships = await ctx.db
      .query('memberships')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .collect();

    // Delete availabilities
    for (const membership of memberships) {
      const availabilities = await ctx.db
        .query('availabilities')
        .withIndex('by_membership', q => q.eq('membershipId', membership._id))
        .collect();
      for (const avail of availabilities) {
        await ctx.db.delete(avail._id);
      }
    }

    // Delete potential date times
    const potentialDates = await ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .collect();
    for (const pdt of potentialDates) {
      await ctx.db.delete(pdt._id);
    }

    // Delete posts and replies
    const posts = await ctx.db
      .query('posts')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .collect();
    for (const post of posts) {
      const replies = await ctx.db
        .query('replies')
        .withIndex('by_post', q => q.eq('postId', post._id))
        .collect();
      for (const reply of replies) {
        await ctx.db.delete(reply._id);
      }
      await ctx.db.delete(post._id);
    }

    // Delete invites
    const invites = await ctx.db
      .query('invites')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .collect();
    for (const invite of invites) {
      await ctx.db.delete(invite._id);
    }

    // Delete notifications
    const notifications = await ctx.db
      .query('notifications')
      .withIndex('by_event', q => q.eq('eventId', eventId as Id<'events'>))
      .collect();
    for (const notif of notifications) {
      await ctx.db.delete(notif._id);
    }

    // Delete memberships
    for (const membership of memberships) {
      await ctx.db.delete(membership._id);
    }

    // Delete event
    await ctx.db.delete(eventId as Id<'events'>);

    return { success: true };
  },
});
