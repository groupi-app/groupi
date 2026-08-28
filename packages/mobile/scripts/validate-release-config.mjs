import { readFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

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
const appConfig = read('app.config.ts');
const androidBuild = read('android/app/build.gradle');
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

assert(
  eas.cli?.appVersionSource === 'remote',
  'EAS build versions must be managed remotely'
);
assert(
  eas.build?.['e2e-test']?.withoutCredentials === true &&
    eas.build?.['e2e-test']?.ios?.simulator === true &&
    eas.build?.['e2e-test']?.android?.buildType === 'apk',
  'The e2e-test profile must create unsigned simulator/emulator artifacts'
);
assert(
  eas.build?.preview?.distribution === 'internal',
  'The preview profile must create signed internal-distribution builds'
);
assert(
  eas.build?.production?.distribution === 'store' &&
    eas.build?.production?.autoIncrement === true,
  'The production profile must create versioned store builds'
);
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
assert(
  linking.appLinkHost === 'www.groupi.gg',
  'Release links must use the canonical www.groupi.gg host'
);
assert(
  linking.appleApplicationPrefix === 'X2HQQURT9V',
  'The Apple application prefix must match the registered Groupi App ID'
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

for (const workflow of [
  '.eas/workflows/e2e-tests.yml',
  '.eas/workflows/signed-preview.yml',
  '.eas/workflows/release-internal.yml',
]) {
  const source = read(workflow);
  assert(
    source.includes('type: build'),
    `${workflow} must contain a build job`
  );
}

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

process.stdout.write('Mobile release configuration is structurally valid.\n');
