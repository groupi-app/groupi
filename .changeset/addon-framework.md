---
'@groupi/web': minor
'@groupi/convex': minor
---

Add extensible add-on framework for events

Introduce a generic add-on system that allows optional, pluggable features to be attached to events. The framework manages lifecycle, configuration, storage, gating, and UI rendering through a handler + registry pattern on both backend and frontend.

**Framework:**

- New tables: `eventAddonConfigs`, `addonData`, `addonOptOuts`
- Backend handler interface with lifecycle hooks (onEnabled, onDisabled, onConfigUpdated, onDateChosen, onDateReset, onEventDeleted)
- Frontend registry with self-registering addon definitions
- Generic hooks for addon config, data, and opt-out management
- Addon gating system to require completion before accessing event content

**Built-in add-ons:**

- Reminders: refactored from legacy system to use the add-on framework with per-user opt-out support
- Questionnaire: new add-on allowing organizers to create custom questionnaires with 7 question types (short answer, long answer, multiple choice, checkboxes, number, dropdown, yes/no); responses are gated and organizers can view all responses in a table
