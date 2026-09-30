# Groupi workflow examples

Examples for @groupi/cli 0.1.0. Generated from agent-workflows.json; exercised at the executable boundary.

These shell examples require trusted installed Groupi, configured profiles, and credentials injected from a secret manager.
Set ORGANIZER_PROFILE and ATTENDEE_PROFILE for distinct identities on the same server, and ATTENDEE_USERNAME to the intended recipient.
For each command, select the matching saved credential or environment key scoped by GROUPI_API_KEY_PROFILE. Verify identities with auth status first.
Capture EVENT_ID from event creation and INVITE_ID from username invitation creation. The attendee must inspect the invitation before accepting it.
Generate and retain EVENT_REQUEST_ID and INVITE_REQUEST_ID as Unix-milliseconds.UUID identifiers before running the write jobs.

```sh
EVENT_REQUEST_ID=$(node -e 'console.log(Date.now()+"."+require("node:crypto").randomUUID())')
INVITE_REQUEST_ID=$(node -e 'console.log(Date.now()+"."+require("node:crypto").randomUUID())')
```

## Table of Contents

- [planning](#planning)
- [inspection](#inspection)

## planning

```sh
groupi --profile "$ORGANIZER_PROFILE" events create --title Dinner --request-id "$EVENT_REQUEST_ID" --format json
groupi --profile "$ORGANIZER_PROFILE" invites members send "$EVENT_ID" --username "$ATTENDEE_USERNAME" --request-id "$INVITE_REQUEST_ID" --format json
groupi --profile "$ATTENDEE_PROFILE" invites members get "$INVITE_ID" --format json
groupi --profile "$ATTENDEE_PROFILE" invites members accept "$INVITE_ID" --format json
groupi --profile "$ATTENDEE_PROFILE" events rsvp set "$EVENT_ID" --status YES --format json
groupi --profile "$ORGANIZER_PROFILE" events members "$EVENT_ID" --all --format json
```

## inspection

```sh
groupi --profile "$ORGANIZER_PROFILE" auth status --format json
groupi --profile "$ORGANIZER_PROFILE" events list --limit 20 --format json
groupi --profile "$ORGANIZER_PROFILE" events get "$EVENT_ID" --format json
groupi --profile "$ATTENDEE_PROFILE" events rsvp get "$EVENT_ID" --format json
```

Windows users can pass the same arguments from PowerShell or a process API; shell variable assignment and quoting follow the host shell.

Fixture checks prove executable argument/output behavior with synthetic credentials. Real staging permissions, notification delivery, and OS credential stores require separate release evidence.
