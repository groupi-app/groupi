/**
 * Parses the Supabase SQL dump file into structured TypeScript objects.
 * This handles the PostgreSQL COPY format used by pg_dump.
 */

import * as fs from 'fs';
import * as path from 'path';

// Import Clerk CSV parser
import { parseClerkCsv, ClerkUser } from './parse-clerk-users';

// Types for the old Supabase schema
export interface OldPerson {
  id: string; // Clerk user ID
  createdAt: string;
  updatedAt: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  imageUrl: string;
  // Added from Clerk export
  email: string;
}

export interface OldEvent {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
  location: string;
  chosenDateTime: string | null;
}

export interface OldMembership {
  id: string;
  personId: string;
  eventId: string;
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
  rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
}

export interface OldPotentialDateTime {
  id: string;
  eventId: string;
  dateTime: string;
}

export interface OldAvailability {
  membershipId: string;
  potentialDateTimeId: string;
  status: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
}

export interface OldPost {
  id: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string;
  authorId: string;
  eventId: string;
  title: string;
  content: string;
}

export interface OldReply {
  id: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  postId: string;
  text: string;
}

export interface OldInvite {
  id: string;
  eventId: string;
  createdById: string;
  createdAt: string;
  expiresAt: string | null;
  usesRemaining: number | null;
  maxUses: number | null;
  name: string | null;
}

export interface OldNotification {
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

export interface OldPersonSettings {
  id: string;
  createdAt: string;
  updatedAt: string;
  personId: string;
}

export interface OldNotificationMethod {
  id: string;
  createdAt: string;
  updatedAt: string;
  settingsId: string;
  type: 'EMAIL' | 'PUSH' | 'WEBHOOK';
  enabled: boolean;
  name: string | null;
  value: string;
  customTemplate: string | null;
  webhookFormat: string | null;
  webhookHeaders: string | null;
}

export interface OldNotificationSetting {
  id: string;
  notificationType: string;
  methodId: string;
  enabled: boolean;
}

export interface ParsedData {
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
  notificationMethods: OldNotificationMethod[];
  notificationSettings: OldNotificationSetting[];
}

/**
 * Parse a PostgreSQL INSERT statement into an array of rows.
 * Handles multi-line INSERT statements with proper string escaping.
 */
function parseInsertStatement(sql: string, tableName: string): string[][] {
  // Find the INSERT INTO statement for this table
  const pattern = new RegExp(
    `INSERT INTO "public"\\."${tableName}"\\s*\\([^)]+\\)\\s*VALUES([\\s\\S]*?)(?=;\\s*(?:INSERT|--|$))`,
    'g'
  );

  const match = pattern.exec(sql);
  if (!match) {
    return [];
  }

  const valuesSection = match[1];
  const rows: string[][] = [];

  // Parse each row - they're separated by ),\n\t(
  const rowPattern = /\(([^)]*(?:\([^)]*\)[^)]*)*)\)/g;
  let rowMatch;

  while ((rowMatch = rowPattern.exec(valuesSection)) !== null) {
    const rowContent = rowMatch[1];
    const values = parseRowValues(rowContent);
    rows.push(values);
  }

  return rows;
}

/**
 * Parse a single row's values, handling quoted strings and NULLs.
 */
function parseRowValues(rowContent: string): string[] {
  const values: string[] = [];
  let current = '';
  let inString = false;
  let i = 0;

  while (i < rowContent.length) {
    const char = rowContent[i];

    if (char === "'" && !inString) {
      inString = true;
      i++;
      continue;
    }

    if (char === "'" && inString) {
      // Check for escaped quote
      if (rowContent[i + 1] === "'") {
        current += "'";
        i += 2;
        continue;
      }
      inString = false;
      values.push(current);
      current = '';
      i++;
      continue;
    }

    if (char === ',' && !inString) {
      if (current.trim() === 'NULL') {
        values.push('NULL');
      } else if (current.trim() !== '') {
        values.push(current.trim());
      }
      current = '';
      i++;
      continue;
    }

    if (inString) {
      current += char;
    } else if (char !== ' ' && char !== '\t' && char !== '\n') {
      current += char;
    }

    i++;
  }

  // Handle last value
  if (current.trim() !== '') {
    if (current.trim() === 'NULL') {
      values.push('NULL');
    } else {
      values.push(current.trim());
    }
  }

  return values;
}

/**
 * Convert a PostgreSQL timestamp string to an ISO string.
 */
function parseTimestamp(ts: string | null): string | null {
  if (!ts || ts === 'NULL') return null;
  // PostgreSQL format: '2024-07-01 01:39:45.454'
  // Add 'T' and 'Z' to make it ISO format
  return ts.replace(' ', 'T') + 'Z';
}

/**
 * Parse boolean values from PostgreSQL format.
 */
function parseBoolean(val: string): boolean {
  return val === 'true' || val === 't' || val === '1';
}

/**
 * Parse integer values, handling NULL.
 */
function parseInteger(val: string): number | null {
  if (val === 'NULL' || val === '') return null;
  return parseInt(val, 10);
}

export function parseSqlDump(filePath: string, clerkCsvPath?: string): ParsedData {
  const sql = fs.readFileSync(filePath, 'utf-8');

  // Parse Clerk CSV if provided to get emails
  let clerkUserMap: Record<string, ClerkUser> = {};
  if (clerkCsvPath && fs.existsSync(clerkCsvPath)) {
    const clerkUsers = parseClerkCsv(clerkCsvPath);
    for (const user of clerkUsers) {
      clerkUserMap[user.id] = user;
    }
    console.log(`Loaded ${clerkUsers.length} Clerk users with emails`);
  }

  // Parse each table
  const personRows = parseInsertStatement(sql, 'Person');
  const eventRows = parseInsertStatement(sql, 'Event');
  const membershipRows = parseInsertStatement(sql, 'Membership');
  const potentialDateTimeRows = parseInsertStatement(sql, 'PotentialDateTime');
  const availabilityRows = parseInsertStatement(sql, 'Availability');
  const postRows = parseInsertStatement(sql, 'Post');
  const replyRows = parseInsertStatement(sql, 'Reply');
  const inviteRows = parseInsertStatement(sql, 'Invite');
  const notificationRows = parseInsertStatement(sql, 'Notification');
  const personSettingsRows = parseInsertStatement(sql, 'PersonSettings');
  const notificationMethodRows = parseInsertStatement(sql, 'NotificationMethod');
  const notificationSettingRows = parseInsertStatement(sql, 'NotificationSetting');

  console.log(`Parsed ${personRows.length} persons`);
  console.log(`Parsed ${eventRows.length} events`);
  console.log(`Parsed ${membershipRows.length} memberships`);
  console.log(`Parsed ${potentialDateTimeRows.length} potential date times`);
  console.log(`Parsed ${availabilityRows.length} availabilities`);
  console.log(`Parsed ${postRows.length} posts`);
  console.log(`Parsed ${replyRows.length} replies`);
  console.log(`Parsed ${inviteRows.length} invites`);
  console.log(`Parsed ${notificationRows.length} notifications`);
  console.log(`Parsed ${personSettingsRows.length} person settings`);
  console.log(`Parsed ${notificationMethodRows.length} notification methods`);
  console.log(`Parsed ${notificationSettingRows.length} notification settings`);

  // Transform rows into typed objects
  // Merge with Clerk data to get emails
  const persons: OldPerson[] = personRows.map(row => {
    const clerkId = row[0];
    const clerkUser = clerkUserMap[clerkId];

    // Use Clerk data for name if available
    const firstName = clerkUser?.firstName || (row[3] === 'NULL' ? null : row[3]);
    const lastName = clerkUser?.lastName || (row[4] === 'NULL' ? null : row[4]);

    return {
      id: clerkId,
      createdAt: parseTimestamp(row[1])!,
      updatedAt: parseTimestamp(row[2])!,
      firstName,
      lastName,
      username: clerkUser?.username || row[5],
      imageUrl: row[6],
      // Email from Clerk export - this is required for Better Auth
      email: clerkUser?.email || '',
    };
  });

  const events: OldEvent[] = eventRows.map(row => ({
    id: row[0],
    createdAt: parseTimestamp(row[1])!,
    updatedAt: parseTimestamp(row[2])!,
    title: row[3],
    description: row[4] || '',
    location: row[5] || '',
    chosenDateTime: parseTimestamp(row[6]),
  }));

  const memberships: OldMembership[] = membershipRows.map(row => ({
    id: row[0],
    personId: row[1],
    eventId: row[2],
    role: row[3] as 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE',
    rsvpStatus: row[4] as 'YES' | 'MAYBE' | 'NO' | 'PENDING',
  }));

  const potentialDateTimes: OldPotentialDateTime[] = potentialDateTimeRows.map(row => ({
    id: row[0],
    eventId: row[1],
    dateTime: parseTimestamp(row[2])!,
  }));

  const availabilities: OldAvailability[] = availabilityRows.map(row => ({
    membershipId: row[0],
    potentialDateTimeId: row[1],
    status: row[2] as 'YES' | 'MAYBE' | 'NO' | 'PENDING',
  }));

  const posts: OldPost[] = postRows.map(row => ({
    id: row[0],
    createdAt: parseTimestamp(row[1])!,
    updatedAt: parseTimestamp(row[2])!,
    editedAt: parseTimestamp(row[3])!,
    authorId: row[4],
    eventId: row[5],
    title: row[6],
    content: row[7],
  }));

  const replies: OldReply[] = replyRows.map(row => ({
    id: row[0],
    createdAt: parseTimestamp(row[1])!,
    updatedAt: parseTimestamp(row[2])!,
    authorId: row[3],
    postId: row[4],
    text: row[5],
  }));

  const invites: OldInvite[] = inviteRows.map(row => ({
    id: row[0],
    eventId: row[1],
    createdById: row[2],
    createdAt: parseTimestamp(row[3])!,
    expiresAt: parseTimestamp(row[4]),
    usesRemaining: parseInteger(row[5]),
    maxUses: parseInteger(row[6]),
    name: row[7] === 'NULL' ? null : row[7],
  }));

  const notifications: OldNotification[] = notificationRows.map(row => ({
    id: row[0],
    createdAt: parseTimestamp(row[1])!,
    updatedAt: parseTimestamp(row[2])!,
    personId: row[3],
    type: row[4],
    eventId: row[5] === 'NULL' ? null : row[5],
    postId: row[6] === 'NULL' ? null : row[6],
    read: parseBoolean(row[7]),
    datetime: parseTimestamp(row[8]),
    authorId: row[9] === 'NULL' ? null : row[9],
    rsvp: row[10] === 'NULL' ? null : row[10],
  }));

  const personSettings: OldPersonSettings[] = personSettingsRows.map(row => ({
    id: row[0],
    createdAt: parseTimestamp(row[1])!,
    updatedAt: parseTimestamp(row[2])!,
    personId: row[3],
  }));

  const notificationMethods: OldNotificationMethod[] = notificationMethodRows.map(row => ({
    id: row[0],
    createdAt: parseTimestamp(row[1])!,
    updatedAt: parseTimestamp(row[2])!,
    settingsId: row[3],
    type: row[4] as 'EMAIL' | 'PUSH' | 'WEBHOOK',
    enabled: parseBoolean(row[5]),
    name: row[6] === 'NULL' ? null : row[6],
    value: row[7],
    customTemplate: row[8] === 'NULL' ? null : row[8],
    webhookFormat: row[9] === 'NULL' ? null : row[9],
    webhookHeaders: row[10] === 'NULL' ? null : row[10],
  }));

  const notificationSettings: OldNotificationSetting[] = notificationSettingRows.map(row => ({
    id: row[0],
    notificationType: row[1],
    methodId: row[2],
    enabled: parseBoolean(row[3]),
  }));

  return {
    persons,
    events,
    memberships,
    potentialDateTimes,
    availabilities,
    posts,
    replies,
    invites,
    notifications,
    personSettings,
    notificationMethods,
    notificationSettings,
  };
}

// Run if executed directly
const isMainModule = import.meta.url === `file://${process.argv[1]}`;
if (isMainModule) {
  const __dirname = new URL('.', import.meta.url).pathname;
  const dumpPath = path.join(__dirname, '../../supabase-backup-data.sql');

  // Use Clerk CSV from Downloads folder
  const clerkCsvPath = '/Users/tsurette/Downloads/ins_2gkgKffk4yzRi8mUP2nizXuZReH.csv';

  console.log('Parsing SQL dump with Clerk user data...');
  const data = parseSqlDump(dumpPath, clerkCsvPath);

  // Check for users without emails
  const usersWithoutEmail = data.persons.filter(p => !p.email);
  if (usersWithoutEmail.length > 0) {
    console.log(`\nWarning: ${usersWithoutEmail.length} users without email addresses:`);
    usersWithoutEmail.forEach(p => {
      console.log(`  - ${p.id} (${p.username})`);
    });
  }

  // Save parsed data to JSON for inspection
  const outputPath = path.join(__dirname, 'parsed-data.json');
  fs.writeFileSync(outputPath, JSON.stringify(data, null, 2));
  console.log(`\nParsed data saved to ${outputPath}`);

  // Show sample with emails
  console.log('\nSample persons with emails:');
  data.persons.slice(0, 5).forEach(p => {
    console.log(`  ${p.username}: ${p.email} (${p.firstName} ${p.lastName})`);
  });
}
