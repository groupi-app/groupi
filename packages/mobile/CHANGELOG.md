# @groupi/mobile

## 1.0.0

### Minor Changes

- 35d0036: Save Event configuration atomically with shared drafts, and handle automatic completion and expired date polls while preserving participation history.
- 4e96ee3: Add bounded credentials, independent integration authorship, and delegated sign-in with consent and app review.
- 49da7c2: Deliver approved community-branded application decisions with trusted status returns and staff-visible, deduplicated email retries independent of admission.
- 0b8c85c: Add formal Groups across web, mobile, the developer API, and CLI, with managed
  membership, applications, joining questionnaires, persistent Group tools, and
  explicit announcements. Keep Group Event visibility separate from invitations,
  Event membership, and RSVP. New Event attendees start Pending, and ownership
  transfers require recipient acceptance. Require explicit resolution of owned
  Groups and Events before account deletion.
- f5a7247: Add Group-managed Discord access with explicit member connections, role or server membership modes, durable access cleanup, and scoped API/SDK connection journeys.
- 35d0036: Let post authors and moderators control replies, and let moderators pin up to three posts per Event or Group without additional notifications.
- 9df172b: Add private invite lists across web, mobile, the developer API, and CLI. Manage
  saved selections and explicitly send ordinary event invitations from an editable
  recipient draft, with inline creation and protected retries. Anonymize deleted
  recipients and provide Needs attention repair without changing event membership
  or RSVP.
- 35d0036: Retire new Group announcement and Event email sends in favor of posts, reject retired send/retry APIs and CLI sends, and redirect old management links while preserving stored records, read/status and unsubscribe compatibility.
- b09e9c1: Add shared Post, Form, List and Poll creation across Events and Groups, integrate participant tools into Events, and move add-on management into Event Settings while preserving existing data.
- de67671: Adapt Groupi’s sticker-book controls and themes for native touch, readable states, and reduced motion.

### Patch Changes

- eaec01b: Add CLI cover and avatar upload, replacement, and removal with validated owned images and safe recovery.
- eaec01b: Add safe CLI posts, replies, and file attachments with shared validation and atomic updates.
- 49da7c2: Selected-Group delegated applicant consent and private own-context read, with synchronized TypeScript/Python SDK and versioned synthetic integration contract.
- 49da7c2: Support delegated own community application submission, saved-snapshot editing and withdrawal with revision-safe replay, and synchronized TypeScript/Python clients.
- 49da7c2: Add independent community Event Join, revision-safe RSVP and Event Leave, plus own Group departure that retains independent Event participation, with synchronized clients.
- e93fe11: Improve Groups and Invite Lists layouts, selection feedback, and accessibility.
- 4e96ee3: Validate known backend and add-on data types and preserve cleared answers across web and mobile.
- 81de951: Fix add-on completion and event-specific template behavior. Align native and REST permissions, notifications, reports, and add-on automations. Unify GDL date parsing across web, mobile, and REST with explicit timezones, overnight ranges, and daylight-saving validation. Organize add-ons and backend operations into focused modules and standardize shared workspace source consumption while preserving compiled package distribution.
- 348908d: Fix blurry event covers and post text wrapping on mobile.
- 88d5ddb: Connect Android push notifications to the new Groupi Firebase project and advance the native runtime for the required app update.
- Updated dependencies [35d0036]
- Updated dependencies [4e96ee3]
- Updated dependencies [eaec01b]
- Updated dependencies [eaec01b]
- Updated dependencies [49da7c2]
- Updated dependencies [49da7c2]
- Updated dependencies [49da7c2]
- Updated dependencies [49da7c2]
- Updated dependencies [dd246af]
- Updated dependencies [0b8c85c]
- Updated dependencies [f5a7247]
- Updated dependencies [81de951]
- Updated dependencies [35d0036]
- Updated dependencies [35d0036]
- Updated dependencies [9df172b]
- Updated dependencies [b09e9c1]
- Updated dependencies [de67671]
  - @groupi/shared@1.0.0

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
