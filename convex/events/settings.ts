import { ConvexError, v, type Infer } from 'convex/values';
import { type QueryCtx, type MutationCtx } from '../_generated/server';
import type { Id } from '../_generated/dataModel';
import { resolveEventPermissions } from '../auth';
import { requireDiscussionRole } from '../lib/discussionAccess';
import { updateEventArgs, updateEventForPerson } from './writes';
import { updateEventPermissionsForPerson } from './management';
import {
  updateAdmissionPolicyForPerson,
  resolveAdmissionPolicy,
} from './admission';
import { admissionPolicyValidator } from './admissionContracts';
import { applicationSettingsValidator } from '../eventApplications/contracts';
import { configure } from '../eventApplications/model';
import * as audiences from '../groupEventAudiences/model';
import { addonConfig } from '../addons/contracts';
import { saveSettingsDates } from './settingsDates';
import { saveSettingsAddons } from '../addons/settings';
import { secretHash } from '../authorization/model';
import { paginationOptsValidator } from 'convex/server';

const permission = v.union(
  v.literal('EVERYONE'),
  v.literal('MODERATOR'),
  v.literal('ORGANIZER')
);
const permissions = v.object({
  createPosts: permission,
  inviteMembers: permission,
  viewAttendeeList: permission,
});
const details = v.object({
  title: v.string(),
  description: v.string(),
  location: v.string(),
  visibility: v.union(
    v.literal('PRIVATE'),
    v.literal('FRIENDS'),
    v.literal('PUBLIC')
  ),
  imageStorageId: v.optional(v.id('_storage')),
  imageUrl: v.optional(v.union(v.string(), v.null())),
  imageFocalPoint: v.optional(v.object({ x: v.number(), y: v.number() })),
});
const dateOption = v.object({
  id: v.optional(v.id('potentialDateTimes')),
  start: v.number(),
  end: v.optional(v.number()),
  note: v.optional(v.string()),
});
const addon = v.object({
  addonType: v.string(),
  enabled: v.boolean(),
  config: addonConfig,
});
export const settingsSnapshot = v.object({
  revision: v.string(),
  role: v.union(v.literal('MODERATOR'), v.literal('ORGANIZER')),
  details,
  permissions,
  admissionPolicy: admissionPolicyValidator,
  applications: applicationSettingsValidator,
  audiences: v.object({
    friendsShared: v.union(v.boolean(), v.null()),
    canManageEvent: v.boolean(),
    groups: v.array(
      v.object({
        groupId: v.id('groups'),
        name: v.string(),
        canWithdraw: v.boolean(),
      })
    ),
  }),
  date: v.object({
    completedAt: v.optional(v.number()),
    chosenDateTime: v.optional(v.number()),
    chosenEndDateTime: v.optional(v.number()),
    options: v.array(dateOption),
  }),
  addons: v.array(addon),
});
export const settingsPatch = v.object({
  details: v.optional(
    v.object({ ...updateEventArgs.fields, eventId: v.optional(v.id('events')) })
  ),
  permissions: v.optional(permissions),
  admissionPolicy: v.optional(admissionPolicyValidator),
  applications: v.optional(applicationSettingsValidator),
  audiences: v.optional(
    v.object({ friendsShared: v.boolean(), groupIds: v.array(v.id('groups')) })
  ),
  date: v.optional(
    v.object({
      mode: v.union(v.literal('SINGLE'), v.literal('POLL')),
      start: v.optional(v.number()),
      end: v.optional(v.number()),
      options: v.optional(v.array(dateOption)),
      confirmedReset: v.optional(v.boolean()),
    })
  ),
  addons: v.optional(
    v.array(
      v.object({
        ...addon.fields,
        confirmedDestructive: v.optional(v.boolean()),
      })
    )
  ),
});
function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(',')}]`;
  if (value !== null && typeof value === 'object')
    return `{${Object.entries(value)
      .filter(([, v]) => v !== undefined)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(',')}}`;
  return JSON.stringify(value) ?? 'null';
}
export async function settingsForPerson(
  ctx: QueryCtx | MutationCtx,
  eventId: Id<'events'>,
  personId: Id<'persons'>
): Promise<Infer<typeof settingsSnapshot>> {
  const member = await requireDiscussionRole(
    ctx,
    eventId,
    personId,
    'MODERATOR'
  );
  const event = await ctx.db.get(eventId);
  if (!event)
    throw new ConvexError({ code: 'NOT_FOUND', message: 'Event not found.' });
  const [dates, addons, grants] = await Promise.all([
    ctx.db
      .query('potentialDateTimes')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
    ctx.db
      .query('eventAddonConfigs')
      .withIndex('by_event', q => q.eq('eventId', eventId))
      .collect(),
    ctx.db
      .query('groupEventAudiences')
      .withIndex('by_eventId', q => q.eq('eventId', eventId))
      .collect(),
  ]);
  const currentAudiences =
    member.role === 'ORGANIZER'
      ? await audiences.audiences(ctx, personId, eventId)
      : { friendsShared: null, canManageEvent: false, groups: [] };
  const snapshot = {
    role: member.role as 'MODERATOR' | 'ORGANIZER',
    details: {
      title: event.title,
      description: event.description ?? '',
      location: event.location ?? '',
      visibility: event.visibility ?? 'PRIVATE',
      imageStorageId: event.imageStorageId,
      imageFocalPoint: event.imageFocalPoint,
    },
    permissions: resolveEventPermissions(event),
    admissionPolicy: resolveAdmissionPolicy(event),
    applications: event.applicationSettings ?? {
      questions: [],
      reviewerPolicy: 'ORGANIZERS_AND_MODERATORS' as const,
    },
    audiences: {
      friendsShared: currentAudiences.friendsShared,
      canManageEvent: currentAudiences.canManageEvent,
      groups: currentAudiences.groups,
    },
    date: {
      completedAt: event.completedAt,
      chosenDateTime: event.chosenDateTime,
      chosenEndDateTime: event.chosenEndDateTime,
      options: dates.map(d => ({
        id: d._id,
        start: d.dateTime,
        end: d.endDateTime,
        note: d.note,
      })),
    },
    addons: addons.map(a => ({
      addonType: a.addonType,
      enabled: a.enabled,
      config: a.config,
    })),
  };
  // Include hidden grants in concurrency detection without disclosing their IDs.
  const revision = await secretHash(
    canonical({
      snapshot,
      grants: grants.map(g => [g._id, g.groupId, g.createdAt]),
      timezone: event.timezone,
      completedAt: event.completedAt,
    })
  );
  return {
    ...snapshot,
    revision,
    details: {
      ...snapshot.details,
      imageUrl: event.imageStorageId
        ? await ctx.storage.getUrl(event.imageStorageId)
        : null,
    },
  };
}
export async function saveSettingsForPerson(
  ctx: MutationCtx,
  personId: Id<'persons'>,
  {
    eventId,
    expectedRevision,
    patch,
  }: {
    eventId: Id<'events'>;
    expectedRevision: string;
    patch: Infer<typeof settingsPatch>;
  }
) {
  const person = { _id: personId };
  const before = await settingsForPerson(ctx, eventId, person._id);
  if (before.revision !== expectedRevision)
    throw new ConvexError({
      code: 'CONFLICT',
      message:
        'Event settings changed. Review the current settings before saving your draft.',
    });
  if (patch.date) await saveSettingsDates(ctx, person._id, eventId, patch.date);
  if (patch.details) {
    const { eventId: ignored, ...fields } = patch.details;
    void ignored;
    const changed = Object.fromEntries(
      Object.entries(fields).filter(
        ([key, value]) =>
          canonical(value) !==
          canonical(before.details[key as keyof typeof before.details])
      )
    );
    if (Object.keys(changed).length)
      await updateEventForPerson(ctx, person._id, { ...changed, eventId });
  }
  if (patch.permissions)
    await updateEventPermissionsForPerson(ctx, person._id, {
      eventId,
      ...patch.permissions,
    });
  if (patch.admissionPolicy)
    await updateAdmissionPolicyForPerson(
      ctx,
      person._id,
      eventId,
      patch.admissionPolicy
    );
  if (patch.applications)
    await configure(ctx, eventId, person._id, patch.applications);
  if (patch.audiences) {
    await requireDiscussionRole(ctx, eventId, person._id, 'ORGANIZER');
    const selected = new Set(patch.audiences.groupIds);
    if (
      selected.size !== patch.audiences.groupIds.length ||
      selected.size > 100
    )
      throw new ConvexError({
        code: 'VALIDATION_ERROR',
        message: 'Choose up to 100 distinct Groups.',
      });
    // Only exposed existing grants may be removed. Inaccessible grants survive.
    const existing = new Set(before.audiences.groups.map(g => g.groupId));
    for (const g of before.audiences.groups)
      if (!selected.has(g.groupId))
        await audiences.withdraw(ctx, person._id, eventId, g.groupId);
    for (const id of selected)
      if (!existing.has(id))
        await audiences.share(ctx, person._id, eventId, id);
    const currentEvent = await ctx.db.get(eventId);
    if (
      (currentEvent?.friendsAudienceEnabled ??
        currentEvent?.visibility === 'FRIENDS') !==
      patch.audiences.friendsShared
    )
      await audiences.friends(
        ctx,
        person._id,
        eventId,
        patch.audiences.friendsShared
      );
  }
  if (patch.addons) {
    const changed = patch.addons.filter(item => {
      const old = before.addons.find(row => row.addonType === item.addonType);
      return (
        !old ||
        old.enabled !== item.enabled ||
        canonical(old.config) !== canonical(item.config)
      );
    });
    await saveSettingsAddons(ctx, person._id, eventId, changed);
  }
  return settingsForPerson(ctx, eventId, person._id);
}

export const audienceOptionsArgs = {
  eventId: v.id('events'),
  search: v.string(),
  paginationOpts: paginationOptsValidator,
};
export const audienceOptionsPage = v.object({
  page: v.array(v.object({ groupId: v.id('groups'), name: v.string() })),
  isDone: v.boolean(),
  continueCursor: v.string(),
});
export async function audienceOptionsForPerson(
  ctx: QueryCtx,
  personId: Id<'persons'>,
  args: {
    eventId: Id<'events'>;
    search: string;
    paginationOpts: { numItems: number; cursor: string | null };
  }
) {
  await requireDiscussionRole(ctx, args.eventId, personId, 'ORGANIZER');
  if (
    args.search.length > 100 ||
    !Number.isInteger(args.paginationOpts.numItems) ||
    args.paginationOpts.numItems < 1 ||
    args.paginationOpts.numItems > 100
  )
    throw new ConvexError({
      code: 'VALIDATION_ERROR',
      message: 'Invalid Group search.',
    });
  const memberships = await ctx.db
    .query('groupMemberships')
    .withIndex('by_personId', q => q.eq('personId', personId))
    .order('desc')
    .paginate(args.paginationOpts);
  const matches = [];
  const search = args.search.trim().toLocaleLowerCase();
  for (const membership of memberships.page) {
    if (!(await audiences.canShare(ctx, membership.groupId, personId)))
      continue;
    const group = await ctx.db.get(membership.groupId);
    if (group && group.name.toLocaleLowerCase().includes(search))
      matches.push({ groupId: group._id, name: group.name });
  }
  return {
    page: matches,
    isDone: memberships.isDone,
    continueCursor: memberships.continueCursor,
  };
}
