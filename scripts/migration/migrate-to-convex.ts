/**
 * Main migration script - migrates data from Supabase to Convex.
 *
 * Prerequisites:
 * 1. Convex dev server running: pnpm convex:dev
 * 2. Supabase dump file at: supabase-backup-data.sql
 *
 * Usage:
 *   pnpm tsx scripts/migration/migrate-to-convex.ts
 *
 * Options:
 *   --dry-run    Parse data and show what would be migrated without making changes
 *   --clear      Clear existing data before migration (USE WITH CAUTION)
 */

import { ConvexHttpClient } from 'convex/browser';
import { api, internal } from '../../convex/_generated/api';
import * as fs from 'fs';
import * as path from 'path';
import { parseSqlDump, type ParsedData } from './parse-sql-dump';

// Get the Convex deployment URL from environment
const CONVEX_URL = process.env.CONVEX_URL || process.env.NEXT_PUBLIC_CONVEX_URL;

if (!CONVEX_URL) {
  console.error('Error: CONVEX_URL or NEXT_PUBLIC_CONVEX_URL environment variable not set');
  console.error('Run: source .env.local && pnpm tsx scripts/migration/migrate-to-convex.ts');
  process.exit(1);
}

const client = new ConvexHttpClient(CONVEX_URL);

// ID mappings - old ID -> new Convex ID
interface IdMappings {
  persons: Record<string, string>;
  personSettings: Record<string, string>;
  events: Record<string, string>;
  memberships: Record<string, string>;
  potentialDateTimes: Record<string, string>;
  posts: Record<string, string>;
  notificationMethods: Record<string, string>;
}

/**
 * Convert ISO timestamp string to Unix milliseconds.
 */
function timestampToMs(ts: string | null): number | undefined {
  if (!ts) return undefined;
  return new Date(ts).getTime();
}

/**
 * Generate a unique token for invites.
 */
function generateToken(): string {
  return Math.random().toString(36).substring(2, 15) +
    Math.random().toString(36).substring(2, 15);
}

/**
 * Find the organizer (creator) of an event from memberships.
 */
function findEventCreator(
  eventId: string,
  memberships: ParsedData['memberships']
): string | null {
  const organizer = memberships.find(
    m => m.eventId === eventId && m.role === 'ORGANIZER'
  );
  return organizer?.personId || null;
}

/**
 * Find a membership ID for a person in an event (for posts/replies).
 */
function findMembershipId(
  personId: string,
  eventId: string,
  memberships: ParsedData['memberships'],
  mappings: IdMappings
): string | undefined {
  const membership = memberships.find(
    m => m.personId === personId && m.eventId === eventId
  );
  return membership ? mappings.memberships[membership.id] : undefined;
}

/**
 * Split array into chunks for batch processing.
 */
function chunk<T>(array: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < array.length; i += size) {
    chunks.push(array.slice(i, i + size));
  }
  return chunks;
}

async function runMigration(dryRun: boolean, clearData: boolean) {
  console.log('='.repeat(60));
  console.log('Supabase to Convex Migration');
  console.log('='.repeat(60));

  if (dryRun) {
    console.log('DRY RUN MODE - No changes will be made\n');
  }

  // 1. Parse the SQL dump
  console.log('\n[1/12] Parsing SQL dump...');
  const dumpPath = path.join(__dirname, '../../supabase-backup-data.sql');

  if (!fs.existsSync(dumpPath)) {
    console.error(`Error: SQL dump not found at ${dumpPath}`);
    process.exit(1);
  }

  const data = parseSqlDump(dumpPath);

  console.log('\nData summary:');
  console.log(`  - ${data.persons.length} persons`);
  console.log(`  - ${data.events.length} events`);
  console.log(`  - ${data.memberships.length} memberships`);
  console.log(`  - ${data.potentialDateTimes.length} potential date times`);
  console.log(`  - ${data.availabilities.length} availabilities`);
  console.log(`  - ${data.posts.length} posts`);
  console.log(`  - ${data.replies.length} replies`);
  console.log(`  - ${data.invites.length} invites`);
  console.log(`  - ${data.notifications.length} notifications`);
  console.log(`  - ${data.personSettings.length} person settings`);
  console.log(`  - ${data.notificationMethods.length} notification methods`);
  console.log(`  - ${data.notificationSettings.length} notification settings`);

  if (dryRun) {
    console.log('\nDry run complete. Exiting without making changes.');
    return;
  }

  // Initialize mappings
  const mappings: IdMappings = {
    persons: {},
    personSettings: {},
    events: {},
    memberships: {},
    potentialDateTimes: {},
    posts: {},
    notificationMethods: {},
  };

  // 2. Optionally clear existing data
  if (clearData) {
    console.log('\n[2/12] Clearing existing data...');
    await client.mutation(internal.migration.clearAllData, {});
    console.log('Data cleared.');
  } else {
    console.log('\n[2/12] Skipping data clear (use --clear to clear first)');
  }

  // 3. Migrate persons
  console.log('\n[3/12] Migrating persons...');
  const personBatches = chunk(data.persons, 50);
  for (const batch of personBatches) {
    const personData = batch.map(p => ({
      clerkUserId: p.id,
      username: p.username,
      firstName: p.firstName || undefined,
      lastName: p.lastName || undefined,
      imageUrl: p.imageUrl || undefined,
    }));

    const batchMappings = await client.mutation(
      internal.migration.migratePersons,
      { persons: personData }
    );

    Object.assign(mappings.persons, batchMappings);
  }
  console.log(`Migrated ${data.persons.length} persons`);

  // 4. Create person settings for each person
  console.log('\n[4/12] Creating person settings...');
  const settingsData = data.personSettings.map(s => ({
    oldPersonId: s.personId,
    newPersonId: mappings.persons[s.personId],
  })).filter(s => s.newPersonId); // Only include if person was migrated

  const settingsBatches = chunk(settingsData, 50);
  for (const batch of settingsBatches) {
    const batchMappings = await client.mutation(
      internal.migration.migratePersonSettings,
      { settings: batch }
    );
    Object.assign(mappings.personSettings, batchMappings);
  }
  console.log(`Created ${settingsData.length} person settings`);

  // 5. Migrate events
  console.log('\n[5/12] Migrating events...');
  const eventBatches = chunk(data.events, 50);
  for (const batch of eventBatches) {
    const eventData = batch.map(e => {
      // Find the organizer as the creator
      const creatorClerkId = findEventCreator(e.id, data.memberships);
      const creatorId = creatorClerkId ? mappings.persons[creatorClerkId] : null;

      if (!creatorId) {
        console.warn(`Warning: No creator found for event "${e.title}" (${e.id})`);
        // Use the first migrated person as fallback
        const fallbackCreatorId = Object.values(mappings.persons)[0];
        return {
          oldId: e.id,
          title: e.title,
          description: e.description || undefined,
          location: e.location || undefined,
          chosenDateTime: timestampToMs(e.chosenDateTime),
          creatorId: fallbackCreatorId,
          createdAt: timestampToMs(e.createdAt) || Date.now(),
          updatedAt: timestampToMs(e.updatedAt) || Date.now(),
          timezone: 'America/New_York', // Default timezone
        };
      }

      return {
        oldId: e.id,
        title: e.title,
        description: e.description || undefined,
        location: e.location || undefined,
        chosenDateTime: timestampToMs(e.chosenDateTime),
        creatorId,
        createdAt: timestampToMs(e.createdAt) || Date.now(),
        updatedAt: timestampToMs(e.updatedAt) || Date.now(),
        timezone: 'America/New_York', // Default timezone
      };
    });

    const batchMappings = await client.mutation(
      internal.migration.migrateEvents,
      { events: eventData }
    );
    Object.assign(mappings.events, batchMappings);
  }
  console.log(`Migrated ${data.events.length} events`);

  // 6. Migrate memberships
  console.log('\n[6/12] Migrating memberships...');
  const membershipBatches = chunk(data.memberships, 50);
  for (const batch of membershipBatches) {
    const membershipData = batch.map(m => ({
      oldId: m.id,
      personId: mappings.persons[m.personId],
      eventId: mappings.events[m.eventId],
      role: m.role,
      rsvpStatus: m.rsvpStatus,
    })).filter(m => m.personId && m.eventId);

    if (membershipData.length > 0) {
      const batchMappings = await client.mutation(
        internal.migration.migrateMemberships,
        { memberships: membershipData }
      );
      Object.assign(mappings.memberships, batchMappings);
    }
  }
  console.log(`Migrated ${Object.keys(mappings.memberships).length} memberships`);

  // 7. Migrate potential date times
  console.log('\n[7/12] Migrating potential date times...');
  const pdtBatches = chunk(data.potentialDateTimes, 50);
  for (const batch of pdtBatches) {
    const pdtData = batch.map(pdt => ({
      oldId: pdt.id,
      eventId: mappings.events[pdt.eventId],
      dateTime: timestampToMs(pdt.dateTime) || Date.now(),
    })).filter(pdt => pdt.eventId);

    if (pdtData.length > 0) {
      const batchMappings = await client.mutation(
        internal.migration.migratePotentialDateTimes,
        { potentialDateTimes: pdtData }
      );
      Object.assign(mappings.potentialDateTimes, batchMappings);
    }
  }
  console.log(`Migrated ${Object.keys(mappings.potentialDateTimes).length} potential date times`);

  // 8. Migrate availabilities
  console.log('\n[8/12] Migrating availabilities...');
  const availabilityBatches = chunk(data.availabilities, 100);
  let availabilityCount = 0;
  for (const batch of availabilityBatches) {
    const availabilityData = batch.map(a => ({
      membershipId: mappings.memberships[a.membershipId],
      potentialDateTimeId: mappings.potentialDateTimes[a.potentialDateTimeId],
      status: a.status,
    })).filter(a => a.membershipId && a.potentialDateTimeId);

    if (availabilityData.length > 0) {
      await client.mutation(
        internal.migration.migrateAvailabilities,
        { availabilities: availabilityData }
      );
      availabilityCount += availabilityData.length;
    }
  }
  console.log(`Migrated ${availabilityCount} availabilities`);

  // 9. Migrate posts
  console.log('\n[9/12] Migrating posts...');
  const postBatches = chunk(data.posts, 50);
  for (const batch of postBatches) {
    const postData = batch.map(p => {
      const authorId = mappings.persons[p.authorId];
      const eventId = mappings.events[p.eventId];
      const membershipId = findMembershipId(p.authorId, p.eventId, data.memberships, mappings);

      return {
        oldId: p.id,
        title: p.title,
        content: p.content,
        editedAt: timestampToMs(p.editedAt) || Date.now(),
        authorId,
        eventId,
        membershipId,
      };
    }).filter(p => p.authorId && p.eventId);

    if (postData.length > 0) {
      const batchMappings = await client.mutation(
        internal.migration.migratePosts,
        { posts: postData }
      );
      Object.assign(mappings.posts, batchMappings);
    }
  }
  console.log(`Migrated ${Object.keys(mappings.posts).length} posts`);

  // 10. Migrate replies
  console.log('\n[10/12] Migrating replies...');
  const replyBatches = chunk(data.replies, 50);
  let replyCount = 0;

  // First, build a map of post old ID to event old ID for finding memberships
  const postToEventMap: Record<string, string> = {};
  for (const post of data.posts) {
    postToEventMap[post.id] = post.eventId;
  }

  for (const batch of replyBatches) {
    const replyData = batch.map(r => {
      const authorId = mappings.persons[r.authorId];
      const postId = mappings.posts[r.postId];
      const eventOldId = postToEventMap[r.postId];
      const membershipId = eventOldId
        ? findMembershipId(r.authorId, eventOldId, data.memberships, mappings)
        : undefined;

      return {
        text: r.text,
        authorId,
        postId,
        membershipId,
      };
    }).filter(r => r.authorId && r.postId);

    if (replyData.length > 0) {
      await client.mutation(internal.migration.migrateReplies, { replies: replyData });
      replyCount += replyData.length;
    }
  }
  console.log(`Migrated ${replyCount} replies`);

  // 11. Migrate invites
  console.log('\n[11/12] Migrating invites...');
  const inviteBatches = chunk(data.invites, 50);
  let inviteCount = 0;
  for (const batch of inviteBatches) {
    const inviteData = batch.map(i => ({
      eventId: mappings.events[i.eventId],
      createdById: mappings.memberships[i.createdById],
      token: generateToken(), // Generate new unique token
      expiresAt: timestampToMs(i.expiresAt),
      usesRemaining: i.usesRemaining || undefined,
      maxUses: i.maxUses || undefined,
      name: i.name || undefined,
    })).filter(i => i.eventId && i.createdById);

    if (inviteData.length > 0) {
      await client.mutation(internal.migration.migrateInvites, { invites: inviteData });
      inviteCount += inviteData.length;
    }
  }
  console.log(`Migrated ${inviteCount} invites`);

  // 12. Migrate notifications
  console.log('\n[12/12] Migrating notifications...');
  const notifBatches = chunk(data.notifications, 100);
  let notifCount = 0;

  // Map old notification types to new valid types
  const notificationTypeMap: Record<string, string | null> = {
    'NEW_POST': 'NEW_POST',
    'NEW_REPLY': 'NEW_REPLY',
    'DATE_CHOSEN': 'DATE_CHOSEN',
    'DATE_CHANGED': 'DATE_CHANGED',
    'DATE_RESET': 'DATE_RESET',
    'USER_JOINED': 'USER_JOINED',
    'USER_LEFT': 'USER_LEFT',
    'USER_PROMOTED': 'USER_PROMOTED',
    'USER_DEMOTED': 'USER_DEMOTED',
    'EVENT_EDITED': 'EVENT_EDITED',
    'USER_RSVP': 'USER_RSVP',
    'USER_MENTIONED': 'USER_MENTIONED',
    'EVENT_REMINDER': 'EVENT_REMINDER',
  };

  for (const batch of notifBatches) {
    const notifData = batch.map(n => {
      const mappedType = notificationTypeMap[n.type];
      if (!mappedType) {
        console.warn(`Unknown notification type: ${n.type}`);
        return null;
      }

      return {
        personId: mappings.persons[n.personId],
        type: mappedType as 'NEW_POST' | 'NEW_REPLY' | 'DATE_CHOSEN' | 'DATE_CHANGED' | 'DATE_RESET' | 'USER_JOINED' | 'USER_LEFT' | 'USER_PROMOTED' | 'USER_DEMOTED' | 'EVENT_EDITED' | 'USER_RSVP' | 'USER_MENTIONED' | 'EVENT_REMINDER',
        read: n.read,
        eventId: n.eventId ? mappings.events[n.eventId] : undefined,
        postId: n.postId ? mappings.posts[n.postId] : undefined,
        authorId: n.authorId ? mappings.persons[n.authorId] : undefined,
        datetime: timestampToMs(n.datetime),
        rsvp: n.rsvp as 'YES' | 'MAYBE' | 'NO' | 'PENDING' | undefined,
      };
    }).filter((n): n is NonNullable<typeof n> => n !== null && !!n.personId);

    if (notifData.length > 0) {
      await client.mutation(internal.migration.migrateNotifications, { notifications: notifData });
      notifCount += notifData.length;
    }
  }
  console.log(`Migrated ${notifCount} notifications`);

  // Note: Notification methods and settings migration skipped for now
  // as they require proper person settings IDs
  console.log('\nNote: Notification methods and settings will be recreated when users configure them.');

  // Save ID mappings for reference
  const mappingsPath = path.join(__dirname, 'id-mappings.json');
  fs.writeFileSync(mappingsPath, JSON.stringify(mappings, null, 2));
  console.log(`\nID mappings saved to: ${mappingsPath}`);

  console.log('\n' + '='.repeat(60));
  console.log('Migration complete!');
  console.log('='.repeat(60));
  console.log('\nNext steps:');
  console.log('1. Users can sign in with Better Auth using the same email');
  console.log('2. They need to "claim" their old account by entering their username');
  console.log('3. The system will link their new Better Auth user to their legacy data');
  console.log('\nLegacy user IDs are stored in format: legacy:clerk_id:username');
}

// Parse command line arguments
const args = process.argv.slice(2);
const dryRun = args.includes('--dry-run');
const clearData = args.includes('--clear');

runMigration(dryRun, clearData).catch(err => {
  console.error('Migration failed:', err);
  process.exit(1);
});
