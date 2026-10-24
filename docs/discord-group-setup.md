# Discord Group setup

Source behavior for the manager setup slice of [issue #405](https://github.com/groupi-app/groupi/issues/405). The connection is independent of the Event scheduled-event add-on.

## Setup contract

`groupDiscord.actions.configure` requires an authenticated current Group owner or moderator and fresh Discord Manage Server authority. Administrator and server-owner authority qualify. The server must contain the bot with View Audit Log and Create Instant Invite, plus Manage Roles in Role access mode or Kick Members and Ban Members in Server membership mode. Hierarchy still applies to administrators.

Role access is the default. Setup creates a dedicated role with zero permissions, no hoist and no mentionability, or deliberately adopts a non-managed ordinary-member role below the bot. Adopted roles use an allowlist of member permissions; unknown and staff permissions are rejected. An optional text landing channel must belong to the selected server. Setup changes no channel permissions or participant membership.

The authenticated manager query subscribes to `pending`, `active` or `blocked` configuration status. A transaction reserves the Group/server binding before role creation; activation checks role exclusivity again after creation. Server membership excludes all other Group connections, while Role connections can share a server with separate roles. Existing configurations cannot be silently overwritten. Known created role IDs survive rejected activation as `provisionedRoleId` for later operational resolution.

## Lifecycle and verification gates

`groupDiscordCleanup` has independent lifetime: its Group reference is a historical string, and each obligation carries server, mode, identity, role, generation, desired outcome, observed state and retry status. Group/configuration deletion must never cascade-delete owed removals. The table establishes persistence ownership; enrollment, revocation, cleanup workers, handback and setup recovery belong to the subsequent lifecycle slices. No membership effects are performed synchronously by setup.

Generation starts at one. Later reconfiguration must invalidate old grant authority and create a fresh generation before enrollment can resume. A process interruption after reservation remains visibly pending; a known setup failure remains blocked. Do not automatically repeat uncertain role creation. Discord provides no role-creation idempotency key, so a lost creation response requires staff resolution rather than pretending the external write failed.

This slice remains unreleased until enrollment, identity retirement, teardown, durable retry and moderation observation are complete. Deterministic authenticated tests cover setup authority, provider capability, safe role adoption/creation, concurrent binding and role-creation/adoption races. UI tests cover manager visibility, selection, consequences and status announcements. Real Discord and signed-in browser/device acceptance remain open gates; source tests do not establish them.
