# Native Mobile E2E and Quality Audit

**Audit date:** 2026-08-23  
**Branch:** `feat/native-mobile`  
**Starting commit:** `04c6b90`  
**Platform prepared:** iOS 26.5 simulator on Xcode 26.6

## Outcome

The mobile source, shared contracts, and native configuration received a comprehensive static, component, contract, accessibility, and automated-test audit. The safe defects found during that audit were repaired and covered where a pure regression test was practical.

A signed-in live-device journey was **not executed**. The prepared `Groupi iOS Test` iPhone 17 Pro simulator had no Groupi binary installed, `packages/mobile/.env.local` was absent, and no user-managed Metro or application server was available. The mobile client intentionally throws without `EXPO_PUBLIC_CONVEX_URL`; authentication additionally requires `EXPO_PUBLIC_BETTER_AUTH_URL`. Project rules prohibit starting development or build processes from this agent session. No production deployment or credentials were substituted.

This report therefore distinguishes automated verification from device E2E. “Passed” below means the named automated suite passed, not that a person completed the flow on a simulator.

## Environment and executed verification

| Check                | Result                                                                |
| -------------------- | --------------------------------------------------------------------- |
| iOS simulator        | Booted `Groupi iOS Test`, iPhone 17 Pro, iOS 26.5                     |
| Xcode                | 26.6                                                                  |
| Expo Doctor          | 19/19 checks passed                                                   |
| Mobile TypeScript    | Passed                                                                |
| Mobile ESLint        | Passed                                                                |
| Mobile Vitest        | 17 files / 112 tests passed                                           |
| Mobile coverage      | 14.04% statements, 12.32% branches, 10.87% functions, 13.88% lines    |
| Shared tests         | 7 files / 256 tests passed                                            |
| Web tests            | 56 files / 1,007 tests passed                                         |
| Convex direct suite  | Passed; six known scheduled-function warnings remain                  |
| Device UI journey    | Blocked by missing non-production environment and installed app       |
| Physical-device push | Not run; requires a signed device build plus EAS/APNs/FCM credentials |

The root aggregate test command cannot run the Convex script-generated suite without `CONVEX_DEPLOYMENT`; the corresponding direct Convex test execution passed. This is an environment limitation, not evidence that the aggregate command passed.

## Safe repairs completed

### Authentication, navigation, and security

- Removed OAuth authorization, callback, result, cookie-key, OTP, and onboarding values from production device logs.
- Added a root protected-route policy. Signed-out event, profile, settings, friend, creation, and other protected deep links now redirect before authenticated Convex queries mount.
- Preserved an allowlisted internal `returnTo` through sign-in and onboarding, including signed-out invite acceptance. External, backslash, query-injection, auth, onboarding, and unknown destinations are rejected.
- Deferred notification-tap routing until authentication is loaded and authenticated.
- Restricted rendered post links to absolute HTTP(S) URLs and handled operating-system link failures.
- Removed Android release signing with the checked-in debug key. A distributable build now requires properly managed release credentials.

### Event and discussion accuracy

- Matched web event classification by considering both start and end times; in-progress events remain upcoming until their end.
- Matched web event ordering: ascending dates with unscheduled events last.
- Fixed required availability selection to pass the canonical potential-date ID and `POLL` selection source.
- Prevented restricted attendee queries from running before their permission check resolves.
- Aligned event actions with organizer/moderator permissions and post/reply moderation rules.
- Added explicit missing/deleted states for event detail, event edit, post detail, and post edit instead of crashes, endless spinners, or blank edit forms.
- Distinguished a loading post feed from a genuinely empty feed.
- Allowed attachment-only replies to submit, matching the enabled composer state.
- Preserved ordered-list numbering in rendered rich text.
- Stabilized rich-editor CSS/extensions across content updates and reinjected theme CSS when active theme values change.

### Attachments and media

- Temporarily restricted mobile attachment selection to images. The previous picker offered videos that the mobile viewer silently hid.
- Preserved picker size metadata and enforced the declared MIME/10 MB policy both when adding and immediately before uploading a file.
- Added contextual labels and practical hit areas to attachment add/remove, spoiler, lightbox, and reply-send actions.
- Made attachment grids and lightboxes respond to rotation/split width and safe-area insets.
- Replaced eager full-resolution lightbox mounting with a windowed paged list.
- Replaced multi-action Android alert sheets with the cross-platform bottom-sheet action menu, including event-image actions.

### Account and settings behavior

- Added the same typed-username confirmation used by web before account deletion.
- Stopped unregistering push before the account-deletion mutation; a transient deletion failure no longer leaves an existing account silently disconnected from push.
- Serialized privacy saves, blocked overlapping snapshots, and rolled the UI back after a failed save.
- Replaced additional generated-API type erasure in touched settings and onboarding paths.
- Centralized public invite URL creation with a validated `EXPO_PUBLIC_BASE_URL` and canonical `https://groupi.gg` fallback.

### Accessibility and cohesive design

- Raised shared button/select/switch interaction targets or hit areas toward the 44-point mobile target.
- Connected visual labels and errors to native text fields, exposed invalid state, and announced validation messages.
- Added tab/radio roles and selected/checked state to filter, status, and RSVP controls.
- Added accessible loading, empty-state, event-card, post-card, add-on-card, attachment, and composer descriptions.
- Replaced status foregrounds that failed contrast on light backgrounds with semantic status-text tokens and subtle surfaces.
- Aligned secondary/accent surface pairs with the shared/web theme rather than combining a bright brand background with muted text.
- Replaced forced-theme status-bar `auto` behavior with icons derived from the active app theme.
- Added missing mobile semantic radius, elevation, status-text, and z-layer declarations used by repaired primitives.

## Gaps requiring a decision or cross-cutting design

### Critical before a native release

1. **Native authentication contract.** The server Expo Better Auth plugin is disabled while the native client uses `expoClient`. Social OAuth and native magic-link return cannot be considered reliable. The OTP workaround writes cookie JSON directly and bypasses the Expo adapter’s Keychain chunking. Re-enable or replace the proxy in a way that preserves web callbacks, then test Google, Discord, magic link, OTP, session refresh, and sign-out on real devices.
2. **Atomic attachment creation.** Posts/replies are created before their uploads and attachment registrations. Batch upload currently permits partial success, so failures can leave blank parents, duplicates on retry, or orphaned storage. Decide on an upload reservation/finalization or rollback contract before changing this flow.
3. **Post-feed scale.** Event detail nests eager post rendering inside a `ScrollView`; the backend “paginated” query collects all posts, memberships, and replies. Implement real Convex cursor pagination with preview/count records and one virtualized native list.
4. **Signed release and device pipeline.** Add preview/production EAS profiles, managed iOS/Android credentials, artifact smoke tests, store submission, and release rollback. Root `build:mobile`, CI, and release automation do not currently produce native artifacts.

### Product/platform decisions

- Passkey creation depends on browser WebAuthn and cannot work in React Native without a compatible native bridge; hide it or select a native implementation.
- Configure Universal Links/App Links, associated domains, Android intent filters, and hosted association files. Canonical HTTPS invite links do not yet open the app.
- Decide whether v1 supports iPad/split view. Tablet support is declared but screens have no tablet content-width or adaptive-column strategy.
- Decide whether custom and Discord add-ons should be fully usable by attendees on native or explicitly labeled web-only.
- Decide the supported mobile attachment set. Web-created video, PDF, and other file attachments remain invisible until typed viewers/downloaders are implemented.
- Add a cohesive Expo Router error boundary with themed retry and safe navigation.
- Hydrate the saved theme before dismissing the splash and configure dark splash assets to avoid cold-start theme flashes.

## Remaining parity and quality backlog

- Advanced invitations: named/expiring/max-use links, QR, usage history, messages/email, +1, contacts, CSV, and bulk flows.
- Organizer event settings: date reset/change, poll/fixed switching, complete permissions, cover focal point, and complete add-on editing.
- Rich discussions: mentions/autocomplete, attachment alt/spoiler authoring, video/file viewing, and complete underline/strike/code/blockquote/nested-mark rendering.
- Profile/social parity: invite-to-event, last-seen/presence controls, and complete reporting reason/detail flows.
- Notification delivery-method creation/editing, webhook management, event-open read parity, and complete notification preference tooling.
- Native custom-theme editor and a generated full mobile design-token namespace. The token linter still scans web only.
- Replace the Friends screen’s simulated 500 ms refresh gesture with a real reconnect action or remove it.
- Adopt a cached/recycling image component plus display-size thumbnails; original multi-megabyte images are still repeatedly decoded.
- Extract stable memoized list rows for friends, replies, and notifications and evaluate FlashList for high-volume screens.
- Expand rich-content accessibility with heading levels, list/list-item semantics, and link/mention roles.
- Replace hardcoded changelog/version data with release metadata.
- Finish removing generated API `any`/cast debt in global-user, file-upload, friends, and remaining event components.

## Test and observability gaps

- There is no Maestro, Detox, Appium, or equivalent signed-device E2E suite.
- Current mobile coverage is approximately 14%, while the project target is 70%. Ratchet the existing threshold upward with route/hook/component tests rather than changing it to 70% without coverage.
- Global console stubs in mobile test setup can hide unexpected warnings and errors. Replace them with per-test expected spies and fail on unexpected console output.
- Add screen-reader, Dynamic Type, reduced-motion, rotation, split-view, offline/reconnect, deep-link, cold-start, and crash-recovery matrices.
- Add native crash reporting, source maps, release health, and performance instrumentation.
- Native push must be tested on signed physical iOS and Android devices; the simulator cannot establish APNs delivery completeness.

## Live E2E handoff

The prepared simulator can be used once a non-production client is available. The minimum handoff is:

1. Configure non-production `EXPO_PUBLIC_CONVEX_URL` and `EXPO_PUBLIC_BETTER_AUTH_URL`; configure `EXPO_PUBLIC_BASE_URL` and `EAS_PROJECT_ID` for link and push testing.
2. Start the project’s normal user-managed mobile environment and install the matching development client on `Groupi iOS Test`.
3. Provide seeded test identities for organizer, moderator, attendee, friend, and non-member roles plus a disposable event.
4. Execute sign-in/onboarding, signed-out invite return, event creation/editing, availability selection, RSVP/permissions, add-ons, post/reply/attachments, moderation, friends/profile/privacy/account, notification routing/settings, theme variants, error/offline paths, and accessibility passes.
5. Repeat link/auth/push flows on signed physical iOS and Android devices before release.
