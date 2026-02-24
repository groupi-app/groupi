import { MutationCtx } from '../_generated/server';
import { Id } from '../_generated/dataModel';
import { requireAuth } from '../auth';
import { notifyEventMembers } from '../lib/notifications';
import type { NotificationType } from '../lib/notifications';
import { authComponent, AuthUserId } from '../auth';

// ===== Read-only snapshots returned by context methods =====

export interface EventSnapshot {
  _id: Id<'events'>;
  title: string;
  description?: string;
  location?: string;
  chosenDateTime?: number;
  createdAt: number;
}

export interface MemberSnapshot {
  personId: Id<'persons'>;
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
  rsvpStatus: string;
  userName?: string | null;
  userImage?: string | null;
}

export interface AuthPersonSnapshot {
  _id: Id<'persons'>;
  userId: string;
}

export interface AddonDataEntry {
  _id: Id<'addonData'>;
  key: string;
  data: unknown;
  createdBy?: Id<'persons'>;
  createdAt: number;
  updatedAt: number;
}

export interface NotifyOptions {
  type: NotificationType;
  authorId: Id<'persons'>;
  postId?: Id<'posts'>;
  datetime?: number;
}

// ===== Scoped context interfaces =====

/**
 * Restricted context for standard add-on handlers.
 *
 * Provides scoped access to addon data, event info, member list,
 * and notifications. Does NOT expose raw database or scheduler.
 */
export interface AddonContext {
  /** The add-on type identifier. */
  readonly addonType: string;
  /** The event this lifecycle event applies to. */
  readonly eventId: Id<'events'>;

  // --- Addon data (scoped to this event + addonType) ---

  /** List all addon data entries for this event + addon. */
  queryAddonData(): Promise<AddonDataEntry[]>;
  /** Get a single addon data entry by key. */
  getAddonDataByKey(key: string): Promise<AddonDataEntry | null>;
  /** Delete a single addon data entry by key. Returns true if found and deleted. */
  deleteAddonDataByKey(key: string): Promise<boolean>;
  /** Delete all addon data entries for this event + addon. Returns number deleted. */
  deleteAllAddonData(): Promise<number>;

  // --- Event info ---

  /** Get a read-only snapshot of the event. */
  getEvent(): Promise<EventSnapshot | null>;
  /** Get the member list for this event. */
  getMembers(): Promise<MemberSnapshot[]>;

  // --- Auth ---

  /** Get the currently authenticated person, or null. */
  getAuthPerson(): Promise<AuthPersonSnapshot | null>;

  // --- Notifications ---

  /** Send a notification to all event members (except the author). */
  notifyEventMembers(options: NotifyOptions): Promise<void>;
}

/**
 * Extended context for trusted (first-party) add-on handlers.
 *
 * Includes everything from AddonContext plus raw database and
 * scheduler access for operations that cannot be expressed
 * through the scoped API (e.g., custom tables, scheduled functions).
 */
export interface TrustedAddonContext extends AddonContext {
  /** Full MutationCtx — use for custom tables, scheduler, etc. */
  readonly rawCtx: MutationCtx;
}

// ===== Factory functions =====

/**
 * Create a scoped AddonContext from a MutationCtx.
 * The returned object is frozen to prevent mutation.
 */
export function createAddonContext(
  ctx: MutationCtx,
  addonType: string,
  eventId: Id<'events'>
): AddonContext {
  const addonCtx: AddonContext = {
    addonType,
    eventId,

    async queryAddonData(): Promise<AddonDataEntry[]> {
      const entries = await ctx.db
        .query('addonData')
        .withIndex('by_event_addon', q =>
          q.eq('eventId', eventId).eq('addonType', addonType)
        )
        .collect();

      return entries.map(e => ({
        _id: e._id,
        key: e.key,
        data: e.data,
        createdBy: e.createdBy,
        createdAt: e.createdAt,
        updatedAt: e.updatedAt,
      }));
    },

    async getAddonDataByKey(key: string): Promise<AddonDataEntry | null> {
      const entry = await ctx.db
        .query('addonData')
        .withIndex('by_event_addon_key', q =>
          q.eq('eventId', eventId).eq('addonType', addonType).eq('key', key)
        )
        .first();

      if (!entry) return null;

      return {
        _id: entry._id,
        key: entry.key,
        data: entry.data,
        createdBy: entry.createdBy,
        createdAt: entry.createdAt,
        updatedAt: entry.updatedAt,
      };
    },

    async deleteAddonDataByKey(key: string): Promise<boolean> {
      const entry = await ctx.db
        .query('addonData')
        .withIndex('by_event_addon_key', q =>
          q.eq('eventId', eventId).eq('addonType', addonType).eq('key', key)
        )
        .first();

      if (!entry) return false;
      await ctx.db.delete(entry._id);
      return true;
    },

    async deleteAllAddonData(): Promise<number> {
      const entries = await ctx.db
        .query('addonData')
        .withIndex('by_event_addon', q =>
          q.eq('eventId', eventId).eq('addonType', addonType)
        )
        .collect();

      for (const entry of entries) {
        await ctx.db.delete(entry._id);
      }
      return entries.length;
    },

    async getEvent(): Promise<EventSnapshot | null> {
      const event = await ctx.db.get(eventId);
      if (!event) return null;

      return {
        _id: event._id,
        title: event.title,
        description: event.description,
        location: event.location,
        chosenDateTime: event.chosenDateTime,
        createdAt: event.createdAt,
      };
    },

    async getMembers(): Promise<MemberSnapshot[]> {
      const memberships = await ctx.db
        .query('memberships')
        .withIndex('by_event', q => q.eq('eventId', eventId))
        .collect();

      const members: MemberSnapshot[] = [];
      for (const m of memberships) {
        const person = await ctx.db.get(m.personId);
        let userName: string | null = null;
        let userImage: string | null = null;

        if (person) {
          try {
            const user = await authComponent.getAnyUserById(
              ctx,
              person.userId as AuthUserId
            );
            userName = user?.name || null;
            userImage = user?.image || null;
          } catch {
            // Auth component may not be available in tests
          }
        }

        members.push({
          personId: m.personId,
          role: m.role as 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE',
          rsvpStatus: m.rsvpStatus ?? 'PENDING',
          userName,
          userImage,
        });
      }

      return members;
    },

    async getAuthPerson(): Promise<AuthPersonSnapshot | null> {
      try {
        const { person } = await requireAuth(ctx);
        return { _id: person._id, userId: person.userId };
      } catch {
        return null;
      }
    },

    async notifyEventMembers(options: NotifyOptions): Promise<void> {
      await notifyEventMembers(ctx, {
        eventId,
        type: options.type,
        authorId: options.authorId,
        postId: options.postId,
        datetime: options.datetime,
      });
    },
  };

  return Object.freeze(addonCtx);
}

/**
 * Create a TrustedAddonContext from a MutationCtx.
 * Includes all scoped methods plus raw database/scheduler access.
 * The returned object is frozen to prevent mutation.
 */
export function createTrustedAddonContext(
  ctx: MutationCtx,
  addonType: string,
  eventId: Id<'events'>
): TrustedAddonContext {
  const baseCtx = createAddonContext(ctx, addonType, eventId);

  const trustedCtx: TrustedAddonContext = {
    ...baseCtx,
    rawCtx: ctx,
  };

  return Object.freeze(trustedCtx);
}
