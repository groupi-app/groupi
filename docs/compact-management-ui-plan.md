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

## Pending post-update decisions

The user proposes canonical Event/Group posts as the single update mechanism, existing personal notification preferences, composer reply disabling and manager pins at feed top. The separate announcement-workspace recommendation is superseded. Do not delete history, auto-convert/resend content, force email or reset opt-ins. Group message broadcast and Event email campaigns have different recipient/consent/history contracts; retiring their creation UI needs an explicit safe boundary.

Remaining material questions, with recommendations for the next concise round:

1. Authors choose/change reply availability; managers can close/reopen any post, with a manager-imposed closure not overridable by its author? Recommend yes; closure blocks new replies for everyone until reopened.
2. Existing replies remain readable with their current edit/delete rights when closed? Recommend yes; retain a stale rejected draft locally, no deletion/hiding.
3. Up to three pins per Event/Group, newest pinned first, no implicit cross-feed propagation, no new notification/mute override, explicit unpin at capacity? Recommend yes. Ensure pins top the actual feed, including the existing Poll block, without implying Poll pinning.
4. Stop new broadcast/email sends, preserve eligible-manager read-only history and old links, let already queued deliveries finish under existing eligibility/cancellation rules? Recommend yes; no resend or conversion. This retirement tradeoff is not yet approved.

Code facts: posts have exactly one canonical Event/Group parent; no lock/pin fields exist. Event Organizer/Moderator and Group Owner/Moderator already manage discussion. Person replies converge in `replies/writes.ts`, while Integration replies insert separately in `discussion/integrations.ts`; lock enforcement must cover both plus old native/REST clients. Group/native feeds paginate and Event web currently collects newest-first. Pins need bounded parent-scoped retrieval, stable chronological cursors and ID deduplication rather than sorting only loaded pages. Existing notification preferences, Event/post mute and DND remain; no Group-wide mute is promised.

No ADR or glossary definition is marked accepted for unresolved pin/retirement policy. Settled domain language must preserve Visibility versus Admission, Group versus Event roles, App connection versus Developer app/Bounded key, and Add-on template versus Event add-on.

## Implementation and verification

Work in independently owned tracks: Event global settings, lifecycle/date classification, Account/Developer, builder, Discord and application review. Integrate against combined source and preserve earlier Form/List/Poll work. Backend operations enforce authority inside transactions; shared hooks stay platform-independent. Use additive compatible fields if needed; no data migration or rewrite.

Targeted behavioral tests first, then combined types/lint/format/contracts/full relevant suites and final build. After TSX edits apply React quality guidance. Run canonical codegen if possible; an unset deployment remains a reported prerequisite, not authority to configure/deploy.

Browser fixtures use actual components/CSS and synthetic local data at desktop and 320/375/390px, long names/options, empty/populated/pending/error, keyboard, menus/dialog dismissal, focus return, save/revert, stale subscriptions, repeated saves, failure and Back/Forward. Verify draft retention and no false success. Cover applicant roles, Account ownership, Discord setup states and builder draft/YAML/preview behavior. Lifecycle tests include event-local midnight, DST short/long days, timezone differences, legacy records, expired-option stale votes and future-date restoration. No external notifications or real user mutations.

## Compatibility and rollout

Source checkpoint/archive precede implementation. No destructive data operation is planned. Maintain existing deep links, notification/preference/unsubscribe routes and legacy records. Event global saves must not broaden Moderator controls or partially succeed while claiming a single successful save. Validate attachment/cover handling and retry receipts.

Local verification is authorized; authenticated shared-backend acceptance is not. Additive schema/functions require a matching explicitly approved nonproduction deployment before real acceptance. Never silently reuse shared test for rollout. No push: this continuation branch has checked-in deployment suppression, but project-level enforcement remains unverified. Before any future draft publication, independently verify CI/Vercel suppression and obtain scope approval. The earlier List release/testing/publication bundle remains separate and unanswered. New release-note summaries/package bumps require their own exact repository approval after final scope is concrete.

## Implementation checkpoint

The settled UI/lifecycle tracks are implemented locally. Event settings uses a root-mounted actor-scoped in-memory draft, unchanged-field normalization and an opaque hashed settings revision, with all configuration writes in one transaction. This includes persisted selected date/poll editing, permissions and supported built-in/custom add-on configuration; unchanged unknown add-ons are preserved. Cover uploads are retained for deliberate retry. Ownership consent, application decisions, and participation are workflows rather than configuration edits and retain their existing explicit operations.

Date option reconciliation preserves unchanged IDs and votes; changed/removed options require confirmation. Completion remains separate from expired-poll classification and exclusion cleanup. Group current-event selection and active shared-event lists now exclude expired polls using actual option records, without deleting or changing membership/discussion/votes. Never-dated/no-option Events retain undated eligibility. Existing UTC records are not rewritten; the explicit question about historical-zone rollout remains pending. **Provisional pending the parent-relayed timezone answer:** new creation accepts validated timezone and web/mobile supply the creator zone, while old clients default to UTC. This local creation-default change must not be published or rolled out as an accepted decision before that answer. The approved lifecycle calculation itself uses each Event’s stored zone; no old record is rewritten.

Independent security review found and resolved unchanged visibility blocking Moderator edits, reschedule-before-sharing ordering, and Discord disable incorrectly requiring fresh guild authorization. Global snapshot defaults preserve historical Friends admission. Browser evidence uses actual components with synthetic boundaries; no authenticated shared backend test occurred. Canonical Convex codegen was attempted and remains blocked by unset CONVEX_DEPLOYMENT. Local SDK OpenAPI generation completed for the updated timezone description; this does not configure or deploy Convex.

No separate announcement sending UI or history was removed and no reply/pin feature was implemented while its questions remain pending. No new Library screenshots were uploaded during this implementation phase; local before/after evidence is retained under artifacts/management-refinement. Final check counts and commit identity belong in the final handoff, not inferred from this checkpoint.
