# Add-on Framework

The add-on framework is a generic, extensible system for attaching optional features to events. Add-ons register themselves through a handler + registry pattern, and the framework handles lifecycle, storage, context scoping, automations, and UI rendering.

## Table of Contents

- [Design Philosophy](#design-philosophy)
- [Architecture Overview](#architecture-overview)
- [Backend](#backend)
  - [Schema](#schema)
  - [Handler Builder](#handler-builder)
  - [Scoped Context](#scoped-context)
  - [Registry](#registry)
  - [Lifecycle Dispatcher](#lifecycle-dispatcher)
  - [Lifecycle Hooks Reference](#lifecycle-hooks-reference)
  - [Queries and Mutations](#queries-and-mutations)
  - [Add-on Data Storage](#add-on-data-storage)
- [Frontend](#frontend)
  - [Registry Interface](#registry-interface)
  - [Hooks](#hooks)
  - [UI Surfaces](#ui-surfaces)
  - [Addon Page Route](#addon-page-route)
- [Addon Gating](#addon-gating)
- [Custom Addon Builder](#custom-addon-builder)
  - [Templates](#templates)
  - [Field Types](#field-types)
  - [Section Layouts](#section-layouts)
  - [Automations Engine](#automations-engine)
- [REST API](#rest-api)
- [Built-in Add-ons](#built-in-add-ons)
- [Building a New Add-on](#building-a-new-add-on)
- [Security Model](#security-model)

## Design Philosophy

Three principles guide the framework:

1. **First-party add-ons use the same framework as custom add-ons.** The reminders add-on is built entirely through the framework. If a first-party add-on needs something the framework doesn't support, the framework is expanded — the add-on doesn't bypass it.

2. **Scoped context by default, raw access when needed.** Standard handlers receive an `AddonContext` with scoped data access (addon data, event info, members, notifications). Trusted handlers additionally receive `rawCtx` for direct database and scheduler access. This prevents accidental cross-addon data access.

3. **Config-driven where possible.** UI surfaces, metadata, opt-out behavior, and author info are all declarative. The framework renders them — add-ons don't need to know how. Custom addons take this further with template-defined field types and automation rules.

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                        Convex Backend                           │
│                                                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │                  defineAddonHandler()                      │  │
│  │  ┌─────────┐ ┌──────────┐ ┌──────────┐ ┌───────┐ ┌─────┐│  │
│  │  │reminders│ │questionnr│ │bring-list│ │discord│ │custom││  │
│  │  │(trusted)│ │(standard)│ │(standard)│ │(trust)│ │(trus)││  │
│  │  └────┬────┘ └────┬─────┘ └────┬─────┘ └───┬───┘ └──┬──┘│  │
│  └───────┼───────────┼────────────┼────────────┼────────┼───┘  │
│          │           │            │            │        │       │
│  ┌───────▼───────────▼────────────▼────────────▼────────▼───┐  │
│  │                  Handler Registry (Map)                   │  │
│  │        registerAddonHandler() + brand checking            │  │
│  └──────────────────────┬───────────────────────────────────┘  │
│                         │                                       │
│  ┌──────────────────────▼───────────────────────────────────┐  │
│  │             Lifecycle Dispatcher                          │  │
│  │  buildContext() → AddonContext or TrustedAddonContext     │  │
│  │  dispatchAddonLifecycle() — all enabled addons            │  │
│  │  dispatchSingleAddonLifecycle() — one specific addon      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Automations Engine (custom addons only)                  │  │
│  │  Trigger → Condition → Action chains                      │  │
│  └──────────────────────────────────────────────────────────┘  │
│                                                                 │
│  Tables: eventAddonConfigs, addonData, addonOptOuts,           │
│          addonTemplates                                         │
└─────────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────────┐
│                         Frontend                                │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │       AddonDefinition Registry                            │  │
│  │  registerAddon() with validation + duplicate detection    │  │
│  └──────────────┬───────────────────────────────────────────┘  │
│                 │                                               │
│    ┌────────────┼────────────┬───────────┐                     │
│    ▼            ▼            ▼           ▼                     │
│  Create      Event        Manage      Addon                    │
│  Wizard      Page Card    Page        Page                     │
│  Config      (summary)    (config)    (full page)              │
│                                                                 │
│  Hooks: useEventAddons, useAddonConfig, useSetAddonData, ...   │
│                                                                 │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  Custom Addon Builder (visual editor)                     │  │
│  │  Template Picker, Field Editors, Condition Evaluator      │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

## Backend

### Schema

Four tables power the framework:

**`eventAddonConfigs`** — Stores which add-ons are enabled for each event and their configuration.

```typescript
{
  eventId: Id<'events'>,
  addonType: string,     // e.g. 'reminders', 'custom:templateId'
  enabled: boolean,
  config: any,           // addon-specific JSON (validated by handler)
  createdAt: number,
  updatedAt: number,
}
// Indexes: by_event, by_event_addon
```

**`addonData`** — Generic key-value storage for add-on data. Any member can create entries; only creators or moderators can modify/delete.

```typescript
{
  eventId: Id<'events'>,
  addonType: string,
  key: string,           // addon-defined key (e.g. 'response:personId')
  data: any,             // addon-defined payload (max 64KB)
  createdBy?: Id<'persons'>,
  createdAt: number,
  updatedAt: number,
}
// Indexes: by_event_addon, by_event_addon_key, by_event_addon_creator
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

**`addonTemplates`** — User-created custom addon templates with versioning.

```typescript
{
  ownerId: Id<'persons'>,
  name: string,
  description: string,
  iconName: string,
  template: any,         // full CustomAddonTemplate (validated before save)
  version: number,
  isPublished: boolean,  // draft vs ready to use
  createdAt: number,
  updatedAt: number,
}
// Indexes: by_owner, by_owner_published
```

### Handler Builder

All handlers are created via `defineAddonHandler()` from `convex/addons/define.ts`. This replaces the old `AddonHandler` interface.

```typescript
import { defineAddonHandler } from '../define';
import { ADDON_TYPES } from '../types';

// Standard addon — receives scoped AddonContext
export const myHandler = defineAddonHandler({
  type: ADDON_TYPES.MY_ADDON,
  validateConfig: isValidMyConfig,
  onDisabled: async (ctx) => {
    await ctx.deleteAllAddonData();
  },
});

// Trusted addon — receives TrustedAddonContext with rawCtx
export const myTrustedHandler = defineAddonHandler({
  type: ADDON_TYPES.MY_ADDON,
  trusted: true,
  validateConfig: isValidMyConfig,
  onEnabled: async (ctx, config) => {
    await ctx.rawCtx.scheduler.runAfter(0, someFn, { ... });
  },
});
```

The builder provides:

- **Runtime validation** at definition time (missing type, non-function validateConfig, invalid lifecycle hooks)
- **Brand checking** via a private symbol — only handlers created by `defineAddonHandler()` can be registered
- **Automatic try/catch** wrapping for `validateConfig` (throwing validators return `false`)
- **Object.freeze()** to prevent mutation after creation

### Scoped Context

Handlers receive a scoped context instead of raw `MutationCtx`. This is defined in `convex/addons/context.ts`.

**`AddonContext`** (standard handlers):

| Method                        | Description                                                             |
| ----------------------------- | ----------------------------------------------------------------------- |
| `addonType`                   | The add-on type identifier (readonly)                                   |
| `eventId`                     | The event ID (readonly)                                                 |
| `queryAddonData()`            | List all addon data entries for this event + addon                      |
| `getAddonDataByKey(key)`      | Get a single entry by key                                               |
| `deleteAddonDataByKey(key)`   | Delete a single entry by key                                            |
| `deleteAllAddonData()`        | Delete all entries, returns count                                       |
| `getEvent()`                  | Read-only event snapshot (title, description, location, chosenDateTime) |
| `getMembers()`                | Member list with roles, names, images                                   |
| `getAuthPerson()`             | Currently authenticated person, or null                                 |
| `notifyEventMembers(options)` | Send notification to all members (except author)                        |

**`TrustedAddonContext`** extends `AddonContext` with:

| Property | Description                                                           |
| -------- | --------------------------------------------------------------------- |
| `rawCtx` | Full `MutationCtx` for direct database, scheduler, and storage access |

Both context objects are frozen after creation to prevent mutation.

### Registry

The handler registry (`convex/addons/registry.ts`) uses a `Map` with brand checking:

```typescript
import { reminderHandler } from './handlers/reminders';
registerAddonHandler(reminderHandler);
```

Key behaviors:

- Rejects handlers not created via `defineAddonHandler()` (brand check)
- Rejects duplicate registrations for the same type
- Custom addons use `custom:{templateId}` convention — any type starting with `custom:` falls back to the `__custom__` handler

Registered first-party handlers: `reminders`, `questionnaire`, `bring-list`, `discord`, `__custom__`.

### Lifecycle Dispatcher

The lifecycle dispatcher (`convex/addons/lifecycle.ts`) is called by event mutations. It builds the appropriate scoped context and routes lifecycle events to handlers.

Two dispatch functions:

- **`dispatchAddonLifecycle(ctx, eventId, event, args?)`** — Dispatches to ALL enabled add-ons for an event. Used by `chooseEventDate`, `resetEventDate`, `updateEvent`, `deleteEvent`, member join/leave operations.

- **`dispatchSingleAddonLifecycle(ctx, eventId, addonType, event, config, oldConfig?, args?)`** — Dispatches to ONE specific add-on. Used by `enableAddon`, `disableAddon`, `updateAddonConfig`, `setAddonData`.

### Lifecycle Hooks Reference

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

**Dispatch points in event mutations:**

| Mutation                | Lifecycle Events Dispatched      |
| ----------------------- | -------------------------------- |
| `updateEvent`           | `onEventUpdated` (all addons)    |
| `chooseEventDate`       | `onDateChosen` (all addons)      |
| `resetEventDate`        | `onDateReset` (all addons)       |
| `deleteEvent`           | `onEventDeleted` (all addons)    |
| `joinDiscoverableEvent` | `onMemberJoined` (all addons)    |
| `removeMember`          | `onMemberLeft` (all addons)      |
| `leaveEvent`            | `onMemberLeft` (all addons)      |
| `banMember`             | `onMemberLeft` (all addons)      |
| `enableAddon`           | `onEnabled` (single addon)       |
| `disableAddon`          | `onDisabled` (single addon)      |
| `updateAddonConfig`     | `onConfigUpdated` (single addon) |
| `setAddonData`          | `onDataSubmitted` (single addon) |

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

| Mutation              | Auth                                     | Description                                     |
| --------------------- | ---------------------------------------- | ----------------------------------------------- |
| `enableAddon`         | Moderator+                               | Enable addon with config                        |
| `disableAddon`        | Moderator+                               | Disable addon                                   |
| `updateAddonConfig`   | Moderator+                               | Update config for enabled addon                 |
| `toggleAddonOptOut`   | Member                                   | Toggle user opt-out                             |
| `setAddonData`        | Member (creator or Moderator+ to update) | Upsert data entry by key                        |
| `deleteAddonData`     | Member (creator or Moderator+ to delete) | Delete data entry                               |
| `executeFieldActions` | Member                                   | Execute inline actions for custom addon buttons |

### Add-on Data Storage

The `addonData` table gives add-ons a structured key-value store scoped to `(eventId, addonType, key)`.

- **Standard addons** use `addonData` exclusively via context methods
- **Trusted addons** can use their own dedicated tables (like `eventReminders`) via `rawCtx`
- Payloads are limited to 64KB
- The gating system detects completion by checking for a `response:{personId}` key

```typescript
// Example: storing user responses
await ctx.setAddonData({
  eventId,
  addonType: 'questionnaire',
  key: `response:${personId}`,
  data: { answers: [...] },
});
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

  // Gating
  requiresCompletion?: boolean;
  completionRoute?: string;
}
```

Add-ons self-register by calling `registerAddon()` at module level. The function validates:

- Required fields (id, name, description, iconName, all components and functions)
- Duplicate detection (warns in dev, skips silently in prod)
- Gating consistency (`completionRoute` required when `requiresCompletion` is true)

The module is then imported as a side effect where needed: `import './addons/my-addon'`.

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

## Addon Gating

Add-ons can require completion before a member can access event content.

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

The query checks for an `addonData` entry with key `response:{personId}`. When a user submits their response via `setAddonData`, they become "complete".

## Custom Addon Builder

Users can create custom addons using a visual builder that generates template-based configurations.

### Templates

A custom addon template defines:

```typescript
interface CustomAddonTemplate {
  name: string;
  description: string;
  iconName: string;
  settings?: {
    requiresCompletion?: boolean;
    cardLinkLabel?: string;
    cardSubtitle?: string;
    cardOnly?: boolean; // card only, no dedicated page
  };
  sections: TemplateSection[];
  submitButtonLabel?: string;
  onSubmitActions?: AutomationAction[]; // actions to run on form submit
  automations?: Automation[]; // IFTTT-style automation rules
}
```

Templates are stored in the `addonTemplates` table and referenced when enabling a custom addon. The config stored in `eventAddonConfigs` is `{ templateId, template }`.

### Field Types

Custom addons support 13 field types organized into input fields and display fields:

**Input fields** (collect user data):

| Type          | Description              | Key Properties                              |
| ------------- | ------------------------ | ------------------------------------------- |
| `text`        | Short or long text input | `variant`, `placeholder`, `maxLength`       |
| `number`      | Numeric input            | `min`, `max`                                |
| `select`      | Single-select dropdown   | `options`                                   |
| `multiselect` | Multi-select             | `options`, `minSelections`, `maxSelections` |
| `yesno`       | Boolean toggle           | —                                           |
| `list_item`   | Claimable item list      | `items` (id, name, quantity)                |
| `vote`        | Voting with options      | `options`, `allowMultiple`, `showResults`   |
| `toggle`      | On/off switch            | `defaultEnabled`                            |

**Display fields** (presentation only):

| Type              | Description      | Key Properties                                                            |
| ----------------- | ---------------- | ------------------------------------------------------------------------- |
| `static_text`     | Static content   | `content`, `textFormat` (p, h1, h2, h3)                                   |
| `dynamic_summary` | Computed summary | `summaryType` (response_count, vote_leader, signup_progress, custom_text) |
| `divider`         | Visual separator | `dividerLabel`                                                            |
| `info_callout`    | Alert/info box   | `calloutMessage`, `calloutVariant` (info, warning, success)               |
| `action_button`   | Clickable button | `buttonLabel`, `buttonVariant`, `actions`                                 |

Fields can be marked `configurable: true` to allow organizers to customize them at enable-time (e.g., filling in options for a select field).

Fields support `visibilityConditions` for conditional display based on other field values or context variables.

### Section Layouts

Sections organize fields into logical groups with two layout modes:

| Layout        | Allowed Field Types                                       | Use Case                         |
| ------------- | --------------------------------------------------------- | -------------------------------- |
| `form`        | text, number, select, multiselect, yesno + display fields | Collecting structured responses  |
| `interactive` | vote, list_item, toggle, action_button + display fields   | Real-time collaborative features |

Sections can also be `configurable: true` with `allowedFieldTypes` to let organizers add/modify fields.

### Automations Engine

Custom addons include an IFTTT-style automation engine (`convex/addons/automations/`). Automations are declarative JSON — no user code is executed.

**Triggers** — what starts an automation:

| Trigger             | When it fires                          |
| ------------------- | -------------------------------------- |
| `form_submitted`    | User submits form data                 |
| `list_item_claimed` | User claims a list item                |
| `list_item_full`    | All quantity of a list item is claimed |
| `vote_cast`         | User casts a vote                      |
| `vote_threshold`    | Vote count reaches threshold           |
| `toggle_changed`    | User changes a toggle                  |
| `all_responses_in`  | All members have responded             |
| `member_joined`     | Person joins the event                 |
| `member_left`       | Person leaves the event                |
| `date_chosen`       | Event date is finalized                |
| `addon_enabled`     | Addon is enabled for the event         |

**Conditions** — optional filters on when to execute:

Operators: `equals`, `not_equals`, `contains`, `not_contains`, `greater_than`, `less_than`, `greater_or_equal`, `less_or_equal`, `is_empty`, `is_not_empty`, `in_list`, `not_in_list`.

Variables: `fields.{fieldId}`, `member.name`, `member.role`, `event.title`, `event.location`, `event.date`, `vote.top_option`, `addon.name`.

**Actions** — what happens when triggered:

| Action                     | Description                     | Key Properties                                    |
| -------------------------- | ------------------------------- | ------------------------------------------------- |
| `notify_members`           | Notify all event members        | `message` (supports `{{variable}}` interpolation) |
| `notify_organizers`        | Notify only organizers          | `message`                                         |
| `notify_submitter`         | Notify the person who triggered | `message`                                         |
| `create_post`              | Create a discussion post        | `title`, `message`                                |
| `update_event_description` | Append to event description     | `message`                                         |
| `send_webhook`             | HTTP POST to external URL       | `webhookUrl`, `webhookHeaders`                    |
| `set_addon_data`           | Write to addon data store       | `key`, `data`                                     |

Actions support `recipientToggleField` to filter notification recipients based on a toggle field's value.

**Example automation:**

```json
{
  "id": "welcome-message",
  "name": "Welcome new members",
  "enabled": true,
  "trigger": { "type": "member_joined" },
  "conditions": [],
  "actions": [
    {
      "type": "notify_submitter",
      "message": "Welcome to {{event.title}}! Please fill out the questionnaire."
    }
  ]
}
```

**Engine architecture:**

- `types.ts` — Type definitions and validation functions
- `engine.ts` — Automation evaluator, matches triggers and evaluates conditions
- `conditions.ts` — Built-in condition evaluation logic
- `dispatch.ts` — Action dispatch orchestration
- `resolve.ts` — Variable resolution and `{{template}}` interpolation

## REST API

Add-on management is available via REST API under `/api/v1/events/{eventId}/addons`. All endpoints require API key authentication.

### Endpoints

**Addon Config:**

| Method  | Path                                           | Auth       | Description              |
| ------- | ---------------------------------------------- | ---------- | ------------------------ |
| `GET`   | `/events/{eventId}/addons`                     | Member     | List all addon configs   |
| `POST`  | `/events/{eventId}/addons/{addonType}/enable`  | Moderator+ | Enable addon with config |
| `POST`  | `/events/{eventId}/addons/{addonType}/disable` | Moderator+ | Disable addon            |
| `PATCH` | `/events/{eventId}/addons/{addonType}/config`  | Moderator+ | Update addon config      |

**Addon Data:**

| Method   | Path                                              | Auth                                     | Description                 |
| -------- | ------------------------------------------------- | ---------------------------------------- | --------------------------- |
| `GET`    | `/events/{eventId}/addons/{addonType}/data`       | Member                                   | List all data entries       |
| `PUT`    | `/events/{eventId}/addons/{addonType}/data/{key}` | Member (creator or Moderator+ to update) | Create or update data entry |
| `DELETE` | `/events/{eventId}/addons/{addonType}/data/{key}` | Creator or Moderator+                    | Delete data entry           |

All responses follow the standard format: `{ success: boolean, data?: ..., error?: { code, message } }`.

Schemas are defined with Zod + OpenAPI in `convex/api/v1/schemas/addons.ts`. Routes are implemented in `convex/api/v1/routes/addons.ts`.

## Built-in Add-ons

### Reminders

Notify attendees before the event starts. Config: `{ reminderOffset: ReminderOffset }`.

- **Handler:** `convex/addons/handlers/reminders.ts` (trusted — needs scheduler)
- **Frontend:** `packages/web/app/(newEvent)/create/components/addons/reminder-addon.tsx`
- Schedules via Convex scheduler, cancels on disable/date reset/event delete
- Supports opt-out per user

### Questionnaire

Ask attendees custom questions. Config: `{ questions: Question[] }`.

Question types: `SHORT_ANSWER`, `LONG_ANSWER`, `MULTIPLE_CHOICE`, `CHECKBOXES`, `NUMBER`, `DROPDOWN`, `YES_NO`.

- **Handler:** `convex/addons/handlers/questionnaire.ts` (standard)
- **Frontend:** `packages/web/app/(newEvent)/create/components/addons/questionnaire-addon.tsx`
- Responses stored as `addonData` with key `response:{personId}`
- Config updates clear all responses and notify members (`ADDON_CONFIG_RESET` notification)
- Has `requiresCompletion: true` — members are gated until they fill out the questionnaire
- Organizers can view all responses in a table and export as CSV/JSON

### Bring List

Coordinate what attendees bring to the event. Config: `{ items: BringListItem[] }`.

Each item has `id`, `name`, and `quantity` (>= 1).

- **Handler:** `convex/addons/handlers/bringList.ts` (standard)
- **Frontend:** `packages/web/app/(newEvent)/create/components/addons/bring-list-addon.tsx`
- Claims stored as `addonData` with key `claims:{personId}`
- Config updates clear all claims and notify members
- No gating (`requiresCompletion: false`)
- Organizers see overview card with CSV/JSON export

### Discord

Sync events with Discord scheduled events. Config: `{ guildId: string, guildName: string }`.

- **Handler:** `convex/addons/handlers/discord.ts` (trusted — needs scheduler for Discord API calls)
- **Frontend:** `packages/web/app/(newEvent)/create/components/addons/discord-addon.tsx`
- Creates Discord scheduled event when date is chosen
- Updates Discord event on date/detail changes
- Deletes Discord event on disable/date reset/event delete
- Guild change triggers delete + recreate
- Stores Discord event reference as `addonData` with key `discord-event`

### Custom Addons

Template-based addons created by users. Config: `{ templateId: string, template: CustomAddonTemplate }`.

- **Handler:** `convex/addons/handlers/custom.ts` (trusted — automations need scheduler/DB)
- **Frontend:** Various components in `packages/web/app/(newEvent)/create/components/addons/`
- Template stored in `addonTemplates` table, embedded in addon config when enabled
- Supports all 13 field types, section layouts, and automations
- Config updates clear responses and notify members

## Building a New Add-on

### 1. Add type to `ADDON_TYPES`

```typescript
// convex/addons/types.ts
export const ADDON_TYPES = {
  // ...existing types
  MY_ADDON: 'my-addon',
} as const;
```

### 2. Create backend handler

```typescript
// convex/addons/handlers/my-addon.ts
import { defineAddonHandler } from '../define';
import { ADDON_TYPES } from '../types';

interface MyConfig {
  setting: string;
}

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

### 3. Register the handler

```typescript
// convex/addons/registry.ts
import { myAddonHandler } from './handlers/my-addon';
registerAddonHandler(myAddonHandler);
```

### 4. Run codegen

```bash
pnpm generate
```

### 5. Create frontend definition

```typescript
// packages/web/app/(newEvent)/create/components/addons/my-addon.tsx
'use client';

import { registerAddon } from '../addon-registry';

function MyCreateConfig({ formState, setFormState }) {
  /* ... */
}
function MyEventCard({ eventId, config }) {
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

### 6. Import for side-effect registration

Add the import to all 4 rendering entry points:

- `event-addons.tsx`
- `addon/[addonId]/page.tsx`
- `manage-addons-content.tsx`
- `new-event-addons.tsx`

```typescript
import './addons/my-addon';
```

## Security Model

| Concern                   | Mitigation                                                                                                                             |
| ------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| **Authorization**         | Config changes require MODERATOR+. Data writes require membership; updates/deletes require creator or MODERATOR+.                      |
| **Input validation**      | `validateConfig()` is called before any config is persisted. Builder wraps it in try/catch.                                            |
| **Handler integrity**     | Brand symbol prevents forged handler objects. Registry rejects non-branded handlers.                                                   |
| **Context scoping**       | Standard handlers cannot access raw database or scheduler. Only trusted handlers get `rawCtx`.                                         |
| **Payload size**          | All config and data payloads are limited to 64KB.                                                                                      |
| **Addon type validation** | Mutations reject unregistered addon types via `getAddonHandler()` check.                                                               |
| **Data isolation**        | Data is scoped by `(eventId, addonType, key)`. Members can read any addon's data within their event.                                   |
| **Cleanup**               | `deleteEvent` dispatches `onEventDeleted` to all handlers, then deletes all `eventAddonConfigs`, `addonData`, and `addonOptOuts` rows. |
| **Automations**           | Declarative JSON only — no user code execution. Actions are validated at definition time and dispatched by trusted backend code.       |
| **Opt-out enforcement**   | `sendReminder` checks `addonOptOuts` at send-time, not schedule-time, so late opt-outs are respected.                                  |
