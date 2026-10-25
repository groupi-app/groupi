# Shared content creation

This feature starts at `test` commit
`8fdbc93288fb5050cd3a133959850d97602cd2e3`. The local implementation checkpoint
`f25c28b2` was subsequently extended to the user-approved canonical Post model.

## Model and implementation decisions

The initial audit found persistent Group forms, lists and polls, Event-only
posts/replies, and a separate Bring List add-on. The feature follows these
incremental compatibility boundaries:

1. Existing Group tool tables, revisions, histories and policies remain in place.
   Tool records may have an Event or Group owner; writes require exactly one.
   Event wrappers reuse the existing models and both platforms' screens. Group
   onboarding and owner policies remain intact. Events use exclusion-aware
   membership, existing `createPosts` permission and organizer/moderator management.
2. **`posts` is the canonical Post table.** Each Post has exactly one `eventId`
   or `groupId`. Existing Event rows, IDs, indexes and URLs remain valid without
   rewriting data. `replies`, attachments, muted posts, notifications and presence
   continue to reference the same canonical Post IDs. The Group-facing
   `groupPosts` module is a scoped API adapter, not separate storage.
3. Native create/update/delete and content helpers derive authorization from the
   stored parent. Group access includes current membership, onboarding and
   exclusions. Existing Event-only REST/integration adapters explicitly reject
   Group parents and retain their prior wire contracts and installed-client paths.
4. Web and native Post composition reuse existing rich editors, upload/attachment
   components, shared content limits and sanitization. Group mention suggestions
   expose eligible profile names rather than private email addresses. Web supports
   mention authoring; the existing native editor has no mention autocomplete in
   either context and renders mention content authored on web.
5. Group Post/reply/mention notifications reuse the existing generic preferences
   and delivery channels. Current eligible members receive Post notifications;
   eligible thread participants receive replies. Author, block, DND, mute and
   current content-access rules apply. Queued Group deliveries carry identifiers
   and recheck access before resolving private destinations/content. Existing Group
   announcement subscriptions remain separate.
6. Thread muting, unread marking, post presence, typing and unsaved-edit protection
   use canonical Post IDs in both contexts. New presence tokens are bound to rooms
   so Group access can be checked again after revocation. Unmapped legacy tokens
   retain their existing behavior for backward compatibility.
7. A shared `+ New` menu presents Post, Form, List and Poll, using a desktop
   dropdown, narrow-screen drawer and native action sheet. Discovery uses the
   existing Group policies and Event permissions; backend checks remain decisive.

## Feature disposition

| Feature           | Events                                                                         | Groups                                                          |
| ----------------- | ------------------------------------------------------------------------------ | --------------------------------------------------------------- |
| + New             | Dropdown/drawer/native sheet; existing posting permission                      | Same choices; existing per-kind tool policies                   |
| Posts and replies | Existing canonical IDs, rich text, attachments, notification and URL contracts | Same canonical storage and capabilities through scoped adapters |
| Forms             | Existing form model, responses, management, results and history reused         | Existing saved forms and policies preserved                     |
| Lists             | Existing list model, entries, management and own recovery reused               | Existing saved lists and policies preserved                     |
| Polls             | Existing voting, results, management and history reused                        | Existing saved polls and policies preserved                     |
| Bring List        | Original add-on and routes retained; discoverable from Event Lists             | Not applicable                                                  |

No Event tool REST/CLI authoring is added. Existing Group tool REST/CLI endpoints
remain Group-scoped. Destructive actions retain confirmation.

## Participant features and Event Settings

The generic Event-page Add-ons catalogue and its management toolbar are removed.
Organizer enable/configure/disable controls live under Event Settings → Add-ons.
Existing management links remain aliases to that destination. Placement is
read-only and does not invoke enable, update, disable or provider operations.

| Saved feature                               | Participant placement                                                    | Preserved behavior                                                                    |
| ------------------------------------------- | ------------------------------------------------------------------------ | ------------------------------------------------------------------------------------- |
| Reminders                                   | “Remind me” beside Event planning/date/RSVP                              | Personal opt-out and scheduled reminder status                                        |
| Questionnaire                               | “Your details” completion action and Forms discovery                     | Required gate, answer editing, saved responses and organizer review                   |
| Bring List                                  | “What to bring” and Lists discovery                                      | Same items, quantities, per-person claims and claim review                            |
| Discord                                     | Connection/status beside Event planning                                  | Existing participant Discord link and sync status                                     |
| Custom form/vote/list/interactive templates | Event content under the saved template name                              | Whole event-saved template, response key, conditions, actions and completion behavior |
| Custom card-only/display templates          | Named inline Event content                                               | Existing inline controls, acknowledgement and information                             |
| Unknown or malformed saved features         | Accessible unavailable status; preserved configuration entry in Settings | No invented interaction, raw configuration exposure or automatic removal              |

Custom templates with mixed interactions remain whole rather than splitting
shared responses or conditions across Forms/Lists/Polls. Native retains its
existing clearly named browser handoff for the full custom renderer; this placement
change does not build a second renderer for all custom field types. Built-in
participant flows remain native. Disabled configurations are not offered as active
participant actions, but remain visible to managers where applicable.

Required questionnaire exemptions and legacy paths are preserved: web
`/event/:id/addon/:type`, native `/event/:id/addons/:type`; web `/manage-addons`
and native `/addons/manage` retain management redirects. Configuration changes
or disabling that can clear questionnaire responses/Bring List claims require
explicit confirmation; cancellation and failures retain edits. Unknown saved
configuration is never passed through a guessed editor.

PR435 head `b2da51eb` is locally integrated to preserve its settings/navigation
fixes. This is a local source merge, not a merge of either remote pull request.
The user approved the amended minor release note covering this participant-feature
placement and Event Settings management scope.

## Data and schema evolution

Existing Event posts already satisfy the canonical parent invariant. Their
`eventId`, Post/reply IDs, attachment parent IDs, URLs and saved mute/notification
references require no migration. Old Group tool records also satisfy their
widened validators. Optional added fields keep saved notifications compatible.

The separate `groupPosts`/`groupPostReplies` tables in the unpublished local
checkpoint were never pushed or deployed by this task. They are absent from the
final canonical schema; no live table removal or data deletion was performed.
See [the review-only schema rollout plan](shared-content-schema-review.md) before
any deployment. A deployment inspection finding historical rows in those
checkpoint tables changes the plan and must stop schema removal for explicit
migration review.

Bring List stores configured quantities and per-person claim maps, which ordinary
community list entries do not represent. It remains coexistent: nothing
automatically disables, reconfigures, copies or deletes its configuration,
quantities, claims or links. A regression snapshots its legacy API data, exercises
new Event List operations, then verifies exact preservation. Replacing its model
requires a separate explicit migration decision.

## Verification boundaries

Source tests and component fixtures do not establish live backend/device
acceptance. This worktree has no configured Convex deployment. Codegen is blocked
by missing `CONVEX_DEPLOYMENT`; generated API module declarations are maintained
locally and a real generation run remains an approved-environment acceptance gate.
The offline backend test command bypasses only that configuration prerequisite.

The user approved the minor changeset, a local frontend build with fixture-only
configuration, and a `vercel.json` guard disabling automatic deployment solely for
`codex/shared-content-creation`. The guard prevents publishing this draft branch
from invoking the existing automatic Convex deployment workflow. No merge,
backend deployment, credentials, one-time migration or live notification/data
operation is authorized.

Browser gallery fixtures use no real app data. Matching authenticated frontend
and backend builds, physical native acceptance and observed VoiceOver behavior
remain separate open gates.
