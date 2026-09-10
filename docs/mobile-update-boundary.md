# Mobile Update and Server Boundary

This audit defines which Groupi mobile changes can ship through EAS Update,
which behavior belongs on the Convex backend, and which changes require a new
App Store or Play Store binary.

## Delivery layers

| Layer                | Examples                                                                                                                                   | Delivery                                    |
| -------------------- | ------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------- |
| Server-authoritative | authorization, event membership, invite validity, attachment validation, notification fan-out, vote aggregation                            | Convex deployment; takes effect immediately |
| Mobile update        | screens, styling, copy, navigation logic, client validation, rich-text behavior, bundled JavaScript and compatible assets                  | EAS Update; no store review                 |
| Native binary        | native dependencies, permissions, entitlements, app identifiers, passkey module, notification capabilities, icons and splash configuration | signed store build and review               |

The mobile app uses a fingerprint runtime version. An update is therefore
offered only to binaries whose native dependencies and configuration are
compatible with it. Preview, acceptance, production-test, and production use
separate update channels so a QA update cannot reach store users.

## Audit findings

Most application behavior is already in the correct layer. Convex owns the
security-sensitive operations and database invariants, while the mobile app
mostly contains presentation and immediate interaction logic. Moving ordinary
React Native code to Convex would add latency and offline failure modes without
making releases meaningfully faster now that EAS Update is enabled.

The following client constants duplicate backend policy and are candidates for
a small, cacheable server capabilities query:

- attachment size, count, and MIME type limits in
  `packages/mobile/src/lib/file-upload-policy.ts`;
- invite message limits and link-expiry choices in
  `packages/mobile/src/components/invites/`;
- supported notification categories in
  `packages/mobile/src/hooks/use-settings.ts`;
- report reasons in `packages/mobile/src/lib/report-options.ts`.

The backend already enforces the important attachment, invite, reply, event,
permission, and add-on invariants. Until capabilities are exposed, the client
copies above are convenience validation only and must never be treated as the
security boundary.

## Recommended server additions

1. Add a public, versioned mobile-capabilities query containing mutable policy
   limits, supported feature flags, a minimum supported native runtime, and an
   optional maintenance or release notice.
2. Cache the last successful capabilities response on-device and ship safe
   defaults so startup and offline use do not depend on the query.
3. Keep enforcement beside each Convex mutation even after the UI consumes the
   capabilities response.
4. Move changelog and help content to a public content source only if it needs
   to change independently of an OTA release.

These are operational improvements rather than store-launch blockers. They
should be implemented as one backend contract instead of several one-off
configuration queries.

## Code that should remain in the update layer

- sorting, filtering, infinite-scroll state, navigation, and accessibility;
- theme rendering and built-in visual tokens;
- rich-text editing and safe rendering;
- local GDL parsing for immediate previews;
- labels, icons, empty states, and platform-specific layout;
- defensive client validation that mirrors server validation for fast feedback.

The authoritative GDL parser, sanitizer, and mutations should remain available
server-side as applicable, but making the UI call the server for every edit
would degrade the mobile experience.

## Code that must remain native

- passkey and secure-storage bridges;
- push-notification registration and native notification capabilities;
- camera, photo-library, and document-picker permissions;
- universal/app-link entitlements and Android intent filters;
- bundle identifiers, signing, native dependency versions, app icon, and splash
  assets.

Any pull request touching these areas must create a new runtime fingerprint and
a signed binary before an update using that code is published.
