/**
 * Parse Supabase SQL dump and convert to JSON for Convex migration.
 *
 * Usage:
 *   npx tsx scripts/parse-supabase-dump.ts [--clerk-export clerk_users.json]
 *
 * The script reads supabase_prod_data.sql and outputs migration_data.json
 */

import * as fs from 'fs';
import * as path from 'path';

// Types matching the migration action's expected format
interface ParsedPerson {
  id: string;
  createdAt: string;
  updatedAt: string;
  firstName: string | null;
  lastName: string | null;
  username: string;
  imageUrl: string;
  email: string;
}

interface ParsedEvent {
  id: string;
  createdAt: string;
  updatedAt: string;
  title: string;
  description: string;
  location: string;
  chosenDateTime: string | null;
  chosenEndDateTime: string | null;
  reminderOffset: string | null;
}

interface ParsedMembership {
  id: string;
  personId: string;
  eventId: string;
  role: 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE';
  rsvpStatus: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
}

interface ParsedPotentialDateTime {
  id: string;
  eventId: string;
  dateTime: string;
  endDateTime: string | null;
}

interface ParsedAvailability {
  membershipId: string;
  potentialDateTimeId: string;
  status: 'YES' | 'MAYBE' | 'NO' | 'PENDING';
}

interface ParsedPost {
  id: string;
  createdAt: string;
  updatedAt: string;
  editedAt: string;
  authorId: string;
  eventId: string;
  title: string;
  content: string;
}

interface ParsedReply {
  id: string;
  createdAt: string;
  updatedAt: string;
  authorId: string;
  postId: string;
  text: string;
}

interface ParsedInvite {
  id: string;
  eventId: string;
  createdById: string;
  createdAt: string;
  expiresAt: string | null;
  usesRemaining: number | null;
  maxUses: number | null;
  usesTotal: number | null;
  name: string | null;
}

interface ParsedNotification {
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

interface ParsedPersonSettings {
  id: string;
  createdAt: string;
  updatedAt: string;
  personId: string;
}

interface ClerkUser {
  id: string;
  email_addresses: Array<{ email_address: string }>;
  primary_email_address_id: string;
}

interface ClerkCsvRow {
  id: string;
  first_name: string;
  last_name: string;
  username: string;
  primary_email_address: string;
}

/**
 * Parse SQL INSERT VALUES into an array of row data.
 * Handles:
 * - Quoted strings with escaped quotes
 * - NULL values
 * - Numbers
 * - Multi-line content
 */
function parseInsertValues(sql: string, tableName: string): string[][] {
  // Find the INSERT statement for this table
  const tablePattern = new RegExp(
    `INSERT INTO "public"\\."${tableName}" \\([^)]+\\) VALUES\\s*`,
    'i'
  );
  const match = sql.match(tablePattern);
  if (!match) {
    console.log(`No data found for table: ${tableName}`);
    return [];
  }

  const startIndex = match.index! + match[0].length;

  // Find the end of this INSERT statement (ends with ; followed by newlines and next statement)
  let endIndex = sql.indexOf(';\n\n', startIndex);
  if (endIndex === -1) {
    endIndex = sql.indexOf(';\n--', startIndex);
  }
  if (endIndex === -1) {
    endIndex = sql.length;
  }

  const valuesStr = sql.substring(startIndex, endIndex);
  const rows: string[][] = [];

  // Parse each row - rows are separated by ),\n\t(
  // First row starts with (, last row ends with );
  let currentRow: string[] = [];
  let currentValue = '';
  let inQuotes = false;
  let depth = 0;

  for (let i = 0; i < valuesStr.length; i++) {
    const char = valuesStr[i];
    const nextChar = valuesStr[i + 1];

    if (char === "'" && !inQuotes) {
      inQuotes = true;
      continue;
    }

    if (char === "'" && inQuotes) {
      // Check for escaped quote ''
      if (nextChar === "'") {
        currentValue += "'";
        i++; // Skip the next quote
        continue;
      }
      inQuotes = false;
      continue;
    }

    if (inQuotes) {
      currentValue += char;
      continue;
    }

    if (char === '(') {
      depth++;
      if (depth === 1) {
        currentRow = [];
        currentValue = '';
        continue;
      }
    }

    if (char === ')') {
      depth--;
      if (depth === 0) {
        // End of row
        currentRow.push(currentValue.trim());
        rows.push(currentRow);
        currentValue = '';
        continue;
      }
    }

    if (char === ',' && depth === 1) {
      currentRow.push(currentValue.trim());
      currentValue = '';
      continue;
    }

    if (depth >= 1) {
      currentValue += char;
    }
  }

  return rows;
}

function parseValue(value: string): string | number | boolean | null {
  if (value === 'NULL') return null;
  if (value === 'true') return true;
  if (value === 'false') return false;
  // Check if it's a number
  if (/^-?\d+(\.\d+)?$/.test(value)) {
    return parseFloat(value);
  }
  return value;
}

function parsePersons(sql: string): Omit<ParsedPerson, 'email'>[] {
  const rows = parseInsertValues(sql, 'Person');
  return rows.map(row => ({
    id: row[0],
    createdAt: row[1],
    updatedAt: row[2],
    firstName: row[3] === 'NULL' ? null : row[3],
    lastName: row[4] === 'NULL' ? null : row[4],
    username: row[5],
    imageUrl: row[6],
  }));
}

function parseEvents(sql: string): ParsedEvent[] {
  const rows = parseInsertValues(sql, 'Event');
  return rows.map(row => ({
    id: row[0],
    createdAt: row[1],
    updatedAt: row[2],
    title: row[3],
    description: row[4],
    location: row[5],
    chosenDateTime: row[6] === 'NULL' ? null : row[6],
    // These fields don't exist in old schema, set to null
    chosenEndDateTime: null,
    reminderOffset: null,
  }));
}

function parseMemberships(sql: string): ParsedMembership[] {
  const rows = parseInsertValues(sql, 'Membership');
  return rows.map(row => ({
    id: row[0],
    personId: row[1],
    eventId: row[2],
    role: row[3] as 'ORGANIZER' | 'MODERATOR' | 'ATTENDEE',
    rsvpStatus: row[4] as 'YES' | 'MAYBE' | 'NO' | 'PENDING',
  }));
}

function parsePotentialDateTimes(sql: string): ParsedPotentialDateTime[] {
  const rows = parseInsertValues(sql, 'PotentialDateTime');
  return rows.map(row => ({
    id: row[0],
    eventId: row[1],
    dateTime: row[2],
    endDateTime: null, // New field, not in old schema
  }));
}

function parseAvailabilities(sql: string): ParsedAvailability[] {
  const rows = parseInsertValues(sql, 'Availability');
  return rows.map(row => ({
    membershipId: row[0],
    potentialDateTimeId: row[1],
    status: row[2] as 'YES' | 'MAYBE' | 'NO' | 'PENDING',
  }));
}

function parsePosts(sql: string): ParsedPost[] {
  const rows = parseInsertValues(sql, 'Post');
  return rows.map(row => ({
    id: row[0],
    createdAt: row[1],
    updatedAt: row[2],
    editedAt: row[3],
    authorId: row[4],
    eventId: row[5],
    title: row[6],
    content: row[7],
  }));
}

function parseReplies(sql: string): ParsedReply[] {
  const rows = parseInsertValues(sql, 'Reply');
  return rows.map(row => ({
    id: row[0],
    createdAt: row[1],
    updatedAt: row[2],
    authorId: row[3],
    postId: row[4],
    text: row[5],
  }));
}

function parseInvites(sql: string): ParsedInvite[] {
  const rows = parseInsertValues(sql, 'Invite');
  return rows.map(row => ({
    id: row[0],
    eventId: row[1],
    createdById: row[2],
    createdAt: row[3],
    expiresAt: row[4] === 'NULL' ? null : row[4],
    usesRemaining: row[5] === 'NULL' ? null : parseInt(row[5], 10),
    maxUses: row[6] === 'NULL' ? null : parseInt(row[6], 10),
    usesTotal: null, // New field
    name: row[7] === 'NULL' ? null : row[7],
  }));
}

function parseNotifications(sql: string): ParsedNotification[] {
  const rows = parseInsertValues(sql, 'Notification');
  return rows.map(row => ({
    id: row[0],
    createdAt: row[1],
    updatedAt: row[2],
    personId: row[3],
    type: row[4],
    eventId: row[5] === 'NULL' ? null : row[5],
    postId: row[6] === 'NULL' ? null : row[6],
    read: row[7] === 'true',
    datetime: row[8] === 'NULL' ? null : row[8],
    authorId: row[9] === 'NULL' ? null : row[9],
    rsvp: row[10] === 'NULL' ? null : row[10],
  }));
}

function parsePersonSettings(sql: string): ParsedPersonSettings[] {
  const rows = parseInsertValues(sql, 'PersonSettings');
  return rows.map(row => ({
    id: row[0],
    createdAt: row[1],
    updatedAt: row[2],
    personId: row[3],
  }));
}

async function fetchClerkEmails(
  userIds: string[]
): Promise<Record<string, string>> {
  const clerkSecretKey = process.env.CLERK_SECRET_KEY;
  if (!clerkSecretKey) {
    console.error('CLERK_SECRET_KEY not set, cannot fetch emails from Clerk');
    return {};
  }

  const emailMap: Record<string, string> = {};

  console.log(`Fetching emails for ${userIds.length} users from Clerk...`);

  for (const userId of userIds) {
    try {
      const response = await fetch(`https://api.clerk.com/v1/users/${userId}`, {
        headers: {
          Authorization: `Bearer ${clerkSecretKey}`,
        },
      });

      if (response.ok) {
        const user = (await response.json()) as ClerkUser;
        const primaryEmail = user.email_addresses.find(
          e => e.email_address === user.primary_email_address_id
        );
        if (primaryEmail) {
          emailMap[userId] = primaryEmail.email_address;
        } else if (user.email_addresses.length > 0) {
          emailMap[userId] = user.email_addresses[0].email_address;
        }
      } else {
        console.warn(`Failed to fetch user ${userId}: ${response.status}`);
      }
    } catch (error) {
      console.warn(`Error fetching user ${userId}:`, error);
    }

    // Rate limiting - Clerk has rate limits
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return emailMap;
}

function loadClerkExport(filePath: string): Record<string, string> {
  const content = fs.readFileSync(filePath, 'utf-8');
  const emailMap: Record<string, string> = {};

  // Check if it's CSV or JSON
  if (filePath.endsWith('.csv') || content.startsWith('id,')) {
    // Parse CSV
    const lines = content.split('\n');
    const headers = lines[0].split(',');
    const idIndex = headers.indexOf('id');
    const emailIndex = headers.indexOf('primary_email_address');

    if (idIndex === -1 || emailIndex === -1) {
      console.error('CSV missing required columns: id, primary_email_address');
      return emailMap;
    }

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple CSV parsing (works for this export format)
      const values = line.split(',');
      const id = values[idIndex];
      const email = values[emailIndex];

      if (id && email) {
        emailMap[id] = email;
      }
    }
  } else {
    // Parse JSON
    const data = JSON.parse(content);

    // Handle different Clerk export formats
    if (Array.isArray(data)) {
      for (const user of data) {
        if (user.id && user.email_addresses?.length > 0) {
          emailMap[user.id] = user.email_addresses[0].email_address;
        } else if (user.id && user.email) {
          emailMap[user.id] = user.email;
        }
      }
    }
  }

  return emailMap;
}

async function main() {
  const args = process.argv.slice(2);
  const clerkExportIndex = args.indexOf('--clerk-export');
  const clerkExportPath =
    clerkExportIndex !== -1 ? args[clerkExportIndex + 1] : null;

  const sqlPath = path.join(process.cwd(), 'supabase_prod_data.sql');
  const outputPath = path.join(process.cwd(), 'migration_data.json');

  if (!fs.existsSync(sqlPath)) {
    console.error(`SQL dump not found at: ${sqlPath}`);
    process.exit(1);
  }

  console.log('Reading SQL dump...');
  const sql = fs.readFileSync(sqlPath, 'utf-8');

  console.log('Parsing tables...');
  const personsWithoutEmail = parsePersons(sql);
  const events = parseEvents(sql);
  const memberships = parseMemberships(sql);
  const potentialDateTimes = parsePotentialDateTimes(sql);
  const availabilities = parseAvailabilities(sql);
  const posts = parsePosts(sql);
  const replies = parseReplies(sql);
  const invites = parseInvites(sql);
  const notifications = parseNotifications(sql);
  const personSettings = parsePersonSettings(sql);

  console.log(`Found:
  - ${personsWithoutEmail.length} persons
  - ${events.length} events
  - ${memberships.length} memberships
  - ${potentialDateTimes.length} potential date times
  - ${availabilities.length} availabilities
  - ${posts.length} posts
  - ${replies.length} replies
  - ${invites.length} invites
  - ${notifications.length} notifications
  - ${personSettings.length} person settings`);

  // Get emails for users
  let emailMap: Record<string, string> = {};

  if (clerkExportPath && fs.existsSync(clerkExportPath)) {
    console.log(`Loading Clerk export from: ${clerkExportPath}`);
    emailMap = loadClerkExport(clerkExportPath);
    console.log(`Loaded ${Object.keys(emailMap).length} emails from export`);
  } else if (process.env.CLERK_SECRET_KEY) {
    const userIds = personsWithoutEmail.map(p => p.id);
    emailMap = await fetchClerkEmails(userIds);
    console.log(
      `Fetched ${Object.keys(emailMap).length} emails from Clerk API`
    );
  } else {
    console.warn(
      'WARNING: No Clerk export or CLERK_SECRET_KEY provided. Users without emails will be skipped during migration.'
    );
    console.warn(
      'To provide emails, either:\n' +
        '  1. Set CLERK_SECRET_KEY environment variable\n' +
        '  2. Provide --clerk-export path/to/clerk_users.json'
    );
  }

  // Add emails to persons
  const persons: ParsedPerson[] = personsWithoutEmail.map(p => ({
    ...p,
    email: emailMap[p.id] || '',
  }));

  const personsWithEmail = persons.filter(p => p.email);
  const personsWithoutEmailCount = persons.filter(p => !p.email).length;

  if (personsWithoutEmailCount > 0) {
    console.warn(
      `WARNING: ${personsWithoutEmailCount} persons have no email and will be skipped`
    );
  }

  const migrationData = {
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
  };

  console.log(`Writing migration data to: ${outputPath}`);
  fs.writeFileSync(outputPath, JSON.stringify(migrationData, null, 2));

  console.log('\nMigration data ready!');
  console.log(`\nNext steps:
  1. Review the migration_data.json file
  2. Run the migration in test environment:
     npx convex run migration/actions:runMigration --push \\
       '{"data": ${JSON.stringify(migrationData).substring(0, 50)}..., "clearFirst": true}'

  Or use the Convex dashboard to run the migration action.
  `);
}

main().catch(console.error);
