# iOS Testing Environment

Groupi uses an Expo development build for iOS testing. Expo Go is not
sufficient because Groupi relies on native modules and push notifications.

## Requirements

- Apple silicon Mac running a supported macOS release
- Xcode 26.2 or newer for Expo SDK 55
- An iOS Simulator runtime
- CocoaPods and Watchman
- Node.js 20+ and pnpm 10.12.1

Install the command-line prerequisites with Homebrew. The forced link makes
the supported Node release available to ordinary terminal sessions even
though Homebrew treats it as a versioned formula:

```bash
brew install node@22 cocoapods watchman
brew link --overwrite --force node@22
npm install --global pnpm@10.12.1
```

Install Xcode from the Mac App Store, select it, accept its license, and
install the latest iOS Simulator runtime:

```bash
sudo xcode-select --switch /Applications/Xcode.app/Contents/Developer
sudo xcodebuild -license accept
sudo xcodebuild -runFirstLaunch
xcodebuild -downloadPlatform iOS
```

## Configure the native environment

Create the ignored mobile environment file:

```bash
cp packages/mobile/.env.example packages/mobile/.env.local
```

Set all three values. `EAS_PROJECT_ID` must be the Expo project UUID rather
than its slug. For simulator testing, `EXPO_PUBLIC_BETTER_AUTH_URL` can use
`http://localhost:3000`; a physical iPhone needs a LAN-reachable or public
HTTPS URL.

The matching Convex deployment must allow the native project and bundle ID:

```text
EXPO_ALLOWED_PROJECT_IDS=<same EAS project UUID>
EXPO_ALLOWED_APP_IDS=com.groupi.mobile
```

Verify the machine and project configuration:

```bash
pnpm --filter @groupi/mobile ios:check
```

## Run on the dedicated simulator

Install pods after cloning or whenever native dependencies change:

```bash
pnpm --filter @groupi/mobile exec expo prebuild --platform ios --no-install
pnpm --filter @groupi/mobile ios:pods
```

The iOS project is committed, so Expo Doctor's app-config synchronization check
is disabled intentionally. Re-run the prebuild command whenever app config or a
native dependency changes, and review the generated native diff before
committing it.

Compile and install the development client on the `Groupi iOS Test`
simulator:

```bash
pnpm --filter @groupi/mobile ios:test
```

Subsequent JavaScript-only changes can use the normal Expo development server
without rebuilding the native client. Source the optional helpers for app
lifecycle, screenshots, deep links, and simulated notification payloads:

```bash
source packages/mobile/scripts/sim-helpers.sh
sim_restart
sim_shot groupi-home
sim_push
```

## EAS simulator build

`packages/mobile/eas.json` includes an `ios-simulator` development-client
profile. From the mobile package, an authenticated Expo user can create a
shareable simulator build with:

```bash
pnpm dlx eas-cli@22.2.0 build --platform ios --profile ios-simulator
```

Simulator builds do not require an Apple Developer account. A physical-device
development build and production push credentials do require the appropriate
Apple Developer and APNs configuration.

Signed physical-device previews, automated Maestro runs, and store builds are
documented in [Mobile Build, Device Test, and Release](./mobile-release.md).

## Push smoke testing

The iOS Simulator supports push testing on modern Xcode/iOS runtimes. Two
useful levels are available:

1. `sim_push` injects an APNs-shaped payload directly into the installed app.
   This checks presentation and tap routing without contacting Expo or APNs.
2. End-to-end Expo push testing requires a real `EAS_PROJECT_ID`, the matching
   Convex allowlists, notification permission, and valid Expo/APNs credentials.

Always repeat the final push, passkey, camera, and background-delivery checks
on a physical iPhone before release.
