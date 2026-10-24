# Discord Group setup

Source behavior for manager setup and explicit member Role access in [issue #405](https://github.com/groupi-app/groupi/issues/405). The connection is independent of the Event scheduled-event add-on.

## Table of Contents

- [Setup contract](#setup-contract)
- [Lifecycle and verification gates](#lifecycle-and-verification-gates)
- [Explicit member Connect](#explicit-member-connect)
- [Role eligibility and moderation lifecycle](#role-eligibility-and-moderation-lifecycle)
- [Server membership lifecycle](#server-membership-lifecycle)

## Setup contract

`groupDiscord.actions.configure` requires an authenticated current Group owner or moderator and fresh Discord Manage Server authority. Administrator and server-owner authority qualify. The server must contain the bot with View Audit Log and Create Instant Invite, plus Manage Roles in Role access mode or Kick Members and Ban Members in Server membership mode. Hierarchy still applies to administrators.

Role access is the default. Setup creates a dedicated role with zero permissions, no hoist and no mentionability, or deliberately adopts a non-managed ordinary-member role below the bot. Adopted roles use an allowlist of member permissions; unknown and staff permissions are rejected. An optional text landing channel must belong to the selected server. Setup changes no channel permissions or participant membership.

The authenticated manager query subscribes to `pending`, `active` or `blocked` configuration status. A transaction reserves the Group/server binding before role creation; activation checks role exclusivity again after creation. Server membership excludes all other Group connections, while Role connections can share a server with separate roles. Existing configurations cannot be silently overwritten. Known created role IDs survive rejected activation as `provisionedRoleId` for later operational resolution.

## Lifecycle and verification gates

`groupDiscordCleanup` has independent lifetime: its Group reference is a historical string, and each obligation carries server, mode, identity, role, generation, desired outcome, observed state and retry status. Group/configuration deletion must never cascade-delete owed removals. The table establishes persistence ownership; enrollment and Role revocation/cleanup are implemented below, while handback and setup recovery remain subsequent lifecycle slices. No membership effects are performed synchronously by setup.

Generation starts at one. Later reconfiguration must invalidate old grant authority and create a fresh generation before enrollment can resume. A process interruption after reservation remains visibly pending; a known setup failure remains blocked. Do not automatically repeat uncertain role creation. Discord provides no role-creation idempotency key, so a lost creation response requires staff resolution rather than pretending the external write failed.

This slice remains unreleased until enrollment, identity retirement, teardown, durable retry and moderation observation are complete. Deterministic authenticated tests cover setup authority, provider capability, safe role adoption/creation, concurrent binding and role-creation/adoption races. UI tests cover manager visibility, selection, consequences and status announcements. Real Discord and signed-in browser/device acceptance remain open gates; source tests do not establish them.

## Explicit member Connect

The [#406](https://github.com/groupi-app/groupi/issues/406) Role access slice exposes authenticated `groupDiscord.enrollment.getStatus({groupId})` and `groupDiscord.connect.connect({groupId, consent: true})`. Status distinguishes linked identity from managed enrollment, includes current Group eligibility, safe Open Discord destination and last successfully observed screening/access time. Web and native Group pages display the linked Discord account ID before consent. Account linking alone and Group admission never trigger enrollment.

An existing guild member enrolls in place. An absent member must separately authorize `guilds.join`; Better Auth owns session, state, callback validation and credential storage. A narrowly scoped auth after-hook sets `prompt=consent` only for Discord account-link requests containing `guilds.join`, preserving ordinary sign-in behavior. The server validates actual OAuth application, granted scope, expiry and Discord identity immediately before joining. No OAuth credentials or bot tokens enter Group status or shared clients. Hosted callbacks return to the known Group page; delegated application initiation/return is a subsequent transport slice.

Connect checks current membership, required onboarding and Discord ban state. Joining omits optional roles and screening-bypass fields. Pending membership screening stays incomplete; the member opens Discord, completes its rules and explicitly checks access again. Grants affect only the dedicated ordinary-member role. Current bot capability and dedicated-role hierarchy are checked before assignment; a target's higher unrelated role does not itself prohibit managing the dedicated role. Server ownership and Administrator access are reported as independent external access, while the dedicated role remains managed. Other roles/channel overwrites may independently retain channel access.

Initial grant intents persist with enrollment and connection generations, desired access, attempt lease, retry due time and observed status. Bot-only scheduled work retries transient failures, honors provider retry delay, stops repeated permission failures and checks current eligibility/linked identity before and after provider writes. Duplicate jobs converge through targeted role PUT and observed membership. A stale or ambiguous successful grant records its immutable cleanup target before compensation. Cleanup obligations outlive the enrollment. A successful compensation records completion; uncertain or denied compensation remains pending for the later lifecycle workers.

This is not a production rollout. Ongoing moderation observation, audit ingestion, revocation/identity-retirement/handback, shared global rate-limit recovery and cleanup dispatch remain release gates in the subsequent lifecycle tickets. The initial-grant worker does not establish an atomic ordering with Discord staff actions or complete moderation history. Deterministic API/provider and hosted-auth tests establish the source contract; live Discord, signed-in browser/device and assistive-technology acceptance remain unverified.

## Role eligibility and moderation lifecycle

The [#407](https://github.com/groupi-app/groupi/issues/407) source slice invalidates Role enrollment inside the owning Group leave, removal, ban and coordinated-exclusion transactions. Required questionnaire reconfiguration schedules a paginated eligibility pass, including members who previously completed onboarding. Each invalidation snapshots the exact server, identity, dedicated role and generations before fencing old grants. Completing onboarding or returning to a Group requires another explicit Connect. Server-owner or Administrator exceptions describe independent access; they never exempt the dedicated role from cleanup.

One shared `groupDiscord.reconcile` dispatcher runs every minute. Each tick claims at most 25 due cleanup/observation records, prioritizing cleanup, and checks enrolled identities rather than scanning Discord population. Role cleanup uses only the dedicated member-role DELETE and confirms absence through a targeted member read. It never kicks, bans, replaces the role array or changes unrelated roles. Permission failures, rate limits and uncertain observations remain visible and retryable. Independent cleanup records continue after configuration or Group deletion. Retained handed-back enrollments are excluded from observation.

Moderation observation combines targeted state reads with persisted guild/action audit cursors for kicks, bans and role changes. Forward and ten-minute overlap passes each read at most one 100-entry page per action per invocation. A full page persists its cursor and blocks grants until a later pass catches up. Entry deduplication and enrollment start times keep duplicate/old moderation from authorizing automatic restoration or invalidating newer consent. External removal followed by restoration between snapshots still invalidates the managed enrollment when its audit entry is observed. While an enrollment is still managed and Group-ineligible, restored dedicated-role access is removed again; eligible staff-restored access is left for staff and requires fresh Connect before managed enrollment resumes.

The normal observation target is five minutes; backlog or outages can delay it. Member status exposes last successful observation, observation failures and pending cleanup. Snapshot and audit processing do not provide atomic ordering with Discord staff changes. Discord audit publication has no documented delay bound, and the bounded overlap does not prove complete history. Shared global throttling, retained-history coverage-gap recovery, deeper overlap sweeps and preference-aware manager notifications remain #411 work on this same reconciler. Identity retirement and warned teardown remain #409–#410. No rollout is authorized before #409–#411 and controlled nonproduction Discord/browser/device acceptance are complete.

## Server membership lifecycle

The [#408](https://github.com/groupi-app/groupi/issues/408) source slice enables Server membership through the same authenticated Connect, enrollment, immutable cleanup, audit and snapshot dispatcher used by Role access. Setup reserves the guild against every other Group connection. It never enumerates or purges the guild population. Existing members explicitly enroll in place; absent members separately authorize `guilds.join`. Membership screening remains incomplete until Discord rules are completed and access is checked again. Web and mobile consent explain server removal, Group-ban consequences and fresh Connect requirements.

Ordinary leave/removal and newly incomplete required onboarding owe a kick. Group bans and coordinated exclusion owe a Discord ban, including a participant already absent from the guild. Later Groupi reinstatement does not remove a Discord ban. Discord staff bans independently block Connect without changing Group membership, and a staff kick requires fresh eligible, unbanned Connect. Role mode continues to remove only its dedicated role and never kicks or bans.

Connect records known server-owner and unremovable hierarchy exceptions explicitly as externally managed membership. Later permission loss or hierarchy changes do not create new exceptions: owed removals stay pending with actionable manager/member status and retry after recovery. Role comparisons account for equal positions using Discord's snowflake ordering, with the older ID higher; see the [Discord role contract](https://docs.discord.com/developers/topics/permissions#role-object) and [Discord.js position implementation](https://github.com/discordjs/discord.js/blob/main/packages/discord.js/src/structures/Role.js). No test removal is used to probe capability.

The shared dispatcher verifies kick absence through the exact member endpoint and bans through the exact ban endpoint. Unknown ban (`10026`) means unbanned; unknown guild or unavailable permissions never prove absence. Ban escalation remains owed across kick completion, and restored ineligible membership is removed again within the managed scope. Late joined membership after grant authority changes snapshots the old identity/generations and uses that same cleanup dispatcher for compensation. Cleanup survives configuration/Group deletion, and pending old cleanup fences new enrollment.

This remains a source integration slice. Identity retirement (#409), warned teardown (#410), shared recovery/notifications/audit-gap work (#411), and controlled nonproduction Discord/browser/device acceptance remain release gates. No deployed runtime, live guild mutation or production rollout was performed for this slice.

## Discord identity retirement

Unlinking Discord through Groupi account settings or Better Auth's authenticated
unlink endpoint captures the old managed targets and invalidates grant authority
before deleting credentials. A successful explicit Discord link selects one managed Discord identity while
preserving older login accounts and other providers. Replacement callbacks retire
old managed access before selecting the replacement. Explicit unlink removes only
the requested login account. Replayed or racing callbacks cannot restore old enrollment authority.

Cleanup uses the existing bot-only dispatcher and immutable guild, identity,
mode and dedicated-role targets. It retains no member OAuth tokens. Replacement
Connect waits for every pending or blocked cleanup obligation for the person,
including obligations in another Group or mode. Cleanup failures remain visible
in linked-account settings and Group status; Groupi retries automatically after
bot permissions or provider availability recover. Ask the Group manager to
resolve persistent bot access or hierarchy failures. Known externally managed
Server membership stays an explicit exception; Role independent-access warnings
do not exempt the dedicated role from removal.

Account deletion uses Groupi's ownership-resolution boundary and preserves owed
cleanup after the Person and credentials are deleted. Better Auth self-deletion
remains disabled. Its raw admin removal endpoint is rejected with a direction to
Groupi account resolution because the upstream cascade deletes credentials before
Groupi can enforce ownership safeguards. No repository caller uses that endpoint.
These source checks do not establish controlled Discord/browser/device acceptance.
