# Supabase to Convex Migration

This directory contains scripts and instructions to migrate data from the old Supabase/Clerk-based system to the new Convex/Better Auth system.

## Overview

The migration creates actual Better Auth users and preserves all data relationships:

- **Better Auth Users** → Created with email, username, and name from Clerk export
- **Persons** → Linked directly to Better Auth users (users can sign in immediately)
- **Events** → Migrated with creator determined from ORGANIZER membership
- **Memberships** → All person-event relationships preserved
- **Posts & Replies** → Author relationships preserved
- **Invites** → New tokens generated, creator relationships preserved
- **Notifications** → All notification history preserved
- **Availabilities** → All date/time voting preserved

## Prerequisites

1. **Supabase SQL dump** - Export from Supabase (supabase-backup-data.sql)
2. **Clerk user export CSV** - Download from Clerk dashboard (contains emails)

## Migration Steps

### Step 1: Parse the SQL Dump with Clerk Data

```bash
npx tsx scripts/migration/parse-sql-dump.ts
```

This:

- Reads the Supabase SQL dump
- Merges with Clerk CSV to get email addresses
- Creates `parsed-data.json` with all the extracted data

### Step 2: Push Convex Functions

```bash
npx convex dev --once --typecheck=disable
```

This deploys the migration functions to your Convex deployment.

### Step 3: Run the Migration

The migration runs as a Convex action. You can run it via the Convex dashboard.

**Via Convex Dashboard**

1. Go to your Convex dashboard: https://dashboard.convex.dev
2. Navigate to Functions → migration/actions → runMigration
3. Click "Run Function"
4. Paste the contents of `parsed-data.json` as the `data` argument
5. Set `clearFirst: true` if you want to clear existing data first

The migration will:

1. Create Better Auth users with email/username/name
2. Create person records linked to those users
3. Migrate all events, memberships, posts, etc. with proper relationships

## Post-Migration

After migration, users can sign in immediately using:

- Their email address (magic link)
- OAuth (Google, Discord) if they used the same email

No account claiming required - the migration creates real Better Auth users.

## Data Mapping

### User Records

Old Clerk format:

```
id: "user_2iclMU63hXRNSSAtVCEhusch9Yu"
email: "tsurette111@gmail.com"
username: "theia"
firstName: "Theia"
lastName: "Surette"
```

New Better Auth format:

```
_id: "abc123..."  (Convex ID)
email: "tsurette111@gmail.com"
username: "theia"
displayUsername: "theia"
name: "Theia Surette"
emailVerified: true
```

### Person Records

```
_id: "xyz789..."  (Convex ID)
userId: "abc123..."  (Better Auth user ID)
bio: "Theia Surette"
```

### Timestamps

- Old: PostgreSQL timestamp strings (e.g., "2024-07-01 01:39:45.454")
- New: Unix milliseconds (e.g., 1719798785454)

### Timezones

Events are assigned "America/New_York" as the default timezone during migration.
Users can update this after migration.

## Files

- `parse-sql-dump.ts` - Parses Supabase SQL dump into JSON
- `parsed-data.json` - (Generated) Parsed data ready for import
- `run-migration.ts` - Alternative script to run migration via HTTP client
- `../convex/migration/` - Convex migration functions:
  - `mutations.ts` - Internal mutations for data import
  - `actions.ts` - Main migration action
  - `claim.ts` - Account claiming functions

## Troubleshooting

### "User already has an account" when claiming

The user already signed up and has a fresh person record. They can still claim if they just signed up - the empty new record will be deleted.

### Missing relationships

Check the `id-mappings.json` file to see if the old ID was successfully mapped. Missing mappings usually mean the referenced record doesn't exist.

### Timeout during migration

Large datasets may timeout. The migration is designed to batch operations, but you may need to run it multiple times for very large datasets.
