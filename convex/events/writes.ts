import { claimUpload } from '../files/uploads';
import { validateImageMetadata } from '../files/imageRules';
import { z } from '@hono/zod-openapi';
import { v, ConvexError, type Infer } from 'convex/values';
import type { MutationCtx } from '../_generated/server';
import type { Doc, Id } from '../_generated/dataModel';
import { REMINDER_OFFSETS, type ReminderOffset } from '../types';
import { notifyEventMembers } from '../lib/notifications';
import { getAddonHandler } from '../addons/registry';
import {
  dispatchAddonLifecycle,
  dispatchSingleAddonLifecycle,
} from '../addons/lifecycle';
import { requireDiscordGuildAuthorization } from '../discord/authorization';

function eventValidationError(message: string) {
  return new ConvexError({ code: 'VALIDATION_ERROR', message });
}
const eventDateSchema = z.string().datetime({ offset: true });
export function parseEventDate(value: string) {
  if (
    !eventDateSchema.safeParse(value).success ||
    !Number.isFinite(Date.parse(value))
  )
    throw eventValidationError(
      'Event dates must be valid ISO date-times with Z or an explicit timezone offset.'
    );
  return Date.parse(value);
}
function validateBasicFields(
  title: string | undefined,
  description: string | undefined,
  location: string | undefined
) {
  if (title !== undefined && (!title.trim() || title.trim().length > 200))
    throw eventValidationError(
      'Event title is required and must be 200 characters or less'
    );
  if (description !== undefined && description.trim().length > 5000)
    throw eventValidationError(
      'Event description must be 5000 characters or less'
    );
  if (location !== undefined && location.trim().length > 500)
    throw eventValidationError('Event location must be 500 characters or less');
}
export async function requireWriteRole(
  ctx: MutationCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>,
  minimum: 'MODERATOR' | 'ORGANIZER'
) {
  const membership = await ctx.db
    .query('memberships')
    .withIndex('by_person_event', q =>
      q.eq('personId', personId).eq('eventId', eventId)
    )
    .first();
  if (
    !membership ||
    membership.role === 'ATTENDEE' ||
    (minimum === 'ORGANIZER' && membership.role !== 'ORGANIZER')
  )
    throw new ConvexError({
      code: 'FORBIDDEN',
      message: `${minimum} role or higher required for this action.`,
    });
  return membership;
}
const dateTimeOptionValidator = v.object({
  start: v.string(), // ISO date string
  end: v.optional(v.string()), // ISO date string (optional end time)
  note: v.optional(v.string()),
});

export const reminderOffsetValidator = v.union(
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
);

const permissionLevelValidator = v.union(
  v.literal('EVERYONE'),
  v.literal('MODERATOR'),
  v.literal('ORGANIZER')
);

function validateImageFocalPoint(
  focalPoint: { x: number; y: number } | null | undefined
) {
  if (!focalPoint) return;

  if (
    !Number.isFinite(focalPoint.x) ||
    !Number.isFinite(focalPoint.y) ||
    focalPoint.x < 0 ||
    focalPoint.x > 1 ||
    focalPoint.y < 0 ||
    focalPoint.y > 1
  ) {
    throw new Error('Image focal point must be between 0 and 1');
  }
}

export const createEventArgs = v.object({
  title: v.string(),
  description: v.optional(v.string()),
  location: v.optional(v.string()),
  imageStorageId: v.optional(v.id('_storage')), // Optional cover image
  imageFocalPoint: v.optional(
    v.object({
      x: v.number(), // 0-1 normalized (0.5 = center)
      y: v.number(), // 0-1 normalized (0.5 = center)
    })
  ), // Focal point for cropping cover image
  // Legacy: array of ISO date strings (backward compatible)
  potentialDateTimes: v.optional(v.array(v.string())),
  // New: array of objects with start/end times
  potentialDateTimeOptions: v.optional(v.array(dateTimeOptionValidator)),
  chosenDateTime: v.optional(v.string()), // ISO date string for single-date events
  chosenEndDateTime: v.optional(v.string()), // ISO date string for end time
  reminderOffset: v.optional(reminderOffsetValidator), // Legacy: kept for backward compat
  addons: v.optional(
    v.array(
      v.object({
        addonType: v.string(),
        config: v.any(),
      })
    )
  ),
  visibility: v.optional(
    v.union(v.literal('PRIVATE'), v.literal('FRIENDS'), v.literal('PUBLIC'))
  ),
  permissions: v.optional(
    v.object({
      createPosts: v.optional(permissionLevelValidator),
      inviteMembers: v.optional(permissionLevelValidator),
      viewAttendeeList: v.optional(permissionLevelValidator),
    })
  ),
  _traceId: v.optional(v.string()),
});
export async function createEventForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    title,
    description,
    location,
    imageStorageId,
    imageFocalPoint,
    potentialDateTimes,
    potentialDateTimeOptions,
    chosenDateTime,
    chosenEndDateTime,
    reminderOffset,
    addons,
    visibility,
    permissions,
  }: Infer<typeof createEventArgs>
) {
  if (!(await ctx.db.get(personId)))
    throw eventValidationError('Account not found');

  // Validate input
  if (!title.trim()) {
    throw eventValidationError('Event title is required');
  }

  validateBasicFields(title, description, location);
  validateImageFocalPoint(imageFocalPoint);
  if (imageFocalPoint && !imageStorageId) {
    throw eventValidationError('An image focal point requires a cover image');
  }

  if (imageStorageId) {
    const metadata = await ctx.db.system.get(imageStorageId);
    if (!metadata) throw eventValidationError('Uploaded cover not found');
    const upload = await claimUpload(ctx, personId, imageStorageId, 'cover');
    validateImageMetadata('cover', upload.mimeType, metadata.size);
    if (
      metadata.size !== upload.size ||
      (metadata.contentType && metadata.contentType !== upload.mimeType)
    )
      throw eventValidationError(
        'Cover metadata does not match the uploaded image'
      );
  }

  // Handle potential date times - support both legacy and new format
  let dateTimeOptions: Array<{ start: number; end?: number; note?: string }> =
    [];

  if (potentialDateTimeOptions && potentialDateTimeOptions.length > 0) {
    // New format: objects with start/end
    dateTimeOptions = potentialDateTimeOptions.map(opt => ({
      start: parseEventDate(opt.start),
      end: opt.end === undefined ? undefined : parseEventDate(opt.end),
      note: opt.note,
    }));
  } else if (potentialDateTimes && potentialDateTimes.length > 0) {
    // Legacy format: array of strings (just start times)
    dateTimeOptions = potentialDateTimes.map(dateStr => ({
      start: parseEventDate(dateStr),
    }));
  }

  // Validate all potential date time options have end > start
  for (const opt of dateTimeOptions) {
    if (opt.note !== undefined && opt.note.length > 200)
      throw eventValidationError('Note must be 200 characters or less');
    if (opt.end !== undefined && opt.end <= opt.start) {
      throw eventValidationError(
        'End time must be after start time for all date options'
      );
    }
  }

  // Convert chosen date time if provided
  const chosenTimestamp =
    chosenDateTime === undefined ? undefined : parseEventDate(chosenDateTime);
  const chosenEndTimestamp =
    chosenEndDateTime === undefined
      ? undefined
      : parseEventDate(chosenEndDateTime);
  if (chosenEndTimestamp !== undefined && chosenTimestamp === undefined)
    throw eventValidationError('An event end time requires a start time.');
  if (chosenTimestamp !== undefined && dateTimeOptions.length > 0)
    throw eventValidationError(
      'Choose a fixed start time or proposed date options, not both.'
    );

  // Validate chosen end time is after start time if both provided
  if (
    chosenTimestamp !== undefined &&
    chosenEndTimestamp !== undefined &&
    chosenEndTimestamp <= chosenTimestamp
  ) {
    throw eventValidationError('End time must be after start time');
  }

  // Validate dates are in the future
  const now = Date.now();
  if (chosenTimestamp !== undefined && chosenTimestamp <= now) {
    throw eventValidationError('Event date must be in the future');
  }
  for (const opt of dateTimeOptions) {
    if (
      !Number.isFinite(opt.start) ||
      (opt.end !== undefined && !Number.isFinite(opt.end))
    )
      throw eventValidationError('Event date must be finite.');
    if (opt.start <= now) {
      throw eventValidationError('All date options must be in the future');
    }
  }

  // Validate reminder offset won't result in a past reminder time
  if (reminderOffset && chosenTimestamp) {
    const offsetMs = REMINDER_OFFSETS[reminderOffset as ReminderOffset];
    if (offsetMs && chosenTimestamp - offsetMs <= now) {
      throw eventValidationError(
        'Reminder time would be in the past. Choose a shorter reminder offset.'
      );
    }
  }

  // Create the event
  const eventId = await ctx.db.insert('events', {
    title: title.trim(),
    description: description?.trim() || '',
    location: location?.trim() || '',
    imageStorageId: imageStorageId,
    imageFocalPoint: imageFocalPoint,
    creatorId: personId,
    createdById: personId,
    createdAt: now,
    updatedAt: now,
    timezone: 'UTC', // Default timezone, can be updated later
    potentialDateTimes: dateTimeOptions.map(opt => opt.start), // Legacy array field
    chosenDateTime: chosenTimestamp,
    chosenEndDateTime: chosenEndTimestamp,
    reminderOffset: reminderOffset,
    visibility: visibility,
    permissions: permissions,
    memberCount: 1,
  });

  // Create the creator's membership as ORGANIZER
  const membershipId = await ctx.db.insert('memberships', {
    personId: personId,
    eventId: eventId,
    role: 'ORGANIZER',
    rsvpStatus: 'YES', // Creator auto-accepts
    updatedAt: now,
  });

  // Create potentialDateTimes records and default availabilities for the organizer
  if (dateTimeOptions.length > 0) {
    const potentialDateTimeIds = await Promise.all(
      dateTimeOptions.map(async opt => {
        return await ctx.db.insert('potentialDateTimes', {
          eventId: eventId,
          dateTime: opt.start,
          endDateTime: opt.end,
          note: opt.note || undefined,
          updatedAt: now,
        });
      })
    );

    // Create "YES" availabilities for the organizer for all date options
    await Promise.all(
      potentialDateTimeIds.map(async potentialDateTimeId => {
        await ctx.db.insert('availabilities', {
          membershipId: membershipId,
          potentialDateTimeId: potentialDateTimeId,
          status: 'YES',
          updatedAt: now,
        });
      })
    );
  }

  // Get the created event
  const event = await ctx.db.get(eventId);

  // Build the list of add-ons to enable
  // Support both new `addons` arg and legacy `reminderOffset` arg
  const addonEntries: Array<{ addonType: string; config: unknown }> = [];

  if (addons && addons.length > 0) {
    addonEntries.push(...addons);
  } else if (reminderOffset) {
    // Legacy backward compat: convert reminderOffset to addon config
    addonEntries.push({
      addonType: 'reminders',
      config: { reminderOffset },
    });
  }

  // Create addon config rows and dispatch onEnabled lifecycle
  for (const addon of addonEntries) {
    const handler = getAddonHandler(addon.addonType);
    if (!handler || !handler.validateConfig(addon.config)) continue;

    await requireDiscordGuildAuthorization(
      ctx,
      personId,
      addon.addonType,
      addon.config
    );

    await ctx.db.insert('eventAddonConfigs', {
      eventId,
      addonType: addon.addonType,
      enabled: true,
      config: addon.config,
      createdAt: now,
      updatedAt: now,
    });

    await dispatchSingleAddonLifecycle(
      ctx,
      eventId,
      addon.addonType,
      'onEnabled',
      addon.config
    );
  }

  return {
    eventId,
    membershipId,
    event,
  };
}

export const updateEventArgs = v.object({
  eventId: v.id('events'),
  title: v.optional(v.string()),
  description: v.optional(v.string()),
  location: v.optional(v.string()),
  imageStorageId: v.optional(
    v.union(
      v.id('_storage'),
      v.null() // Allow null to remove the image
    )
  ),
  imageFocalPoint: v.optional(
    v.union(
      v.object({
        x: v.number(),
        y: v.number(),
      }),
      v.null() // Allow null to clear the focal point
    )
  ),
  visibility: v.optional(
    v.union(
      v.literal('PRIVATE'),
      v.literal('FRIENDS'),
      v.literal('PUBLIC'),
      v.null()
    )
  ),
  _traceId: v.optional(v.string()),
});
export async function updateEventForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    eventId,
    title,
    description,
    location,
    imageStorageId,
    imageFocalPoint,
    visibility,
  }: Infer<typeof updateEventArgs>
) {
  const membership = await requireWriteRole(
    ctx,
    eventId,
    personId,
    'MODERATOR'
  );

  // Get the event
  const event = await ctx.db.get(eventId);
  if (!event) {
    throw eventValidationError('Event not found');
  }

  validateBasicFields(title, description, location);
  validateImageFocalPoint(imageFocalPoint);
  const willHaveImage =
    imageStorageId === undefined
      ? event.imageStorageId !== undefined
      : imageStorageId !== null;
  if (imageFocalPoint && !willHaveImage) {
    throw eventValidationError('An image focal point requires a cover image');
  }

  // Prepare update data
  const updateData: Partial<Doc<'events'>> = {};

  if (title !== undefined) {
    if (!title.trim()) {
      throw eventValidationError('Event title cannot be empty');
    }
    updateData.title = title.trim();
  }

  if (description !== undefined) {
    updateData.description = description.trim();
  }

  if (location !== undefined) {
    updateData.location = location.trim();
  }

  // Handle image updates
  if (imageStorageId !== undefined && imageStorageId !== event.imageStorageId) {
    if (imageStorageId) {
      const metadata = await ctx.db.system.get(imageStorageId);
      if (!metadata) throw eventValidationError('Uploaded cover not found');
      const upload = await claimUpload(ctx, personId, imageStorageId, 'cover');
      validateImageMetadata('cover', upload.mimeType, metadata.size);
      if (
        metadata.size !== upload.size ||
        (metadata.contentType && metadata.contentType !== upload.mimeType)
      )
        throw eventValidationError(
          'Cover metadata does not match the uploaded image'
        );
    }
    // Delete old image from storage if it exists
    if (event.imageStorageId) {
      try {
        await ctx.storage.delete(event.imageStorageId);
      } catch {
        // Ignore errors - file may already be deleted
      }
    }
    // Set new image or clear if null
    updateData.imageStorageId =
      imageStorageId === null ? undefined : imageStorageId;
    // If image is being removed, also clear the focal point
    if (imageStorageId === null) {
      updateData.imageFocalPoint = undefined;
    }
  }

  // Handle focal point updates
  if (imageFocalPoint !== undefined) {
    updateData.imageFocalPoint =
      imageFocalPoint === null ? undefined : imageFocalPoint;
  }

  if (visibility !== undefined) {
    // Visibility changes require ORGANIZER role (not just MODERATOR)
    if (membership.role !== 'ORGANIZER') {
      throw eventValidationError('Only organizers can change event visibility');
    }

    updateData.visibility = visibility === null ? undefined : visibility;
  }

  // Update the event
  updateData.updatedAt = Date.now();
  await ctx.db.patch(eventId, updateData);

  // Get the updated event
  const updatedEvent = await ctx.db.get(eventId);

  // Notify all event members about the edit
  await notifyEventMembers(ctx, {
    eventId,
    type: 'EVENT_EDITED',
    authorId: personId,
  });

  // Dispatch onEventUpdated to all enabled add-ons (e.g. sync Discord event)
  await dispatchAddonLifecycle(ctx, eventId, 'onEventUpdated');

  return { event: updatedEvent };
}

export const updatePotentialDateTimesArgs = v.object({
  eventId: v.id('events'),
  // Legacy: array of Unix timestamps (backward compatible)
  potentialDateTimes: v.optional(v.array(v.number())),
  // New: array of objects with start/end times and optional notes
  potentialDateTimeOptions: v.optional(
    v.array(
      v.object({
        start: v.number(), // Unix timestamp
        end: v.optional(v.number()), // Unix timestamp for end time
        note: v.optional(v.string()), // Optional note (max 200 chars)
      })
    )
  ),
  _traceId: v.optional(v.string()),
});
export async function updatePotentialDateTimesForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    eventId,
    potentialDateTimes,
    potentialDateTimeOptions,
  }: Infer<typeof updatePotentialDateTimesArgs>
) {
  const organizerMembership = await requireWriteRole(
    ctx,
    eventId,
    personId,
    'ORGANIZER'
  );

  // Handle both legacy and new format
  let dateTimeOptions: Array<{
    start: number;
    end?: number;
    note?: string;
  }> = [];

  if (potentialDateTimeOptions && potentialDateTimeOptions.length > 0) {
    // New format: objects with start/end/note
    dateTimeOptions = potentialDateTimeOptions;
  } else if (potentialDateTimes && potentialDateTimes.length > 0) {
    // Legacy format: array of timestamps (just start times)
    dateTimeOptions = potentialDateTimes.map(timestamp => ({
      start: timestamp,
    }));
  }

  // Validate end times are after start times and note lengths
  const now = Date.now();
  for (const opt of dateTimeOptions) {
    if (
      !Number.isFinite(opt.start) ||
      (opt.end !== undefined && !Number.isFinite(opt.end))
    )
      throw eventValidationError('Event date must be finite.');
    if (opt.start <= now) {
      throw eventValidationError('All date options must be in the future');
    }
    if (opt.end !== undefined && opt.end <= opt.start) {
      throw eventValidationError('End time must be after start time');
    }
    if (opt.note && opt.note.length > 200) {
      throw eventValidationError('Note must be 200 characters or less');
    }
  }

  // Delete all existing potential date times for this event
  const existingDates = await ctx.db
    .query('potentialDateTimes')
    .withIndex('by_event', q => q.eq('eventId', eventId))
    .collect();

  for (const date of existingDates) {
    // Delete all availabilities for this potential date time
    const availabilities = await ctx.db
      .query('availabilities')
      .withIndex('by_potential_date', q =>
        q.eq('potentialDateTimeId', date._id)
      )
      .collect();

    for (const availability of availabilities) {
      await ctx.db.delete(availability._id);
    }

    await ctx.db.delete(date._id);
  }

  // Create new potential date times
  const newPotentialDateTimeIds = await Promise.all(
    dateTimeOptions.map(async opt => {
      return await ctx.db.insert('potentialDateTimes', {
        eventId: eventId,
        dateTime: opt.start,
        endDateTime: opt.end,
        note: opt.note || undefined,
        updatedAt: now,
      });
    })
  );

  // Create "YES" availabilities for the organizer for all new date options
  if (organizerMembership) {
    await Promise.all(
      newPotentialDateTimeIds.map(async potentialDateTimeId => {
        await ctx.db.insert('availabilities', {
          membershipId: organizerMembership._id,
          potentialDateTimeId: potentialDateTimeId,
          status: 'YES',
          updatedAt: now,
        });
      })
    );
  }

  await ctx.db.patch(eventId, {
    potentialDateTimes: dateTimeOptions.map(opt => opt.start),
    updatedAt: now,
  });

  // Get the updated potential date times
  const updatedPotentialDates = await Promise.all(
    newPotentialDateTimeIds.map(id => ctx.db.get(id))
  );

  // Dispatch onDateReset to all enabled add-ons since we're starting a new poll
  // (the chosen date will likely change, so any existing reminder is invalid)
  await dispatchAddonLifecycle(ctx, eventId, 'onDateReset');

  // Notify all members about new date options (using DATE_CHANGED type)
  await notifyEventMembers(ctx, {
    eventId,
    type: 'DATE_CHANGED',
    authorId: personId,
  });

  return {
    potentialDates: updatedPotentialDates.filter(d => d !== null),
    success: true,
  };
}
