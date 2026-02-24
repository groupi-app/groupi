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

**Current add-ons:** Reminders, Questionnaire, Bring List, Discord, Custom (template-based)

**Key tables:** `eventAddonConfigs`, `addonData`, `addonOptOuts`, `addonTemplates`

### Handler Architecture

Backend handlers are created via `defineAddonHandler()` and receive a scoped `AddonContext` instead of raw `MutationCtx`. This provides:

- **Standard handlers** (`AddonContext`): Scoped access to addon data, event info, member list, and notifications. Cannot access raw database or scheduler.
- **Trusted handlers** (`TrustedAddonContext`): Everything in `AddonContext` plus `rawCtx` for direct database and scheduler access. Only for first-party addons that need custom tables or scheduled functions.

Handlers are branded objects — only handlers created via `defineAddonHandler()` can be registered. This prevents forged handler objects.

## File Locations

| Component             | Location                                                                                |
| --------------------- | --------------------------------------------------------------------------------------- |
| Addon context         | `convex/addons/context.ts`                                                              |
| Handler builder       | `convex/addons/define.ts`                                                               |
| Addon types           | `convex/addons/types.ts`                                                                |
| Backend handlers      | `convex/addons/handlers/{name}.ts`                                                      |
| Backend registry      | `convex/addons/registry.ts`                                                             |
| Backend queries       | `convex/addons/queries.ts`                                                              |
| Backend mutations     | `convex/addons/mutations.ts`                                                            |
| Lifecycle dispatcher  | `convex/addons/lifecycle.ts`                                                            |
| Frontend registry     | `packages/web/app/(newEvent)/create/components/addon-registry.ts`                       |
| Frontend addons       | `packages/web/app/(newEvent)/create/components/addons/{name}-addon.tsx`                 |
| Addon hooks           | `packages/web/hooks/convex/use-addons.ts`                                               |
| Gating hook           | `packages/web/hooks/convex/use-addon-gating.ts`                                         |
| Event layout (gating) | `packages/web/app/(event)/event/[eventId]/layout.tsx`                                   |
| Addon page route      | `packages/web/app/(event)/event/[eventId]/addon/[addonId]/page.tsx`                     |
| Manage page           | `packages/web/app/(event)/event/[eventId]/manage-addons/`                               |
| Automations types     | `convex/addons/automations/types.ts`                                                    |
| Automations engine    | `convex/addons/automations/engine.ts`                                                   |
| Automations dispatch  | `convex/addons/automations/dispatch.ts`                                                 |
| Automations resolve   | `convex/addons/automations/resolve.ts`                                                  |
| Custom addon handler  | `convex/addons/handlers/custom.ts`                                                      |
| Discord handler       | `convex/addons/handlers/discord.ts`                                                     |
| Template mutations    | `convex/addonTemplates/mutations.ts`                                                    |
| Template queries      | `convex/addonTemplates/queries.ts`                                                      |
| REST API routes       | `convex/api/v1/routes/addons.ts`                                                        |
| REST API schemas      | `convex/api/v1/schemas/addons.ts`                                                       |
| REST API internal     | `convex/api/v1/internal/addons.ts`                                                      |
| Addon builder UI      | `packages/web/app/(addonBuilder)/addon-builder/`                                        |
| Custom addon settings | `packages/web/app/(settings)/settings/custom-addons/`                                   |
| Template picker       | `packages/web/app/(event)/event/[eventId]/manage-addons/components/template-picker.tsx` |
| Custom addon renderer | `packages/web/app/(newEvent)/create/components/addons/custom-addon-renderer.tsx`        |
| Custom addon schema   | `packages/web/lib/custom-addon-schema.ts`                                               |
| Field editors         | `packages/web/lib/field-editors.tsx`                                                    |
| Condition evaluator   | `packages/web/lib/condition-evaluator.ts`                                               |
| Custom registration   | `packages/web/lib/custom-addon-registration.tsx`                                        |
| Template hooks        | `packages/web/hooks/convex/use-addon-templates.ts`                                      |

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

### Step 2: Create backend handler with `defineAddonHandler()`

```
convex/addons/handlers/my-addon.ts
```

Use `defineAddonHandler()` to create the handler. Standard addons receive `AddonContext`; use `trusted: true` only if you need raw DB/scheduler access.

```typescript
// Standard addon (recommended for most addons)
import { defineAddonHandler } from '../define';
import { ADDON_TYPES } from '../types';

export const myAddonHandler = defineAddonHandler({
  type: ADDON_TYPES.MY_ADDON,
  validateConfig: isValidMyConfig,
  onDisabled: async ctx => {
    await ctx.deleteAllAddonData();
  },
  onEventDeleted: async ctx => {
    await ctx.deleteAllAddonData();
  },
});
```

```typescript
// Trusted addon (only when you need scheduler/custom tables)
export const myTrustedHandler = defineAddonHandler({
  type: ADDON_TYPES.MY_ADDON,
  trusted: true,
  validateConfig: isValidMyConfig,
  onEnabled: async (ctx, config) => {
    await ctx.rawCtx.scheduler.runAfter(0, someInternalFn, { ... });
  },
});
```

### Step 3: Register handler

```typescript
// convex/addons/registry.ts
import { myAddonHandler } from './handlers/my-addon';
registerAddonHandler(myAddonHandler);
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

### Rule 1: Always use `defineAddonHandler()`

**NEVER** create handler objects directly. Always use the builder function:

```typescript
// ❌ WRONG - raw object, no validation, no branding
export const myHandler: AddonHandler = {
  type: 'my-addon',
  validateConfig: isValid,
};

// ✅ CORRECT - validated, branded, scoped context
export const myHandler = defineAddonHandler({
  type: 'my-addon',
  validateConfig: isValid,
});
```

The builder provides:

- Runtime validation at definition time (missing type, non-function validateConfig, etc.)
- Try/catch wrapping for `validateConfig` (throwing validators return `false`)
- Brand checking to prevent forged handler objects
- `Object.freeze()` to prevent mutation

### Rule 2: Always validate config

`validateConfig` must return `false` for any invalid config shape. Never trust the config object.

```typescript
// ✅ Type-safe validation
function isValidConfig(config: unknown): config is MyConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  return typeof c.setting === 'string';
}
```

### Rule 3: Clean up on disable and delete

Every handler with side effects or data must implement `onDisabled` and `onEventDeleted` to remove addon-specific data.

```typescript
// ✅ Clean up addon data via AddonContext
onDisabled: async (ctx) => {
  await ctx.deleteAllAddonData();
},
```

### Rule 4: Use `addonData` for user responses

Store user-submitted data in the `addonData` table with key format `response:{personId}`. This pattern is required for gating to detect completion.

```typescript
// Key format for gating compatibility
key: `response:${personId}`;
```

### Rule 5: Notify on config reset

If updating config invalidates existing responses, clear them and notify members using the context API:

```typescript
onConfigUpdated: async (ctx, _oldConfig, _newConfig) => {
  await ctx.deleteAllAddonData();
  const person = await ctx.getAuthPerson();
  if (person) {
    await ctx.notifyEventMembers({
      type: 'ADDON_CONFIG_RESET',
      authorId: person._id,
    });
  }
},
```

### Rule 6: Use `requireAuth` and `requireEventRole`

- Config mutations: require MODERATOR+ via `requireEventRole`
- Data mutations: require membership, verified by the generic `setAddonData` mutation
- Queries: require membership via `requireEventMembership`

### Rule 7: Prefer standard context over trusted

Only use `trusted: true` when you genuinely need raw database or scheduler access (custom tables, scheduled functions). Standard context covers:

- Reading/writing addon data (`queryAddonData`, `getAddonDataByKey`, `deleteAllAddonData`)
- Reading event info (`getEvent`)
- Reading member list (`getMembers`)
- Getting authenticated user (`getAuthPerson`)
- Sending notifications (`notifyEventMembers`)

### Rule 8: Access `eventId` from context, not parameters

Lifecycle hooks no longer receive `eventId` as a parameter — it's available via `ctx.eventId`:

```typescript
// ❌ Old pattern
onDisabled: async (ctx, eventId) => { ... }

// ✅ New pattern
onDisabled: async (ctx) => {
  const event = await ctx.getEvent(); // uses ctx.eventId internally
}
```

## Frontend Rules

### Rule 9: Self-register at module level

Call `registerAddon()` at the bottom of the addon file. The registry validates required fields and rejects duplicates.

```typescript
// ✅ Registration at module level (bottom of file)
registerAddon({
  id: 'my-addon',
  name: 'My Add-on',
  // ...
});
```

### Rule 10: Provide all 3 required components

Every addon needs:

- `CreateConfigComponent` — config UI in the create wizard
- `EventCardComponent` — summary card on the event page
- `ManageConfigComponent` — config UI on the manage page

`PageComponent` is optional — only needed for full-page experiences.

### Rule 11: Store config in `formState.addonConfigs`

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

### Rule 12: Use addon hooks for data access

Use hooks from `use-addons.ts`. Don't create addon-specific query hooks.

```typescript
// ✅ Generic hooks
const myData = useMyAddonData(eventId, 'my-addon');
const setData = useSetAddonData();
```

### Rule 13: ManageConfigComponent must warn about response clearing

If config changes clear responses, show a warning before saving:

```typescript
{hasChanges && (
  <p className='text-sm text-warning'>
    Saving changes will reset all existing responses and notify members.
  </p>
)}
```

## Gating Rules

### Rule 14: Set `requiresCompletion` for mandatory addons

If users must complete the addon before accessing the event, set both fields:

```typescript
registerAddon({
  // ...
  requiresCompletion: true,
  completionRoute: '/addon/my-addon',
});
```

The frontend registry enforces that `completionRoute` is provided when `requiresCompletion` is true.

### Rule 15: Gating order is fixed

1. Organizers are always exempt
2. Availability is checked first
3. Addons are checked in order of `getAddonCompletionStatus` results
4. First incomplete addon with `requiresCompletion` triggers redirect

### Rule 16: Completion is detected by `response:{personId}` key

The `getAddonCompletionStatus` query checks for an `addonData` entry with key `response:{personId}`. Use this key format when storing user responses.

### Rule 17: Don't add custom gating logic

Use the framework's gating system. Don't add redirect logic in individual addon components.

## Testing Rules

### Rule 18: Test config validation

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

### Rule 19: Test lifecycle hooks

Test that `onConfigUpdated` clears data, `onDisabled` cleans up, and `onEventDeleted` removes everything.

### Rule 20: Test completion status

Verify that `getAddonCompletionStatus` returns correct values before and after submission:

```typescript
// Before submission
expect(status.addons[0].completed).toBe(false);

// After submission
await setAddonData(...);
expect(status.addons[0].completed).toBe(true);
```

### Rule 21: Test access control

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

Exception: Addons with complex scheduling needs (like reminders with `eventReminders` table) may use dedicated tables — mark them as `trusted: true`.

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

### Anti-Pattern 7: Creating raw handler objects

```typescript
// ❌ Bypasses validation and branding
export const myHandler = {
  type: 'my-addon',
  validateConfig: isValid,
};

// ✅ Use the builder
export const myHandler = defineAddonHandler({
  type: 'my-addon',
  validateConfig: isValid,
});
```

### Anti-Pattern 9: Missing new lifecycle hook dispatch

```typescript
// ❌ Forgetting to dispatch lifecycle events from event mutations
export const updateEvent = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(eventId, updates);
    // Missing: await dispatchAddonLifecycle(ctx, eventId, 'onEventUpdated');
  },
});

// ✅ Always dispatch relevant lifecycle events
export const updateEvent = mutation({
  handler: async (ctx, args) => {
    await ctx.db.patch(eventId, updates);
    await dispatchAddonLifecycle(ctx, eventId, 'onEventUpdated');
  },
});
```

### Anti-Pattern 8: Using `trusted: true` unnecessarily

```typescript
// ❌ Don't request trusted access just for addon data operations
export const myHandler = defineAddonHandler({
  type: 'my-addon',
  trusted: true, // NOT NEEDED
  validateConfig: isValid,
  onDisabled: async ctx => {
    // Only uses deleteAllAddonData — doesn't need rawCtx
    await ctx.deleteAllAddonData();
  },
});

// ✅ Standard context is sufficient
export const myHandler = defineAddonHandler({
  type: 'my-addon',
  validateConfig: isValid,
  onDisabled: async ctx => {
    await ctx.deleteAllAddonData();
  },
});
```

## Lifecycle Hooks Reference

All lifecycle hooks are optional. Standard handlers receive `AddonContext`; trusted handlers receive `TrustedAddonContext`.

| Hook              | Trigger                                              | Parameters                      |
| ----------------- | ---------------------------------------------------- | ------------------------------- |
| `onEnabled`       | Add-on enabled for an event                          | `(ctx, config)`                 |
| `onDisabled`      | Add-on disabled for an event                         | `(ctx)`                         |
| `onConfigUpdated` | Config changed on enabled add-on                     | `(ctx, oldConfig, newConfig)`   |
| `onDateChosen`    | Event date finalized or changed                      | `(ctx, chosenDateTime, config)` |
| `onDateReset`     | Event date cleared                                   | `(ctx, config)`                 |
| `onEventUpdated`  | Event details changed (title, description, location) | `(ctx, config)`                 |
| `onEventDeleted`  | Event deleted                                        | `(ctx)`                         |
| `onDataSubmitted` | User submits addon data via `setAddonData`           | `(ctx, key, data, submitterId)` |
| `onMemberJoined`  | Person joins event                                   | `(ctx, personId)`               |
| `onMemberLeft`    | Person leaves/removed/banned from event              | `(ctx, personId)`               |

### Dispatch points in event mutations

| Mutation                                    | Events Dispatched                |
| ------------------------------------------- | -------------------------------- |
| `updateEvent`                               | `onEventUpdated` (all addons)    |
| `chooseEventDate`                           | `onDateChosen` (all addons)      |
| `resetEventDate`                            | `onDateReset` (all addons)       |
| `deleteEvent`                               | `onEventDeleted` (all addons)    |
| `joinDiscoverableEvent`                     | `onMemberJoined` (all addons)    |
| `removeMember` / `leaveEvent` / `banMember` | `onMemberLeft` (all addons)      |
| `enableAddon`                               | `onEnabled` (single addon)       |
| `disableAddon`                              | `onDisabled` (single addon)      |
| `updateAddonConfig`                         | `onConfigUpdated` (single addon) |
| `setAddonData`                              | `onDataSubmitted` (single addon) |

## Discord Addon Rules

The Discord addon (`convex/addons/handlers/discord.ts`) syncs events with Discord scheduled events.

### Rule 22: Discord requires `trusted: true`

The Discord handler uses `ctx.rawCtx.scheduler.runAfter()` to call internal Discord API actions asynchronously.

### Rule 23: Discord stores event reference as `discord-event` key

The Discord event ID and guild ID are stored in `addonData` with key `discord-event`. Always check for this key before attempting updates or deletes.

### Rule 24: Discord creates events only when date is chosen

Discord scheduled events require a start time. The handler only creates Discord events when `chosenDateTime` is set, and deletes them when the date is reset.

## Custom Addon Rules

### Rule 25: Custom addons use `custom:{templateId}` convention

Custom addon types are stored as `custom:{templateId}` in `eventAddonConfigs.addonType`. The registry falls back to the `__custom__` handler for any type starting with `custom:`.

### Rule 26: Custom addon config is `{ templateId, template }`

The config stored in `eventAddonConfigs` always contains both the template ID reference and the full template definition.

### Rule 27: Templates are validated before save

Use `isValidTemplate()` and `isValidCustomConfig()` from `convex/addons/handlers/custom.ts` to validate templates. The handler validates 13 field types, section layouts, automations, and all nested structures.

### Rule 28: Section layouts restrict field types

- `form` layout: text, number, select, multiselect, yesno + display fields
- `interactive` layout: vote, list_item, toggle, action_button + display fields

Never mix field types across layouts.

### Rule 29: Configurable fields allow organizer customization

Fields and sections with `configurable: true` allow empty initial values (e.g., empty options arrays). The organizer fills these in when enabling the addon for their event.

## Automation Rules

### Rule 30: Automations are declarative JSON only

No user code is executed. Automations use a trigger → condition → action chain defined in JSON. The engine validates and dispatches actions via trusted backend code.

### Rule 31: Use `{{variable}}` interpolation in action messages

Action messages support template variables: `{{member.name}}`, `{{event.title}}`, `{{event.location}}`, `{{event.date}}`, `{{fields.fieldId}}`, `{{vote.top_option}}`, `{{addon.name}}`.

### Rule 32: Automation actions execute in trusted context

Custom addon automations run via `TrustedAddonContext` because they need scheduler access for webhooks and raw DB access for post creation.

## REST API Rules

### Rule 33: REST API follows standard response format

All responses use: `{ success: boolean, data?: ..., error?: { code, message } }`.

### Rule 34: REST API enforces same auth as Convex mutations

- Config operations: require MODERATOR+ role
- Data operations: require event membership; updates/deletes require creator or MODERATOR+
- All endpoints require API key authentication

### Rule 35: REST API schemas are in `convex/api/v1/schemas/addons.ts`

Use Zod schemas with OpenAPI decorators. Routes are in `convex/api/v1/routes/addons.ts`.
