# Terminal interface

Run `groupi tui --profile staging` to open the interactive interface. Running
`groupi` without a command also opens it when stdin and stdout are terminals.
`--non-interactive`, `--format json`, piped input/output, and `--api-key-stdin`
never launch it implicitly. Explicit `tui` rejects those combinations.

Sign in with `groupi auth login --profile staging` first, or supply an existing
environment key bound to that profile. The interface does not start browser
login. The selected profile and API origin remain visible throughout navigation.

## Keyboard

- Up/down and Enter select screens or actions.
- Escape cancels a form or returns to the previous screen; `b` also returns.
- `r` refreshes the current screen and attempts reconnection immediately.
- Page Up/Page Down scroll long details.
- `q` quits outside a form. Ctrl+C exits anywhere.

Lists fetch 20 items at a time. Select **Next page** to continue and **Back** to
return to the previous page. Empty lists still expose supported creation actions.
The active screen refreshes every five seconds after a successful read. Read
failures retain stale data, display the failure, and back off to ten, twenty,
forty, then sixty seconds. Manual refresh attempts reconnection immediately.
Inactive screens do not poll. Successful reconnect resets the interval.

Every write displays its target, entered values, selected profile and origin,
then offers **Cancel** (the default) and **Confirm**. Escape cancels. While a
write is pending, additional writes are disabled. The shared command service
controls validation, permissions, retries and request identifiers. An uncertain
write is never automatically resubmitted by the interface: read the recovery
message and inspect the refreshed data before deliberately trying again.

## Everyday screens

- Events: browse, inspect, create basic events, edit title/description/location,
  invite a username, mute/unmute, and inspect attendance.
- RSVP: submit a status and optional note. An empty note clears the previous note.
- Availability: inspect proposed dates and submit a response/note for one date.
- Invitations: inspect and accept/decline received invitations; organizers can
  inspect and revoke sent invitations.
- Friends: browse friends, incoming/outgoing requests and blocks; send a request
  by person ID, accept/decline/cancel requests, remove friends and block/unblock.
- Notifications: browse all/unread, inspect event/post targets, mark read/unread,
  clear individual items, mark all read or clear all; open related event screens.
- Discussion: read posts/replies, create plain-text content with an optional
  local attachment, edit plain single-line bodies or a post title, add/remove attachments, delete content and
  mute/unmute a post. Long content is paged with Page Up/Page Down.

Rich-body edits use **Edit from HTML file**: export the original `content` or
`text` field with `posts get` / `replies get --format json`, edit that HTML in your
editor, and supply its local file path. This preserves formatting and valid
mention markup; the readable screen projection is never used as an edit source.
Use CLI `--file` / `--content-format markdown` for multiline or Markdown creation
and `--attach <path...>` for multiple attachments in one atomic write. The terminal
and CLI share upload/cleanup orchestration, including rejected-parent cleanup.

The server enforces event roles, visibility and social permissions. An action
being present in a menu does not grant permission. Read failures hide mutation
actions until a successful refresh and cancel open forms; cached details are
explicitly marked stale. Reopen an action after reconnecting to review and confirm
it again.

## Advanced command boundary

Each confirmation names the corresponding non-interactive command. Exit the
interface and run that command with `--help` for exact flags. Use
`groupi --profile <name>` consistently when moving between interfaces.

Use CLI commands for email/link invitations, organizer date selection/reset,
bulk availability JSON, event visibility/permissions, membership roles/removal,
account preferences, covers/avatars and add-on configuration/participation.
These commands share the same services as the terminal screens. Never copy an
API key into a form: authentication is configured separately.

## Verification boundary

Automated focused checks cover keyboard form cancellation/confirmation, profile
display, refresh timing, stale data/backoff/reconnect, in-flight navigation races,
serialized writes, uncertain outcomes, cleanup and public noninteractive guards.
Release acceptance still requires manual organizer/attendee checks on isolated
staging, including incoming invitations/notifications, privacy failures and real
disconnect/reconnect. Test fixtures are not evidence of that live verification.
