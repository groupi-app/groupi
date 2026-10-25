# Groupi workflow examples

Examples for @groupi/cli 0.1.0. Generated from agent-workflows.json; exercised at the executable boundary.

These shell examples require trusted installed Groupi, configured profiles, and credentials injected from a secret manager.
Set ORGANIZER_PROFILE and ATTENDEE_PROFILE for distinct identities on the same server, and ATTENDEE_USERNAME to the intended recipient.
For each command, select the matching saved credential or environment key scoped by GROUPI_API_KEY_PROFILE. Verify identities with auth status first.
Capture EVENT_ID from event creation and INVITE_ID from username invitation creation. The attendee must inspect the invitation before accepting it.
For the invite-lists workflow, set INVITE_LIST_PERSON_IDS to a JSON array of intended personId values selected from username discovery; capture INVITE_LIST_ID from creation. Creating or editing a list sends no invitations. The invite command explicitly sends current people; inspect sent/skipped results, including zero-sent outcomes.
Generate and retain EVENT_REQUEST_ID, INVITE_REQUEST_ID, and INVITE_LIST_REQUEST_ID as Unix-milliseconds.UUID identifiers before running the write jobs. List creation/edit/deletion are sent once; protected list invitation uses the retained request identifier.

```sh
EVENT_REQUEST_ID=$(node -e 'console.log(Date.now()+"."+require("node:crypto").randomUUID())')
INVITE_REQUEST_ID=$(node -e 'console.log(Date.now()+"."+require("node:crypto").randomUUID())')
INVITE_LIST_REQUEST_ID=$(node -e 'console.log(Date.now()+"."+require("node:crypto").randomUUID())')
```

## Table of Contents

- [planning](#planning)
- [invite-lists](#invite-lists)
- [inspection](#inspection)
- [event-ownership-transfer](#event-ownership-transfer)

## planning

```sh
groupi --profile "$ORGANIZER_PROFILE" events create --title Dinner --request-id "$EVENT_REQUEST_ID" --format json
groupi --profile "$ORGANIZER_PROFILE" invites members send "$EVENT_ID" --username "$ATTENDEE_USERNAME" --request-id "$INVITE_REQUEST_ID" --format json
groupi --profile "$ATTENDEE_PROFILE" invites members get "$INVITE_ID" --format json
groupi --profile "$ATTENDEE_PROFILE" invites members accept "$INVITE_ID" --format json
groupi --profile "$ATTENDEE_PROFILE" events rsvp set "$EVENT_ID" --status YES --format json
groupi --profile "$ORGANIZER_PROFILE" events members "$EVENT_ID" --all --format json
```

## invite-lists

```sh
groupi --profile "$ORGANIZER_PROFILE" invite-lists people --search "$ATTENDEE_USERNAME" --format json
groupi --profile "$ORGANIZER_PROFILE" invite-lists create --name 'Dinner guests' --person-ids "$INVITE_LIST_PERSON_IDS" --format json
groupi --profile "$ORGANIZER_PROFILE" invite-lists list --format json
groupi --profile "$ORGANIZER_PROFILE" invite-lists get "$INVITE_LIST_ID" --format json
groupi --profile "$ORGANIZER_PROFILE" invite-lists edit "$INVITE_LIST_ID" --name 'Weekend guests' --format json
groupi --profile "$ORGANIZER_PROFILE" invite-lists invite "$INVITE_LIST_ID" --event "$EVENT_ID" --request-id "$INVITE_LIST_REQUEST_ID" --format json
groupi --profile "$ORGANIZER_PROFILE" invite-lists delete "$INVITE_LIST_ID" --yes --format json
```

## inspection

```sh
groupi --profile "$ORGANIZER_PROFILE" auth status --format json
groupi --profile "$ORGANIZER_PROFILE" events list --limit 20 --format json
groupi --profile "$ORGANIZER_PROFILE" events get "$EVENT_ID" --format json
groupi --profile "$ATTENDEE_PROFILE" events rsvp get "$EVENT_ID" --format json
```

## event-ownership-transfer

```sh
groupi --profile "$ORGANIZER_PROFILE" events transfer offer "$EVENT_ID" "$RECIPIENT_PERSON_ID" --yes --format json
groupi --profile "$ATTENDEE_PROFILE" events transfer status "$EVENT_ID" --format json
groupi --profile "$ATTENDEE_PROFILE" events transfer accept "$EVENT_ID" "$TRANSFER_ID" --yes --format json
groupi --profile "$ORGANIZER_PROFILE" events transfer status "$EVENT_ID" --format json
```

Windows users can pass the same arguments from PowerShell or a process API; shell variable assignment and quoting follow the host shell.

Fixture checks prove executable argument/output behavior with synthetic credentials. Real staging permissions, notification delivery, and OS credential stores require separate release evidence.
