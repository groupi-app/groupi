# @groupi/cli

## 1.0.0

### Major Changes

- 35d0036: Retire new Group announcement and Event email sends in favor of posts, reject retired send/retry APIs and CLI sends, and redirect old management links while preserving stored records, read/status and unsubscribe compatibility.

### Minor Changes

- eaec01b: Support validated CLI add-on participation with participant isolation and consistent app automation behavior.
- 66572c1: Add CLI RSVP, availability, attendance, and event date management with shared permissions and private notes
- eaec01b: Add CLI cover and avatar upload, replacement, and removal with validated owned images and safe recovery.
- 259647b: Add owner-scoped custom add-on definition authoring with portable import/export, version-protected edits, validated lifecycle commands and actionable schema errors.
- 2654111: Add authenticated CLI event browsing with isolated profiles, safe pagination, and API-key enforcement.
- eaec01b: Add keyboard-driven terminal workflows for planning, discussions, friends and notifications, with profile-aware confirmations and refresh/reconnect handling.
- b63416e: Add CLI commands for event discovery and management, friendships and blocking, account preferences, add-on configuration, and Discord guild refresh. Include portable agent guidance and generated command references.
- c0a163c: Add CLI notification read and clear actions, plus event and discussion muting with app-equivalent permissions and delivery rules.
- eaec01b: Add safe CLI posts, replies, and file attachments with shared validation and atomic updates.
- 7c8a386: Add safe CLI event creation and editing with replay protection and app-equivalent validation
- a302647: Add CLI link, email, and username invitations with safe retries and app-equivalent permissions
- e729fa1: Add secure CLI browser login with OS credential storage and profile-isolated authentication
- 0b8c85c: Add formal Groups across web, mobile, the developer API, and CLI, with managed
  membership, applications, joining questionnaires, persistent Group tools, and
  explicit announcements. Keep Group Event visibility separate from invitations,
  Event membership, and RSVP. New Event attendees start Pending, and ownership
  transfers require recipient acceptance. Require explicit resolution of owned
  Groups and Events before account deletion.
- a41f96d: Allow explicit Discord handback acknowledgement when deleting a Group; retain pending removals and preserve Discord server/bot.
- 9df172b: Add private invite lists across web, mobile, the developer API, and CLI. Manage
  saved selections and explicitly send ordinary event invitations from an editable
  recipient draft, with inline creation and protected retries. Anonymize deleted
  recipients and provide Needs attention repair without changing event membership
  or RSVP.

### Patch Changes

- 169b161: Make pagination consistent across CLI readers and reject repeated cursors, oversized pages, and malformed responses without partial output.
