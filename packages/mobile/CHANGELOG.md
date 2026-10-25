# @groupi/mobile

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
