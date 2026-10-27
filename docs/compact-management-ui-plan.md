# Compact management UI implementation plan

The completed voice walkthrough approves local implementation of the settled decisions below. Announcement retirement details remain a separate pending decision track. No push, merge, deployment, shared backend writes or credential changes are authorized.

## Table of Contents

- [Checkpoint and evidence](#checkpoint-and-evidence)
- [Approved behavior](#approved-behavior)
- [Pending post-update decisions](#pending-post-update-decisions)
- [Implementation and verification](#implementation-and-verification)
- [Compatibility and rollout](#compatibility-and-rollout)

## Checkpoint and evidence

Continuation branch `codex/management-ui-refinement` starts from verified unpublished checkpoint `62be9ebe98c7850f601d0048c1acdf80939f9e8e`. Source archive SHA256: `c01be12164c4fde6c6ab26a7495c55cae98b048ad626f0a287a11f9f031df152`. The original plan and local evidence remain under sibling task `artifacts/management-refinement/` and `artifacts/ui-audit/`.

Frontend-design, grill-with-docs and its grilling/domain-modeling skills informed the planning rounds. User walkthrough approval ends the implementation hold. Repository UI/tokens, architecture, testing and relevant backend/shared-hook guidance apply. Existing Groupi typography/theme and shared ActionMenu desktop dropdown/mobile drawer conventions govern composition.

Actual-component synthetic renders confirm the announcement selector overflow, Discord detail clutter, oversized repetitive key actions, metadata-first builder and long Event management stack. Applications actions wrapped successfully; no overflow was reproduced there. Full authenticated routes remain unverified. Preserve the distinction between component fixtures and authenticated acceptance.

## Approved behavior

### Cohesive Event settings

All non-destructive Event settings edits participate in one global dirty Save/Revert experience across settings routes. No independent saves for audience, admission or application configuration. Inspect and extend the existing provider/transaction model; preserve drafts, failed-save recovery, navigation guards and atomicity rather than silently discarding edits. Destructive actions have separate confirmation.

Replace the audience card with one searchable **Shared With** multi-select: Friends first, then accessible Groups, with selected chips. Preserve independent audience/access semantics and current server authority; sharing never grants Event membership, RSVP or management. Admission is one labeled select and at most one concise helper line. Application questions sit in a collapsed accordion with question count, helper above, no redundant headings/save or special dirty marker.

### Automatic lifecycle and passed date options

Remove manual completion UI. With an end time, complete automatically at that time. Without an end time, complete at the next calendar day boundary after the start in the stable Event timezone. The Event schema already contains required `timezone`; use it rather than the viewer zone. Validate actual creation/legacy paths and handle invalid/missing historical values explicitly.

Passed open-poll date options remain visible as Passed; deny new votes for them while preserving old votes. If all options have passed, place the Event in Past with **Needs new dates**, not Completed: preserve memberships, posts and votes. Adding future options restores Upcoming. Never-undated/no-option records should remain active/undated; historical explicit completedAt must retain compatibility without changing records silently. Record any genuinely blocking legacy ambiguity before making a destructive choice.

### Account and Developer settings

Separate everyday Account from Developer settings. Compact key identity rows; use supported short actions and shared ActionMenu for secondary controls. Revoke remains separately confirmed. Preserve one-time secret display, credential ownership, all existing flows and `/settings/account#emails`. Do not combine independent account providers or remount dirty username state accidentally. No credential issuance/revocation in browser fixtures.

### Add-on builder

Use collapsible named content sections with field counts; keep the active editing section expanded. Put general settings in a separate accordion so neither metadata nor content forms an uninterrupted wall. Preserve the stable builder provider, raw/invalid/pending YAML text, Visual/YAML modes, preview contexts, owner-only behavior and distinct draft-save/publish validation. Verify actual current functionality and save checkpoints; existing isDirty is not a reliable saved-state marker. Mobile preview requires an accessible title and reachable controls.

### Discord settings

Use server image/name and success-colored Connected badge. Pending/errors offer the appropriate recovery action. Hide raw identifiers from routine viewing. Remove Refresh; reuse safe automatic metadata synchronization where appropriate without render loops or unauthorized writes. Keep landing channel selection, with existing-role adoption secondary and manual-ID fallback only where necessary. Add Install Bot and Link Discord using the existing Account linking and Event Discord add-on patterns. Keep role-versus-server-membership meaning and explicit Disable handback confirmation. Never perform live linking/install/disconnect during synthetic testing.

### Application review

One heading; concise intro or omit redundant prose. Applicant-first existing member avatar/name/username with normal popover/profile link. No occupation/title subtitle: current contract supplies only name/username/image/personId. Small status badge, clear questions/answers and dividers, retained decision reason. Use labeled Approve and Decline with icons, not icon-only buttons. Preserve reviewer policy, pending locks, errors, existing decision semantics and the standard settings/back shell.

## Approved post updates

The user approved canonical Event/Group posts as the update mechanism, with existing notification preferences. Authors and moderators may toggle replies after publication; either eligible actor may reopen a post. Existing replies stay readable and retain their existing edit/delete permissions. Closing replies blocks all new person and Integration replies, including stale clients, without deleting content.

Organizers/moderators may pin up to three posts per Event or Group. Pins appear newest-pin-first above the entire feed, independently of chronological pagination, without duplicate posts or implicit cross-feed propagation. Pinning sends no additional notification and never changes mute, DND or notification preferences. At capacity, unpin one before pinning another. Permissions and capacity are checked in the write transaction.

The user declined a new announcement history view because they report no announcements have been made. Retire separate Group broadcast/Event email sending UI and navigation locally, preserving all stored records/schema, read/status APIs and notification preferences, rejecting new send/retry intents. Legacy management links return to the parent feed through normal access checks. Do not delete, resend or convert records, force email, or reset opt-ins.

**Data verification and boundary:** at 23:22 UTC the user personally checked and confirmed “there’s no data”; absence of announcement content is user-verified, not tool-verified. The earlier 23:19 UTC limited CLI existence check on test reported a row in `groupEventAnnouncements` but inspected no content and must not be presented as proof of a user announcement. Both facts are retained in local evidence. This does not block reversible UI retirement: no stored records/schema or prior-queue internal delivery workers are removed, and no history UI or data migration is included. Production was not queried; any future destructive migration requires its own verification and approval.

Code facts: posts have one canonical Event/Group parent. Person replies converge in `replies/writes.ts`; Integration replies insert through `discussion/integrations.ts`. Both must enforce locks. Group/native feeds paginate while Event web collects newest-first, requiring bounded parent-scoped pinned retrieval rather than sorting only loaded pages. No Group-wide mute is promised.

## Implementation and verification

Work in independently owned tracks: Event global settings, lifecycle/date classification, Account/Developer, builder, Discord and application review. Integrate against combined source and preserve earlier Form/List/Poll work. Backend operations enforce authority inside transactions; shared hooks stay platform-independent. Use additive compatible fields if needed; no data migration or rewrite.

Targeted behavioral tests first, then combined types/lint/format/contracts/full relevant suites and final build. After TSX edits apply React quality guidance. Run canonical codegen if possible; an unset deployment remains a reported prerequisite, not authority to configure/deploy.

Browser fixtures use actual components/CSS and synthetic local data at desktop and 320/375/390px, long names/options, empty/populated/pending/error, keyboard, menus/dialog dismissal, focus return, save/revert, stale subscriptions, repeated saves, failure and Back/Forward. Verify draft retention and no false success. Cover applicant roles, Account ownership, Discord setup states and builder draft/YAML/preview behavior. Lifecycle tests include event-local midnight, DST short/long days, timezone differences, legacy records, expired-option stale votes and future-date restoration. No external notifications or real user mutations.

## Compatibility and rollout

Source checkpoint/archive precede implementation. No destructive data operation is planned. Maintain existing deep links, notification/preference/unsubscribe routes and legacy records. Event global saves must not broaden Moderator controls or partially succeed while claiming a single successful save. Validate attachment/cover handling and retry receipts.

Local verification is authorized; authenticated shared-backend acceptance is not. Additive schema/functions require a matching explicitly approved nonproduction deployment before real acceptance. Never silently reuse shared test for rollout. No push: this continuation branch has checked-in deployment suppression, but project-level enforcement remains unverified. Before any future draft publication, independently verify CI/Vercel suppression and obtain scope approval. The earlier List release/testing/publication bundle remains separate and unanswered. New release-note summaries/package bumps require their own exact repository approval after final scope is concrete.

## Implementation checkpoint

The settled UI/lifecycle tracks are implemented locally. Event settings uses a root-mounted actor-scoped in-memory draft, unchanged-field normalization and an opaque hashed settings revision, with all configuration writes in one transaction. This includes persisted selected date/poll editing, permissions and supported built-in/custom add-on configuration; unchanged unknown add-ons are preserved. Cover uploads are retained for deliberate retry. Ownership consent, application decisions, and participation are workflows rather than configuration edits and retain their existing explicit operations.

Date option reconciliation preserves unchanged IDs and votes; changed/removed options require confirmation. Completion remains separate from expired-poll classification and exclusion cleanup. Group current-event selection and active shared-event lists now exclude expired polls using actual option records, without deleting or changing membership/discussion/votes. Never-dated/no-option Events retain undated eligibility. The user approved preserving existing stored timezones (including historical UTC). New creation accepts validated timezone and web/mobile supply the creator zone, while old clients default to UTC. Lifecycle calculation uses each Event’s stored zone; no old record is rewritten.

Independent security review found and resolved unchanged visibility blocking Moderator edits, reschedule-before-sharing ordering, and Discord disable incorrectly requiring fresh guild authorization. Global snapshot defaults preserve historical Friends admission. Browser evidence uses actual components with synthetic boundaries; no authenticated shared backend test occurred. Canonical Convex codegen was attempted and remains blocked by unset CONVEX_DEPLOYMENT. Local SDK OpenAPI generation completed for the updated timezone description; this does not configure or deploy Convex.

Reply/pin implementation is complete locally following the parent-relayed answers. Authors and moderators control replies; existing replies remain readable and editable under their prior permissions. Separate pinned queries keep at most three newest pins above Event/Group pagination and Poll blocks, without extra notifications. Revision checks, transactional capacity checks, actor-scoped acknowledgements, draft retention and late-response guards cover stale clients and route reuse. Native feeds consume pins and locks; management controls are web-only. Announcement sending/navigation is retired locally with safe legacy redirects; existing records/schema, read/status APIs, prior queues and direct preference links remain; callable new-send/retry paths reject and CLI sends fail clearly before credentials/network. No history UI or migration is included. No new Library screenshots were uploaded during this implementation phase; local before/after evidence is retained under artifacts/management-refinement. Final check counts and commit identity belong in the final handoff, not inferred from this checkpoint.

Final local post-update verification: 1,616 web tests, 1,387 backend tests, 470 shared tests, 664 mobile tests, 402 CLI tests, SDK suites, combined lint/types/format, 840 source/generated contracts and the final web build passed. Actual-component synthetic browser evidence covers 34 layouts and 49 assertions without overflow/page errors. Canonical Convex generation remains blocked by no selected deployment; authenticated deployed acceptance and native device verification remain unrun. No push, deployment, credential change, changeset or shared-data mutation occurred.
