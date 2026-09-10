import { existsSync, readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  fingerprintToAndroidPasskeyOrigin,
  normalizeAndroidFingerprints,
} from './link-association-utils.mjs';

const mobileDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDir = join(mobileDir, '..', '..');

function read(relativePath) {
  return readFileSync(join(mobileDir, relativePath), 'utf8');
}

function assert(condition, message) {
  if (!condition) {
    throw new Error(message);
  }
}

const eas = JSON.parse(read('eas.json'));
const mobilePackage = JSON.parse(read('package.json'));
const appConfig = read('app.config.ts');
const androidBuild = read('android/app/build.gradle');
const androidManifest = read('android/app/src/main/AndroidManifest.xml');
const androidStrings = read('android/app/src/main/res/values/strings.xml');
const iosInfoPlist = read('ios/Groupi/Info.plist');
const iosExpoPlist = read('ios/Groupi/Supporting/Expo.plist');
const iosProject = read('ios/Groupi.xcodeproj/project.pbxproj');
const associationGenerator = read('scripts/generate-link-associations.mjs');
const linking = JSON.parse(read('linking.config.json'));
const webConfig = readFileSync(
  join(repositoryDir, 'packages', 'web', 'next.config.mjs'),
  'utf8'
);
const appleAssociation = JSON.parse(
  readFileSync(
    join(
      repositoryDir,
      'packages',
      'web',
      'public',
      '.well-known',
      'apple-app-site-association'
    ),
    'utf8'
  )
);
const androidAssociation = JSON.parse(
  readFileSync(
    join(
      repositoryDir,
      'packages',
      'web',
      'public',
      '.well-known',
      'assetlinks.json'
    ),
    'utf8'
  )
);

assert(
  eas.cli?.appVersionSource === 'remote',
  'EAS build versions must be managed remotely'
);
assert(
  eas.cli?.requireCommit === true,
  'EAS release builds must come from a committed source state'
);
assert(
  eas.build?.['e2e-test']?.withoutCredentials === true &&
    eas.build?.['e2e-test']?.ios?.simulator === true &&
    eas.build?.['e2e-test']?.android?.buildType === 'apk',
  'The e2e-test profile must create unsigned simulator/emulator artifacts'
);
assert(
  eas.build?.['production-test']?.extends === 'e2e-test' &&
    eas.build?.['production-test']?.environment === 'production',
  'The production-test profile must test the production environment without release credentials'
);
assert(
  eas.build?.preview?.distribution === 'internal',
  'The preview profile must create signed internal-distribution builds'
);
assert(
  eas.build?.acceptance?.extends === 'preview' &&
    eas.build?.acceptance?.environment === 'production',
  'The acceptance profile must create signed internal builds against production'
);
assert(
  eas.build?.production?.distribution === 'store' &&
    eas.build?.production?.autoIncrement === true &&
    eas.build?.production?.channel === 'production',
  'The production profile must create versioned store builds'
);
for (const [profile, channel] of [
  ['preview', 'preview'],
  ['acceptance', 'acceptance'],
  ['production-test', 'production-test'],
]) {
  assert(
    eas.build?.[profile]?.channel === channel,
    `The ${profile} build profile must use the isolated ${channel} update channel`
  );
}
assert(
  eas.submit?.production?.android?.track === 'internal' &&
    eas.submit?.production?.android?.releaseStatus === 'completed',
  'Android automated submission must remain on the internal test track'
);

assert(
  appConfig.includes("owner: 'theiasurette'") &&
    appConfig.includes("'15aeaffd-755c-4f24-96b9-dd9f1bc25e6f'") &&
    appConfig.includes("bundleIdentifier: 'com.groupi.mobile'") &&
    appConfig.includes("package: 'com.groupi.mobile'"),
  'Expo ownership/project linkage and native application IDs must remain stable'
);
const escapedMobileVersion = mobilePackage.version.replaceAll('.', '\\.');
assert(
  new RegExp(`version: '${escapedMobileVersion}'`).test(appConfig) &&
    new RegExp(`versionName "${escapedMobileVersion}"`).test(androidBuild) &&
    new RegExp(
      `<key>CFBundleShortVersionString<\\/key>\\s*<string>${escapedMobileVersion}<\\/string>`
    ).test(iosInfoPlist) &&
    new RegExp(`MARKETING_VERSION = ${escapedMobileVersion};`).test(iosProject),
  'Mobile package, Expo, Android, and iOS marketing versions must match; run pnpm mobile:sync-version'
);
assert(
  appConfig.includes('supportsTablet: false') &&
    iosProject.match(/TARGETED_DEVICE_FAMILY = 1;/g)?.length === 2,
  'The first store release must remain phone-only until iPad QA and screenshots are complete'
);
assert(
  appConfig.includes("policy: 'fingerprint'") &&
    appConfig.includes('https://u.expo.dev/${easProjectId}') &&
    appConfig.includes("checkAutomatically: 'ON_LOAD'") &&
    appConfig.includes('fallbackToCacheTimeout: 0'),
  'EAS Update must use a native-compatible fingerprint and check safely on launch'
);
assert(
  androidManifest.includes(
    'https://u.expo.dev/15aeaffd-755c-4f24-96b9-dd9f1bc25e6f'
  ) &&
    androidManifest.includes(
      'expo.modules.updates.EXPO_RUNTIME_VERSION" android:value="@string/expo_runtime_version"'
    ) &&
    androidStrings.includes('file:fingerprint') &&
    iosExpoPlist.includes(
      'https://u.expo.dev/15aeaffd-755c-4f24-96b9-dd9f1bc25e6f'
    ) &&
    iosExpoPlist.includes('file:fingerprint'),
  'Checked-in native projects must use the Groupi EAS Update URL and fingerprint runtime'
);
assert(
  androidManifest.includes(
    'expo.modules.updates.ENABLED" android:value="true"'
  ) &&
    iosExpoPlist.includes('<key>EXUpdatesEnabled</key>') &&
    iosExpoPlist.includes('<true/>'),
  'EAS Update must remain enabled in both checked-in native projects'
);
for (const profile of ['acceptance', 'production', 'production-test']) {
  assert(
    appConfig.includes(`'${profile}'`),
    `Production URL validation must cover the ${profile} profile`
  );
}
for (const variable of [
  'EXPO_PUBLIC_BASE_URL',
  'EXPO_PUBLIC_BETTER_AUTH_URL',
  'EXPO_PUBLIC_CONVEX_URL',
]) {
  assert(
    appConfig.includes(`'${variable}'`),
    `${variable} must be validated before a production-backed build`
  );
}
assert(
  linking.appLinkHost === 'www.groupi.gg',
  'Release links must use the canonical www.groupi.gg host'
);
assert(
  linking.appleApplicationPrefix === 'X2HQQURT9V',
  'The Apple application prefix must match the registered Groupi App ID'
);
assert(
  Array.isArray(linking.androidSha256CertFingerprints) &&
    linking.androidSha256CertFingerprints.length > 0,
  'At least one valid signed Android certificate fingerprint must be registered'
);
const registeredAndroidFingerprints = normalizeAndroidFingerprints(
  linking.androidSha256CertFingerprints
);
assert(
  appConfig.includes('`webcredentials:${appLinkHost}`'),
  'iOS must declare the passkey relying-party domain as a web credential association'
);
assert(
  associationGenerator.includes('webcredentials') &&
    associationGenerator.includes('appleApplicationPrefix'),
  'The Apple association generator must publish the signed app ID for passkeys'
);
const signedAppleApplicationId = `${linking.appleApplicationPrefix}.com.groupi.mobile`;
assert(
  appleAssociation.webcredentials?.apps?.includes(signedAppleApplicationId) &&
    appleAssociation.applinks?.details?.some(detail =>
      detail.appIDs?.includes(signedAppleApplicationId)
    ),
  'The deployed Apple association source must match the signed Groupi application ID'
);
const androidAppTarget = androidAssociation.find(
  statement =>
    statement.relation?.includes(
      'delegate_permission/common.handle_all_urls'
    ) &&
    statement.target?.namespace === 'android_app' &&
    statement.target?.package_name === 'com.groupi.mobile'
);
assert(
  androidAppTarget,
  'The Android association source must authorize the Groupi application ID'
);
const publishedAndroidFingerprints =
  androidAppTarget.target.sha256_cert_fingerprints;
assert(
  Array.isArray(publishedAndroidFingerprints) &&
    publishedAndroidFingerprints.length ===
      registeredAndroidFingerprints.length &&
    registeredAndroidFingerprints.every(fingerprint =>
      publishedAndroidFingerprints.includes(fingerprint)
    ),
  'Android asset links must exactly match the registered signing certificates'
);
assert(
  webConfig.includes("source: '/.well-known/apple-app-site-association'") &&
    webConfig.includes("source: '/.well-known/assetlinks.json'") &&
    webConfig.includes("{ key: 'Content-Type', value: 'application/json' }"),
  'The web app must serve both link-association files as application/json'
);

const releaseBlock = androidBuild.match(/release\s*\{([\s\S]*?)\n\s*\}/)?.[1];
assert(releaseBlock, 'Android release build type is missing');
assert(
  !/signingConfig\s+signingConfigs\.debug/.test(releaseBlock),
  'Android release builds must never use the repository debug key'
);
for (const density of ['mdpi', 'hdpi', 'xhdpi', 'xxhdpi', 'xxxhdpi']) {
  assert(
    existsSync(
      join(
        mobileDir,
        'android',
        'app',
        'src',
        'main',
        'res',
        `drawable-${density}`,
        'notification_icon.png'
      )
    ),
    `Android notification icon is missing for ${density}`
  );
}
assert(
  !iosInfoPlist.includes('NSMicrophoneUsageDescription') &&
    appConfig.includes('microphonePermission: false') &&
    androidManifest.includes(
      'android.permission.RECORD_AUDIO" tools:node="remove"'
    ) &&
    androidManifest.includes(
      'android.permission.SYSTEM_ALERT_WINDOW" tools:node="remove"'
    ),
  'Release builds must not request microphone access when Groupi only captures still images'
);
for (const metadataName of [
  'com.google.firebase.messaging.default_notification_icon',
  'expo.modules.notifications.default_notification_icon',
]) {
  assert(
    androidManifest.includes(metadataName),
    `Android notification metadata is missing ${metadataName}`
  );
}

for (const workflow of [
  '.eas/workflows/e2e-tests.yml',
  '.eas/workflows/signed-preview.yml',
  '.eas/workflows/production-acceptance.yml',
  '.eas/workflows/production-e2e.yml',
  '.eas/workflows/release-internal.yml',
]) {
  const source = read(workflow);
  assert(
    source.includes('type: build'),
    `${workflow} must contain a build job`
  );
}

for (const workflow of [
  '.eas/workflows/signed-preview.yml',
  '.eas/workflows/production-acceptance.yml',
  '.eas/workflows/production-e2e.yml',
  '.eas/workflows/release-internal.yml',
]) {
  const source = read(workflow);
  for (const command of [
    'pnpm release:check',
    'pnpm type-check',
    'pnpm test:run',
  ]) {
    assert(
      source.includes(`command: ${command}`),
      `${workflow} must run ${command} before signed builds`
    );
  }
  assert(
    source.includes('needs: [validate]'),
    `${workflow} signed builds must wait for source validation`
  );
}

const productionE2eWorkflow = read('.eas/workflows/production-e2e.yml');
assert(
  productionE2eWorkflow.includes('profile: production-test') &&
    productionE2eWorkflow.includes('environment: production'),
  'Production E2E must test production-backed unsigned builds'
);
assert(
  !productionE2eWorkflow.includes('authenticated-event.yml'),
  'Production E2E must never seed the production backend'
);

const maestroFlows = [
  '.maestro/smoke.yml',
  '.maestro/invite-link.yml',
  '.maestro/protected-routes.yml',
  '.maestro/process-recovery.yml',
  '.maestro/authenticated-event.yml',
];
const e2eWorkflow = read('.eas/workflows/e2e-tests.yml');

for (const flow of maestroFlows) {
  assert(
    read(flow).includes('appId: com.groupi.mobile'),
    `${flow} must target the release application ID`
  );
  assert(
    e2eWorkflow.includes(`'${flow}'`),
    `${flow} must run in the EAS mobile E2E workflow`
  );
}

const authenticatedFlow = read('.maestro/authenticated-event.yml');
assert(
  authenticatedFlow.includes('onFlowStart:') &&
    authenticatedFlow.includes('onFlowComplete:') &&
    authenticatedFlow.includes('setup-authenticated-fixture.js') &&
    authenticatedFlow.includes('cleanup-authenticated-fixture.js'),
  'Authenticated E2E must seed and clean its isolated fixture through hooks'
);

const rootPackage = JSON.parse(
  readFileSync(join(repositoryDir, 'package.json'), 'utf8')
);
assert(
  rootPackage.scripts?.['build:mobile'] ===
    'cd packages/mobile && pnpm build:android',
  'Root build:mobile must delegate to the mobile production build script'
);

const androidPasskeyOrigins = registeredAndroidFingerprints.map(
  fingerprintToAndroidPasskeyOrigin
);

process.stdout.write(
  `Mobile release configuration is structurally valid. Convex must trust PASSKEY_ANDROID_ORIGINS=${androidPasskeyOrigins.join(',')}.\n`
);
