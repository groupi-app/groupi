---
name: addon-dev
description: Building new add-ons for the Groupi event add-on framework. Covers the full process from backend handler creation through frontend registration, gating, and testing. Use when adding a new event add-on feature.
---

# Building a New Add-on

Follow these seven steps in order. Read `.agents/rules/addons.md` before editing.

## Step 1: Add Type

```typescript
// convex/addons/types.ts
export const ADDON_TYPES = {
  // ... existing types
  MY_ADDON: 'my-addon', // Add here
} as const;
```

## Step 2: Create Backend Handler

```
convex/addons/handlers/my-addon.ts
```

Inspect `convex/addons/handlers/` for an analogous existing handler before creating one.

Use `defineAddonHandler()` -- never create raw handler objects:

```typescript
import { defineAddonHandler } from '../define';
import { ADDON_TYPES } from '../types';

function isValidConfig(config: unknown): config is MyConfig {
  if (typeof config !== 'object' || config === null) return false;
  const c = config as Record<string, unknown>;
  return typeof c.setting === 'string';
}

export const myAddonHandler = defineAddonHandler({
  type: ADDON_TYPES.MY_ADDON,
  validateConfig: isValidConfig,
  onDisabled: async ctx => {
    await ctx.deleteAllAddonData();
  },
  onEventDeleted: async ctx => {
    await ctx.deleteAllAddonData();
  },
});
```

Use `trusted: true` ONLY if you need raw DB/scheduler access (custom tables, scheduled functions).

## Step 3: Register Handler

```typescript
// convex/addons/registry.ts
import { myAddonHandler } from './handlers/my-addon';
registerAddonHandler(myAddonHandler);
```

## Step 4: Run `pnpm generate`

## Step 5: Create Frontend Addon

```
packages/web/app/(newEvent)/create/components/addons/my-addon.tsx
```

Must call `registerAddon()` at module level:

```typescript
import { registerAddon } from '../addon-registry';

function CreateConfig({ formState, onChange }) {
  /* config UI */
}
function EventCard({ eventId, config }) {
  /* summary card */
}
function ManageConfig({ eventId, addonId, config }) {
  /* manage page UI */
}

registerAddon({
  id: 'my-addon',
  name: 'My Add-on',
  description: 'What it does',
  icon: IconComponent,
  CreateConfigComponent: CreateConfig,
  EventCardComponent: EventCard,
  ManageConfigComponent: ManageConfig,
  // Optional for gating:
  // requiresCompletion: true,
  // completionRoute: '/addon/my-addon',
  onEnable: formState => ({
    addonConfigs: {
      ...formState.addonConfigs,
      'my-addon': { setting: 'default' },
    },
  }),
});
```

## Step 6: Add Side-Effect Imports

Add `import './addons/my-addon'` or the full path to ALL 4 files:

1. `packages/web/app/(event)/event/[eventId]/event-addons.tsx`
2. `packages/web/app/(event)/event/[eventId]/addon/[addonId]/page.tsx`
3. `packages/web/app/(event)/event/[eventId]/manage-addons/manage-addons-content.tsx`
4. `packages/web/app/(newEvent)/create/components/new-event-addons.tsx`

Missing any of these = the addon won't render in that context.

## Step 7: Write Tests

Backend test in `convex/tests/my-addon.test.ts`:

- Test config validation (valid + invalid)
- Test lifecycle hooks (onDisabled cleans up, onEventDeleted removes data)
- Test completion status (before/after submission)
- Test access control (non-members rejected, MODERATOR+ for config)

Use test scenarios from `convex/tests/test_helpers.ts`.

## Key Rules

- Store user responses with key format `response:{personId}` (required for gating detection)
- Always clean up in `onDisabled` and `onEventDeleted`
- If config changes clear responses, notify members via `ctx.notifyEventMembers()`
- Access `eventId` via `ctx.eventId`, not as a parameter
- Set `requiresCompletion: true` + `completionRoute` for mandatory addons
