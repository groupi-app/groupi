# Explicit Group announcements

Group owners and current moderators can deliberately announce to permitted members from the Group screen, REST v2, or CLI. Routine Event and tool publication does not send an announcement.

## Sending and recovery

The title contains 1–100 trimmed characters; the plain-text message contains 1–2000 trimmed characters. The manager supplies a stable `<unix-ms>.<uuid-v4>` request key. Keys accept at most five minutes of future clock skew and expire after 24 hours. Preserve the key and body after an uncertain outcome: the same Group, sender and key returns the original aggregate status; changed content conflicts. Expired keys cannot send again even if history is deleted. Manager history and message state persist until Group or sender deletion.

`groupAnnouncements.mutations.sendAnnouncement` accepts `{ groupId, requestId, title, message }`. `groupAnnouncements.queries.getAnnouncement` accepts `{ groupId, requestId }`. Both require current live manager authority; status belongs to the requesting sender. Results contain only `announcementId`, `state`, `notified` and `skipped`. PROCESSING means indexed paging remains; COMPLETED means all bounded pages were processed; CANCELLED means sender authority became unavailable. Counts describe notification rows created and memberships skipped, including the sender. They never confirm external delivery. Cancellation preserves counts for work already created.

REST uses POST `/api/v2/groups/{groupId}/announcements` with `Idempotency-Key` and `{ title, message }`, requiring `groups:write`. GET `/api/v2/groups/{groupId}/announcements/status?requestId=...` requires `groups:read`. The server advertises `capabilities.groups.announcements: 1`. CLI equivalents:

```sh
groupi groups announce GROUP --title 'Reading' --message 'Bring a book' --request-id UNIX_MS.UUID_V4
groupi groups announcement-status GROUP --request-id UNIX_MS.UUID_V4
```

## Audience and channels

The send fixes an indexed membership creation boundary and processes 25 memberships per transaction. Every page rechecks sender authority and current recipient membership, active Group bans, live Auth account, blocking and Do Not Disturb. Members joining after the send boundary are excluded. The simple eligibility seam can later compose the separate required-onboarding policy.

Recipients get in-app notifications; existing enabled EMAIL, PUSH and WEBHOOK methods apply their private `GROUP_ANNOUNCEMENT` preference, defaulting to enabled when no type preference exists. The settings screens expose this preference. There is no SMS, phone integration, custom manager automation, or public contact/preference response.

Mutation scheduling and cursor updates are atomic. Replayed or concurrent requests/pages do not create duplicate notifications. Announcement dispatch persists only a notification ID, rechecks eligibility and preferences, then claims dispatch once. Existing external actions execute at most once and are never blindly retried by announcement recovery. Existing push delivery rules apply, with an additional current announcement-eligibility check at push claim.

## Cleanup and verification

Group deletion and all three account deletion paths remove sender announcement history and associated notifications/push records immediately. Recipient deletion removes their notification/delivery records; identifier-only pending dispatch safely becomes a no-op. Removed recipients cannot retrieve announcement text through notification projections. External requests already in flight cannot be recalled.

Tests exercise authenticated Convex sessions, concurrent and repeated request/page recovery, stale authority, recipient deletion, privacy/DND, channel preferences, REST scope validation, actual web/native Convex providers and accessible composition, and CLI requests against an isolated real localhost HTTP fixture. No live notification provider or deployment is needed.

The native composer test mounts production Button, Input and Text components through the production Convex provider over mocked React Native host primitives. It verifies provider binding, control props and handler submission in the renderer; it does not verify device accessibility, keyboard behavior or operating-system interactions.
