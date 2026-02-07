# Add-on Framework

The add-on framework is a generic, extensible system for attaching optional features to events. Instead of hardcoding feature-specific fields and logic throughout the codebase, add-ons register themselves with a common interface and the framework handles lifecycle, storage, and UI rendering.

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Architecture Overview](#architecture-overview)
- [Backend](#backend)
  - [Schema](#schema)
  - [Handler Interface](#handler-interface)
  - [Registry](#registry)
  - [Lifecycle Dispatcher](#lifecycle-dispatcher)
  - [Queries and Mutations](#queries-and-mutations)
  - [Add-on Data Storage](#add-on-data-storage)
- [Frontend](#frontend)
  - [Registry Interface](#registry-interface)
  - [Hooks](#hooks)
  - [UI Surfaces](#ui-surfaces)
  - [Addon Page Route](#addon-page-route)
- [Addon Gating](#addon-gating)
- [Built-in Add-ons](#built-in-add-ons)
- [Building a New Add-on](#building-a-new-add-on)
- [Security Model](#security-model)
- [Future: User Marketplace](#future-user-marketplace)

## Design Philosophy

Three principles guide the framework:

1. **First-party add-ons use the same framework as user add-ons.** The reminders add-on is built entirely through the framework. If a first-party add-on needs something the framework doesn't support, the framework is expanded — the add-on doesn't bypass it.

2. **Same interface, different execution environment.** The `AddonHandler` lifecycle interface is identical for all add-ons. First-party handlers run in-process with full `MutationCtx`. Future user add-ons will receive a capability-scoped wrapper over the same lifecycle surface (e.g. webhook dispatch with sandboxed actions).

3. **Config-driven where possible.** UI surfaces, metadata, opt-out behavior, and author info are all declarative. The framework renders them — add-ons don't need to know how.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────┐
│                    Convex Backend                        │
│                                                         │
│  ┌──────────────┐    ┌──────────────┐                   │
│  │ AddonHandler │    │ AddonHandler │   ... more         │
│  │ (reminders)  │    │ (future)     │                   │
│  └──────┬───────┘    └──────┬───────┘                   │
│         │                   │                           │
│  ┌──────▼───────────────────▼───────┐                   │
│  │         Handler Registry         │                   │
│  └──────────────┬───────────────────┘                   │
│                 │                                       │
│  ┌──────────────▼───────────────────┐                   │
│  │       Lifecycle Dispatcher       │                   │
│  │  (called by event mutations)     │                   │
│  └──────────────────────────────────┘                   │
│                                                         │
│  Tables: eventAddonConfigs, addonOptOuts, addonData     │
└─────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────┐
│                     Frontend                            │
│                                                         │
│  ┌──────────────────────────────────┐                   │
│  │       AddonDefinition Registry   │                   │
│  │  (maps addon id → components)    │                   │
│  └──────────────┬───────────────────┘                   │
│                 │                                       │
│    ┌────────────┼────────────┬───────────┐              │
│    ▼            ▼            ▼           ▼              │
│  Create      Event        Manage      Addon             │
│  Wizard      Page Card    Page        Page              │
│  Config      (summary)    (config)    (full page)       │
│                                                         │
│  Hooks: useEventAddons, useAddonConfig, useAddonData    │
└─────────────────────────────────────────────────────────┘
```

## Backend

### Schema

Three tables power the framework:

**`eventAddonConfigs`** — Stores which add-ons are enabled for each event and their configuration.

```typescript
{
  eventId: Id<'events'>,
  addonType: string,     // e.g. 'reminders'
  enabled: boolean,
  config: any,           // addon-specific JSON (validated by handler)
  createdAt: number,
  updatedAt: number,
}
// Indexes: by_event, by_event_addon
```

**`addonOptOuts`** — Tracks users who opted out of a specific add-on for an event.

```typescript
{
  personId: Id<'persons'>,
  eventId: Id<'events'>,
  addonType: string,
  optedOutAt: number,
  updatedAt?: number,
}
// Indexes: by_person, by_event, by_person_event_addon
```

**`addonData`** — Generic key-value storage for add-on data. Any member can create entries; only creators or moderators can modify/delete.

```typescript
{
  eventId: Id<'events'>,
  addonType: string,
  key: string,           // addon-defined key (e.g. 'vote:option1')
  data: any,             // addon-defined payload (max 64KB)
  createdBy?: Id<'persons'>,
  createdAt: number,
  updatedAt: number,
}
// Indexes: by_event_addon, by_event_addon_key, by_event_addon_creator
```

### Handler Interface

Every backend add-on implements `AddonHandler` (defined in `convex/addons/types.ts`):

```typescript
interface AddonHandler {
  type: AddonType;
  validateConfig: (config: unknown) => boolean;

  // Lifecycle hooks (all optional)
  onEnabled?: (ctx, eventId, config) => Promise<void>;
  onDisabled?: (ctx, eventId) => Promise<void>;
  onConfigUpdated?: (ctx, eventId, oldConfig, newConfig) => Promise<void>;
  onDateChosen?: (ctx, eventId, chosenDateTime, config) => Promise<void>;
  onDateReset?: (ctx, eventId, config) => Promise<void>;
  onEventDeleted?: (ctx, eventId) => Promise<void>;
}
```

First-party handlers receive the full Convex `MutationCtx`, giving them access to the database, scheduler, and storage. Future user add-on handlers will receive a capability-scoped wrapper.

**Example — the reminders handler** (`convex/addons/handlers/reminders.ts`):

- `validateConfig` checks that `config.reminderOffset` is a valid offset string
- `onEnabled` schedules a reminder if the event already has a chosen date
- `onDisabled` cancels any scheduled reminders
- `onConfigUpdated` reschedules with the new offset
- `onDateChosen` schedules a reminder at `chosenDateTime - offset`
- `onDateReset` cancels reminders (date cleared, no reminder needed)
- `onEventDeleted` cancels scheduled functions and deletes `eventReminders` rows

### Registry

The handler registry (`convex/addons/registry.ts`) is a static map from addon type to handler:

```typescript
import { reminderHandler } from './handlers/reminders';
import { questionnaireHandler } from './handlers/questionnaire';

const handlers = {
  [reminderHandler.type]: reminderHandler,
  [questionnaireHandler.type]: questionnaireHandler,
};

export function getAddonHandler(type: string): AddonHandler | undefined;
export function getAllAddonHandlers(): AddonHandler[];
```

To register a new backend handler, add it to this map.

### Lifecycle Dispatcher

The lifecycle dispatcher (`convex/addons/lifecycle.ts`) is called by event mutations instead of hardcoded feature logic.

Two functions:

- **`dispatchAddonLifecycle(ctx, eventId, event, args?)`** — Dispatches to ALL enabled add-ons for an event. Used by `chooseEventDate`, `resetEventDate`, `updatePotentialDateTimes`, and `deleteEvent`.

- **`dispatchSingleAddonLifecycle(ctx, eventId, addonType, event, config, oldConfig?, args?)`** — Dispatches to ONE specific add-on. Used by `enableAddon`, `disableAddon`, `updateAddonConfig`, and `createEvent`.

### Queries and Mutations

**Queries** (`convex/addons/queries.ts`):

| Query                      | Auth          | Description                        |
| -------------------------- | ------------- | ---------------------------------- |
| `getEventAddons`           | Member        | All addon configs for an event     |
| `getAddonConfig`           | Member        | Specific addon config by type      |
| `isAddonOptedOut`          | Authenticated | User's opt-out status for an addon |
| `getAddonData`             | Member        | All data entries for an addon      |
| `getAddonDataByKey`        | Member        | Single data entry by key           |
| `getMyAddonData`           | Member        | Current user's data entries        |
| `getAddonCompletionStatus` | Authenticated | Completion status for gating       |

**Mutations** (`convex/addons/mutations.ts`):

| Mutation            | Auth                                     | Description                     |
| ------------------- | ---------------------------------------- | ------------------------------- |
| `enableAddon`       | Moderator+                               | Enable addon with config        |
| `disableAddon`      | Moderator+                               | Disable addon                   |
| `updateAddonConfig` | Moderator+                               | Update config for enabled addon |
| `toggleAddonOptOut` | Member                                   | Toggle user opt-out             |
| `setAddonData`      | Member (creator or Moderator+ to update) | Upsert data entry by key        |
| `deleteAddonData`   | Member (creator or Moderator+ to delete) | Delete data entry               |

### Add-on Data Storage

The `addonData` table gives add-ons a structured key-value store scoped to their event. Each entry has an `addonType`, a `key` (addon-defined string), and a `data` payload (max 64KB).

First-party add-ons can use their own dedicated tables (like `eventReminders` for reminders) or the generic `addonData` table. Future user add-ons will only have access to `addonData` since they can't define schema.

```typescript
// Example: a polls addon storing votes
await setAddonData({
  eventId,
  addonType: 'polls',
  key: `vote:${optionId}:${personId}`,
  data: { optionId, votedAt: Date.now() },
});

// Query all votes for a poll
const votes = await getAddonData({ eventId, addonType: 'polls' });
```

## Frontend

### Registry Interface

The frontend registry (`packages/web/app/(newEvent)/create/components/addon-registry.ts`) defines `AddonDefinition`:

```typescript
interface AddonDefinition {
  id: string;
  name: string;
  description: string;
  iconName: keyof typeof Icons;
  author?: { name: string; url?: string };

  // Create wizard
  CreateConfigComponent: ComponentType<AddonConfigProps>;
  isEnabled: (formState) => boolean;
  onEnable: (formState) => Partial<FormState>;
  onDisable: (formState) => Partial<FormState>;
  getConfigFromFormState: (formState) => Record<string, unknown> | null;

  // Event page
  EventCardComponent: ComponentType<EventCardProps>;

  // Manage page
  ManageConfigComponent: ComponentType<ManageConfigProps>;

  // Dedicated page (optional)
  PageComponent?: ComponentType<AddonPageProps>;
  pageTitle?: string;

  // Opt-out
  supportsOptOut: boolean;
  optOutLabel?: string;

  // Gating — require completion before accessing event content
  requiresCompletion?: boolean;
  completionRoute?: string; // relative to /event/[eventId]
}
```

Add-ons self-register by calling `registerAddon()` at module level. The module is then imported as a side effect where needed (e.g. `import './addons/reminder-addon'`).

### Hooks

Generic hooks in `packages/web/hooks/convex/use-addons.ts`:

| Hook                                    | Purpose                           |
| --------------------------------------- | --------------------------------- |
| `useEventAddons(eventId)`               | All addon configs for an event    |
| `useAddonConfig(eventId, type)`         | Specific addon config             |
| `useIsAddonOptedOut(eventId, type)`     | Optimistic opt-out status         |
| `useToggleAddonOptOut()`                | Toggle opt-out with optimistic UI |
| `useEnableAddon()`                      | Enable an addon                   |
| `useDisableAddon()`                     | Disable an addon                  |
| `useUpdateAddonConfig()`                | Update addon config               |
| `useAddonData(eventId, type)`           | All data entries for addon        |
| `useAddonDataByKey(eventId, type, key)` | Single data entry                 |
| `useMyAddonData(eventId, type)`         | Current user's entries            |
| `useSetAddonData()`                     | Upsert data entry                 |
| `useDeleteAddonData()`                  | Delete data entry                 |
| `useAddonGating(eventId)`               | Gating redirect (or null)         |

### UI Surfaces

Each add-on can render in up to four places:

| Surface       | Component                  | Where it appears                |
| ------------- | -------------------------- | ------------------------------- |
| Create wizard | `CreateConfigComponent`    | Step 3 of event creation        |
| Event page    | `EventCardComponent`       | Add-ons section on event detail |
| Manage page   | `ManageConfigComponent`    | `/event/[id]/manage-addons`     |
| Addon page    | `PageComponent` (optional) | `/event/[id]/addon/[addonId]`   |

The framework handles rendering — it queries `eventAddonConfigs`, filters to enabled add-ons with registered definitions, and renders the appropriate component for each.

### Addon Page Route

Add-ons can optionally define a `PageComponent` and `pageTitle` for a full dedicated page at `/event/[eventId]/addon/[addonId]`. The route is a single dynamic page (`packages/web/app/(event)/event/[eventId]/addon/[addonId]/page.tsx`) that looks up the add-on in the registry and renders its component.

Not all add-ons need a dedicated page. The `EventCardComponent` serves as a summary; the page is for anything that needs more space (settings, history, detailed views).

## Addon Gating

Add-ons can require completion before a member can access event content. This is a framework-level feature controlled by two fields on `AddonDefinition`:

- **`requiresCompletion`** — if `true`, the member must complete this addon
- **`completionRoute`** — path (relative to `/event/[eventId]`) to redirect to when incomplete

### How it works

1. The `getAddonCompletionStatus` query checks availability and each enabled addon for the current user
2. The `useAddonGating(eventId)` hook wraps the query and returns `{ redirectTo, isLoading }`
3. The event layout (`layout.tsx`) calls the hook and redirects on non-exempt routes
4. Exempt routes (to avoid loops): `/availability`, `/addon/`, `/manage-addons`

### Gating order

1. **Organizers are exempt** — always return `null`
2. **Availability** — if there are potential dates with no chosen date and the user hasn't voted, redirect to `/event/{id}/availability`
3. **Addons** — first incomplete addon with `requiresCompletion: true` triggers redirect to its `completionRoute`

### Completion detection

For addons: the query checks for an `addonData` entry with key `response:{personId}`. When a user submits their response via `setAddonData`, they become "complete".

## Built-in Add-ons

### Reminders

Notify attendees before the event starts. Config: `{ reminderOffset: ReminderOffset }`.

- **Handler:** `convex/addons/handlers/reminders.ts`
- **Frontend:** `packages/web/app/(newEvent)/create/components/addons/reminder-addon.tsx`
- Schedules via Convex scheduler, cancels on disable/date reset/event delete
- Supports opt-out per user

### Questionnaire

Ask attendees custom questions. Config: `{ questions: Question[] }`.

Question types: `SHORT_ANSWER`, `LONG_ANSWER`, `MULTIPLE_CHOICE`, `CHECKBOXES`, `NUMBER`, `DROPDOWN`, `YES_NO`.

- **Handler:** `convex/addons/handlers/questionnaire.ts`
- **Frontend:** `packages/web/app/(newEvent)/create/components/addons/questionnaire-addon.tsx`
- Responses stored as `addonData` with key `response:{personId}`
- Config updates clear all responses and notify members (`ADDON_CONFIG_RESET` notification)
- Has `requiresCompletion: true` — members are gated until they fill out the questionnaire
- Organizers can view all responses in a table on the addon page
- Organizers can export responses as CSV or JSON via the export dropdown
- Does not support opt-out (completion is mandatory)

## Building a New Add-on

### 1. Backend handler

Create `convex/addons/handlers/my-addon.ts`:

```typescript
import { type AddonHandler, ADDON_TYPES } from '../types';

// Add to ADDON_TYPES in types.ts first:
// MY_ADDON: 'my-addon'

interface MyConfig {
  setting: string;
}

function isValidConfig(config: unknown): config is MyConfig {
  if (typeof config !== 'object' || config === null) return false;
  return typeof (config as Record<string, unknown>).setting === 'string';
}

export const myAddonHandler: AddonHandler = {
  type: ADDON_TYPES.MY_ADDON,
  validateConfig: isValidConfig,

  onEnabled: async (ctx, eventId, config) => {
    // Set up addon resources
  },

  onDisabled: async (ctx, eventId) => {
    // Clean up addon resources
  },

  onEventDeleted: async (ctx, eventId) => {
    // Clean up all addon data for this event
  },
};
```

### 2. Register the handler

In `convex/addons/registry.ts`:

```typescript
import { myAddonHandler } from './handlers/my-addon';

const handlers = {
  [reminderHandler.type]: reminderHandler,
  [myAddonHandler.type]: myAddonHandler,
};
```

### 3. Frontend definition

Create `packages/web/app/(newEvent)/create/components/addons/my-addon.tsx`:

```typescript
'use client';

import { registerAddon } from '../addon-registry';

function MyCreateConfig({ formState, setFormState }) {
  /* ... */
}
function MyEventCard({ eventId, config, chosenDateTime }) {
  /* ... */
}
function MyManageConfig({ config, onSave, onDisable, isSaving }) {
  /* ... */
}

registerAddon({
  id: 'my-addon',
  name: 'My Add-on',
  description: 'Does something useful',
  iconName: 'sparkles',
  author: { name: 'Groupi' },

  CreateConfigComponent: MyCreateConfig,
  isEnabled: fs => fs.addonConfigs?.['my-addon'] !== undefined,
  onEnable: fs => ({
    addonConfigs: { ...fs.addonConfigs, 'my-addon': { setting: 'default' } },
  }),
  onDisable: fs => {
    const { 'my-addon': _, ...rest } = fs.addonConfigs ?? {};
    return { addonConfigs: rest };
  },
  getConfigFromFormState: fs => fs.addonConfigs?.['my-addon'] ?? null,

  EventCardComponent: MyEventCard,
  ManageConfigComponent: MyManageConfig,

  supportsOptOut: false,
});
```

### 4. Import for side-effect registration

Add the import to any file that renders add-ons:

```typescript
import './addons/my-addon';
```

The existing files that need this (`event-addons.tsx`, `manage-addons-content.tsx`, `new-event-addons.tsx`, `addon/[addonId]/page.tsx`) already import `reminder-addon` — add your addon import alongside it.

### 5. Run codegen

```bash
pnpm generate
```

## Security Model

| Concern                   | Mitigation                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Authorization**         | Config changes require MODERATOR+. Data writes require membership; updates/deletes require creator or MODERATOR+.                      |
| **Input validation**      | `validateConfig()` is called before any config is persisted. Handlers define their own validation.                                     |
| **Payload size**          | All config and data payloads are limited to 64KB.                                                                                      |
| **Addon type validation** | Mutations reject unregistered addon types via `getAddonHandler()` check.                                                               |
| **Data isolation**        | Data is scoped by `(eventId, addonType, key)`. Members can read any addon's data within their event.                                   |
| **Cleanup**               | `deleteEvent` dispatches `onEventDeleted` to all handlers, then deletes all `eventAddonConfigs`, `addonData`, and `addonOptOuts` rows. |
| **Opt-out enforcement**   | `sendReminder` checks `addonOptOuts` at send-time, not at schedule-time, so late opt-outs are respected.                               |

## Future: User Marketplace

The framework is designed with a future user marketplace in mind (Phase 2):

- **`author` field** on `AddonDefinition` — already present, will be displayed in the marketplace UI
- **`addonData` table** — gives user add-ons structured storage without schema access
- **Lifecycle interface** — same hooks for user add-ons, dispatched via webhook instead of in-process
- **Capability wrapper** — user add-on handlers will receive a scoped context with safe operations (`actions.notify()`, `actions.scheduleCallback()`, `actions.getData()`, `actions.setData()`) instead of full `MutationCtx`
- **Config-driven templates** — user add-ons may define UI via config (JSON schemas for forms) instead of React components, or render in an iframe sandbox

The `addonDefinitions` table, webhook callbacks, store UI, and sandboxed execution are not built yet. The current framework proves the pattern works with the reminders add-on and establishes the surface area that user add-ons will integrate with.
