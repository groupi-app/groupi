# Red Room integration contract

`red-room.v1` publishes a selected-Group applicant integration. G1 consent/own-context and G3 own-application writes below are implemented in this source candidate. Publication does not establish deployment or provider acceptance. Synthetic development data is shipped at `@groupi/sdk/community-contract`; it is not a service adapter.

## Table of Contents

- [Implemented boundary](#implemented-boundary)
- [Operation mapping](#operation-mapping)
- [Errors and recovery](#errors-and-recovery)
- [Proposed mutation replay](#proposed-mutation-replay)
- [Fixtures and release gates](#fixtures-and-release-gates)

## Implemented boundary

Use the existing approved native or confidential-web delegated client, with exact issuer, API audience, registered redirect, state, nonce and S256 PKCE. A confidential site retains reusable credentials on its server. Send `group_id=<selected Group ID>` in the authorization request; TypeScript `DelegatedSession.authorizationRequest` accepts `selectedGroupId`, and Python `authorization_request` accepts `selected_group_id`. Request `groups.context.read` and only separately necessary identity claims/background access. Consent binds the selected Group to the browser interaction. Users may decline any action. Selecting a Group grants no membership, reviewer authority or Event access. The screen discloses its current/future audience Events as the boundary for future participation permissions, without claiming those permissions are live.

The grant selector is `{kind:"selected-group",groupId}`. Existing Event selectors and named/integration keys retain their independent semantics. Group grants permit independently selected identity actions, `groups.context.read`, and G3 `groups.applications.submit`/`edit`/`withdraw` actions. Write scopes do not require read scope; future permissions require implemented actions and renewed explicit consent. No organizer credential fallback is supported. Identity remains verified issuer plus the app-specific subject from the existing signed identity protocol, never email or a global person ID.

`GET /api/v2/groups/{groupId}/community-context?cursor=...` requires a delegated bearer credential. Every read checks credential lifetime/scope/audience, live grant/account/app eligibility, active connection, exact selected Group and current Group policies in one read transaction. Testing apps remain usable only by their owner; nonowners require platform approval. Unknown or unrelated Group IDs produce the same permission denial without exposing existence. A banned person can read their own admission state/history, with no current questions or member-content eligibility; the grant never overrides a ban.

The typed `CommunityContext` contains current form enabled state/questions and a content-derived revision, current membership independently from historical decisions, eligibility, up to 50 newest own applications and `nextCursor`, granted actions and currently implemented allowed operations. Fetch subsequent pages with the opaque cursor. Saved questions/answers remain attached to each application. Decisions omit reviewer/person IDs and all free-text review reasons; other applicants, their existence, answers and private staff data are absent. `canApply` describes current admission eligibility; submit is available only when its exact scope is currently granted. `allowedActions` contains only implemented actions. Announcement preference is `{supported:false,subscribed:null}` until G7, never an invented subscription. Protected success and error responses use `private, no-store`; refresh on page entry, return/focus and after actions. Realtime is unnecessary.

## Operation mapping

The SDK exports exact current/proposed mappings as `communityOperations` and types in `community-contract.d.ts`. All paths below are relative to `/api/v2`. Proposed names reserve the coordination contract; they are deliberately absent from callable SDK classes and public OpenAPI until implemented. Methods and payload/result types must be implemented and tested at the named milestone before use against a live provider.

| Concept                              | HTTP and SDK mapping                                                                                                                        | Status / acceptance                                                    |
| ------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- |
| Hosted authentication and consent    | Existing `/oauth/auth`, `/oauth/token`; `DelegatedSession` / `DelegatedSession`                                                             | G1 selected Group; G2 themed journey; G10 live provider acceptance     |
| Own community context                | `GET /groups/{groupId}/community-context`; `readOwnCommunityContext` / `read_own_community_context`                                         | Implemented G1                                                         |
| Read own application/history         | Own-context `applications` projection, paginated by cursor                                                                                  | Implemented G1; includes saved snapshots and decisions                 |
| Submit own application               | `POST /groups/{groupId}/community-applications`; `submitCommunityApplication` / `submit_community_application`                              | Implemented G3                                                         |
| Edit own application                 | `PATCH /groups/{groupId}/community-applications/{applicationId}`; `editCommunityApplication` / `edit_community_application`                 | Implemented G3                                                         |
| Withdraw own application             | `POST /groups/{groupId}/community-applications/{applicationId}/withdraw`; `withdrawCommunityApplication` / `withdraw_community_application` | Implemented G3                                                         |
| Read single current Event / own RSVP | `GET /groups/{groupId}/current-event`; `readCurrentCommunityEvent` / `read_current_community_event`                                         | Implemented G4; explicit none/conflict/event discriminants             |
| Join Event                           | `POST /groups/{groupId}/events/{eventId}/join`; `joinCommunityEvent` / `join_community_event`                                               | Proposed G5; creates Pending, never Yes; replay preserves later RSVP   |
| Change own RSVP                      | `PUT /groups/{groupId}/events/{eventId}/own-rsvp`; `setCommunityRsvp` / `set_community_rsvp`                                                | Proposed G5                                                            |
| Leave Event                          | `POST /groups/{groupId}/events/{eventId}/leave`; `leaveCommunityEvent` / `leave_community_event`                                            | Proposed G5                                                            |
| Leave Group                          | `POST /groups/{groupId}/community-leave`; `leaveCommunity` / `leave_community`                                                              | Proposed G5; independent Event participation retained                  |
| Read own announcement preference     | Own-context `announcementPreference`                                                                                                        | Shape published; supported only at G7                                  |
| Change preference                    | `PUT /groups/{groupId}/announcement-preference`; `setCommunityAnnouncementPreference` / `set_community_announcement_preference`             | Proposed G7; explicit default off                                      |
| Coordinated expulsion                | `POST /groups/{groupId}/coordinated-expulsions`; `expelCommunityMember` / `expel_community_member`                                          | Proposed G8; staff-only independent authority, progress and generation |
| Reinstatement                        | `POST /groups/{groupId}/coordinated-expulsions/{personId}/reinstate`; `reinstateCommunityMember` / `reinstate_community_member`             | Proposed G9; restores no memberships/invitations/bans                  |

### Frozen action scopes and allowed actions

`communityOperations.<operation>.action` and `communityActionCatalog` are the exact shared names below. `groups.context.read` and the three G3 application actions are grantable. Other entries remain **proposed**, rejected by current authorization validators and unavailable in live SDK authorization configuration until their milestone lands. Adding one requires updating grant validators, live authority, SDK scope lists and consent together. Staff actions never belong in applicant consent.

| Operation                            | Exact action/scope                        | Milestone       |
| ------------------------------------ | ----------------------------------------- | --------------- |
| `readOwnCommunityContext`            | `groups.context.read`                     | G1              |
| `submitCommunityApplication`         | `groups.applications.submit`              | G3              |
| `editCommunityApplication`           | `groups.applications.edit`                | G3              |
| `withdrawCommunityApplication`       | `groups.applications.withdraw`            | G3              |
| `readCurrentCommunityEvent`          | `groups.events.read`                      | G4              |
| `joinCommunityEvent`                 | `groups.events.join`                      | G5              |
| `setCommunityRsvp`                   | `groups.events.rsvp`                      | G5              |
| `leaveCommunityEvent`                | `groups.events.leave`                     | G5              |
| `leaveCommunity`                     | `groups.leave`                            | G5              |
| `setCommunityAnnouncementPreference` | `groups.announcements.preferences.update` | G7              |
| `expelCommunityMember`               | `groups.expulsions.create`                | G8 (staff only) |
| `reinstateCommunityMember`           | `groups.expulsions.reinstate`             | G9 (staff only) |

`grantedActions` is the intersection of current token scopes and the live App connection grant, not an inferred role or membership. `allowedActions` is its subset whose implemented operation is currently eligible on this selected resource. A scope does not imply authority; revocation, bans, membership, current admission policy and roles are rechecked at every protected operation. G3 advertises submit only when that exact action is granted and the person can currently apply, and edit/withdraw only for their own active pending application and corresponding scope. Event responses use these full action strings, never shorthand `join`/`rsvp`. Read scope is independent of write scope; a write-only receipt does not include answer/logistics/roster projections. Read own application/history and own preference use `groups.context.read`; own RSVP uses `groups.events.read` through the current-event projection.

Application mutations take current form revision on submit and saved application revision on edit/withdraw; `ProposedOperations` defines all typed intent/result projections. For proposed wire mutations, `Idempotency-Key` carries `operationId`; path IDs come from `payload` and remaining payload fields plus `expectedRevision` form the JSON body. For example, submit sends `Idempotency-Key: <operationId>` with body `{formRevision:"<observed form.revision>",answers:{"<question id>":"<answer>"}}`; edit sends `{expectedRevision:<observed application.revision>,answers:{...}}`; withdrawal sends `{expectedRevision:<observed application.revision>}`. RSVP sends `{expectedRevision:<observed participation.revision>,rsvp:"YES"}`. Join and leave send `{}` with target IDs in the path. Preference sends `{subscribed:true}` or `{subscribed:false}`. Expulsion sends `{policy:"coordinated",personId:"<target>"}`; reinstatement sends `{generation:<observed exclusion generation>}`. Edit/withdraw/RSVP concurrency revisions are required typed inputs. Read authority filters reconciliation/state; mutation receipts contain only IDs/status/revision unless separately authorized reads are performed. No write permission implicitly returns answers, roster or logistics. Current own-context is the live community read. G3 mutations return minimal committed receipts; G4–G9 remain proposed.

## Errors and recovery

SDK `GroupiError` preserves wire `code`, HTTP `status`, `details` and `uncertain`; it never silently uses another credential. Structured error envelopes are `{error:{code,message,...guidance}}`. Error classification is versioned with the contract. Reserved future errors below are proposed, not claims of current HTTP routes.

| Code                                                                    | Meaning / action                                                                                                                                       |
| ----------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `UNAUTHORIZED` (401)                                                    | Missing, malformed, unknown or wrong-audience credential; start explicit authorization. No resource existence is revealed.                             |
| `TOKEN_EXPIRED` (401)                                                   | Known delegated credential or grant expired; renew only an existing permitted refresh grant, otherwise reconnect.                                      |
| `CONNECTION_REVOKED` (401)                                              | Known credential/connection revoked; explicit reconnect, never retry the revoked token.                                                                |
| `FORBIDDEN` (403)                                                       | Action/resource/current account, app or eligibility denied; re-read authorized state or return to consent. Retrying unchanged authority does not help. |
| `VALIDATION_ERROR` (400)                                                | Fix input; proposed application validation includes answer shape and stale current-form submission errors.                                             |
| `STALE_REVISION`, `CONFLICT` (409; proposed)                            | Read authorized current own state; ask for a fresh intent with its new revision.                                                                       |
| `PROTECTED_OWNER`, `PROTECTED_ORGANIZER` (409; proposed)                | Staff must resolve ownership/last-Organizer safeguards; never display successful departure/expulsion.                                                  |
| `STAFF_CONFIGURATION_CONFLICT` (current-event conflict discriminant)    | Multiple active applicable Events; staff resolution required, never select arbitrarily.                                                                |
| `IDEMPOTENCY_CONFLICT` (409; proposed)                                  | Same operation ID with a different payload/resource/app/actor binding; reject, never replay unrelated effects.                                         |
| `IDEMPOTENCY_EXPIRED` (409; proposed)                                   | Receipt window ended; reconcile authorized state before deciding a new intent.                                                                         |
| `UNAVAILABLE` (503), `RATE_LIMITED` (429)                               | Retry safe reads with bounded backoff and `Retry-After`; absence of response is not absence of Event/application.                                      |
| `UNKNOWN_OUTCOME` (local transport or proposed mutation classification) | Read authorized own state/operation receipt before retrying; no success/failure claim from a lost response.                                            |

Existing OAuth errors remain distinct: `access_denied` requires fresh explicit consent; `invalid_grant` includes expired/used authorization codes or invalid refresh state and requires reconnect; `invalid_client` requires operator correction. Wrong browser/account or state/PKCE mismatch never bypasses binding. Provider transport/configuration failure is not a decline. Existing SDK transport codes (`TRANSPORT_ERROR`, `TOKEN_TRANSPORT_ERROR`, `INVALID_TOKEN_RESPONSE`, `REDIRECT_REFUSED`) preserve uncertainty; see [delegated sign-in](delegated-sign-in.md) for protocol constraints. G10 verifies hosted wrong-browser, used-link and provider failure classifications against the deployed provider.

## Proposed mutation replay

This replay contract is implemented for G3 application writes and optional staff decision intents; G4–G9 must reuse it. A caller generates a UUID operation ID for one deliberate intent. The server binds it to the verified issuer/app subject (internally current actor/app), operation, selected Group, target application/Event/person, expected revision and canonical validated payload. A duplicate identical request returns its original committed receipt without duplicate records, transitions, notifications or cleanup scheduling. A different binding/payload fails `IDEMPOTENCY_CONFLICT`. Authorization is rechecked even when retrieving a receipt, and result projections obey current read permission.

G3 retains authoritative receipts for exactly 30 days from the first accepted request and retains recognized operation IDs, bindings and minimal receipt records indefinitely as mismatch tombstones. No cleanup deletes these records. Replays never extend lifetime. Return `IDEMPOTENCY_EXPIRED` for an expired recognized receipt; beyond retained tombstones a client must not blindly retry an uncertain intent. Reconcile current own-context, current-event/RSVP or authorized staff progress first; if state cannot establish the original outcome, require explicit user/staff resolution before a new operation ID. Intentional later reapplication gets a new ID. The implementation milestone must publish its exact retention/cleanup horizon before acceptance.

`Committed<T>` separates authoritative `outcome:"committed"` from `effects.email:"queued"` and cleanup queued/blocked/complete. Delivery failure does not undo admission. Staff cleanup may be blocked while exclusion is already committed. A new revision mismatch must fail atomically rather than overwrite a later decision or RSVP. Join replay returns membership without resetting an established RSVP. Reinstatement increments the exclusion generation and restores no removed participation; stale cleanup cannot affect a newer generation. Saved application snapshot edits do not switch to the current form.

### G3 current application lifecycle

Submit, edit and withdraw use the frozen HTTP mapping above, require a UUID `Idempotency-Key`, and return `{operationId,outcome:"committed",result:{applicationId,status,revision},effects:{email:"not-requested",cleanup:"not-requested"}}`. Applicants never receive answers in write receipts. Existing notification scheduling remains inside the canonical submission/review transaction; receipt commitment makes no claim that external delivery completed. G6 owns branded decision delivery.

Submit compares `formRevision` to the current form and rejects a stale value with `STALE_REVISION`. It never overwrites a pending application. Edits use the application's saved question snapshot even after current questions change. Edit and withdrawal require `expectedRevision`; canonical native edits, withdrawal and staff decisions advance `updatedAt` by at least one even within the same millisecond. Web/mobile staff review sends the observed revision. Staff review supports an optional UUID `operationId`; duplicates recheck current manager authority and do not repeat admission or notifications. Replayed historical approvals never restore a departed membership. Old native clients retain their existing signatures, while new delegated writes always require revisions.

After receipt expiry, `IDEMPOTENCY_EXPIRED` requires authorized state reconciliation before a new intent. A write-only caller must separately obtain read consent or use a trusted native view to reconcile; it receives no implicit read projection. A declined or withdrawn applicant may intentionally reapply immediately against current questions using a new operation ID. Bans, disconnect, suspension and current account authority remain authoritative on every request, including replay.

## Fixtures and release gates

The package fixtures contain synthetic names, IDs, answers and timestamps only. Each fixture carries `synthetic:true`, `status` and `milestone`; proposed records are not served by a fallback live endpoint. G1 fixtures cover never applied, saved-snapshot pending, declined, withdrawn, historical approval without membership, member, banned and expired/revoked reads. G4 covers no Event, ongoing Event and multiple-Event conflict. G5 covers voluntary departure with retained participation and Join/Pending/Yes/leave. G7 covers subscribed/unsubscribed. G8/G9 cover expelled/reinstated. G3 covers a committed lost-response receipt.

Existing Groups #261 supplies native admission/history/review, independent Group/Event audiences, member onboarding and ordinary moderation. Existing delegated-readiness #346 supplies approved app registration, app-specific identity, signed protocol, bounded credentials, consent/disconnect and SDK consumers. This work extends those domain boundaries rather than impersonating applicants.

Remaining gates include G2 trusted hosted appearance/onboarding, deployed G3 acceptance, G5 participation, G6 branded decision delivery, G7 preferences/announcements, G8 exclusion, G9 cleanup/reinstatement and G10 deployed acceptance. Existing narrowed backend schemas still need their two-stage [migration audit](strict-backend-contract-rollout.md); issuer signing/cookie configuration, matching deployed frontend/backend source, isolated browser identities, native accessibility where applicable and external security review remain unverified. Local protocol/HTTP and SDK tests are source evidence only. No live data or deployment is modified here.

Contract additions may add optional fields within `red-room.v1`; incompatible field meanings, operation bindings, privacy or replay semantics require a new contract version and coordinated Groupi/Bound in Red consumer fixtures/tests. A proposed operation becomes supported only with its implementation, OpenAPI entry, generated SDK methods, authority/replay tests and milestone acceptance. Fixtures and both SDK references must move together.

## G4 current Event and staff lifecycle

`GET /groups/{groupId}/current-event` and native
`api.groups.currentEvent.getCurrentEvent` share `currentEventForPerson`.
The delegated read requires `groups.events.read`, current selected Group binding
and live credential/account authority. A currently eligible Group member can read
before Join; independent Event membership retains its own read authority after
voluntary Group departure. Public or Friends eligibility alone does not replace
selected Group authority here. Roster is null before Event admission; members
receive display names only when the existing attendee-list permission allows it.
No email, response notes, or application answers appear in this projection.

Exactly zero applicable active Events returns `kind:none`; more than one returns
`kind:conflict` with `STAFF_CONFIGURATION_CONFLICT`, without arbitrarily selecting
or exposing unrelated Event IDs. A single Event returns description, timezone,
logistics, own participation and full action strings. `supportedRsvpChoices` is
computed from the canonical RSVP validator choices; `allowedRsvpTransitions` is
empty until G5 implements and authorizes RSVP writes. G5 must advertise transitions
only for a live own membership with the granted eligible `groups.events.rsvp`
action. G4 advertises only `groups.events.read`.

Staff use native `api.events.lifecycleOperations.getLifecycle` and
`api.events.lifecycleOperations.setLifecycle`, or legacy API-key REST
`GET /events/{eventId}/lifecycle` (`readEventLifecycle` /
`read_event_lifecycle`) and `POST /events/{eventId}/lifecycle`
(`updateEventLifecycle` / `update_event_lifecycle`). POST accepts
`action:complete|reopen|reschedule`, mandatory `expectedRevision` from the staff
read, optional `startsAt`/`endsAt`, and a UUID `Idempotency-Key`. Native uses the
same UUID as `operationId`. Reschedule requires both dates; use null for an undated
start or absent end. A finite future start and strictly later end are required.
Reopen cannot revive a past recorded end; use Reschedule. Current Event Organizer
authority is checked inside the write transaction, before replay. Group roles do
not confer this authority, and selected Group delegated scopes cannot call these
staff operations. Staff reads identify visible Group audience conflicts; existing
audience/DIRECT controls remain the configuration path.

Completion means `completedAt` is set, or a recorded end is at or before
server time. A past start without an end and an undated Event remain active.
Lifecycle receipts bind actor, native/legacy credential authority, Event, operation,
body and revision, and use the shared 30-day receipt window with permanent mismatch
tombstones. Replays do not extend retention or repeat scheduling/add-on effects;
minimal receipts contain no logistics/roster. The Organizer UI retains the exact
intent after an uncertain outcome and offers an explicit current-state
reconciliation before starting another intent.

G8 integration boundary: `events/lifecycle.isEventComplete(event, now)` is the
shared selection/cleanup predicate. `guardEventReactivation(ctx, eventId,
explicit=false)` runs before explicit reopen/reschedule, existing choose/reset
date operations, Group audience addition, Friends audience enablement, visibility
widening, and DIRECT/APPLY admission changes. G8 adds exclusion reconciliation to
this function regardless of `explicit`; that flag permits the explicit completion
fence only. No exclusion records or expulsion behavior are invented in G4.
Audience withdrawal, disabled Friends sharing and narrowing to Private remain
available. Potential date options do not change chosen dates or completion.

Source-level HTTP/native/SDK and Organizer component tests are local evidence.
A matching deployed frontend/backend and isolated signed-in browser identity have
not been supplied for this G4 source; live staff browser/provider acceptance remains
an open G10 gate. No local runtime, deployment, or live data write was performed.

## G8 coordinated exclusion and G9 handoff

Staff native `groups.expulsions.expel` and legacy-key REST
`POST /groups/{groupId}/coordinated-expulsions` commit explicit coordinated
exclusion. REST requires `{personId,policy:"coordinated"}` and UUID
`Idempotency-Key`; SDK names are `expelCommunityMember` and
`expel_community_member`. Applicant selected-Group scopes cannot invoke this
staff operation. The key's current account, expiry, enablement and Groups write
scope are rechecked inside the same transaction, before receipt replay.

The minimal receipt is `{operationId,outcome:"committed",exclusion:"active",
generation,cleanup:"pending"|"blocked"|"complete",conflicts:[{eventId,code}]}`.
Initiation returns pending or blocked only. Conflicts identify
`EVENT_AUTHORITY_REQUIRED` or `PROTECTED_ORGANIZER`; a Group owner target fails
`PROTECTED_OWNER` (409) without commitment. Staff reconcile through native
`groups.expulsions.progress` or
`GET /groups/{groupId}/coordinated-expulsions/{personId}`
(`readCommunityExpulsion` / `read_community_expulsion`). Every read/replay
requires current Group manager authority. Replay uses G3's 30-day receipt window
and permanent mismatch tombstones. It repeats no exclusion or scheduling.
Own-context adds `eligibility.excluded`, preserving own application history while
withholding current questions and member-content eligibility.

`groups/exclusions.isEventExcludedForPerson(ctx,eventId,personId,now?)` checks
active `communityExclusions` for captured Event IDs or current Group audience
links. `isGroupExcludedForPerson(ctx,groupId,personId)` fences Group entry and
member content. Completed Event history is exempt from the Event read fence.
`events/lifecycle.guardEventReactivation` calls `reconcileEventExclusions`
regardless of its explicit flag, and Group audience sharing calls it again after
inserting the new link. Reconciliation deliberately does not use the completed
history exemption: it captures newly applicable IDs before reopening can expose
retained membership. Captured IDs survive audience withdrawal.

Canonical callsites: Event admission/protected logistics; authenticated Event
membership; native Event header, attendees, dates, availability and dashboard;
REST membership/detail/list and attendee access; bounded authorization via the
shared membership helper; RSVP and availability writes; Event admission writer;
ordinary invitation permission, targeted invitation eligibility, targeted and
generic invitation acceptance, and known-email invitation creation; discussion
roles, feeds, detail and replies; Group entry, detail, manager and member content.
G5/G6/G7 use these eligibility helpers within their own write/delivery transaction.

G9 consumes `communityExclusions`: `(groupId,personId)` identifies the record;
`active,generation,operationId,actorId,eventIds,cleanup,conflicts` are durable.
Before each destructive step, re-read active/generation and current actor authority
in that transaction. Do not infer completed cleanup from an empty current audience:
use captured IDs, and preserve Event records which are completed at that step.
New audience links extend captured IDs and mark pending. Reinstatement increments
generation and deactivates the exclusion, restoring no removed state. A worker
must not modify a newer generation. Initiation schedules no cleanup or notification;
G9 owns scheduling/retry, completion proof and reinstatement progress.

Source native/HTTP/SDK and staff component tests provide local evidence only.
Deployed staff browser/native and provider acceptance remain G10 gates.

## G6 decision email and trusted return

Canonical delegated submissions record the verified source app/grant, never a caller-supplied brand, recipient or return URL. Native applications retain Groupi defaults. Platform administrators may configure `appearance.statusReturnUrl` on the approved Developer app; it must be HTTPS on a registered redirect origin with no credentials or fragment. The Bound in Red destination is `https://<site-origin>/red-room/application`. Sender display name/accent use approved hosted appearance, while `RESEND_FROM_EMAIL` and `RESEND_API_KEY` remain operator-owned. Mailbox/domain verification and actual inbox receipt remain G10 deployment gates.

Decision commitment and admission are independent of email. Native application reads and delegated own-context expose optional `decisionDelivery` (`queued`, `sending`, `sent`, `failed`, `suppressed`) without recipients, provider diagnostics or credentials. Existing global notification methods/type preferences and DND govern eligibility at decision time and again at dispatch; announcement opt-in is not consulted. `sent` records provider acceptance, not inbox receipt. Suppression stops further attempts; an earlier uncertain provider attempt may already have been accepted.

A single durable dispatch belongs to each decided application. Claiming is transactional; replaying the decision cannot queue another message or restore departed membership. Frozen messages use a per-dispatch/per-recipient provider idempotency key. Current Group managers can retry delivery from web/mobile review without repeating a decision. Active claims reject retries for five minutes; queued or failed claims can retry within 23 hours of the decision. Beyond that conservative bound, staff must inspect provider delivery before contacting the applicant: [Resend's idempotency retention is 24 hours](https://resend.com/changelog/idempotency-keys), so automated retries stop rather than risk duplicate mail. Decision replay receipts retain the G3 30-day policy independently. Application/Group/account cleanup removes dispatch payloads with the private application.

Email links go first to the trusted Groupi `/application-status/{applicationId}` route. The route signs in the applicant, checks ownership/current account/Group eligibility, displays historical decision separately from current membership, and only offers the configured site return after rechecking the source app, active grant/binding, selected Group and current `groups.context.read` authority. It adds no recipient, identity token or application answers to the external URL. The site must authenticate its own session and reread delegated own-context. Disconnect, app suspension/deletion or removed read authority disables the external continuation; old approval never restores current membership. Queued delivery rechecks source authority and current preferences before claiming mail. Source-level authenticated HTTP/domain, provider transport and staff component tests do not establish live email/browser acceptance.

## G7 explicit announcement preferences and Event mail

`GET /groups/{groupId}/community-context` now returns
`announcementPreference:{supported:true,subscribed:boolean}`; absence of a saved
choice means false. `PUT /groups/{groupId}/announcement-preference` requires the
selected Group delegated `groups.announcements.preferences.update` scope, a UUID
`Idempotency-Key`, and exactly `{subscribed:boolean}`. The generated Node method is
`setCommunityAnnouncementPreference`; Python uses
`set_community_announcement_preference`. The response is exactly
`{operationId,outcome:"committed",result:{subscribed},effects:{email:"not-requested",cleanup:"not-requested"}}`.
Own native reads/changes use `groups.announcementPreferences.readOwn/updateOwn`.
Opt-in requires current member-content eligibility; own opt-out remains available
after departure. Voluntary Group Leave retains the explicit choice, but a former
member receives no Group Event announcements. Rejoining does not silently rewrite
that choice. Other Groups and global notification settings remain independent.

Staff explicitly invoke native `groupAnnouncements.eventMail.announce` with
`{groupId,eventId,operationId}`. Both current Group manager and current Event
Organizer authority are mandatory; Group management grants no Event role. The
Event must be active and currently shared to this Group. Publishing or sharing
an Event never invokes this operation. The receipt commits an announcement ID
and `effects.email:"queued"`; the Group screen exposes queued, delivered, failed
and suppressed aggregate counts, and an authorized retry. Delivered records
provider acceptance, not inbox receipt. General Group in-app announcement
behavior is separate and retains its existing controls.

Platform administrators link a Group to an approved Developer app with native
`groupAnnouncements.eventMail.configureBrand({groupId,appId,returnUrl})`.
The app's approved appearance supplies brand/accent/sender display name; the
sender mailbox and provider key remain operator-owned. The return must be HTTPS
on a registered redirect origin, without credentials or fragment. No configured
link uses Groupi defaults. A changed, invalid, removed or suspended configuration
suppresses already queued mail rather than silently changing its brand. Staff
cannot pass a brand, sender, recipient, or external return in an announcement.

The identifier-only page/dispatch queue rechecks current explicit opt-in,
current Group member-content authority, canonical Event audience eligibility,
blocks/bans/exclusion, live account, DND and global EMAIL/type preferences. A
delegated opt-in also rechecks its live source app/grant/binding. Claims are
transactional; repeated page processing, operation replay and concurrent claims
cannot produce duplicate dispatches. Frozen per-recipient messages use stable
provider idempotency keys. Authorized retries retain those exact messages and
keys, reject active claims for five minutes, and stop at 23 hours after enqueue,
before the provider's 24-hour retention horizon. Email failure never rewrites
membership, RSVP, subscription, or the committed operation receipt. UUID receipts
retain the common 30-day window and permanent mismatch tombstones.

Email links first open Groupi `/announcement-preferences/{groupId}`. The person
signs in to their own account, reads/changes their own preference, and can continue
to the approved external community only after current app/grant/selected Group
read authority is rechecked. The external URL contains no email, identity token,
Event logistics or application data. The site must authenticate and reread live
own context. Group/Event/account deletion purges the corresponding private queue,
frozen payloads and preferences; deleting an Event preserves unrelated Group
preferences.

Authenticated HTTP/native, generated SDK, production-provider staff component
and mocked provider transport tests establish local source behavior. Matching
deployed frontend/backend, actual signed-in browser navigation, provider mailbox
verification and inbox/return acceptance remain open G10 gates. No development
runtime, build, deployment or live data mutation was performed for G7.
