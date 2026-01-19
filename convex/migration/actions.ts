/**
 * Migration action - handles the entire migration in a single Convex action.
 * This is triggered manually via the Convex dashboard or CLI.
 */

import { v } from 'convex/values';
import { internalAction } from '../_generated/server';
import { internal } from '../_generated/api';
import { Id } from '../_generated/dataModel';

// Types matching the parsed SQL data
interface OldPerson {
  id: string;
  createdAt: string;
  updatedAt: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  imageUrl: string;
  email: string; // Added from Clerk export
}

interface OldEvent {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
  location: string;
  chosenDateTime: string | null;
}

interface OldMembership {
  id: string;
  personId: string;
  eventId: string;
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
  rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
}

interface OldPotentialDateTime {
  id: string;
  eventId: string;
  dateTime: string;
}

interface OldAvailability {
  membershipId: string;
  potentialDateTimeId: string;
  status: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
}

interface OldPost {
  id: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string;
  authorId: string;
  eventId: string;
  title: string;
  content: string;
}

interface OldReply {
  id: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  postId: string;
  text: string;
}

interface OldInvite {
  id: string;
  eventId: string;
  createdById: string;
  createdAt: string;
  expiresAt: string | null;
  usesRemaining: number | null;
  maxUses: number | null;
  name: string | null;
}

interface OldNotification {
  id: string;
  createdAt: string;
  updatedAt: string;
  personId: string;
  type: string;
  eventId: string | null;
  postId: string | null;
  read: boolean;
  datetime: string | null;
  authorId: string | null;
  rsvp: string | null;
}

interface OldPersonSettings {
  id: string;
  createdAt: string;
  updatedAt: string;
  personId: string;
}

interface ParsedData {
  persons: OldPerson[];
  events: OldEvent[];
  memberships: OldMembership[];
  potentialDateTimes: OldPotentialDateTime[];
  availabilities: OldAvailability[];
  posts: OldPost[];
  replies: OldReply[];
  invites: OldInvite[];
  notifications: OldNotification[];
  personSettings: OldPersonSettings[];
}

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
    data: v.any(), // ParsedData JSON
    clearFirst: v.optional(v.boolean()),
  },
  handler: async (ctx, { data, clearFirst }) => {
    const parsedData = data as ParsedData;

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
        creatorId: creatorId as string,
        createdAt: timestampToMs(e.createdAt) || Date.now(),
        updatedAt: timestampToMs(e.updatedAt) || Date.now(),
        timezone: 'America/New_York',
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
        rsvp: n.rsvp as 'YES' | 'MAYBE' | 'NO' | 'PENDING' | undefined,
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
