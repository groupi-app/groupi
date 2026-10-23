# @groupi/shared

## 0.5.0

### Minor Changes

- 0b8c85c: Add formal Groups across web, mobile, the developer API, and CLI, with managed
  membership, applications, joining questionnaires, persistent Group tools, and
  explicit announcements. Keep Group Event visibility separate from invitations,
  Event membership, and RSVP. New Event attendees start Pending, and ownership
  transfers require recipient acceptance. Require explicit resolution of owned
  Groups and Events before account deletion.
- 9df172b: Add private invite lists across web, mobile, the developer API, and CLI. Manage
  saved selections and explicitly send ordinary event invitations from an editable
  recipient draft, with inline creation and protected retries. Anonymize deleted
  recipients and provide Needs attention repair without changing event membership
  or RSVP.

### Patch Changes

- eaec01b: Support validated CLI add-on participation with participant isolation and consistent app automation behavior.
- eaec01b: Add safe CLI posts, replies, and file attachments with shared validation and atomic updates.
- 81de951: Fix add-on completion and event-specific template behavior. Align native and REST permissions, notifications, reports, and add-on automations. Unify GDL date parsing across web, mobile, and REST with explicit timezones, overnight ranges, and daylight-saving validation. Organize add-ons and backend operations into focused modules and standardize shared workspace source consumption while preserving compiled package distribution.

## 0.4.0

### Minor Changes

- a1c2752: Bring the native mobile app to production acceptance with native authentication and passkeys, push notifications, universal links, complete event and post workflows, attachment management, mobile-optimized parity, and signed release automation. Align the supporting Convex, shared, and web behavior for secure cross-platform authentication, linking, notifications, permissions, and preview deployments.
