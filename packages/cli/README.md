# Groupi CLI

Development milestones [#222](https://github.com/groupi-app/groupi/issues/222),
[#223](https://github.com/groupi-app/groupi/issues/223),
[#224](https://github.com/groupi-app/groupi/issues/224),
[#225](https://github.com/groupi-app/groupi/issues/225), and
[#226](https://github.com/groupi-app/groupi/issues/226). The package can be packed
and installed locally; public registry publication belongs to #228. Supports Node 22 and 24 on macOS, Windows, and Linux.
Runtime files are plain JavaScript checked by TypeScript, so installation needs no
compiler, Expo, or Next.js runtime. The optional terminal interface uses Ink and
React, loaded when the interface opens.

Run `groupi tui --profile <name>` for keyboard-driven planning, discussions,
friends and notifications. A bare `groupi` also opens it in an interactive
terminal. See the [terminal guide](./docs/terminal.md) for keyboard controls,
confirmations, refresh behavior and advanced-command fallbacks. Piped/JSON calls
never open the interface; `--non-interactive` explicitly disables implicit launch.

## Agent guidance and command reference

The package ships a portable [agent usage skill](./skills/groupi/SKILL.md),
[generated versioned command reference](./docs/command-reference.md), and
[tested workflow examples](./docs/workflow-examples.md). These files travel with
the executable, including commands added after the initial browsing milestone.
Use `groupi --version` and per-command `--help` to check your installed surface.

Maintainers regenerate with `pnpm --filter @groupi/cli docs:generate` and verify
with `pnpm --filter @groupi/cli docs:check`. Packing rejects stale references.
Installed-package tests execute the same planning and inspection example arguments
with synthetic credentials, isolated organizer/attendee profiles, and a local HTTP
fixture; no real credentials are recorded. This verifies public instructions and
streams, while staging, live agent-client integration, and platform credential-store
checks require separate release evidence.

## Authentication

```sh
groupi auth login
groupi auth status --format json
groupi auth logout
groupi auth logout --revoke
```

Login is explicit and requires an interactive terminal. The browser shows the
account being authorized and returns a short-lived, single-use authorization
code bound to that CLI session using PKCE. Success appears only after the CLI
exchanges the code and saves the credential. Keys never enter browser URLs.
`--no-browser` displays the URL for manual opening; `--timeout` accepts 10–300
seconds (default 300). Cancellation or failure closes the loopback listener.

Saved keys use macOS Keychain, Windows Credential Manager, or Linux Secret Service.
Linux needs an unlocked Secret Service on the session bus. There is no plaintext
fallback; unavailable stores give temporary environment/stdin key instructions.
Keys are isolated by profile name and canonical API endpoint. A fresh login
replaces only that profile's saved key; previous server keys remain valid until
revoked in browser API-key settings. CLI keys expire after 90 days and permit
120 requests per minute. Expiry requires another explicit login.

`auth status` verifies the active key with the selected server and returns
`{profile, apiUrl, source, account: {id, name, email}, expiresAt?}`. It never shows
the key. `auth logout` deletes only the selected saved credential and does not
revoke the server key. `--revoke` revokes that saved key first; a failed revocation
keeps the local record so you can retry or revoke through browser settings.
Environment/stdin credentials are unaffected by logout. JSON/headless login
fails with `BROWSER_INTERACTION_REQUIRED` instead of opening a browser or waiting.

Credential precedence is explicit stdin, then the profile-scoped environment key,
then the OS store. A mismatched environment key fails rather than falling back.
Login storage failures attempt server revocation; `AUTH_CLEANUP_REQUIRED` means
cleanup could not be confirmed and you should inspect browser API-key settings.
Network-interrupted exchanges are never retried automatically; inspect browser
API-key settings for a possibly issued key before restarting login.

## Read events

Supply an existing API key through `GROUPI_API_KEY` in your environment, then run:

```sh
groupi events list
groupi events list --format json --limit 20
groupi events list --format json --cursor '<opaque cursor>'
groupi events list --format json --all
groupi events get <event-id> --format json
```

Alternatively pipe exactly one key from a secure credential source to
`groupi --api-key-stdin events list`. The flag explicitly takes precedence over
environment credentials, consumes stdin through EOF, and never saves the key.
Do not use this input channel simultaneously for content. Keys never belong in
command-line arguments or profile files. Expired/invalid keys require explicitly
obtaining a new key; ordinary commands never open a browser.

The reserved `default` profile uses hosted Groupi at
`https://trustworthy-warthog-524.convex.site/api/v2`.
For another installation, create and explicitly select a named profile:

```sh
groupi profile add staging --api-url https://your-installation.example/api/v2 --web-url https://app.example.com
groupi --profile staging --api-key-stdin events list --format json
```

Environment-key use on that profile additionally requires
`GROUPI_API_KEY_PROFILE=staging`. An unscoped environment key is bound to `default`;
selecting another server never silently reuses it. `--profile` overrides
`GROUPI_PROFILE`, which otherwise defaults to `default`. Unknown profiles fail.
Profile names cannot be overwritten: use a new name when changing a server.
Profiles contain only API and optional authorization website URLs, in `~/.config/groupi` (or `GROUPI_CONFIG_DIR`).
HTTPS is required except literal loopback development URLs such as
`http://127.0.0.1:3211/api/v2`. URLs cannot contain credentials, query or fragment.
Authenticated redirects are always refused, including same-host redirects.
The hosted authorization website is `https://www.groupi.gg`. Named profiles need
an explicit `--web-url`; existing profiles can pass it to `auth login` for that
invocation. The authorization website must be an origin without a path. It is
never inferred from a REST hostname.

## Create and edit events

```sh
groupi events create --title "Dinner" --description "Bring snacks" --location "Cafe" --format json
groupi events create --title "Dinner" --start "2027-03-05T18:00:00-05:00" --end "2027-03-05T20:00:00-05:00"
groupi events create --title "Choose a date" --date-options '[{"start":"2027-03-05T18:00:00Z","note":"Early option"}]'
groupi events edit <event-id> --title "Updated dinner" --description "" --format json
groupi events edit <event-id> --date-options '[{"start":"2027-03-06T18:00:00Z"}]' --yes --format json
```

`create` requires a nonempty `--title`. Basic fields are `--description` and
`--location`; an empty string clears either field during an edit. Titles,
descriptions, and locations allow at most 200, 5,000, and 500 trimmed characters.
An edit needs at least one change. Basic edits permit organizers and moderators.

Supply either a fixed `--start`/`--end` or `--date-options`, a JSON array of
`{start, end?, note?}` objects. Dates use ISO strings with seconds and an explicit
UTC offset or `Z`; ambiguous local times and invalid calendar dates are rejected.
Offsets are converted to UTC, matching the apps; there is no independent event
time-zone override. End times must follow their start; notes allow 200 characters.
The server also enforces app scheduling rules, including future creation dates.

Replacing proposed dates requires organizer permission. It deletes the previous
options and availability, creates the new options and organizer responses, and
notifies members. Interactive mode identifies the event, profile, and server and
asks for confirmation; JSON/headless mode requires `--yes`. Declining, Ctrl-C,
or closing the prompt sends no write. An empty array clears the proposed dates.
An event with a confirmed date must first have that date explicitly reset with
`events dates reset <event-id> --yes` (or in the app). Visibility/permissions, media,
and general add-on configuration are later CLI milestones.

Both write commands check the server's advertised `eventWrites` version before
submitting. Creation additionally requires version 1 replay protection with a
24-hour window. An older server fails with `UNSUPPORTED_SERVER` instead of
silently ignoring fields or creating duplicate events.

### Creation recovery

A creation returns `{eventId, membershipId, requestId}`. The CLI generates a
request ID in `<Unix-milliseconds>.<UUID-v4>` form and sends it as
`Idempotency-Key`. `--request-id` lets you repeat an attempt with the exact same
inputs. For jobs that may be terminated before they return output, generate and
retain the identifier before running the command:

```sh
REQUEST_ID=$(node -e 'console.log(Date.now()+"."+require("node:crypto").randomUUID())')
groupi events create --title "Dinner" --request-id "$REQUEST_ID" --format json
```

The server binds the identifier to the authenticated identity, operation, and
canonical request payload. Concurrent submissions and replay return the original
event and organizer membership; event writes and replay records commit together.
Different inputs with the same identifier return `IDEMPOTENCY_CONFLICT`. Keep the
same selected profile, account, request ID, and inputs when recovering.

Identifiers expire 24 hours after their embedded timestamp (with at most five
minutes of future clock skew accepted). Expired identifiers return
`IDEMPOTENCY_EXPIRED` even after replay-record cleanup; they never create a fresh
event. Cleanup is scheduled after expiry. Inspect existing events before
intentionally creating again with a new identifier. REST callers that omit the
header retain non-deduplicated legacy behavior; the CLI always supplies it.

Creation uses at most three identical attempts for connection failures,
unreadable successful responses, HTTP 5xx, or short HTTP 429 delays. Each attempt
has a 10-second timeout; retry delays never exceed two seconds, and longer
`Retry-After` values are respected by returning an error. Redirects are refused.
An unresolved write returns `UNCERTAIN_OUTCOME` with the request identifier and
inspection/replay instructions. It never claims that a lost response means no
event was created.

Edits return the updated event document, including proposed date options with
millisecond timestamps. Edits are sent once because notifications and scheduling
side effects are not safely replayable. A lost, malformed, redirected, or server-
failed edit returns `UNCERTAIN_OUTCOME` and an `events get <id> --profile <name>`
inspection command. Read the event before deciding whether another edit is
needed; do not blindly repeat it.

## Invitations

Three explicit groups distinguish bearer invitations from recipient-bound username
invitations. All commands use the selected profile and the same authentication,
JSON output, and exit-code rules as events.

```sh
# Shareable links and email bearer invitations
groupi invites links create <event-id> --name "Friends" --uses 10 --format json
groupi invites links list <event-id> --kind all --limit 20 --format json
groupi invites links get <token> --format json
groupi invites links accept <token> --format json
groupi invites links edit <invite-id> --uses 5 --expires "2027-03-01T00:00:00Z" --yes
groupi invites links edit <invite-id> --unlimited --no-expiry --yes
groupi invites links revoke <invite-id> --yes

# Email batches (queued delivery, or create pending invitations with --no-send)
groupi invites email send <event-id> --invites '[{"email":"guest@example.com","recipientName":"Guest","plusOnes":1}]' --message "Join us" --format json
groupi invites email send <event-id> --invites '[{"email":"guest@example.com"}]' --no-send
groupi invites email send-pending <event-id> --format json

# Username invitations: only the intended recipient can accept or decline
groupi invites members send <event-id> --username guest --role ATTENDEE --message "Join us"
groupi invites members list --format json
groupi invites members list <event-id> --status all --all --format json
groupi invites members get <invite-id> --format json
groupi invites members accept <invite-id> --format json
groupi invites members decline <invite-id> --yes
groupi invites members revoke <invite-id> --yes
```

`links list` includes email bearer invitations by default; `--kind link`, `email`,
or `all` filters it. `members list` without an event lists the current identity's
received invitations, defaulting to `PENDING`. With an event ID it lists that
accessible event's invitations, defaulting to all statuses. Its `--status` accepts
`PENDING`, `ACCEPTED`, `DECLINED`, or `all`. Both lists support `--limit 1..100`,
`--cursor`, and `--all`, returning `{items, nextCursor}` (default page size 20).
An empty page can still contain a cursor. Cursors cannot be reused across another
identity, event, invitation kind, or filter.

Link/email invitations are bearer credentials: anyone possessing a valid token
can accept under the app's rules. Email addresses describe delivery and do not
bind acceptance to that account; plus-ones increase the permitted uses. There is
no bearer invitation decline operation. Treat returned tokens and list output as
private, and share only with intended guests. `get`/`accept` require the token,
while `edit`/`revoke` require the invitation ID. Username invitations are instead
bound to their recipient; member revocation cancels the sent invitation.

All link edits, link revocation, member decline, and member revocation display the
target, profile, and server and ask for confirmation interactively. JSON/headless
mode requires `--yes`. Server permissions still apply: CLI confirmation never
grants permission to create, manage, or respond to an invitation. Acceptance uses
the app's membership, notification, expiry, usage, and blocked-relationship rules.

Names allow 200 characters. Link `--uses` accepts 1–10,000; omit it for no limit.
Expiry must be a valid future ISO timestamp with seconds and an explicit offset
or `Z`; `--no-expiry` removes it during editing. Email batches contain 1–100
`{email, recipientName?, plusOnes?}` objects; plus-ones accept 0–99. `--message`
allows 480 characters. Member roles are `ATTENDEE` or `MODERATOR`; usernames are
trimmed, normalized to lowercase, and may include a leading `@`.

Creation and send commands, including `email send-pending`, always send a reusable
request ID and accept `--request-id`. They require `inviteWrites` version 1 with
24-hour retention, binding replay to the identity, operation, and original payload.
Keep the same profile, identity, identifier, and inputs after a lost response.
Within retention, an explicit original request ID can replay even after the
invitation's own expiry. A new expired invitation still fails server validation.
Expired request IDs cannot be replayed: inspect the applicable invitation list
before deliberately starting again with a new ID. Ordinary edits, accept, decline,
and revoke are sent once; an uncertain result explains how to inspect before
repeating. Raw server errors and bearer tokens are excluded from diagnostics.

JSON creation results are `{id, token, requestId}` for links,
`{createdCount, inviteIds, queuedCount, requestId}` for email batches, and
`{inviteId, status, requestId}` for usernames. Sending pending emails returns
`{queuedCount, requestId}`. By default, an email batch queues both the new invitations and any existing
pending email invitations for that event, matching the app; `queuedCount` can
therefore exceed `createdCount`. `--no-send` creates the batch without queuing any
new or existing pending invitations. Queued means scheduled for sending, never
confirmed delivery. Both acceptance commands return `{eventId, membershipId}`. A link edit
returns the updated bearer summary; link revocation returns `{id, revoked:true}`;
member decline/revocation returns `{success:true}`. Read results contain only the
following fields; unrelated server fields are discarded:

- Bearer summaries: `id`, `eventId`, `token`, `name`, `maxUses`, `usesTotal`,
  `usesRemaining`, `expiresAt`, `createdAt`, `kind`, `email`, `recipientName`,
  `customMessage`, and `emailStatus` (`pending`, `queued`, or `null`).
- Token inspection: `id`, `eventId`, `eventTitle`, `eventDescription`,
  `eventLocation`, `name`, `expired`, and `maxUsesReached`.
- Member summaries: `inviteId`, `eventId`, `eventTitle`, `inviterId`, `inviteeId`,
  `role`, `status`, `message`, `createdAt`, and `respondedAt`.

Missing optional values are `null`; timestamps are Unix milliseconds.

For restricted API keys, event-nested invitation creation/listing and email sends
need the appropriate `events:read`/`events:write` grants. Token lookup/acceptance
and bearer management additionally use `invites:read`/`invites:write`; received
username invitations and member responses use
`member-invites:read`/`member-invites:write`. Event grants alone do not cover these
other resources. Every grant is further limited by the caller's app permissions.

## RSVP, availability, and attendance

```sh
groupi events rsvp get <event-id> --format json
groupi events rsvp set <event-id> --status YES --note "Bringing snacks" --format json
groupi events members <event-id> --all --format json
groupi events dates list <event-id> --format json
groupi events availability get <event-id> --all --format json
groupi events availability set <event-id> --responses '[{"potentialDateTimeId":"<option-id>","status":"YES","note":"Can bring food"}]'
groupi events availability responses <event-id> --option <option-id> --all --format json
groupi events availability clear <event-id> --yes
groupi events dates choose <event-id> --option <option-id> --yes
groupi events dates choose <event-id> --start "2029-03-05T18:00:00-05:00" --end "2029-03-05T20:00:00-05:00" --yes
groupi events dates reset <event-id> --yes
```

RSVP applies to the selected identity's event membership. `--status` accepts `YES`,
`MAYBE`, `NO`, or `PENDING`. RSVP and availability notes allow 200 characters.
An omitted or empty RSVP `--note` clears the previous note, matching the app.
`rsvp get` and `set` return `{membershipId, rsvpStatus, rsvpNote}`.

Availability submissions contain unique `potentialDateTimeId` values with a
`YES`, `MAYBE`, or `NO` status and optional `note`. `PENDING` is a read state for
missing responses, not a submission status. An omitted/empty note clears the
submitted option's previous note. Options omitted from a submission are unchanged;
an empty array is the app-supported no-op. Use `availability clear` to remove all
of your responses for the event. Submission returns `{created, updated}`; clearing
returns `{deletedCount, membershipId}` and leaves your RSVP status and note
unchanged. Notes and counts never imply permission
to see another participant's response.

`members`, `dates list`, `availability get`, and `availability responses` use
`--limit 1..100` (default 20), `--cursor`, and `--all`. Every list returns
`{items, nextCursor}`; continue until `nextCursor` is `null`, even after an empty
page. Attendance and per-option member responses obey the event's member-list
permissions. Own availability remains available to an event member even when
other members' responses are restricted. Cross-event date IDs are rejected by
the server. The returned fields are:

- Members: `id`, `personId`, `role`, `rsvpStatus`, `rsvpNote`, `joinedAt`, `user`.
- Proposed dates: `id`, `dateTime`, `endDateTime`, `note`.
- Own availability: `potentialDateTime` (a proposed date), `status`, `note`,
  `availabilityId`; missing responses have `PENDING` status and null ID/note.
- Per-option responses: `membershipId`, `personId`, `user`, `status`, `note`;
  members with no response appear as `PENDING`.

User summaries contain `id`, `name`, `email`, `image`, and `username`; deleted users
are represented as `null`. Optional data is `null`, timestamps are Unix
milliseconds, and unrelated server fields are omitted from CLI output.

Only organizers can choose or reset an event date. Choose either an existing
poll option with `--option`, or a manual future `--start` with optional `--end`.
Manual dates require seconds and an explicit UTC offset or `Z`; the end must
follow the start. Omitting `--end` removes a previously chosen end. The server
resolves poll option membership atomically. Poll selection copies each member's
availability status to their RSVP (missing response becomes `PENDING`) and leaves
RSVP notes unchanged. Manual selection preserves all RSVP statuses and notes.
Reset removes the chosen start/end and cancels scheduled reminders while retaining
RSVPs, proposed dates, availability, and their notes. These operations send the
app's date notifications. Date choose/reset return the updated
REST event detail, including proposed options and chosen timestamps.

Clearing availability, choosing a date, and resetting a date show the event,
profile, and server and require confirmation. JSON/headless mode requires `--yes`.
All attendance writes require `attendanceWrites` version 1. They are sent once,
including RSVP and repeated reset requests, because the app's notifications and
other side effects must not be duplicated automatically. An ambiguous outcome
returns `UNCERTAIN_OUTCOME` and an inspection command. Read the current RSVP,
availability, or event before deciding whether another write is necessary.
Restricted keys need `events:read` for these reads and `events:write` for writes;
those grants never override event membership or role permissions.

## Output contract

Human-readable output is the default. `--format json` emits one success document
on stdout or `{ "error": { "code": "...", "message": "..." } }` on stderr.
Help/version in JSON mode use `{ "text": "..." }`. JSON errors and missing inputs
never prompt. Event lists return `{ "items": [...], "nextCursor": "..." }`, with
`null` indicating completion. An empty page can still have a continuation cursor.
Default page size is 20; `--limit` accepts 1–100. `--all` follows cursors from the
requested starting page and reports success only after full retrieval.
Event detail returns the REST v2 event document directly.

| Exit | Meaning                                                       |
| ---- | ------------------------------------------------------------- |
| 0    | Success                                                       |
| 1    | Unexpected internal failure                                   |
| 2    | Usage, validation, conflict, or cancelled confirmation        |
| 3    | Authentication or permission error                            |
| 4    | Resource or API endpoint not found                            |
| 5    | Network, rate limit, unsupported server, or uncertain outcome |

Read requests have a 10-second attempt timeout and at most three attempts for
network failures, HTTP 429, 502, 503, or 504. Retry delays are bounded to two
seconds; a longer server `Retry-After` returns an actionable failure immediately
instead of retrying before the server allows. Other HTTP failures are not retried. Raw server error bodies are never
echoed, preventing reflected credentials from entering diagnostics.
Authentication exchanges and revocations have a 10-second network timeout and
are never retried. The interactive TUI remains a later milestone.

Command names, JSON fields, and exit codes are stable within a major version;
breaking changes require a major release and migration notes. Experimental
commands will be explicitly identified; the commands above are not experimental.

## Verification

`pnpm --filter @groupi/cli test:run` tests the executable's public behavior using a
local HTTP fixture. `test:package` packs and installs the archive in a temporary
directory, verifies its executable and contents, and reruns the same tests against
the installed binary. Backend real-router tests separately establish authentication,
authorization, and cursor behavior. CI runs package checks on Node 22/24 across
all three supported operating systems; a workflow definition alone is not evidence
of a successful matrix run. See the repository's CLI capability checklist for
current release evidence and remaining work.

Native credential-store smoke checks run against the actual OS provider on all
three platforms in CI, including an unavailable Linux session bus. Deterministic
CLI callback tests substitute only the external native binding; they do not
establish OS integration on their own. The native store smoke script can be run
with `node packages/cli/scripts/test-credential-store.js` from the repository root.

### Notifications and discussion subscriptions

```sh
groupi notifications list --unread --limit 20
groupi notifications list --cursor '<nextCursor>'
groupi notifications list --all --format json
groupi notifications count
groupi notifications read <notification-id>
groupi notifications unread <notification-id>
groupi notifications read-all
groupi notifications read-event <event-id>
groupi notifications read-post <post-id>
groupi notifications clear <notification-id> --yes
groupi notifications clear-all --yes
groupi events mute <event-id>
groupi events unmute <event-id>
groupi events mute-status <event-id>
groupi posts mute <post-id>
groupi posts unmute <post-id>
groupi posts mute-status <post-id>
```

Notification lists default to 20 newest items, with `--limit` from 1–100.
JSON is `{items,nextCursor}`; each item contains `id`, `type`, `read`,
`createdAt`, and nullable `event`, `post`, and `author` references. Continue
until `nextCursor` is null, including after an empty page. A cursor belongs
to its account and unread-filter setting; preserve `--unread` when continuing
an unread list. `--all` deliberately collects all pages and stops on repeated
cursors. Counts return `{count}`; writes return `{success:true}`, with `count`
for event/post-scoped read actions.

Clearing permanently removes your notification records and their queued push
work. Interactive clearing displays the target and asks for confirmation;
JSON/headless clearing requires `--yes`. Read/unread and mute changes do not
prompt. These writes are sent once. If a response is lost or incomplete, the
CLI reports `UNCERTAIN_OUTCOME`: inspect `notifications list --all` or the
appropriate `mute-status` before deciding whether to repeat the action.
Already-unmuted targets retain the existing API's not-found response.

Mute status returns `{isMuted,effectiveMuted}` for an event and additionally
`eventMuted` for a discussion. A discussion can remain effectively muted by
its parent event after its own mute is removed. Muting and status require
current event membership. Muted-list details are hidden after membership is
lost. Historical notifications belong to their recipient and retain the app's
existing related-item references, including invitations received before
joining an event. Clear and read actions only affect the selected identity.

These commands require the server health capability
`notificationControls: {version:1}`. Older servers are rejected before the
operation so unsupported pagination or controls cannot silently appear to work.
Existing REST clients retain the unpaginated array without `pagination=cursor`,
and REST v1 keeps its success envelope.

### Covers and avatars

Use `events cover set <event-id> --file cover.png` or
`account avatar set --file avatar.jpg` to upload and replace an image. Both
accept the app image formats (JPEG, PNG, GIF, WebP, SVG) up to 10 MiB; documents,
video, and audio attachment formats are not images. The server verifies the
image format and ownership. SVG images cannot contain executable or external
content. Avatar cropping remains an optional preparation step; the CLI does not
silently crop or transform your file.

Cover uploads accept `--focal-x 0.5 --focal-y 0.5` with coordinates in [0,1].
Replacing a cover without coordinates clears the previous focal point.
Use `events cover get <event-id>` or `account avatar get` to inspect the result.
The corresponding `remove` commands require confirmation (`--yes` for scripts).
Image writes are not retried automatically. After an uncertain outcome, inspect
before repeating. Failed replacements preserve the current image and discard
only the caller's unclaimed upload; abandoned uploads expire after 24 hours.

## Custom add-on authoring

Use `groupi addons definitions` to list, inspect, create, edit, import/export,
publish, unpublish and delete your own complete custom definitions. Portable JSON
preserves supported configuration; owner-only access, inspected-version checks
and explicit lifecycle confirmation protect existing data. See
[definition format, examples and limitations](docs/addon-authoring.md).
Existing webhook definitions can be exported faithfully, but webhook actions are
unsupported for new authoring writes. Existing event add-on use and configuration
remain separate commands.

## Discover joins

`groupi events join <event-id>` creates Attendee membership with Pending RSVP.
Text and JSON results report `role` and `rsvpStatus`; joining does not confirm
attendance. For a dated event, use `events rsvp set`; for an undated event,
provide availability until a date is chosen. Poll date selection derives RSVP
from availability, while manual date selection preserves the current response.

Join requires the server's `eventManagement.pendingRsvpJoin: true` capability
before sending a write. Other event management commands remain compatible with
`eventManagement.version: 1` servers.

## Groups

Groups are formal communities independent of Events, friendships and Invite Lists.
Create an owner-only Group and retain its returned stable `groupId`:

```sh
groupi groups create --name "Readers" --description "Monthly books"
groupi groups list --limit 20 --all
groupi groups get <group-id>
groupi groups edit <group-id> --name "Book club" --clear-description
groupi groups delete <group-id> --yes
```

Names are trimmed and contain 1–100 characters; duplicate display names are allowed.
Descriptions are limited to 2000 characters; `--image` accepts an HTTPS URL up to
2048 characters. Renaming preserves identity and links. Only the owner can edit or
delete a Group. Deletion is explicit and does not delete independent Events.
Pagination returns `items` and `nextCursor`; `--all` deliberately follows pages.
REST API keys use the `groups` collection with `read` / `write` permissions.
Writes require the server's `groups` version 1 capability and are never retried;
inspect `groups list --all` after an uncertain creation before repeating it.
Owners can invite existing people; invitations grant Group membership only:

```sh
groupi groups invite <group-id> <person-id>
groupi groups invites <group-id> --status PENDING --all
groupi groups invitation-policy <group-id> --enabled false
groupi group-invites list --status PENDING --all
groupi group-invites accept <invite-id>
groupi group-invites decline <invite-id> --yes
groupi group-invites cancel <invite-id> --yes
groupi groups members <group-id> --all
groupi settings privacy set --group-invites FRIENDS
```

Invitation commands require the server's `groupInvites` version 1 capability.
Sending and changing policy require `groups:write`; owner invitation status and
member roster require `groups:read`. Own invitation inbox requires
`group-invites:read`; accept, decline and owner cancellation require
`group-invites:write`. Roster access requires admitted membership. Only the intended
recipient can accept or decline. Blocking and incoming Group privacy settings can
make a recipient unavailable without disclosing why; incoming choices are
`EVERYONE` (default), `FRIENDS`, and `NO_ONE`, independent of Event invitations.
Disabling invitations prevents both new sends and pending acceptance. Invitation
IDs are identifiers, not bearer credentials, and Group links do not admit visitors.
After an uncertain write, inspect the own inbox or owner's invitation list before
repeating; writes are never automatically retried. Group deletion removes its
invitations and memberships. Applications and tools remain unavailable.

### Group moderation

```sh
groupi groups member-role <group-id> <person-id> --role MODERATOR --yes
groupi groups member-role <group-id> <person-id> --role MEMBER --yes
groupi groups remove-member <group-id> <person-id> --yes
groupi groups ban <group-id> <person-id> --yes
groupi groups bans <group-id> --limit 20 --all
groupi groups lift-ban <group-id> <person-id> --yes
groupi groups leave <group-id> --yes
```

Only the owner appoints or demotes moderators and changes Group policies.
Owners and moderators manage invitations and ordinary member removal/bans;
moderators cannot manage the owner, peer moderators or their own role. Demote a
moderator before ordinary removal or banning. Nonowners, including moderators,
may leave voluntarily. Resolve ownership before the owner leaves or deletes their
account. Group moderation preserves independent Event authority, memberships,
RSVPs and friendships.

Removal and leaving permit later invitations under current policy. A ban blocks
new invitations and pending acceptance until a manager lifts it; lifting does not
admit membership. Previously accepted invitations cannot readmit departed members.
Ban lists are private to managers and paginated, with names, usernames, avatars
and dates only. Moderation writes require `groupModeration` version 1 and
`groups:write`; ban lists require `groups:read`. An older server receives no writes.
Inspect current membership and bans after an uncertain result before repeating;
these operations are never automatically retried. Removal and ban notices follow
the affected person's existing notification methods and preferences.

## Event ownership transfers

Event ownership requires recipient consent. Use `events transfer offer EVENT PERSON --yes`, then the named recipient runs `events transfer accept EVENT OFFER --yes`. Inspect `events transfer status EVENT` after any uncertain write. A pending offer remains unresolved: the current Organizer keeps responsibility until acceptance. Acceptance makes the former Organizer a Moderator and moves Friends visibility to the new Organizer's friends; membership and RSVP are preserved. The recipient may `decline`, and the current Organizer may `cancel`, using the offer ID and `--yes`.

## Event logistics and admission

Read before joining with `groupi events preview <event-id>`. The safe JSON/text
result includes Event identity, description, current Organizer, location, dates,
resolved admission policy and `entryAction`. Reading creates no membership or RSVP
and returns no discussion, roster, availability responses or tool submissions.

As the Organizer, configure
`groupi events settings set <event-id> --admission-policy INVITATION_ONLY` or
`--admission-policy DIRECT`. Admission is independent of visibility. Unconfigured
Friends events preserve Direct entry; unconfigured Public/Private events remain
Invitation only. Public readability alone does not allow self-joining.

Admission writes require `eventAdmission.version: 1` before a write is sent.
`JOIN` is available only after current audience, block and ban checks; a preview
can report `INVITATION_ONLY`, `UNAVAILABLE`, or `MEMBER` instead. Ordinary authorized
invitations and their Pending acceptance remain independent admission grants.
