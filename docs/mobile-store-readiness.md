# Mobile Store Readiness

Public-release preparation and draft listing copy for Groupi. This dated record
does not authorize store submissions, distribution, or publication.

## Table of Contents

- [Verified status](#verified-status)
- [Release blockers](#release-blockers)
- [Android testing sequence](#android-testing-sequence)
- [Draft store listings](#draft-store-listings)
- [Screenshots and acceptance](#screenshots-and-acceptance)
- [Store declarations](#store-declarations)

## Verified status

Production audit checked September 17, 2026 (America/New_York), against source
`237a1fdddf569b4b7097beddd14f784a9d6bdaab`. Firebase setup and Android build
preparation were updated September 26; older artifact evidence below refers to
the runtime-1 build and does not validate the replacement binary.

| Item                        | Evidence and status                                                                                                                                                                                                                                                |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| iOS external TestFlight     | Owner reported submission; a fresh console check requires signing in again. Review status, messages, and saved private review notes remain unverified.                                                                                                             |
| Google Play                 | Personal developer account Groupi Events (`5688705546719346407`) is registered under `theia@groupi.gg`. Identity review and device verification remain pending; no app record or testing track exists.                                                             |
| Android production artifact | EAS build `b9443438-d8f9-4f1e-a603-ce647a0de246` finished: `com.groupi.mobile`, version `0.4.1`, version code `4`, runtime `1`, production profile/channel, store distribution.                                                                                    |
| Android artifact source     | `ef704e7d38f32ab831eca345e587bfbb0f4abcee`. The only mobile/shared differences through the checked production source are the iOS submission app ID and iOS plist whitespace.                                                                                       |
| Android certificate         | The downloaded AAB's certificate SHA-256 matches the EAS certificate in `linking.config.json`: `C3:CE:F7:0F:56:A5:C0:52:C9:7E:BA:D4:30:82:02:92:23:C5:08:B0:76:E1:0C:64:D2:56:55:7A:28:22:79:7F`. This does not establish the future Play app-signing certificate. |
| Artifact integrity          | AAB SHA-256: `500d6dce3b47f2a6f0f4c42375ccbdf4481616d9837884d8f27e15b9adb207d9`. Certificate inspected; complete Android signature verification and device install remain outstanding.                                                                             |
| Embedded production hosts   | Android bundle contains `trustworthy-warthog-524.convex.cloud` and `www.groupi.gg`. Static inspection does not replace an authenticated device test.                                                                                                               |
| Android push                | FCM V1 is assigned in EAS for `groupi-ae0fa`. The runtime-2 signed baseline finished and its Firebase resources were verified (details below); physical push testing remains outstanding.                                                                          |
| Play automation             | EAS reports no Google Play submission service-account key assigned.                                                                                                                                                                                                |
| Association endpoints       | Both canonical `/.well-known` endpoints return direct HTTP 200 JSON. Play app-signing certificate still needs verification and inclusion.                                                                                                                          |
| Public resources            | `/privacy`, `/terms`, `/support`, and `/delete-account` returned HTTP 404. No corresponding public pages were found in source.                                                                                                                                     |
| Structural check            | `pnpm --filter @groupi/mobile release:check` passed. This does not establish store readiness or real-device functionality.                                                                                                                                         |

The owner subsequently confirmed that a new Google Play developer account is
required and selected `theia@groupi.gg` as the owner. Groupi does not have a
business entity or D-U-N-S number, so preparation is proceeding along the personal
account path. Google accepted the owner's two-step verification setup. The public
developer name `Groupi` was unavailable; `Groupi Events` was accepted in the
registration draft. The owner completed registration. The console now confirms
personal account **Groupi Events**, account ID `5688705546719346407`.

The console confirms the owner's identity documents are under review. App
creation remains disabled until account verification is complete. Android-device
verification still requires action; contact-phone verification requires identity
approval first. For device
verification, the owner must sign in to the Google Play Console Android app as
`theia@groupi.gg`, select **Groupi Events**, and follow its instructions. No app
record, Play app-signing certificate, or testing track exists yet.

On September 26, the owner explicitly confirmed shutdown of the old Firebase
project `groupi-916d6` (project number `373694064288`). Google Cloud confirmed it
is shut down and scheduled for deletion after October 26, 2026. Google warns
some resources may be deleted before the 30-day recovery period ends.

The replacement Firebase project is **Groupi**, `groupi-ae0fa`, project number
`665236106441`, created under `theia@groupi.gg` in the `groupi.gg` organization
(`282238878862`) on the Spark plan. Optional Analytics and Gemini setup were
disabled. Android app `com.groupi.mobile` is registered as **Groupi Android**,
Firebase app ID `1:665236106441:android:69d82b8fbf105dd834f118`.
FCM HTTP v1 is enabled. The public Android configuration is now present in
`packages/mobile/google-services.json` and its matching native app copy. Expo
and Gradle wiring is complete locally; shared native runtime is now `2` in Expo,
Android, and iOS metadata. Existing runtime-1 binaries remain on their compatible
updates; new runtime-2 binaries are required for the new native configuration.

The owner approved creating the dedicated push identity
`expo-fcm-push@groupi-ae0fa.iam.gserviceaccount.com`, assigning the Firebase Cloud
Messaging API Admin role, and uploading its private key to Expo's existing
`@theiasurette/groupi-mobile` project. The service account and role are created;
EAS confirmed the private key is uploaded and assigned to `com.groupi.mobile`
for FCM V1. The downloaded private credential is stored outside the repository
with owner-only file permissions; it is not in Downloads or source control.
The owner explicitly approved a temporary policy-admin role and project-only
key-creation exception. After key creation, the project was restored to inherit
`iam.managed.disableServiceAccountKeyCreation` (effective status **Enforced**),
and the temporary organization role was removed. Both restorations were verified
in Google Cloud. The organization-wide policy was never changed.
Device verification is deferred because the owner's current Android device is
outdated and cannot be updated.

The [existing runtime-1 build](https://expo.dev/accounts/theiasurette/projects/groupi-mobile/builds/b9443438-d8f9-4f1e-a603-ce647a0de246)
does not include the new native Firebase configuration. Local `pnpm check`, six
mobile config tests, and release validation passed. Patch changesets for mobile
push configuration and backend credential cleanup are committed.

The [replacement Android build](https://expo.dev/accounts/theiasurette/projects/groupi-mobile/builds/dea56545-5e07-4733-a34e-440f041e1ab5)
finished successfully September 26 from commit
`c44f725d432bfa284bff4fae689d7f38df9eac47`: version `0.4.1`, version code `6`,
native runtime `2`, production environment/profile/channel, store distribution,
and the existing EAS-managed signing key. Version code `5` was consumed by a
pre-upload attempt that stopped when EAS normalized an XML final newline. No
store submission or backend deployment has occurred.

The signed AAB is available from the build page. Its SHA-256 is
`25442c4c16c877da4ba505cf320331d4a325afc8bcd284c1cc077b18e28fa52f`.
Artifact inspection confirmed the new Firebase project number/app ID and the
production Convex/web hosts. The signing certificate matches the existing EAS
certificate listed above. OpenSSL verified the signature over the signing
manifest; the manifest digest and SHA-256 digests of all 1,515 bundle entries
also passed. Physical-device installation and push acceptance remain outstanding.

Two subsequently reported mobile display fixes are committed in `558fa06` and are
**not included** in that build: event covers wait for measured layout and source
dimensions before mounting the native image, and post list text/titles are
constrained to wrap while feed previews preserve block boundaries. The native
image is recreated if its displayed size changes, preventing reuse of a tiny
initial decode. Regression tests and `pnpm check` pass; sharpness and text layout
still require visual acceptance on the affected phone. The owner approved the
patch release note, committed in `348908d`. Include these changes in the next
candidate before final device testing.

## Release blockers

The local release-preparation branch includes a bounded authentication cleanup
repair with component-backed regression tests. It has not been deployed, and it
does not resolve the wider app-data erasure gaps described below.

The repair revokes linked credentials, sessions, passkeys, API keys, and pending
verification credentials before removing the authentication identity. All work
is transactional: failures roll back both app and authentication cleanup.
Magic-link ownership is stored inside verification JSON rather than an indexed
field, so cleanup scans that table. A sufficiently large table can exceed
transaction limits and prevent deletion; test that limit before production
rollout and design indexed ownership or a durable cleanup flow if needed.

1. **Account deletion:** production code removes the Groupi profile but retains
   the Better Auth identity and credentials. It also leaves uploaded attachments
   and other person-associated records. Repair and test both authentication
   cleanup and the complete app-data lifecycle before declaring deletion ready.
   Source: `convex/users/mutations.ts`, `convex/schema.ts`, and
   `convex/tests/push-notifications.test.ts`.
2. **iOS login:** Google and Discord are offered, but no Sign in with Apple or
   equivalent private-email setup flow is implemented. Resolve applicability and
   implement the required equivalent login before public submission. Plain OTP
   and existing passkeys do not establish compliance with
   [Apple guideline 4.8](https://developer.apple.com/app-store/review/guidelines/#login-services).
3. **Public resources:** publish an accurate privacy policy, support/contact
   page, and external account-deletion request path; link the policy in-app.
   Confirm support addresses receive mail. Do not enter the 404 URLs in store
   forms. See [Apple privacy requirements](https://developer.apple.com/app-store/review/guidelines/#privacy)
   and [Google deletion requirements](https://support.google.com/googleplay/android-developer/answer/13327111?hl=en).
4. **Blocking and moderation:** reports and admin content removal exist, but a
   blocked participant in a shared event can still post, reply, and trigger
   notifications visible to the blocker. Define and enforce this behavior.
   Verify objectionable-content filtering, support contact, and timely report
   handling against [Apple guideline 1.2](https://developer.apple.com/app-store/review/guidelines/#user-generated-content).
5. **Reviewer access:** the registry expires and existing provisioning does not
   renew it. Agree an explicit lifecycle that keeps the current account/key
   usable throughout review. Do not rotate or revoke access while reviewers use
   it. Keep credentials out of public testing instructions.
6. **Android services:** Firebase registration, native configuration, FCM V1
   credential assignment, and the runtime-2 signed baseline are complete. Finish
   physical push testing, plus Play account verification, app creation, and
   signing setup. Rebuild with the subsequent display fixes before final testing.
7. **Acceptance and declarations:** complete the physical-device matrix,
   screenshots, privacy disclosures, ratings, agreements, and store metadata.

## Android testing sequence

1. Confirm the Google account that should own Groupi's Play Console account.
   If registration is required, the owner supplies verification information,
   chooses the accurate account type, and approves agreements/payment.
2. Inspect existing Firebase/Google Cloud projects before creating any. Register
   `com.groupi.mobile` in the intended Firebase project. Keep the service-account
   private key separate from the public Android app configuration.
3. Configure Google Services in Expo configuration and the checked-in native
   project. Increment native runtime consistently as required by
   [the update boundary](./mobile-update-boundary.md). Assign FCM V1 credentials
   to EAS using a secure workflow. Follow
   [Expo's FCM instructions](https://docs.expo.dev/push-notifications/fcm-credentials/).
4. Verify the Play app record and enroll in Play App Signing. Prepare the
   internal-test release and obtain confirmation before upload/submission or
   tester access changes. Internal testing does not start a required closed test.
5. Add Play's **app-signing** certificate to `linking.config.json`, retaining
   the EAS certificate. Generate association files and backend passkey origins.
   Deploy through the normal checked pipeline.
6. Validate and produce the necessary signed binary from approved source.
   Configure submission automation separately; first upload may need the console.
7. Install through Play on a physical Android device. Verify push registration,
   background delivery/tap routing, passkeys, and app links.
8. For personal accounts created after November 13, 2023, plan for at least 12
   testers continuously opted in to a closed test for 14 days, followed by a
   production-access application. Verify the actual account's requirement.
   [Google testing requirements](https://support.google.com/googleplay/android-developer/answer/14151465?hl=en)

## Draft store listings

These drafts describe implemented capabilities; device acceptance remains
outstanding. Review copy before entering it in stores.

| Field                    | Draft                                                                              |
| ------------------------ | ---------------------------------------------------------------------------------- |
| App name                 | Groupi: Plan & Share Events                                                        |
| Apple subtitle           | Bring your people together                                                         |
| Apple keywords           | friends,gatherings,party,calendar,rsvp,polls,invites,organizer,meetup,availability |
| Google short description | Plan events, find a date, invite friends, and keep the conversation together.      |
| Category proposal        | Apple: Social Networking; Google Play: Social. Confirm final positioning.          |

### Full description

Make plans with your people, from the first idea to the day of the event.
Groupi brings invitations, date polls, RSVPs, and event conversations into one
place, so everyone can follow along.

**Find a date that works**

Propose dates, collect availability, and see what works for your group.

**Bring everyone together**

Create an event, share an invitation, and keep track of who's coming.

**Keep the details with the plan**

Share updates, photos, and attachments in event posts. Reply to the conversation
without losing the important details in a separate chat.

**Stay in the loop**

Manage event notifications and mute conversations when you need a break.

**Make it yours**

Choose your theme and add a personal touch to your planning space.

Use Groupi on mobile and the web to keep your plans together.

### Initial release notes

Welcome to Groupi! Create events, invite your people, find a date with polls,
collect RSVPs, and share updates and photos in event conversations.

## Screenshots and acceptance

Capture actual release UI with private synthetic events and fictional people.
Use separate iOS and Android captures with dimensions accepted by each console;
do not simulate unimplemented screens or include reviewer credentials.

Suggested sequence:

1. Event list with a few clearly named gatherings.
2. Event details with an image, date, and RSVPs.
3. Date poll with synthetic participant availability.
4. Discussion with posts, a photo, and replies.
5. Invitation sharing without real recipient details.
6. Appearance using the real app UI.

Record OS/device, exact binary/version, delivery channel, date, tester, result,
and defects for each case. Cover:

- Email-code authentication, OAuth, passkeys, session recovery, and sign-out.
- Invitation return after login and cross-platform links.
- Event creation/edit/delete, images, date polls, RSVP, and add-ons.
- Rich-text posts/replies, attachments, image dismissal, and infinite loading.
- Push permission, registration, background receipt, tap routing, mute, and
  sign-out cleanup on physical devices.
- Themes, custom colors, dirty-state dismissal, and OS permissions.
- Offline/relaunch recovery, blocking/reporting, and complete account deletion
  using dedicated disposable normal test users.

Do not enable production E2E fixtures or delete the active reviewer account.

## Store declarations

Derive declarations from actual code, installed SDK behavior, and the final
published policy. Record purpose, user linkage, recipients, optional versus
required collection, retention, and deletion for each category. Do not guess
tracking, sharing, age-rating, or legal answers.

Review identity/profile information; event details and user-supplied locations;
posts/replies/photos/files; friendships/invitations; device push tokens;
authentication/session/passkey records; reports/moderation; and operational
logs. Include Convex, authentication providers, email delivery, and Expo push
services in the assessment where used.

Complete Apple's privacy disclosures, age rating, export compliance,
pricing/territories, agreements/trader requirements, contact details, and saved
private review instructions. Complete Google's Data Safety, rating, target
audience, ads declaration, app access, policy/deletion URLs, and listing assets.
Obtain explicit owner confirmation for public submission after these items and
release validation are complete.
