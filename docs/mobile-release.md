# Mobile Build, Device Test, and Release

Groupi uses EAS Build for signed native artifacts and EAS Workflows for
cross-platform Maestro smoke tests and store delivery. Run EAS commands from
`packages/mobile`, which is the Expo app root in this monorepo.

## Build profiles

`packages/mobile/eas.json` defines the release progression:

| Profile           | Signing                    | Backend     | Purpose                                     |
| ----------------- | -------------------------- | ----------- | ------------------------------------------- |
| `ios-simulator`   | None                       | Development | Local simulator development                 |
| `e2e-test`        | None                       | Preview     | Automated preview Maestro tests             |
| `preview`         | EAS-managed device signing | Preview     | Physical-device preview testing             |
| `production-test` | None                       | Production  | Non-mutating hosted production smoke tests  |
| `acceptance`      | EAS-managed device signing | Production  | Installable production acceptance artifacts |
| `production`      | EAS-managed store signing  | Production  | Store submission                            |

Production build numbers use EAS remote versioning and auto-increment. Android
automated submission is deliberately limited to the completed Google Play
internal-test track. iOS submission uploads to App Store Connect/TestFlight;
promotion beyond internal testing remains an explicit store-console action.

## One-time Expo and signing setup

The app is linked to
[`@theiasurette/groupi-mobile`](https://expo.dev/accounts/theiasurette/projects/groupi-mobile)
with project ID `15aeaffd-755c-4f24-96b9-dd9f1bc25e6f`. Install EAS CLI and
sign in to the Groupi Expo owner account. Do not commit access tokens, signing
keys, provisioning profiles, or store service-account JSON files.

```bash
cd packages/mobile
eas login
eas credentials:configure-build --platform android --profile production
eas credentials:configure-build --platform ios --profile production
```

Android managed production signing is configured. The iOS App ID belongs to
Apple team `X2HQQURT9V`; its explicit bundle ID is `com.groupi.mobile`, and
Associated Domains is enabled. EAS-managed iOS signing is configured for
physical-device previews, TestFlight, push entitlements, and App Store release.

Create EAS `preview` and `production` environment variables for:

- `EXPO_PUBLIC_CONVEX_URL`
- `EXPO_PUBLIC_BETTER_AUTH_URL`
- `EXPO_PUBLIC_BASE_URL=https://www.groupi.gg`

Configure the matching Convex deployments with `SITE_URL=https://www.groupi.gg`,
`PASSKEY_RP_ID=www.groupi.gg`, `PASSKEY_RP_NAME=Groupi`, and
`PASSKEY_ANDROID_ORIGINS=android:apk-key-hash:w873D1alwFLJfrrUMIICkiPFCLB24Qxk0lZVeigieX8`.
Authentication rejects missing, insecure, unrelated relying-party
configuration, and unregistered Android certificate origins instead of
silently falling back to localhost.

The `acceptance`, `production-test`, and `production` build profiles fail during
app configuration unless all three public URLs are present, use HTTPS, and
point to the canonical Groupi web/auth host plus a Convex cloud deployment.
This prevents a signed acceptance or store artifact from accidentally embedding
local or preview web endpoints. Selecting the correct production Convex
deployment remains an owner-controlled EAS environment operation.

The build worker provides `EAS_BUILD_PROJECT_ID`; local development may still
set `EAS_PROJECT_ID` in the ignored `packages/mobile/.env.local` file. Configure
the matching Convex deployment with this project ID in
`EXPO_ALLOWED_PROJECT_IDS` and `com.groupi.mobile` in
`EXPO_ALLOWED_APP_IDS` before physical push testing.

For GitHub dispatch, add the repository secrets `EXPO_TOKEN` and
`EAS_PROJECT_ID`. Connect the EAS project to this GitHub repository if the
`mobile-e2e` pull-request label trigger should run directly in EAS.

## Automated pipelines

The GitHub **Mobile Build and Release** workflow exposes five manual choices:

- `e2e-tests`: unsigned Android emulator and iOS Simulator builds, followed by
  Maestro on both platforms;
- `signed-preview`: EAS-signed installable builds for physical-device QA;
- `production-acceptance`: source-gated, signed installable artifacts connected
  to production, without any store submission;
- `production-e2e`: non-mutating Android/iOS hosted smoke tests against the
  production environment;
- `release-internal`: signed store builds, Android internal-track release, and
  iOS App Store Connect upload.

EAS-hosted `maestro` workflow jobs require a paid Expo plan. The preview and
production E2E workflows and flows are ready, but the current Expo account
cannot execute or fully validate that job type until the plan is enabled.
Signed preview, production acceptance, and internal release workflows validate
successfully without that entitlement.

The same pipelines can be run directly from the app directory:

```bash
pnpm test:e2e
pnpm test:e2e:production
pnpm build:preview
pnpm build:acceptance
pnpm release:internal
```

E2E builds read the EAS `preview` environment. The current Maestro suite covers
cold launch, the native authentication surface, client-side email validation,
and signed-out invite deep-link routing. Authenticated provider, session,
attachment, event, and push delivery flows require preview test identities and
a reachable E2E-enabled backend before they can be automated safely.

Production E2E intentionally excludes the authenticated fixture because that
fixture creates and removes records. It runs only signed-out, non-destructive
smoke, routing, invite-return, and process-recovery flows. Authenticated
production acceptance is a manual test with dedicated test accounts after the
signed `acceptance` artifacts install.

Run the structural release guard without contacting EAS:

```bash
pnpm release:check
```

## Universal-link trust files

The native app claims `www.groupi.gg`, so the website must publish association
files derived from the actual signing identities. The Apple application prefix
was verified in the developer portal as `X2HQQURT9V`. The checked-in Android
certificate is the EAS-managed certificate used for signed preview and direct
production artifacts:

- SHA-256 fingerprint:
  `C3:CE:F7:0F:56:A5:C0:52:C9:7E:BA:D4:30:82:02:92:23:C5:08:B0:76:E1:0C:64:D2:56:55:7A:28:22:79:7F`
- Android passkey origin:
  `android:apk-key-hash:w873D1alwFLJfrrUMIICkiPFCLB24Qxk0lZVeigieX8`

When Google Play App Signing is provisioned, add its **app-signing** SHA-256
fingerprint to `linking.config.json` alongside the EAS certificate. The Play
certificate is distinct from the EAS upload certificate and is required for
links and passkeys in Play-distributed builds.

Generate the public files, review them, and commit them with the signing setup:

```bash
pnpm mobile:link-associations
```

The generator refreshes both website files from `linking.config.json`, prints
the exact `PASSKEY_ANDROID_ORIGINS` value required by Convex, and supports
temporary additional fingerprints through the comma-separated
`ANDROID_SHA256_CERT_FINGERPRINTS` environment variable. Persist every trusted
certificate in `linking.config.json` before release so `pnpm release:check` can
verify that the published source matches the signed applications exactly.

Deploy the web app, then verify direct HTTP 200 JSON responses at:

- `https://www.groupi.gg/.well-known/apple-app-site-association`
- `https://www.groupi.gg/.well-known/assetlinks.json`

The Apple association file must include both the universal-link `applinks`
details and a `webcredentials.apps` entry for
`<APPLE_APPLICATION_PREFIX>.com.groupi.mobile`. The latter is required for
native passkey registration and sign-in.

Finally, uninstall/reinstall signed builds so both operating systems fetch the
new associations, and test links from Messages/Mail on physical iOS and Android
devices. Redirected links from `groupi.gg` do not substitute for hosting the
files directly on the claimed `www.groupi.gg` domain.

## Release acceptance

### Activation status (verified 2026-08-28)

- The Expo project is linked and its production environment contains the
  canonical public base/auth URLs plus the live production Convex URL.
- The production Convex deployment trusts the EAS project ID, native app ID,
  and current EAS Android signing origin. `E2E_TESTING` is `false`.
- The signed preview, production acceptance, and internal-release workflow
  definitions pass Expo's hosted validator. Hosted Maestro validation is
  blocked only by the account's paid-plan entitlement.
- No iOS test devices are registered with Apple team `X2HQQURT9V`, so an ad hoc
  iOS acceptance artifact cannot include a device until registration is
  completed.
- Both live `www.groupi.gg/.well-known` association endpoints still return 404.
  Their checked-in sources and JSON headers are ready, but the web branch must
  be deployed before universal links and native passkeys can be accepted on
  signed devices.
- The direct EAS Android certificate is published in source. The Google Play
  app-signing fingerprint must be added after Play App Signing exists; it does
  not block direct APK acceptance testing.

Before promotion beyond internal testing, exercise native Google, Discord,
magic-link, and OTP sign-in; invite return; event creation and editing;
availability and RSVP; add-ons; infinite post loading; attachment rollback;
notification receipt/tap/sign-out behavior; camera and media permissions;
offline recovery; and universal links. Repeat push, background delivery,
passkey behavior, and link verification on signed physical iOS and Android
devices because simulator results are not sufficient for these capabilities.
