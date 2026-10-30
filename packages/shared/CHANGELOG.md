# @groupi/shared

## 1.0.0

### Minor Changes

- 35d0036: Save Event configuration atomically with shared drafts, and handle automatic completion and expired date polls while preserving participation history.
- 4e96ee3: Add bounded credentials, independent integration authorship, and delegated sign-in with consent and app review.
- 49da7c2: Expose a single current community Event with explicit absence and configuration conflicts, privacy-safe participation reads, and Organizer completion, reopening, and rescheduling controls with replay-safe SDK operations.
- 0b8c85c: Add formal Groups across web, mobile, the developer API, and CLI, with managed
  membership, applications, joining questionnaires, persistent Group tools, and
  explicit announcements. Keep Group Event visibility separate from invitations,
  Event membership, and RSVP. New Event attendees start Pending, and ownership
  transfers require recipient acceptance. Require explicit resolution of owned
  Groups and Events before account deletion.
- f5a7247: Add Group-managed Discord access with explicit member connections, role or server membership modes, durable access cleanup, and scoped API/SDK connection journeys.
- 35d0036: Add Simple, Checklist and Bring list types in Events and Groups, with creator-managed participation settings, collaborative completion attribution and quantity claims while preserving existing lists.
- 35d0036: Let post authors and moderators control replies, and let moderators pin up to three posts per Event or Group without additional notifications.
- 9df172b: Add private invite lists across web, mobile, the developer API, and CLI. Manage
  saved selections and explicitly send ordinary event invitations from an editable
  recipient draft, with inline creation and protected retries. Anonymize deleted
  recipients and provide Needs attention repair without changing event membership
  or RSVP.
- b09e9c1: Add shared Post, Form, List and Poll creation across Events and Groups, integrate participant tools into Events, and move add-on management into Event Settings while preserving existing data.
- de67671: Add shared, contrast-safe sticker-book theme treatments for consistent action and status states.

### Patch Changes

- eaec01b: Support validated CLI add-on participation with participant isolation and consistent app automation behavior.
- eaec01b: Add safe CLI posts, replies, and file attachments with shared validation and atomic updates.
- 49da7c2: Selected-Group delegated applicant consent and private own-context read, with synchronized TypeScript/Python SDK and versioned synthetic integration contract.
- 49da7c2: Support delegated own community application submission, saved-snapshot editing and withdrawal with revision-safe replay, and synchronized TypeScript/Python clients.
- 49da7c2: Add explicit per-Group announcement opt-in and staff-triggered branded Event mail with durable recipient delivery, live eligibility checks, trusted preference returns and synchronized clients.
- dd246af: Show Discord server and profile cards with server icons, profile pictures, display names and usernames, while keeping connection problems visible.
- 81de951: Fix add-on completion and event-specific template behavior. Align native and REST permissions, notifications, reports, and add-on automations. Unify GDL date parsing across web, mobile, and REST with explicit timezones, overnight ranges, and daylight-saving validation. Organize add-ons and backend operations into focused modules and standardize shared workspace source consumption while preserving compiled package distribution.

## 0.4.0

### Minor Changes

- a1c2752: Bring the native mobile app to production acceptance with native authentication and passkeys, push notifications, universal links, complete event and post workflows, attachment management, mobile-optimized parity, and signed release automation. Align the supporting Convex, shared, and web behavior for secure cross-platform authentication, linking, notifications, permissions, and preview deployments.
