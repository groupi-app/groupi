---
'@groupi/web': minor
'@groupi/convex': minor
---

Refactor addon framework with scoped context, handler builder, and expanded lifecycle

**Backend:**

- Replace raw `AddonHandler` interface with `defineAddonHandler()` builder pattern — provides runtime validation, brand checking, and automatic try/catch wrapping for `validateConfig`
- Introduce scoped `AddonContext` for standard addons (data access, event info, members, notifications) and `TrustedAddonContext` for first-party addons needing raw DB/scheduler access
- Add 4 new lifecycle hooks: `onEventUpdated`, `onDataSubmitted`, `onMemberJoined`, `onMemberLeft`
- Refactor existing handlers (reminders, questionnaire, bring list) to use builder pattern and scoped context
- Dispatch lifecycle events from event mutations (`updateEvent`, `removeMember`, `leaveEvent`, `banMember`, `joinDiscoverableEvent`)

**Frontend:**

- Add validated `registerAddon()` with duplicate detection, required field checks, and gating consistency validation
- Expand addon hooks with `useEnableAddon`, `useUpdateAddonConfig`, `useDisableAddon`, `useSetAddonData`
- Add side-effect imports to all 4 addon rendering entry points
