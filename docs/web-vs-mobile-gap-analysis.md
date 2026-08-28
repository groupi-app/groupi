# Web vs Native Mobile Parity Audit

This is the implementation and release backlog for bringing the Expo app to practical parity with the web app.

**Audit date:** 2026-08-23

**Audited commit:** `7f74523` (`feat/native-mobile` after merging `test`)

**Scope:** end-user and event-organizer workflows, shared data compatibility, native release readiness, and platform-appropriate equivalents. Web administration, API documentation, CLI auth, PWA behavior, hover interactions, and the visual add-on builder are excluded unless product requirements explicitly put them on mobile.

**Latest verification:** See [Native Mobile E2E and Quality Audit — 2026-08-23](./mobile-e2e-audit-2026-08-23.md) for the current automated results, safe repairs, device-test blocker, and newly confirmed architecture backlog.

## Current source status — 2026-08-28

The eight high-priority parity and release tracks from this audit are complete
in source on `feat/native-mobile`: native passkey/link trust, organizer event
permissions and settings, atomic attachment creation and management, native
account linking, universal-link destinations, add-on destinations/fallbacks,
and source-gated signed-device automation. Post-creation cover focal positioning
was also completed for create, edit, card, and header rendering.

The branch is source-ready to produce signed iOS and Android production
acceptance artifacts. It is not yet operationally accepted against production:
the remaining gates require owner-managed EAS/Convex production environment
values, publishing the checked-in web association files, registered physical
devices and signing accounts, the Google Play app-signing fingerprint once
available, and authenticated physical-device verification. EAS-hosted Maestro
jobs also remain optional behind Expo's paid-plan entitlement; the signed
acceptance workflow does not depend on them.

The broader, non-release-blocking parity backlog remains product work rather
than broken core flow repair: richer native rendering for arbitrary custom
add-ons, advanced questionnaire organizer aggregation/export, mentions, and
deeper authenticated accessibility/E2E coverage.

## Original audit verdict

The native app has substantially more functionality than the previous April audit reported. Authentication, onboarding, event lists, discovery, core event detail, posting, friends, moderation, privacy, and much of account management are present.

It is not ready to be described as feature-compatible or production-ready yet. The most urgent issue is contract drift: generated Convex types are erased in the shared/mobile layer, allowing screens to compile while using nonexistent endpoints, fields, or result shapes. Several headline flows are therefore present in the UI but fail or render incorrectly at runtime.

The smallest credible path to parity is:

1. Restore generated type safety and close backend authorization holes.
2. Repair the existing broken core flows and add regression tests.
3. Finish event creation/management, invitations, add-ons, and notifications.
4. Establish a real signed build, CI, E2E, push, deep-link, and observability path.
5. Complete secondary UX parity and explicitly decide which advanced web tools belong on native.

## Original audited baseline

| Area               | Native status                                                         |
| ------------------ | --------------------------------------------------------------------- |
| Product surface    | 27 non-layout user screens; 83 TSX components; 16 hooks               |
| Unit tests         | 17 files / 112 tests; all pass                                        |
| Measured coverage  | 14.04% statements, 12.32% branches, 10.87% functions, 13.88% lines    |
| E2E/device tests   | Simulator prepared; live journey blocked on env/binary                |
| Native release     | Profiles/workflows added; managed credentials and store links pending |
| Push notifications | Native registration/delivery implemented; signed-device setup remains |

## Implementation progress on `feat/native-mobile`

The first stabilization tranche after this audit is now implemented on the branch:

- Replaced generated-API type erasure across the repaired event, availability, member, invite, friend, profile, post/reply, add-on, notification, settings, and report flows.
- Corrected the runtime contract failures in availability, attendees, replies, attachment parent IDs, discovery, received invites, invite management/acceptance, notification presentation/settings, and external profiles.
- Made questionnaire, Bring List, and reminder data interoperable with their canonical web/backend formats.
- Wired permissions and add-ons into native event creation, included both in the create payload/review, added reminder/config validation, and added native organizer add-on management.
- Added required availability/questionnaire gating before event content.
- Hardened shared event/post/reply reads, member-role mutations, attachment registration, and presence writes at the backend boundary.
- Rebuilt native notifications around the real 19-type delivery-method model with item actions and reactive cursor pagination.
- Added authenticated per-device Expo push registration, account/type preference filtering, durable delivery tickets and receipts, bounded retries, stale-token cleanup, and safe native notification routing.
- Replaced the unsupported native auth workaround with the Better Auth Expo proxy/storage flow, including provider callback, OTP, invite-return, refresh, and sign-out regressions.
- Made post/reply attachment creation atomic with explicit batch failure cleanup and rollback behavior.
- Replaced the eager event discussion graph with a cursor-paginated Convex query and one continuously scrolling virtualized native list.
- Added canonical HTTPS/custom-scheme normalization plus checked-in iOS associated-domain and Android App Link configuration.
- Added EAS preview/production/E2E profiles, remote build versioning, on-demand signed build/store workflows, Maestro Android/iOS smoke flows, and a release-configuration CI guard.
- Synced single/system/custom appearance preferences through Convex and Uniwind.
- Made mobile type-check/test failures blocking in CI, fixed the Vitest coverage ratchet, and added focused mobile/shared/Convex regressions.
- Standardized common native headers, buttons, back navigation, semantic tokens, and accessibility affordances.

The P0/P1 inventory below documents the audited baseline and broader path to full parity. Items above are complete in source. Release activation still requires the owner-managed EAS project/signing/store credentials, preview/production environment values, the real Apple application prefix and Play signing fingerprint for hosted association files, and physical-device acceptance. Broader work still includes authenticated device E2E/accessibility coverage, advanced invitation methods, custom add-on rendering, mentions/attachment metadata, and full organizer date/settings surfaces.

## P0: functional and data-contract blockers

These must be fixed before adding more parity surface. Each is an existing flow that currently fails, loses data, or presents misleading state.

### 1. Restore generated Convex typing

Twenty-nine mobile files load the generated API as `any`, while the shared hook layer defines `ConvexApi` as `any`. The mobile package also uses broad `as never` casts to force IDs and mutation arguments through the compiler.

This has hidden endpoint, argument, and response-shape drift throughout the app. Remove the local API casts domain-by-domain, use generated function references and inferred `FunctionArgs`/`FunctionReturnType`, then fix every resulting error. Share typed adapters where web and native need different presentation but the same domain model.

Evidence:

- [`packages/shared/src/hooks/types.ts`](../packages/shared/src/hooks/types.ts)
- [`packages/mobile/src/hooks/use-events.ts`](../packages/mobile/src/hooks/use-events.ts)
- [`packages/mobile/src/hooks/use-posts.ts`](../packages/mobile/src/hooks/use-posts.ts)

Highest-value shared adapters:

- event attendees to a canonical member array;
- availability query to canonical date options;
- post detail to post/replies/attachments;
- create post/reply results to extracted document IDs;
- notification presentation and notification-method settings.

### 2. Repair existing core screens

| Flow                             | Current defect                                                                                                                                                                                 | Required repair                                                                               |
| -------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------- |
| Availability                     | Convex returns `potentialDates`, but native reads `potentialDateTimes` and assumes a different nested shape. No dates appear, so voting and final-date selection cannot work.                  | Bind to the generated return type and add vote/choose regression tests.                       |
| Attendees                        | The query returns an event object with `memberships`; the screen treats the object itself as an iterable array.                                                                                | Reuse the correct normalization already present in `MemberList`.                              |
| Replies                          | Shared hooks call nonexistent `posts.mutations.createReply/updateReply/deleteReply`; the functions live under `replies.mutations`. The screen also reads replies from the wrong nesting level. | Correct the endpoints and read `post.replies`.                                                |
| Attachments on new posts/replies | Create mutations return objects such as `{ postId, post }` and `{ replyId }`; native passes the whole result as an attachment parent ID.                                                       | Extract IDs before creating attachment records.                                               |
| Discover                         | Results expose `eventId`; the screen keys and joins with nonexistent `_id`.                                                                                                                    | Use `eventId`, update the friends-only discovery copy, and test joining.                      |
| Pending event invites            | Results are flat (`inviteId`, `eventTitle`, `createdAt`); the screen expects `_id`, nested `event`, and `_creationTime`.                                                                       | Use generated fields for rendering, accept, and decline.                                      |
| Event invite management          | `getEventInvites` returns `{ invites, pendingEmailCount, userRole }`; the screen treats it as an array and expects obsolete usage fields.                                                      | Read `result.invites` and canonical `usesRemaining`/`usesTotal`.                              |
| Invite acceptance navigation     | The accepted event ID is at `inviteData.invite.eventId`; native reads `inviteData.eventId`.                                                                                                    | Navigate using the nested ID and preserve signed-out return state.                            |
| Notification inbox               | Native uses nonexistent `readAt`, `title`, and `message` fields and the wrong author shape. Read filtering and presentation are incorrect.                                                     | Share the web presentation mapper and use `read`, `createdAt`, and the enriched author shape. |
| Notification settings            | The query returns `{ personSettings, notificationMethods }`, but native treats it as a flat boolean map and sends rejected category keys to a different mutation.                              | Use the settings mutation and edit the real delivery-method/type matrix.                      |
| External profiles                | Native reads bio, pronouns, and person ID from nonexistent `profile.person`; the query returns them under `profile.user`.                                                                      | Bind to the generated result so profile details and mutual lookups work.                      |

Primary evidence:

- [`convex/events/queries.ts`](../convex/events/queries.ts)
- [`packages/mobile/app/event/[eventId]/availability.tsx`](../packages/mobile/app/event/%5BeventId%5D/availability.tsx)
- [`packages/mobile/app/event/[eventId]/attendees.tsx`](../packages/mobile/app/event/%5BeventId%5D/attendees.tsx)
- [`packages/shared/src/hooks/usePostActions.ts`](../packages/shared/src/hooks/usePostActions.ts)
- [`packages/mobile/app/(tabs)/discover.tsx`](../packages/mobile/app/%28tabs%29/discover.tsx)
- [`packages/mobile/app/invites/index.tsx`](../packages/mobile/app/invites/index.tsx)
- [`packages/mobile/app/event/[eventId]/invite.tsx`](../packages/mobile/app/event/%5BeventId%5D/invite.tsx)
- [`packages/mobile/app/(tabs)/notifications.tsx`](../packages/mobile/app/%28tabs%29/notifications.tsx)
- [`packages/mobile/app/settings/notifications.tsx`](../packages/mobile/app/settings/notifications.tsx)
- [`packages/mobile/app/profile/[userId].tsx`](../packages/mobile/app/profile/%5BuserId%5D.tsx)

### 3. Make add-on data interoperable

Native and web currently encode or interpret built-in add-on data differently:

- Questionnaire field types are canonical uppercase values such as `SHORT_ANSWER`, `CHECKBOXES`, and `YES_NO`; native matches lowercase names and stores every answer as a string. Checkbox validation can call `.trim()` on an array.
- Bring-list claims use incompatible keys and values. Native writes per-item/person records while web reads a per-person quantity map, so claims do not round-trip between platforms.
- Reminder display reads `reminderTiming`, while the canonical configuration uses `reminderOffset`.

Normalize all built-in configurations and response payloads in shared typed code, migrate or tolerate existing native-shaped data if it has already been persisted, and add web/native round-trip tests.

Evidence:

- [`packages/mobile/src/components/addons/questionnaire-addon.tsx`](../packages/mobile/src/components/addons/questionnaire-addon.tsx)
- [`packages/mobile/src/components/addons/bring-list-addon.tsx`](../packages/mobile/src/components/addons/bring-list-addon.tsx)
- [`packages/mobile/src/components/addons/reminder-addon.tsx`](../packages/mobile/src/components/addons/reminder-addon.tsx)

### 4. Finish required-flow gating and remove broken navigation

Native opens event content even when a member still owes required availability or add-on responses. Web gates event content until those actions are complete. Implement the same domain rule with native navigation.

The organizer **Manage** button pushes `/event/:id/addons/manage`, but that route does not exist. Add the management route or remove the action until it is usable.

Evidence:

- [`packages/mobile/app/event/[eventId]/index.tsx`](../packages/mobile/app/event/%5BeventId%5D/index.tsx)
- [`packages/mobile/app/event/[eventId]/addons/index.tsx`](../packages/mobile/app/event/%5BeventId%5D/addons/index.tsx)
- [`packages/web/hooks/convex/use-addon-gating.ts`](../packages/web/hooks/convex/use-addon-gating.ts)

### 5. Close backend authorization gaps before a native release

These are shared backend risks uncovered during the parity audit, not native-only differences:

- Anonymous callers who know IDs can read private event/post/reply data because several queries only check membership when a current person exists.
- A moderator can promote themselves or another member to organizer and can target organizers with remove/ban mutations in some cases.
- Attachment batch creation validates authentication but not access to the referenced post/reply or ownership of uploaded storage objects.
- Presence mutations allow anonymous callers to supply arbitrary user IDs and room IDs, enabling spoofed presence/typing data.
- User-authored post links are passed directly to `Linking.openURL`; native should allow only intended `https:`/`http:` schemes.

Add server-side auth/resource-boundary tests for each case. The UI must never be the authorization boundary.

Evidence:

- [`convex/events/queries.ts`](../convex/events/queries.ts)
- [`convex/posts/queries.ts`](../convex/posts/queries.ts)
- [`convex/events/mutations.ts`](../convex/events/mutations.ts)
- [`convex/attachments/mutations.ts`](../convex/attachments/mutations.ts)
- [`convex/presence.ts`](../convex/presence.ts)
- [`packages/mobile/src/components/posts/html-content.tsx`](../packages/mobile/src/components/posts/html-content.tsx)

## P0: test and release blockers

### 1. Establish a real native build and release path

- Root `build:mobile` invokes a nonexistent mobile `build:android` script.
- There is no `eas.json`, store submission workflow, signed native build job, or artifact smoke test.
- Android release builds currently use the debug keystore; iOS release signing is not configured in the repository.
- `EXPO_PUBLIC_CONVEX_URL`, `EXPO_PUBLIC_BETTER_AUTH_URL`, and `EAS_PROJECT_ID` have no documented production/EAS profile mapping.
- App/build versions are hardcoded separately across Expo, Android, and iOS.

Define whether native projects are generated or authoritative, add development/preview/production profiles, wire secrets through the deployment environment, build signed artifacts in CI, and document store promotion/rollback.

Evidence:

- [`package.json`](../package.json)
- [`packages/mobile/package.json`](../packages/mobile/package.json)
- [`packages/mobile/app.config.ts`](../packages/mobile/app.config.ts)
- [`packages/mobile/android/app/build.gradle`](../packages/mobile/android/app/build.gradle)
- [`.github/workflows/release.yml`](../.github/workflows/release.yml)

### 2. Make mobile quality gates meaningful

- Mobile has only 2 test files for 146 production TS/TSX files and no route/hook coverage.
- The EventCard tests duplicate private logic and call the router directly; they never import or render `EventCard`.
- The coverage thresholds use a configuration shape ignored by Vitest 4, allowing under 1% coverage to pass.
- CI allows the mobile type check to fail, excludes mobile from the main quality type pass, and omits the mobile job from the final summary condition.
- There is no component-rendering harness or Maestro/Detox/device smoke suite.

Fix CI and coverage enforcement first, then add regression coverage for every P0 contract repair plus a signed-in device flow covering onboarding, invite acceptance, event creation, voting, posting with attachments, and notification navigation.

Evidence:

- [`packages/mobile/vitest.config.ts`](../packages/mobile/vitest.config.ts)
- [`packages/mobile/src/components/events/__tests__/event-card.test.tsx`](../packages/mobile/src/components/events/__tests__/event-card.test.tsx)
- [`.github/workflows/test.yml`](../.github/workflows/test.yml)

### 3. Implement push end to end

Implemented on `feat/native-mobile`: `expo-notifications` configuration, user-initiated permission handling, stable per-installation registration, token rotation and sign-out cleanup, foreground presentation, cold/warm tap routing, account/type preference filtering, Expo ticket/receipt processing, bounded retry behavior, and `DeviceNotRegistered` cleanup.

Production activation still requires an EAS project ID in `EAS_PROJECT_ID`, valid APNs/FCM credentials on the Expo project, a signed development or production build on a physical device, the matching `EXPO_ALLOWED_PROJECT_IDS` and `EXPO_ALLOWED_APP_IDS` allowlists in Convex, and `EXPO_ACCESS_TOKEN` when Expo push access-token security is enabled. These are deployment credentials rather than source defaults and cannot be validated by the unit suite.

Operational follow-up: add scheduled retention for terminal delivery records and inactive token generations so copied notification text and obsolete credentials do not remain indefinitely.

## P1: core product parity

### Event creation and organizer settings

- Wire the existing `PermissionsStep` and `AddonsStep` into the create-event wizard. They are currently unreachable.
- Submit `permissions`, `addonConfigs`, and multi-date notes in the create mutation.
- Add change/reset date, fixed-date/poll switching, date-option editing, and final-selection confirmation.
- Pass canonical `potentialDateTimeId` and selection source when choosing a poll result; timestamp-only legacy inference is ambiguous for identical options.
- Add visibility, permissions, date, cover focal-point, and add-on configuration to event settings. Native edit currently handles only title, description, location, and image.

Evidence:

- [`packages/mobile/app/create-event/index.tsx`](../packages/mobile/app/create-event/index.tsx)
- [`packages/mobile/src/components/create-event/review-step.tsx`](../packages/mobile/src/components/create-event/review-step.tsx)
- [`packages/mobile/app/event/[eventId]/edit.tsx`](../packages/mobile/app/event/%5BeventId%5D/edit.tsx)

### Availability and attendees

- Add ranked/date sorting, percentage visualization, respondent expansion, notes, and organizer selection confirmation.
- Do not render attendee voting controls to organizers when the domain flow calls for selection instead.
- Add attendee search, RSVP notes, and per-date availability details.

### Add-ons

- Add organizer enable/disable/configure/template-picker management.
- Support all seven canonical questionnaire field types and organizer response viewing/export.
- Support bring-list quantities and organizer export.
- Render Discord and custom add-ons. Custom add-on consumption belongs on native even if the visual authoring tool remains web-only.
- Add shared required-add-on gating and data round-trip tests.

### Invitations

- Add link name, expiry, max uses, usage details, editing, batch removal, and a native QR/share equivalent.
- Add username search, role selection, direct-invite cancellation, and profile-to-event invitation.
- Add manual/bulk email invitations, +1s, custom message, status, and a native contact/CSV import strategy.
- Preserve invite/deep-link state through authentication.

### Notifications

- Model named email/webhook/push methods with format, templates, headers, and per-type subscriptions.
- Add per-item mark-unread/delete and pagination; native currently stops at the first 50 results.
- Make pull-to-refresh meaningful for the reactive query or remove it.
- Add mark-event-notifications-as-read behavior where the web flow relies on it.

### Discussions and attachments

- Add `@` mention insertion/autocomplete and mention notifications; native currently renders existing mention markup only.
- Add attachment alt-text/spoiler editing, deletion, and video display. Native can pick video but its gallery filters to images.
- Add long-thread “jump to present” and new-reply count behavior.

### Themes, profiles, auth, and presence

- Persist and server-sync theme choice; the native provider is in-memory and resets on restart.
- Support system light/dark mappings and decide whether custom-theme selection belongs on native.
- Handle incoming friend requests on profiles and add **Invite to Event**.
- Replace fixed one-tap report reasons with the full reason/details flow.
- Verify social auth and passkeys on physical iOS/Android devices. Native can manage passkeys but offers no passkey sign-in, and linked-account creation sends users to web.
- Add account switching if multi-session parity is required.
- Surface online/last-seen state and the Online/Idle/DND/Invisible status selector.

## P1: native platform quality

- Add verified HTTPS universal links/app links. The app shares HTTPS invite URLs today, but only the custom `groupi://` scheme opens native.
- Preserve the intended route through signed-out and magic-link/social authentication.
- Add accessible names, hints, state, large-text behavior, reduced-motion handling, VoiceOver/TalkBack tests, and a device accessibility smoke matrix.
- Add native crash reporting, source-map upload, analytics, and release-health instrumentation equivalent to the web app's Sentry/analytics coverage.
- Define disconnected/reconnect behavior. `expo-network` is installed but unused; there is no offline state, retry policy, or reconnect test.

## P2: polish and explicit product decisions

- Render cover image/focal point, visibility, and richer detail on event list cards.
- Add a true All/Owned event filter and tab counts if exact list parity is desired.
- Add location autocomplete, natural-language multi-date input, and focal-point selection using native interactions.
- Generate native changelog content from the same changeset source as web instead of hardcoded entries.
- Add branded error-boundary and not-found states.
- Decide on OTA update policy, staged rollout, store metadata/privacy declarations, and post-release smoke checks.
- Decide whether custom theme creation, admin/data explorer/query builder, API docs, CLI auth, or add-on visual authoring should ever be native features.

## Already substantially implemented

The previous audit incorrectly marked many of these as absent. They should be retained and regression-tested rather than rebuilt:

- Email OTP/magic-link, Google/Discord entry points, onboarding, and profile completion.
- Upcoming/Hosting/Attended lists, four sort modes, discovery UI, pending-invite UI, and event muting.
- Event detail, cover upload/lightbox, RSVP notes, leave/delete/report, and basic detail editing.
- Availability UI with batch selection, response counts, and organizer choose action.
- Member promote/demote/remove/ban actions.
- Rich-text post/reply create/edit/delete, edited markers, attachments, post muting, presence heartbeats, and typing indicators.
- Friends, incoming/outgoing requests, suggestions, cancellation, removal, blocking, reports, and mutual-friend/event UI.
- All/Unread notification tabs, bulk mark-read, bulk delete, and badge capping.
- Account emails, linked-account listing/unlinking, passkey/API-key management, account deletion, privacy settings, and blocked-user management.
- Predefined themes, unsaved-change guards, long-press event actions, report flows, and an in-app changelog.
- Attendee renderers for reminder, questionnaire, and bring-list add-ons, subject to the P0 interoperability repairs above.

## Definition of practical native parity

Native parity does not require pixel-identical screens or browser-only tools. It does require that:

1. A user can enter from a universal invite link, authenticate, onboard, and return to the intended event.
2. All web-created events and built-in/custom add-on data render and mutate correctly on native, and vice versa.
3. Attendees can discover/join, RSVP, provide required availability/add-on responses, discuss with attachments/mentions, manage friends, and receive actionable notifications.
4. Organizers can create and fully manage event details, dates, permissions, invitations, members, and add-ons.
5. Authorization is enforced on the server and all shared contracts are generated-type checked.
6. Signed iOS and Android artifacts pass automated unit, contract, E2E, accessibility, deep-link, and push smoke tests.
7. Production configuration, observability, store release, rollback, and incident diagnosis are documented and exercised.
