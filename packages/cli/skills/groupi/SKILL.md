---
name: groupi
description: Use the installed Groupi CLI to inspect and manage events, invitations, attendance, and other commands supported by that version, with explicit authentication and safe write recovery.
---

# Groupi CLI usage

Use Groupi through its public executable. This skill works in any compatible
agent that can read Markdown and run a terminal command; no client API, browser
automation tool, or agent-specific installer is required.

## Table of Contents

- [Installation and version](#installation-and-version)
- [Identity and credentials](#identity-and-credentials)
- [Command contract](#command-contract)
- [Safe mutations and recovery](#safe-mutations-and-recovery)
- [Private invite lists](#private-invite-lists)
- [Workflows and scope](#workflows-and-scope)

## Installation and version

Require Node 22 or 24. The package name is `@groupi/cli`; public registry
publication is a separate release gate. Until publication is verified, install a
trusted release tarball with `pnpm add -g /absolute/path/groupi-cli-<approved-version>.tgz`.
Maintainers can produce that artifact with `pnpm --filter @groupi/cli pack`.
After verified publication, `pnpm add -g @groupi/cli@<approved-version>` installs
the selected release. Check `groupi --version` and `groupi --help` before use.

Read [the generated reference](../../docs/command-reference.md) and
[workflow examples](../../docs/workflow-examples.md) shipped beside this skill.
They are generated from this package's Commander definitions and version. Use
`groupi <command> --help` to inspect live options. Do not assume a newer online
reference applies to an older binary. The distributed
`scripts/generate-reference.js --check` detects stale generated references without
network access or credentials. Copy this entire skill directory into a compatible
client's skill location if desired, and retain access to the installed package's
`docs` directory: relative reference links assume the distributed layout.

## Identity and credentials

The reserved `default` profile selects hosted Groupi. Every other server requires
an explicit named profile. Create profiles without credentials:

```sh
groupi profile add staging --api-url https://your-installation.example/api/v2 --web-url https://app.example.com
groupi --profile staging auth status --format json
```

`--profile` overrides `GROUPI_PROFILE`; unknown profiles fail without fallback.
Do not change a profile's endpoint or silently switch identity after a failure.
Profiles are immutable and contain URLs only. Authentication keys remain isolated
by profile and canonical server address.

Only an explicitly requested interactive `groupi --profile staging auth login`
starts browser authorization. It needs a terminal and saves its key in the OS
credential store, never plaintext. `--no-browser` displays the authorization URL
for manual opening. Ordinary commands and JSON/headless login never open a
browser. Renew expired credentials by explicit login. Use `auth status` to verify
the actual identity before mutations; it reports identity/source without the key.
`auth logout` removes that profile's saved credential; `--revoke` first revokes it
on the server. Logout leaves environment/stdin credentials untouched.

For automation, inject an existing key from the operator's secret manager as
`GROUPI_API_KEY`. Named profiles also require `GROUPI_API_KEY_PROFILE` to equal the
selected profile; an unscoped key belongs only to `default`. Never print secrets,
put them in arguments, URLs, chat, logs, scripts, or profile files, or persist
command output containing secrets. Do not ask the operator to paste a key into
chat. Use the host's secure interactive input or existing secret injection.

Alternatively pipe exactly one key from a secure source to
`groupi --profile staging --api-key-stdin events list --format json`. This explicitly
overrides environment credentials, consumes stdin through EOF, and does not save
the key. Credential precedence is stdin, profile-scoped environment, then OS store.
Never share stdin between credentials and content: use an environment/stored key
when passing post content or JSON through stdin. If secure storage is unavailable,
use temporary environment/stdin credentials instead of a plaintext fallback.

## Command contract

Always use `--format json` for automation. Success is one JSON document on stdout;
failure is `{ "error": { "code": "...", "message": "..." } }` on stderr with
nonzero status. Parse the streams separately; never treat stderr as a success
payload. JSON help/version return `{ "text": "..." }`. JSON and headless commands
never prompt: supply required arguments explicitly and handle missing input.

| Exit | Meaning                                                     |
| ---- | ----------------------------------------------------------- |
| 0    | Success                                                     |
| 1    | Unexpected internal failure                                 |
| 2    | Usage, validation, conflict, or cancelled confirmation      |
| 3    | Authentication, permission, or browser interaction required |
| 4    | Missing resource or API endpoint                            |
| 5    | Network, rate limit, unsupported server, or uncertain write |

Published command names, fields, and exits remain compatible within a major
version. Experimental commands must identify themselves explicitly; do not assume
they have that compatibility guarantee. Writes may reject older servers with
`UNSUPPORTED_SERVER`; update the server instead of bypassing capability checks.

Paginated lists default to 20 and accept `--limit 1..100`, `--cursor`, and `--all`.
Results are `{items, nextCursor}`. Continue while `nextCursor` is non-null, including
when `items` is empty. Cursors are opaque and scoped to identity/query; do not
reuse them across a different identity, event, or filter. `--all` deliberately
retrieves every remaining page and only reports success after completion.

## Safe mutations and recovery

First inspect the target, profile, actual identity, permissions, and relevant state.
Get the human's intent for destructive actions. Interactive destruction shows the
target and confirms; JSON/headless destruction requires `--yes`. That flag records
confirmation and never grants server permission. Dates and invitations may also
require confirmation when changing or clearing existing state.

Read retries are bounded. Event creation and invitation creation/sending support
server deduplication: generate `<Unix-milliseconds>.<UUID>` before a job, retain it
in the job's nonsecret state, and pass `--request-id`. Reuse the exact profile,
identity, operation, request ID, and original inputs for recovery. The server
rejects changed payloads with `IDEMPOTENCY_CONFLICT`; request IDs expire after
24 hours and return `IDEMPOTENCY_EXPIRED`. A new ID can create a duplicate.

Other writes, including edits, RSVP, acceptance, and deletion, are sent once.
`UNCERTAIN_OUTCOME` means a write may already have happened. Follow its inspection
command and read current state before deciding whether another mutation is needed.
Never equate a timeout with failure or automatically repeat an uncertain write.
After an expired deduplicated request, inspect the relevant list before deliberately
issuing a new ID. Check backend state and side effects where applicable; a queued
email is not proof of delivery. Treat invite tokens as bearer secrets, sharing only
with intended recipients and excluding tokens from agent transcripts/logs.

## Private invite lists

Use `invite-lists people --search <username>` to discover existing people without
an event, or `invite-lists people --friends` for accepted-friend choices. Search
requires at least two trimmed characters; friendship is optional. Choose intended
`personId` values from the result, then pass their JSON array to
`invite-lists create --name <name> --person-ids <json>`. Use `invite-lists list` and
`invite-lists get <list-id>` to inspect the selected identity's private lists.
Use `invite-lists edit <list-id> --name <name>` to rename, or `--person-ids <json>`
to replace the complete saved selection; at least one field is required. Ordinary
edits do not prompt. `invite-lists delete <list-id> --yes` deletes an owned list
after destructive confirmation and returns `{deleted:true,inviteListId}`. It
leaves existing invitations and event participation unchanged. Use `--format json`
throughout. The tested workflow includes discovery, creation, browsing, editing,
explicit event use, and deletion.

List names have 1–100 trimmed characters and are unique for their creator ignoring
case. Each creator can own 100 lists; creation requires 1–100 distinct existing
people and collapses duplicate identities. Lists contain people only. Saving
sends no invitations or notifications and changes no event access, membership,
role, or RSVP. Reads/discovery require `invite-lists:read`, creation requires
`invite-lists:write`; editing, deletion, and event use also require
`invite-lists:write`. Event use rechecks actual event invitation permission and
list ownership. Foundation commands require `inviteLists` version 1 or later;
management and protected use require version 2 or later with `retentionMs:86400000`.
Collection/discovery return `{items}` without cursors; detail resolves current
profile fields and includes `needsAttention` and available-person counts.

Deleted recipients have `available:false` and null `name`, `username`, and `image`;
never reconstruct deleted profile details from earlier output. `personCount`
includes saved unavailable entries, while `availablePersonCount` counts existing
people. An all-unavailable list retains its name with `needsAttention:true` and
text “Needs attention”; a fresh send is rejected until at least one existing person
is added. Discover a current person, then repair with
`invite-lists edit <list-id> --person-ids <json>`, replacing the saved selection.
Already saved unavailable IDs may remain alongside at least one existing person;
they remain anonymous, count toward the 100-person limit, and are skipped during
new sends. Ordinary creation/save cannot contain only unavailable people. Repair
does not invite anyone. Delete an unwanted list with the existing confirmed delete
command. Owner account deletion removes owned lists and denies the old identity.

Invite-list creation, editing, and deletion are sent once, without request-ID
replay support. After
`UNCERTAIN_OUTCOME`, inspect `invite-lists list` with the original profile before
deciding whether another creation is needed; after uncertain edits/deletion,
inspect the original list and profile before deciding on another write.

`invite-lists invite <list-id> --event <event-id>` explicitly sends the list's
current people in one request. Choose `--role ATTENDEE` (default) or `MODERATOR`
(organizers only), with optional `--message` of at most 480 characters. There is
a 100-distinct-recipient limit, and eligibility is rechecked at send time. The
JSON result contains `totalCount`, `sentCount`, `skippedCount`, per-person
`results`, `eventId`, and the retained `requestId`. A sent row includes `inviteId`;
a skipped row uses `ALREADY_MEMBER`, `INVITATION_PENDING`, or generic `UNAVAILABLE`.
Never infer confidential block or invitation-preference details from unavailability.
Zero sent recipients means no invitations were sent. Ordinary invitation
acceptance still controls participation; sending creates no membership or RSVP.

Retain a `<Unix-milliseconds>.<UUID v4>` identifier before the job and pass
`--request-id`. Protected replay uses the original recipients/result even after
list edits/deletion while checking current event authority. After uncertain
sending, inspect `invites members list <event-id>` on the original profile or
retry the exact original inputs and identifier within 24 hours. Never silently
generate a new identifier for recovery. Handle `IDEMPOTENCY_CONFLICT` and
`IDEMPOTENCY_EXPIRED` as described above; only a deliberate new send expands the
list's current selection again.
Recipient deletion also leaves protected replay's original historical outcome
intact. Replay needs no current-list lookup or repair; preserve the original
request ID and inputs rather than expanding changed people before recovery.

## Workflows and scope

Use [the tested planning workflow](../../docs/workflow-examples.md): organizer
creates an event and username invitation, the distinct intended attendee accepts
and RSVPs, and organizer inspects attendance. Bind separate profiles/credentials
to the two identities and verify each with `auth status`. Capture `eventId` from
creation and `inviteId` from sending; never substitute a bearer token for an ID.
The inspection workflow illustrates authenticated status, paging, event detail,
and own RSVP without writes. These examples are exercised against the installed
package using synthetic credentials and a local HTTP fixture; they are not proof
of staging authorization, delivery, or notification parity.

The initial `groups create|list|get|edit|delete` path manages formal communities.
Creation returns a stable `groupId`, admits the creator as the single owner and
creates no Event participation or friendship. Names may repeat; use IDs rather
than display names. `groups list` is paginated; use `--all` deliberately. Identity
writes require owner authority and the server's `groups` version 1 capability.
Deletion requires explicit confirmation and is independent of Events. After an
uncertain create, inspect `groups list --all` before repeating. `groups invite`
sends to an existing person's ID; `groups invites` gives owner-only status and
`groups members` gives an admitted member's private roster. `group-invites list`
is the current identity's inbox; only that recipient may accept or decline.
Invitation commands require `groupInvites` version 1. Group links and invitation
IDs are not admission credentials. Accepting grants Group membership without
friendship or Event participation. Use `groups invitation-policy --enabled` for
owner entry control and `settings privacy set --group-invites` for the independent
incoming preference. Preserve other privacy choices. Inspect status after an
uncertain write rather than automatically retrying. Applications and tools remain
unavailable.

The generated command tree is the authoritative implemented surface for this
version, including newly registered lifecycle, social, settings, and add-on
commands. Read each command's help before use. Do not infer features from a REST
route or from the parent roadmap. Discussion/media commands and the everyday TUI are implemented. Custom definition
authoring uses `addons definitions`; read [its portable format and limits](../../docs/addon-authoring.md)
before writing. Export a definition before replacing it, inspect its saved version,
and pass `--expected-version` with explicit confirmation for edits/lifecycle changes.
An uncertain creation must be inspected with `definitions list --all` before any
repeat import. Webhook authoring is unsupported; never strip unsupported fields
to make an imported document pass validation. Existing add-on configuration/use
is distinct from definition ownership.

Passkey setup, linked-account authorization, and account deletion are approved
browser/device exceptions. Use a documented explicit interactive account command
when available; headless use must return `BROWSER_INTERACTION_REQUIRED`. A handoff
is not completion: describe the remaining operator action. Platform administration
is outside the ordinary CLI scope. The release still requires staging workflows
with distinct identities and successful OS/runtime credential-store and package
verification; this skill does not claim those external checks have run.

Event ownership uses `events transfer offer|status|accept|decline|cancel`.
The Organizer offers to an eligible existing Event member; only that recipient
can accept. Pending is unresolved ownership. Acceptance makes the former
Organizer a Moderator, preserves membership/RSVP, and moves Friends visibility
to the new Organizer's friends. Inspect status after uncertain writes; do not
substitute ordinary role changes or repeat writes blindly. Named write commands
require confirmation and use `--yes` in headless mode.

Group moderation uses `groups member-role`, `remove-member`, `ban`, `lift-ban`,
`bans` and `leave`. Writes require the server's `groupModeration` version 1
capability and explicit confirmation. Only the owner appoints/demotes moderators
or edits policies; managers may remove or ban ordinary members. Demote a moderator
before removal/ban. The owner cannot leave with unresolved ownership. Removal
permits later entry, while ban blocks entry until lifted; lift does not admit.
Accepted invitation IDs cannot restore departed membership. These actions never
change independent Event authority or RSVP. Private ban pages expose no reasons
or contact details. Inspect membership/bans after uncertain writes before retrying.
