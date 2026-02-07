# Add-on Framework Rules

Rules for working with the Groupi add-on framework. See `docs/addon-framework.md` for comprehensive documentation.

## Table of Contents

- [Overview](#overview)
- [File Locations](#file-locations)
- [Adding a New Add-on](#adding-a-new-add-on)
- [Backend Rules](#backend-rules)
- [Frontend Rules](#frontend-rules)
- [Gating Rules](#gating-rules)
- [Testing Rules](#testing-rules)
- [Anti-Patterns](#anti-patterns)

## Overview

The add-on framework provides optional, pluggable features for events. Add-ons use a handler + registry pattern on both backend and frontend. The framework manages lifecycle, storage, gating, and UI rendering.

**Current add-ons:** Reminders, Questionnaire

**Key tables:** `eventAddonConfigs`, `addonData`, `addonOptOuts`

## File Locations

| Component             | Location                                                                |
| --------------------- | ----------------------------------------------------------------------- |
| Addon types           | `convex/addons/types.ts`                                                |
| Backend handlers      | `convex/addons/handlers/{name}.ts`                                      |
| Backend registry      | `convex/addons/registry.ts`                                             |
| Backend queries       | `convex/addons/queries.ts`                                              |
| Backend mutations     | `convex/addons/mutations.ts`                                            |
| Lifecycle dispatcher  | `convex/addons/lifecycle.ts`                                            |
| Frontend registry     | `packages/web/app/(newEvent)/create/components/addon-registry.ts`       |
| Frontend addons       | `packages/web/app/(newEvent)/create/components/addons/{name}-addon.tsx` |
| Addon hooks           | `packages/web/hooks/convex/use-addons.ts`                               |
| Gating hook           | `packages/web/hooks/convex/use-addon-gating.ts`                         |
| Event layout (gating) | `packages/web/app/(event)/event/[eventId]/layout.tsx`                   |
| Addon page route      | `packages/web/app/(event)/event/[eventId]/addon/[addonId]/page.tsx`     |
| Manage page           | `packages/web/app/(event)/event/[eventId]/manage-addons/`               |

## Adding a New Add-on

Follow this exact order:

### Step 1: Add type to `ADDON_TYPES`

```typescript
// convex/addons/types.ts
export const ADDON_TYPES = {
  REMINDERS: 'reminders',
  QUESTIONNAIRE: 'questionnaire',
  MY_ADDON: 'my-addon', // Add here
} as const;
```

### Step 2: Create backend handler

```
convex/addons/handlers/my-addon.ts
```

Must implement `AddonHandler` interface with at minimum `type` and `validateConfig`. Include `onDisabled` and `onEventDeleted` for cleanup.

### Step 3: Register handler

```typescript
// convex/addons/registry.ts
import { myAddonHandler } from './handlers/my-addon';
// Add to handlers map
```

### Step 4: Run `pnpm generate`

### Step 5: Create frontend addon file

```
packages/web/app/(newEvent)/create/components/addons/my-addon.tsx
```

Must call `registerAddon()` at module level with all required components.

### Step 6: Add side-effect imports

Add `import './addons/my-addon'` (or `import '@/app/(newEvent)/create/components/addons/my-addon'`) to these 4 files:

- `event-addons.tsx`
- `addon/[addonId]/page.tsx`
- `manage-addons-content.tsx`
- `new-event-addons.tsx`

### Step 7: Write tests

- Backend: `convex/tests/my-addon.test.ts`
- Frontend: alongside the addon or in hooks tests

## Backend Rules

### Rule 1: Always validate config

`validateConfig` must return `false` for any invalid config shape. Never trust the config object.

```typescript
// ✅ Type-safe validation
function isValidConfig(config: unknown): config is MyConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  return typeof c.setting === 'string';
}
```

### Rule 2: Clean up on disable and delete

Every handler with side effects or data must implement `onDisabled` and `onEventDeleted` to remove addon-specific data.

```typescript
// ✅ Clean up addon data
onDisabled: async (ctx, eventId) => {
  const entries = await ctx.db
    .query('addonData')
    .withIndex('by_event_addon', q => q.eq('eventId', eventId).eq('addonType', 'my-addon'))
    .collect();
  for (const entry of entries) await ctx.db.delete(entry._id);
},
```

### Rule 3: Use `addonData` for user responses

Store user-submitted data in the `addonData` table with key format `response:{personId}`. This pattern is required for gating to detect completion.

```typescript
// Key format for gating compatibility
key: `response:${personId}`;
```

### Rule 4: Notify on config reset

If updating config invalidates existing responses, clear them and notify members:

```typescript
onConfigUpdated: async (ctx, eventId, _old, _new) => {
  await clearAllResponses(ctx, eventId, addonType);
  const { person } = await requireAuth(ctx);
  await notifyEventMembers(ctx, {
    eventId,
    type: 'ADDON_CONFIG_RESET',
    authorId: person._id,
  });
},
```

### Rule 5: Use `requireAuth` and `requireEventRole`

- Config mutations: require MODERATOR+ via `requireEventRole`
- Data mutations: require membership, verified by the generic `setAddonData` mutation
- Queries: require membership via `requireEventMembership`

## Frontend Rules

### Rule 6: Self-register at module level

Call `registerAddon()` at the bottom of the addon file. The registry is populated by side-effect imports.

```typescript
// ✅ Registration at module level (bottom of file)
registerAddon({
  id: 'my-addon',
  name: 'My Add-on',
  // ...
});
```

### Rule 7: Provide all 3 required components

Every addon needs:

- `CreateConfigComponent` — config UI in the create wizard
- `EventCardComponent` — summary card on the event page
- `ManageConfigComponent` — config UI on the manage page

`PageComponent` is optional — only needed for full-page experiences.

### Rule 8: Store config in `formState.addonConfigs`

Use the `addonConfigs` map in `FormState`, keyed by addon ID.

```typescript
// ✅ Correct config storage
onEnable: formState => ({
  addonConfigs: {
    ...formState.addonConfigs,
    'my-addon': { setting: 'default' },
  },
}),
```

### Rule 9: Use addon hooks for data access

Use hooks from `use-addons.ts`. Don't create addon-specific query hooks.

```typescript
// ✅ Generic hooks
const myData = useMyAddonData(eventId, 'my-addon');
const setData = useSetAddonData();
```

### Rule 10: ManageConfigComponent must warn about response clearing

If config changes clear responses, show a warning before saving:

```typescript
{hasChanges && (
  <p className='text-sm text-warning'>
    Saving changes will reset all existing responses and notify members.
  </p>
)}
```

## Gating Rules

### Rule 11: Set `requiresCompletion` for mandatory addons

If users must complete the addon before accessing the event, set both fields:

```typescript
registerAddon({
  // ...
  requiresCompletion: true,
  completionRoute: '/addon/my-addon',
});
```

### Rule 12: Gating order is fixed

1. Organizers are always exempt
2. Availability is checked first
3. Addons are checked in order of `getAddonCompletionStatus` results
4. First incomplete addon with `requiresCompletion` triggers redirect

### Rule 13: Completion is detected by `response:{personId}` key

The `getAddonCompletionStatus` query checks for an `addonData` entry with key `response:{personId}`. Use this key format when storing user responses.

### Rule 14: Don't add custom gating logic

Use the framework's gating system. Don't add redirect logic in individual addon components.

## Testing Rules

### Rule 15: Test config validation

Test both valid and invalid configs, including edge cases:

```typescript
test('should reject config with no questions', async () => {
  await expect(
    asUser.mutation(api.addons.mutations.enableAddon, {
      eventId,
      addonType: 'questionnaire',
      config: { questions: [] },
    })
  ).rejects.toThrow('Invalid config');
});
```

### Rule 16: Test lifecycle hooks

Test that `onConfigUpdated` clears data, `onDisabled` cleans up, and `onEventDeleted` removes everything.

### Rule 17: Test completion status

Verify that `getAddonCompletionStatus` returns correct values before and after submission:

```typescript
// Before submission
expect(status.addons[0].completed).toBe(false);

// After submission
await setAddonData(...);
expect(status.addons[0].completed).toBe(true);
```

### Rule 18: Test access control

Verify that non-members cannot submit data and that only MODERATOR+ can change config.

## Exporting Addon Data

A generic export utility is available at `packages/web/lib/export-utils.ts` for downloading addon data as CSV or JSON from the browser.

```typescript
import { downloadFile, toCSV, toJSON } from '@/lib/export-utils';

// CSV export
const csv = toCSV(
  ['Name', 'Answer'],
  [
    ['Alice', 'Yes'],
    ['Bob', 'No'],
  ]
);
downloadFile(csv, 'responses.csv', 'text/csv');

// JSON export
const json = toJSON(headers, [{ Name: 'Alice', Answer: 'Yes' }]);
downloadFile(json, 'responses.json', 'application/json');
```

Data shaping (building headers and rows from addon-specific data) belongs in the addon component, not in the utility. The utility only handles formatting and download mechanics.

## Anti-Patterns

### Anti-Pattern 1: Bypassing the framework

```typescript
// ❌ Don't add addon-specific fields to the events table
events: defineTable({
  myAddonSetting: v.optional(v.string()), // NO
});

// ✅ Use eventAddonConfigs
await enableAddon({
  eventId,
  addonType: 'my-addon',
  config: { setting: 'value' },
});
```

### Anti-Pattern 2: Creating addon-specific tables

```typescript
// ❌ Don't create new tables for addon data
questionnaireResponses: defineTable({ ... })

// ✅ Use the addonData table
await setAddonData(eventId, 'questionnaire', `response:${personId}`, answers)
```

Exception: Addons with complex scheduling needs (like reminders with `eventReminders` table) may use dedicated tables.

### Anti-Pattern 3: Hardcoded addon checks

```typescript
// ❌ Don't check for specific addons in shared code
if (event.hasQuestionnaire) { ... }

// ✅ Use the generic addon query
const addons = useEventAddons(eventId);
const qConfig = addons?.find(a => a.addonType === 'questionnaire');
```

### Anti-Pattern 4: Missing side-effect import

```typescript
// ❌ Addon won't appear if not imported
// (no import statement)

// ✅ Import in all 4 rendering entry points
import '@/app/(newEvent)/create/components/addons/my-addon';
```

### Anti-Pattern 5: Custom gating in addon components

```typescript
// ❌ Don't redirect from inside addon components
function MyEventCard({ eventId }) {
  const router = useRouter();
  if (!completed) router.push('/addon/my-addon'); // NO
}

// ✅ Set requiresCompletion and completionRoute in registration
registerAddon({
  requiresCompletion: true,
  completionRoute: '/addon/my-addon',
});
```

### Anti-Pattern 6: Using non-`response:` keys for completion

```typescript
// ❌ Gating won't detect this
key: `answer:${personId}`;

// ✅ Use the response: prefix
key: `response:${personId}`;
```
