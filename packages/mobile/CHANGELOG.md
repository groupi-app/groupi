# @groupi/mobile

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

- eaec01b: Add CLI cover and avatar upload, replacement, and removal with validated owned images and safe recovery.
- eaec01b: Add safe CLI posts, replies, and file attachments with shared validation and atomic updates.
- e93fe11: Improve Groups and Invite Lists layouts, selection feedback, and accessibility.
- 81de951: Fix add-on completion and event-specific template behavior. Align native and REST permissions, notifications, reports, and add-on automations. Unify GDL date parsing across web, mobile, and REST with explicit timezones, overnight ranges, and daylight-saving validation. Organize add-ons and backend operations into focused modules and standardize shared workspace source consumption while preserving compiled package distribution.
- 348908d: Fix blurry event covers and post text wrapping on mobile.
- 88d5ddb: Connect Android push notifications to the new Groupi Firebase project and advance the native runtime for the required app update.
- Updated dependencies [eaec01b]
- Updated dependencies [eaec01b]
- Updated dependencies [0b8c85c]
- Updated dependencies [81de951]
- Updated dependencies [9df172b]
  - @groupi/shared@0.5.0

## 0.4.1

### Patch Changes

- fb39ccf: Use a stable explicit native runtime for reliable store builds and over-the-air updates while enforcing matching runtime configuration across iOS and Android.

## 0.4.0

### Minor Changes

- a1c2752: Bring the native mobile app to production acceptance with native authentication and passkeys, push notifications, universal links, complete event and post workflows, attachment management, mobile-optimized parity, and signed release automation. Align the supporting Convex, shared, and web behavior for secure cross-platform authentication, linking, notifications, permissions, and preview deployments.
- 6af5a19: Add rich-text creation and editing for mobile replies, preserve formatting from web-authored replies, and keep the expanded event-image close control reachable above gesture handling.

### Patch Changes

- cc82386: Harden iOS and Android store builds with safe over-the-air updates, synchronized native versions, current Expo SDK patches, phone-only iOS targeting, and production-safe media and notification permissions.
- Updated dependencies [a1c2752]
  - @groupi/shared@0.4.0
