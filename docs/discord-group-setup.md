# Discord Group setup

Source behavior for manager setup and explicit member Role access in [issue #405](https://github.com/groupi-app/groupi/issues/405). The connection is independent of the Event scheduled-event add-on.

## Table of Contents

- [Setup contract](#setup-contract)
- [Lifecycle and verification gates](#lifecycle-and-verification-gates)
- [Explicit member Connect](#explicit-member-connect)

## Setup contract

`groupDiscord.actions.configure` requires an authenticated current Group owner or moderator and fresh Discord Manage Server authority. Administrator and server-owner authority qualify. The server must contain the bot with View Audit Log and Create Instant Invite, plus Manage Roles in Role access mode or Kick Members and Ban Members in Server membership mode. Hierarchy still applies to administrators.

Role access is the default. Setup creates a dedicated role with zero permissions, no hoist and no mentionability, or deliberately adopts a non-managed ordinary-member role below the bot. Adopted roles use an allowlist of member permissions; unknown and staff permissions are rejected. An optional text landing channel must belong to the selected server. Setup changes no channel permissions or participant membership.

The authenticated manager query subscribes to `pending`, `active` or `blocked` configuration status. A transaction reserves the Group/server binding before role creation; activation checks role exclusivity again after creation. Server membership excludes all other Group connections, while Role connections can share a server with separate roles. Existing configurations cannot be silently overwritten. Known created role IDs survive rejected activation as `provisionedRoleId` for later operational resolution.

## Lifecycle and verification gates

`groupDiscordCleanup` has independent lifetime: its Group reference is a historical string, and each obligation carries server, mode, identity, role, generation, desired outcome, observed state and retry status. Group/configuration deletion must never cascade-delete owed removals. The table establishes persistence ownership; enrollment, revocation, cleanup workers, handback and setup recovery belong to the subsequent lifecycle slices. No membership effects are performed synchronously by setup.

Generation starts at one. Later reconfiguration must invalidate old grant authority and create a fresh generation before enrollment can resume. A process interruption after reservation remains visibly pending; a known setup failure remains blocked. Do not automatically repeat uncertain role creation. Discord provides no role-creation idempotency key, so a lost creation response requires staff resolution rather than pretending the external write failed.

This slice remains unreleased until enrollment, identity retirement, teardown, durable retry and moderation observation are complete. Deterministic authenticated tests cover setup authority, provider capability, safe role adoption/creation, concurrent binding and role-creation/adoption races. UI tests cover manager visibility, selection, consequences and status announcements. Real Discord and signed-in browser/device acceptance remain open gates; source tests do not establish them.

## Explicit member Connect

The [#406](https://github.com/groupi-app/groupi/issues/406) Role access slice exposes authenticated `groupDiscord.enrollment.getStatus({groupId})` and `groupDiscord.connect.connect({groupId, consent: true})`. Status distinguishes linked identity from managed enrollment, includes current Group eligibility, safe Open Discord destination and last successfully observed screening/access time. Web and native Group pages display the linked Discord account ID before consent. Account linking alone and Group admission never trigger enrollment.

An existing guild member enrolls in place. An absent member must separately authorize `guilds.join`; Better Auth owns session, state, callback validation and credential storage. A narrowly scoped auth after-hook sets `prompt=consent` only for Discord account-link requests containing `guilds.join`, preserving ordinary sign-in behavior. The server validates actual OAuth application, granted scope, expiry and Discord identity immediately before joining. No OAuth credentials or bot tokens enter Group status or shared clients. Hosted callbacks return to the known Group page; delegated application initiation/return is a subsequent transport slice.

Connect checks current membership, required onboarding and Discord ban state. Joining omits optional roles and screening-bypass fields. Pending membership screening stays incomplete; the member opens Discord, completes its rules and explicitly checks access again. Grants affect only the dedicated ordinary-member role. Current bot capability and dedicated-role hierarchy are checked before assignment; a target's higher unrelated role does not itself prohibit managing the dedicated role. Server ownership and Administrator access are reported as independent external access, while the dedicated role remains managed. Other roles/channel overwrites may independently retain channel access.

Initial grant intents persist with enrollment and connection generations, desired access, attempt lease, retry due time and observed status. Bot-only scheduled work retries transient failures, honors provider retry delay, stops repeated permission failures and checks current eligibility/linked identity before and after provider writes. Duplicate jobs converge through targeted role PUT and observed membership. A stale or ambiguous successful grant records its immutable cleanup target before compensation. Cleanup obligations outlive the enrollment. A successful compensation records completion; uncertain or denied compensation remains pending for the later lifecycle workers.

This is not a production rollout. Ongoing moderation observation, audit ingestion, revocation/identity-retirement/handback, shared global rate-limit recovery and cleanup dispatch remain release gates in the subsequent lifecycle tickets. The initial-grant worker does not establish an atomic ordering with Discord staff actions or complete moderation history. Deterministic API/provider and hosted-auth tests establish the source contract; live Discord, signed-in browser/device and assistive-technology acceptance remain unverified.
