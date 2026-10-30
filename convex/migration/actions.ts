/**
 * Migration action - handles the entire migration in a single Convex action.
 * This is triggered manually via the Convex dashboard or CLI.
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

// Historical SQL import contract; inferred by Convex rather than cast.
const OldPerson = v.object({
  id: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  firstName: v.union(v.string(), v.null()),
  lastName: v.union(v.string(), v.null()),
  username: v.string(),
  imageUrl: v.string(),
  email: v.string(),
});
const OldEvent = v.object({
  id: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  title: v.string(),
  description: v.string(),
  location: v.string(),
  chosenDateTime: v.union(v.string(), v.null()),
  chosenEndDateTime: v.union(v.string(), v.null()),
  reminderOffset: v.union(
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
  ),
});
const OldMembership = v.object({
  id: v.string(),
  personId: v.string(),
  eventId: v.string(),
  role: v.union(
    v.literal('ORGANIZER'),
    v.literal('MODERATOR'),
    v.literal('ATTENDEE')
  ),
  rsvpStatus: v.union(
    v.literal('YES'),
    v.literal('MAYBE'),
    v.literal('NO'),
    v.literal('PENDING')
  ),
});
const OldPotentialDateTime = v.object({
  id: v.string(),
  eventId: v.string(),
  dateTime: v.string(),
  endDateTime: v.union(v.string(), v.null()),
});
const OldAvailability = v.object({
  membershipId: v.string(),
  potentialDateTimeId: v.string(),
  status: v.union(
    v.literal('YES'),
    v.literal('MAYBE'),
    v.literal('NO'),
    v.literal('PENDING')
  ),
});
const OldPost = v.object({
  id: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  editedAt: v.string(),
  authorId: v.string(),
  eventId: v.string(),
  title: v.string(),
  content: v.string(),
});
const OldReply = v.object({
  id: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  authorId: v.string(),
  postId: v.string(),
  text: v.string(),
});
const OldInvite = v.object({
  id: v.string(),
  eventId: v.string(),
  createdById: v.string(),
  createdAt: v.string(),
  expiresAt: v.union(v.string(), v.null()),
  usesRemaining: v.union(v.number(), v.null()),
  maxUses: v.union(v.number(), v.null()),
  usesTotal: v.union(v.number(), v.null()),
  name: v.union(v.string(), v.null()),
});
const OldNotification = v.object({
  id: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  personId: v.string(),
  type: v.string(),
  eventId: v.union(v.string(), v.null()),
  postId: v.union(v.string(), v.null()),
  read: v.boolean(),
  datetime: v.union(v.string(), v.null()),
  authorId: v.union(v.string(), v.null()),
  rsvp: v.union(v.string(), v.null()),
});
const OldPersonSettings = v.object({
  id: v.string(),
  createdAt: v.string(),
  updatedAt: v.string(),
  personId: v.string(),
});
const ParsedData = v.object({
  persons: v.array(OldPerson),
  events: v.array(OldEvent),
  memberships: v.array(OldMembership),
  potentialDateTimes: v.array(OldPotentialDateTime),
  availabilities: v.array(OldAvailability),
  posts: v.array(OldPost),
  replies: v.array(OldReply),
  invites: v.array(OldInvite),
  notifications: v.array(OldNotification),
  personSettings: v.array(OldPersonSettings),
});

// ID mappings
interface IdMappings {
  persons: Record<string, Id<'persons'>>;
  personSettings: Record<string, Id<'personSettings'>>;
  events: Record<string, Id<'events'>>;
  memberships: Record<string, Id<'memberships'>>;
  potentialDateTimes: Record<string, Id<'potentialDateTimes'>>;
  posts: Record<string, Id<'posts'>>;
}

function timestampToMs(ts: string | null): number | undefined {
  if (!ts) return undefined;
  return new Date(ts).getTime();
}

function generateToken(): string {
  return (
    Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15)
  );
}

/**
 * Main migration action - call this with the parsed JSON data.
 * Run via: npx convex run migration/actions:runMigration --push
 */
export const runMigration = internalAction({
  args: {
    data: ParsedData,
    clearFirst: v.optional(v.boolean()),
  },
  handler: async (ctx, { data, clearFirst }) => {
    const parsedData = data;

    console.log('='.repeat(60));
    console.log('Starting Supabase to Convex Migration');
    console.log('='.repeat(60));

    // Initialize mappings
    const mappings: IdMappings = {
      persons: {},
      personSettings: {},
      events: {},
      memberships: {},
      potentialDateTimes: {},
      posts: {},
    };

    // Step 1: Clear data if requested
    if (clearFirst) {
      console.log('\n[1] Clearing existing data...');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore - Known Convex type instantiation depth issue with internal API in web tsconfig
      await ctx.runMutation(internal.migration.mutations.clearAllData, {});
    }

    // Step 2: Create Better Auth users first
    console.log('\n[2] Creating Better Auth users...');
    const usersWithEmail = parsedData.persons.filter(p => p.email);
    console.log(
      `  Found ${usersWithEmail.length} users with email addresses (out of ${parsedData.persons.length})`
    );

    // Batch users to avoid timeout
    const USER_BATCH_SIZE = 20;
    const clerkToAuthUserMapping: Record<string, string> = {};

    for (let i = 0; i < usersWithEmail.length; i += USER_BATCH_SIZE) {
      const batch = usersWithEmail.slice(i, i + USER_BATCH_SIZE);
      const userData = batch.map(p => ({
        clerkId: p.id,
        email: p.email,
        name:
          p.firstName && p.lastName
            ? `${p.firstName} ${p.lastName}`
            : p.firstName || p.username,
        username: p.username,
        // Omit imageUrl - Clerk-hosted images will become inaccessible
      }));

      const batchMappings = await ctx.runMutation(
        internal.migration.mutations.createAuthUsers,
        { users: userData }
      );
      Object.assign(clerkToAuthUserMapping, batchMappings);
      console.log(
        `  Created ${Math.min(i + USER_BATCH_SIZE, usersWithEmail.length)}/${usersWithEmail.length} Better Auth users`
      );
    }

    // Step 3: Migrate persons (linked to Better Auth users)
    console.log('\n[3] Migrating persons...');
    const personData = usersWithEmail
      .filter(p => clerkToAuthUserMapping[p.id]) // Only migrate users we created in Better Auth
      .map(p => ({
        clerkUserId: p.id,
        betterAuthUserId: clerkToAuthUserMapping[p.id],
        bio:
          p.firstName && p.lastName
            ? `${p.firstName} ${p.lastName}`
            : p.firstName || undefined,
      }));
    const personMappings = await ctx.runMutation(
      internal.migration.mutations.migratePersons,
      { persons: personData }
    );
    Object.assign(mappings.persons, personMappings);

    // Step 4: Create person settings
    console.log('\n[4] Creating person settings...');
    const settingsData = parsedData.personSettings
      .map(s => ({
        oldPersonId: s.personId,
        newPersonId: mappings.persons[s.personId],
      }))
      .filter(s => s.newPersonId);
    const settingsMappings = await ctx.runMutation(
      internal.migration.mutations.migratePersonSettings,
      { settings: settingsData }
    );
    Object.assign(mappings.personSettings, settingsMappings);

    // Step 5: Migrate events (find organizer as creator)
    console.log('\n[5] Migrating events...');
    const eventData = parsedData.events.map(e => {
      // Find organizer for this event
      const organizer = parsedData.memberships.find(
        m => m.eventId === e.id && m.role === 'ORGANIZER'
      );
      const creatorId = organizer
        ? mappings.persons[organizer.personId]
        : Object.values(mappings.persons)[0]; // Fallback

      return {
        oldId: e.id,
        title: e.title,
        description: e.description || undefined,
        location: e.location || undefined,
        chosenDateTime: timestampToMs(e.chosenDateTime),
        chosenEndDateTime: timestampToMs(e.chosenEndDateTime),
        creatorId: creatorId as string,
        createdAt: timestampToMs(e.createdAt) || Date.now(),
        updatedAt: timestampToMs(e.updatedAt) || Date.now(),
        timezone: 'America/New_York',
        reminderOffset: e.reminderOffset || undefined,
      };
    });
    const eventMappings = await ctx.runMutation(
      internal.migration.mutations.migrateEvents,
      { events: eventData }
    );
    Object.assign(mappings.events, eventMappings);

    // Step 6: Migrate memberships
    console.log('\n[6] Migrating memberships...');
    const membershipData = parsedData.memberships
      .map(m => ({
        oldId: m.id,
        personId: mappings.persons[m.personId] as string,
        eventId: mappings.events[m.eventId] as string,
        role: m.role,
        rsvpStatus: m.rsvpStatus,
      }))
      .filter(m => m.personId && m.eventId);
    const membershipMappings = await ctx.runMutation(
      internal.migration.mutations.migrateMemberships,
      { memberships: membershipData }
    );
    Object.assign(mappings.memberships, membershipMappings);

    // Step 7: Migrate potential date times
    console.log('\n[7] Migrating potential date times...');
    const pdtData = parsedData.potentialDateTimes
      .map(pdt => ({
        oldId: pdt.id,
        eventId: mappings.events[pdt.eventId] as string,
        dateTime: timestampToMs(pdt.dateTime) || Date.now(),
        endDateTime: timestampToMs(pdt.endDateTime),
      }))
      .filter(pdt => pdt.eventId);
    const pdtMappings = await ctx.runMutation(
      internal.migration.mutations.migratePotentialDateTimes,
      { potentialDateTimes: pdtData }
    );
    Object.assign(mappings.potentialDateTimes, pdtMappings);

    // Step 8: Migrate availabilities (batch to avoid timeout)
    console.log('\n[8] Migrating availabilities...');
    const BATCH_SIZE = 200;
    const availabilities = parsedData.availabilities
      .map(a => ({
        membershipId: mappings.memberships[a.membershipId] as string,
        potentialDateTimeId: mappings.potentialDateTimes[
          a.potentialDateTimeId
        ] as string,
        status: a.status,
      }))
      .filter(a => a.membershipId && a.potentialDateTimeId);

    for (let i = 0; i < availabilities.length; i += BATCH_SIZE) {
      const batch = availabilities.slice(i, i + BATCH_SIZE);
      await ctx.runMutation(
        internal.migration.mutations.migrateAvailabilities,
        {
          availabilities: batch,
        }
      );
      console.log(
        `  Migrated ${Math.min(i + BATCH_SIZE, availabilities.length)}/${availabilities.length} availabilities`
      );
    }

    // Step 9: Migrate posts
    console.log('\n[9] Migrating posts...');
    const postData = parsedData.posts
      .map(p => {
        const membership = parsedData.memberships.find(
          m => m.personId === p.authorId && m.eventId === p.eventId
        );
        return {
          oldId: p.id,
          title: p.title,
          content: p.content,
          editedAt: timestampToMs(p.editedAt) || Date.now(),
          authorId: mappings.persons[p.authorId] as string,
          eventId: mappings.events[p.eventId] as string,
          membershipId: membership
            ? (mappings.memberships[membership.id] as string)
            : undefined,
        };
      })
      .filter(p => p.authorId && p.eventId);
    const postMappings = await ctx.runMutation(
      internal.migration.mutations.migratePosts,
      { posts: postData }
    );
    Object.assign(mappings.posts, postMappings);

    // Build post->event map for replies
    const postToEventMap: Record<string, string> = {};
    for (const post of parsedData.posts) {
      postToEventMap[post.id] = post.eventId;
    }

    // Step 10: Migrate replies
    console.log('\n[10] Migrating replies...');
    const replyData = parsedData.replies
      .map(r => {
        const eventOldId = postToEventMap[r.postId];
        const membership = eventOldId
          ? parsedData.memberships.find(
              m => m.personId === r.authorId && m.eventId === eventOldId
            )
          : undefined;
        return {
          text: r.text,
          authorId: mappings.persons[r.authorId] as string,
          postId: mappings.posts[r.postId] as string,
          membershipId: membership
            ? (mappings.memberships[membership.id] as string)
            : undefined,
        };
      })
      .filter(r => r.authorId && r.postId);
    await ctx.runMutation(internal.migration.mutations.migrateReplies, {
      replies: replyData,
    });

    // Step 11: Migrate invites
    console.log('\n[11] Migrating invites...');
    const inviteData = parsedData.invites
      .map(i => ({
        eventId: mappings.events[i.eventId] as string,
        createdById: mappings.memberships[i.createdById] as string,
        token: generateToken(),
        expiresAt: timestampToMs(i.expiresAt),
        usesRemaining: i.usesRemaining || undefined,
        maxUses: i.maxUses || undefined,
        usesTotal: i.usesTotal || undefined,
        name: i.name || undefined,
      }))
      .filter(i => i.eventId && i.createdById);
    await ctx.runMutation(internal.migration.mutations.migrateInvites, {
      invites: inviteData,
    });

    // Step 12: Migrate notifications
    console.log('\n[12] Migrating notifications...');
    const validNotificationTypes = new Set([
      'EVENT_EDITED',
      'NEW_POST',
      'NEW_REPLY',
      'DATE_CHOSEN',
      'DATE_CHANGED',
      'DATE_RESET',
      'USER_JOINED',
      'USER_LEFT',
      'USER_PROMOTED',
      'USER_DEMOTED',
      'USER_RSVP',
      'USER_MENTIONED',
      'EVENT_REMINDER',
    ]);

    const notifications = parsedData.notifications
      .filter(n => validNotificationTypes.has(n.type))
      .map(n => ({
        personId: mappings.persons[n.personId] as string,
        type: n.type as
          | 'NEW_POST'
          | 'NEW_REPLY'
          | 'DATE_CHOSEN'
          | 'DATE_CHANGED'
          | 'DATE_RESET'
          | 'USER_JOINED'
          | 'USER_LEFT'
          | 'USER_PROMOTED'
          | 'USER_DEMOTED'
          | 'EVENT_EDITED'
          | 'USER_RSVP'
          | 'USER_MENTIONED'
          | 'EVENT_REMINDER',
        read: n.read,
        eventId: n.eventId ? (mappings.events[n.eventId] as string) : undefined,
        postId: n.postId ? (mappings.posts[n.postId] as string) : undefined,
        authorId: n.authorId
          ? (mappings.persons[n.authorId] as string)
          : undefined,
        datetime: timestampToMs(n.datetime),
        rsvp: n.rsvp
          ? (n.rsvp as 'YES' | 'MAYBE' | 'NO' | 'PENDING')
          : undefined,
      }))
      .filter(n => n.personId);

    for (let i = 0; i < notifications.length; i += BATCH_SIZE) {
      const batch = notifications.slice(i, i + BATCH_SIZE);
      await ctx.runMutation(internal.migration.mutations.migrateNotifications, {
        notifications: batch,
      });
      console.log(
        `  Migrated ${Math.min(i + BATCH_SIZE, notifications.length)}/${notifications.length} notifications`
      );
    }

    console.log('\n' + '='.repeat(60));
    console.log('Migration complete!');
    console.log('='.repeat(60));

    return {
      success: true,
      counts: {
        persons: Object.keys(mappings.persons).length,
        events: Object.keys(mappings.events).length,
        memberships: Object.keys(mappings.memberships).length,
        potentialDateTimes: Object.keys(mappings.potentialDateTimes).length,
        availabilities: availabilities.length,
        posts: Object.keys(mappings.posts).length,
        replies: replyData.length,
        invites: inviteData.length,
        notifications: notifications.length,
      },
    };
  },
});
