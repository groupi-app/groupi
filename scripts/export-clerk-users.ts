/**
 * Export Clerk users with their email addresses.
 *
 * Usage:
 *   CLERK_SECRET_KEY=sk_live_xxx npx tsx scripts/export-clerk-users.ts
 *
 * Output: clerk_users.json
 */

import * as fs from 'fs';
import * as path from 'path';

interface ClerkUser {
  id: string;
  email_addresses: Array<{
    id: string;
    email_address: string;
  }>;
  primary_email_address_id: string;
  username: string | null;
  first_name: string | null;
  last_name: string | null;
  created_at: number;
  updated_at: number;
}

interface ClerkUserExport {
  id: string;
  email: string;
  username: string | null;
  firstName: string | null;
  lastName: string | null;
}

async function fetchAllClerkUsers(): Promise<ClerkUser[]> {
  const secretKey = process.env.CLERK_SECRET_KEY;

  if (!secretKey) {
    console.error('CLERK_SECRET_KEY environment variable is required');
    console.error(
      'Usage: CLERK_SECRET_KEY=sk_live_xxx npx tsx scripts/export-clerk-users.ts'
    );
    process.exit(1);
  }

  const allUsers: ClerkUser[] = [];
  let offset = 0;
  const limit = 100;

  console.log('Fetching users from Clerk...');

  while (true) {
    const url = `https://api.clerk.com/v1/users?limit=${limit}&offset=${offset}`;

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${secretKey}`,
        'Content-Type': 'application/json',
      },
    });

    if (!response.ok) {
      const error = await response.text();
      console.error(`Clerk API error: ${response.status} - ${error}`);
      process.exit(1);
    }

    const users = (await response.json()) as ClerkUser[];

    if (users.length === 0) {
      break;
    }

    allUsers.push(...users);
    console.log(`  Fetched ${allUsers.length} users...`);

    if (users.length < limit) {
      break;
    }

    offset += limit;

    // Rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return allUsers;
}

async function main() {
  const users = await fetchAllClerkUsers();

  console.log(`\nTotal users: ${users.length}`);

  // Export in a format that includes emails
  const exportData: ClerkUserExport[] = users.map(user => {
    // Find primary email or first email
    let email = '';
    if (user.primary_email_address_id) {
      const primaryEmail = user.email_addresses.find(
        e => e.id === user.primary_email_address_id
      );
      if (primaryEmail) {
        email = primaryEmail.email_address;
      }
    }
    if (!email && user.email_addresses.length > 0) {
      email = user.email_addresses[0].email_address;
    }

    return {
      id: user.id,
      email,
      username: user.username,
      firstName: user.first_name,
      lastName: user.last_name,
    };
  });

  const usersWithEmail = exportData.filter(u => u.email);
  const usersWithoutEmail = exportData.filter(u => !u.email);

  console.log(`Users with email: ${usersWithEmail.length}`);
  if (usersWithoutEmail.length > 0) {
    console.log(`Users without email: ${usersWithoutEmail.length}`);
    console.log('  IDs:', usersWithoutEmail.map(u => u.id).join(', '));
  }

  const outputPath = path.join(process.cwd(), 'clerk_users.json');
  fs.writeFileSync(outputPath, JSON.stringify(exportData, null, 2));

  console.log(`\nExported to: ${outputPath}`);
  console.log('\nNow run the parse script with the Clerk export:');
  console.log(
    '  npx tsx scripts/parse-supabase-dump.ts --clerk-export clerk_users.json'
  );
}

main().catch(console.error);
