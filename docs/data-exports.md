# Data Exports

> **Status: Planned** — This document describes a future feature that has not been implemented yet. It serves as the design spec and implementation plan for data export capabilities.

Feature spec for user-facing data export capabilities. Allows users to download their personal data and organizers to export event data in portable formats.

## Table of Contents

- [Overview](#overview)
- [Export Types](#export-types)
- [Access Control](#access-control)
- [Export Format](#export-format)
- [Backend Architecture](#backend-architecture)
- [Frontend UX](#frontend-ux)
- [Implementation Plan](#implementation-plan)
- [Edge Cases](#edge-cases)

---

## Overview

Two export scopes, both triggered from the UI and assembled server-side:

| Export            | Who                    | What They Get                                           |
| ----------------- | ---------------------- | ------------------------------------------------------- |
| **Personal data** | Any authenticated user | Their own profile, posts, responses, settings           |
| **Event data**    | ORGANIZER / MODERATOR  | Full event contents — members, posts, addon data, votes |

Instance-level database backups are out of scope — admins already have `npx convex export` for that.

---

## Export Types

### Personal Data Export

Everything that belongs to a single user, scoped to their `personId`. Useful for data portability, GDPR subject access requests, or leaving the platform.

**Included data:**

| File                   | Contents                                                                |
| ---------------------- | ----------------------------------------------------------------------- |
| `profile.json`         | Name, username, email, bio, pronouns, avatar URL                        |
| `settings.json`        | Notification preferences, DND status, muted events/posts                |
| `events.json`          | Events they belong to — title, date, location, their role/RSVP          |
| `posts.json`           | Posts and replies they authored (with event context)                    |
| `addon-responses.json` | Their questionnaire answers, bring list items, custom addon submissions |
| `friends.json`         | Friend connections (names only, not other users' data)                  |
| `invites.json`         | Event invites sent and received                                         |

**Excluded data:**

- Other users' profiles, emails, or settings
- Posts authored by other people (even in shared events)
- Addon responses from other members
- Auth tokens, sessions, password hashes
- Raw Convex document IDs (replaced with human-readable references)

### Event Data Export

Everything about a specific event, for organizers who want an offline copy or need to share data outside the app.

**Included data:**

| File                       | Format | Contents                                              |
| -------------------------- | ------ | ----------------------------------------------------- |
| `event.json`               | JSON   | Title, description, dates, location, timezone, status |
| `members.csv`              | CSV    | Name, username, role, RSVP status                     |
| `posts.json`               | JSON   | All posts with replies, author names, timestamps      |
| `availability.csv`         | CSV    | Date options × members, with their votes              |
| `addons/questionnaire.csv` | CSV    | Questions as columns, members as rows                 |
| `addons/bring-list.csv`    | CSV    | Items, who claimed them, quantities                   |
| `addons/custom-*.csv`      | CSV    | Custom addon fields as columns, responses as rows     |
| `addons/reminders.json`    | JSON   | Configured reminders and their schedules              |

**Excluded data:**

- Member email addresses (privacy — only names/usernames)
- Member notification settings
- Internal addon config (the organizer already sees this in the UI)
- Mute/DND statuses of other members

---

## Access Control

```typescript
// Personal data: any authenticated user, own data only
const { person } = await requireAuth(ctx);
// All queries filter by person._id

// Event data: ORGANIZER or MODERATOR of that event
await requireEventRole(ctx, eventId, 'MODERATOR');
// Queries scoped to eventId
```

No export should ever return data the requesting user couldn't already see through the normal UI. The export is a convenience for downloading what they can already access.

---

## Export Format

### File Structure

Both export types produce a ZIP archive:

```
groupi-export-2026-02-24/
├── README.txt              # What this export contains, when it was generated
├── profile.json            # (personal) or event.json (event)
├── members.csv             # (event only)
├── posts.json
├── availability.csv        # (event only)
└── addons/
    ├── questionnaire.csv
    ├── bring-list.csv
    └── custom-rsvp-details.csv
```

### JSON Format

Human-readable, indented, with timestamps as ISO 8601:

```json
{
  "exportedAt": "2026-02-24T15:30:00Z",
  "exportType": "personal",
  "user": {
    "name": "Alice Chen",
    "username": "alice",
    "email": "alice@example.com",
    "bio": "Event planning enthusiast"
  },
  "events": [
    {
      "title": "Game Night",
      "role": "ORGANIZER",
      "rsvp": "YES",
      "date": "2026-03-15T19:00:00-05:00",
      "location": "123 Main St"
    }
  ]
}
```

### CSV Format

Standard RFC 4180 CSV with headers. Suitable for opening in Excel, Google Sheets, etc:

```csv
Name,Username,Role,RSVP
Alice Chen,alice,ORGANIZER,YES
Bob Smith,bob,ATTENDEE,MAYBE
Carol Davis,carol,ATTENDEE,YES
```

### ID Sanitization

Internal Convex document IDs are replaced with human-readable references:

| Internal                      | Exported As                      |
| ----------------------------- | -------------------------------- |
| `j57a3k4m8n9p2q1r` (personId) | `alice` (username) or name       |
| `k82b4l5n9o0q3r2s` (eventId)  | `Game Night` (title)             |
| `m93c5m6o0p1r4s3t` (postId)   | `Post: "Snack Ideas"` or omitted |

---

## Backend Architecture

### Convex Action

Exports are implemented as Convex actions (not mutations) because they're read-only and may need more processing time than a query allows.

```typescript
// convex/exports/actions.ts

export const exportPersonalData = action({
  args: {},
  handler: async ctx => {
    const { person, user } = await requireAuth(ctx);

    // Gather data from all relevant tables
    const profile = await buildProfileExport(ctx, person, user);
    const events = await buildEventsExport(ctx, person._id);
    const posts = await buildPostsExport(ctx, person._id);
    const addonResponses = await buildAddonResponsesExport(ctx, person._id);
    const friends = await buildFriendsExport(ctx, person._id);
    const settings = await buildSettingsExport(ctx, person._id);

    // Assemble into ZIP structure
    const archive = buildArchive({
      'profile.json': profile,
      'events.json': events,
      'posts.json': posts,
      'addon-responses.json': addonResponses,
      'friends.json': friends,
      'settings.json': settings,
    });

    // Store in Convex file storage, return download URL
    const storageId = await ctx.storage.store(archive);
    const url = await ctx.storage.getUrl(storageId);

    // Schedule cleanup — delete the file after 1 hour
    await ctx.scheduler.runAfter(
      60 * 60 * 1000,
      internal.exports.cleanup.deleteExport,
      { storageId }
    );

    return { url };
  },
});

export const exportEventData = action({
  args: { eventId: v.id('events') },
  handler: async (ctx, { eventId }) => {
    await requireEventRole(ctx, eventId, 'MODERATOR');

    const event = await buildEventExport(ctx, eventId);
    const members = await buildMembersExport(ctx, eventId);
    const posts = await buildEventPostsExport(ctx, eventId);
    const availability = await buildAvailabilityExport(ctx, eventId);
    const addons = await buildAddonsExport(ctx, eventId);

    const archive = buildArchive({
      'event.json': event,
      'members.csv': members,
      'posts.json': posts,
      'availability.csv': availability,
      ...addons, // addons/questionnaire.csv, addons/bring-list.csv, etc.
    });

    const storageId = await ctx.storage.store(archive);
    const url = await ctx.storage.getUrl(storageId);

    await ctx.scheduler.runAfter(
      60 * 60 * 1000,
      internal.exports.cleanup.deleteExport,
      { storageId }
    );

    return { url };
  },
});
```

### Data Builders

Each `build*Export` function queries a single domain and returns sanitized data. They share a common pattern:

1. Query the relevant table(s) filtered by personId or eventId
2. Resolve references (person → username/name, event → title)
3. Strip internal fields (`_id`, `_creationTime`, internal flags)
4. Format timestamps as ISO 8601
5. Return a plain object (for JSON) or a `{ headers, rows }` structure (for CSV)

```typescript
// convex/exports/builders.ts

async function buildMembersExport(
  ctx: ActionCtx,
  eventId: Id<'events'>
): Promise<CsvData> {
  const memberships = await ctx.runQuery(
    internal.exports.queries.getEventMemberships,
    { eventId }
  );

  return {
    headers: ['Name', 'Username', 'Role', 'RSVP'],
    rows: memberships.map(m => [
      m.name || '',
      m.username || '',
      m.role,
      m.rsvpStatus,
    ]),
  };
}
```

### File Assembly

ZIP creation happens inside the Convex action. Options:

- **`fflate`** — lightweight, pure JS, works in edge runtime. No native dependencies. This is the best fit for Convex actions.
- **`jszip`** — more common but heavier, may have issues in Convex's runtime.

```typescript
import { zipSync, strToU8 } from 'fflate';

function buildArchive(files: Record<string, string | CsvData>): Blob {
  const entries: Record<string, Uint8Array> = {};

  // Add README
  entries['README.txt'] = strToU8(
    `Groupi Data Export\nGenerated: ${new Date().toISOString()}\n`
  );

  for (const [path, content] of Object.entries(files)) {
    if (typeof content === 'string') {
      // JSON content
      entries[path] = strToU8(content);
    } else {
      // CSV content
      entries[path] = strToU8(toCsv(content.headers, content.rows));
    }
  }

  const zipped = zipSync(entries);
  return new Blob([zipped], { type: 'application/zip' });
}
```

### Cleanup

Export files are temporary. A scheduled function deletes them after 1 hour:

```typescript
// convex/exports/cleanup.ts
export const deleteExport = internalMutation({
  args: { storageId: v.id('_storage') },
  handler: async (ctx, { storageId }) => {
    await ctx.storage.delete(storageId);
  },
});
```

### Rate Limiting

Exports are expensive. Prevent abuse:

- Max 1 personal data export per hour per user
- Max 1 event export per hour per event
- Track last export timestamp in the action, reject if too soon

---

## Frontend UX

### Personal Data Export

Location: **Settings → Privacy → Export My Data**

```
┌──────────────────────────────────────┐
│  Export My Data                       │
│                                      │
│  Download a copy of your Groupi      │
│  data including your profile,        │
│  posts, event memberships, and       │
│  addon responses.                    │
│                                      │
│  Format: ZIP archive (JSON + CSV)    │
│                                      │
│  [ Export My Data ]                  │
│                                      │
│  ┌──────────────────────────────┐   │
│  │ ⏳ Preparing your export...  │   │
│  │    This may take a moment.   │   │
│  └──────────────────────────────┘   │
│                                      │
│  Your export will be available for   │
│  1 hour after generation.            │
└──────────────────────────────────────┘
```

### Event Data Export

Location: **Event → Manage (organizer menu) → Export Event Data**

```
┌──────────────────────────────────────┐
│  Export Event Data                    │
│                                      │
│  Download all data for "Game Night"  │
│  including members, posts, votes,    │
│  and addon responses.                │
│                                      │
│  Includes:                           │
│  ✓ Member list with roles and RSVP   │
│  ✓ All posts and replies             │
│  ✓ Availability votes                │
│  ✓ Questionnaire responses           │
│  ✓ Bring list items                  │
│                                      │
│  [ Export Event Data ]               │
└──────────────────────────────────────┘
```

### Flow

1. User clicks export button
2. Button shows loading state ("Preparing your export...")
3. Frontend calls the Convex action via `useMutation` (or `useAction`)
4. Action returns a download URL
5. Frontend triggers browser download of the ZIP file
6. File auto-deletes from storage after 1 hour

---

## Implementation Plan

### Phase 1: Backend Foundation

1. **Create `convex/exports/` directory**
   - `actions.ts` — main export actions (personal + event)
   - `queries.ts` — internal queries for gathering data (scoped reads)
   - `builders.ts` — data shaping functions per domain
   - `cleanup.ts` — scheduled file deletion
   - `format.ts` — CSV formatting, JSON serialization, ID sanitization

2. **Add `fflate` dependency** to the Convex package for ZIP creation

3. **Personal data export action**
   - Profile + user data
   - Events (membership, role, RSVP)
   - Posts + replies (authored by user)
   - Addon responses (keyed by `response:{personId}`)
   - Friends list
   - Settings + notification preferences

4. **Event data export action**
   - Event metadata
   - Members with roles (names/usernames only, no emails)
   - Posts + replies (all, with author names)
   - Availability votes
   - Addon data per enabled addon

### Phase 2: Frontend UI

5. **Personal export page**
   - Add to Settings → Privacy section
   - Export button with loading state
   - Download link with 1-hour expiry notice

6. **Event export button**
   - Add to event manage/organizer menu
   - Same loading → download flow
   - Only visible to ORGANIZER / MODERATOR

7. **Shared export hook**
   - `useExportPersonalData()` — calls action, handles loading/error/download
   - `useExportEventData(eventId)` — same pattern for events
   - Both trigger browser download on success

### Phase 3: Addon Integration

8. **Generic addon export interface**
   - Each addon type provides a `buildExport(ctx, eventId)` function
   - Returns `{ filename, headers, rows }` for CSV output
   - The event export action calls all enabled addons' export builders

9. **Built-in addon exporters**
   - Questionnaire: questions as columns, responses as rows
   - Bring list: items, claimed by, quantity
   - Custom addons: field definitions as columns, submissions as rows
   - Reminders: schedule summary (JSON)

---

## Edge Cases

### Large Events

Events with hundreds of members and thousands of posts could exceed Convex action timeout (2 minutes) or file storage limits.

**Mitigation:** Paginate queries inside the action. If the export is too large for a single action run, split into multiple scheduled steps that append to the same archive. For v1, log a warning and truncate with a note in the README.

### Deleted Users

Posts may reference users who have since deleted their accounts.

**Mitigation:** Show `[deleted user]` as the author name. Don't include their profile data.

### Unicode and Special Characters

Names, post content, and locations may contain emoji, CJK characters, or other Unicode.

**Mitigation:** All files are UTF-8 encoded. CSV files include a BOM (`\uFEFF`) prefix so Excel opens them correctly.

### Concurrent Exports

A user clicks export multiple times.

**Mitigation:** The rate limit (1 per hour) prevents this. The frontend disables the button while an export is in progress and shows the existing download link if one was recently generated.

### Addon Data Shape Variations

Custom addons have user-defined field schemas that vary per template.

**Mitigation:** The custom addon exporter reads the template's field definitions to build CSV headers dynamically. Fields that don't exist in older responses get empty cells.
