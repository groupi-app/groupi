import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

import {
  fingerprintToAndroidPasskeyOrigin,
  normalizeAndroidFingerprints,
} from './link-association-utils.mjs';

const mobileDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDir = join(mobileDir, '..', '..');
const linking = JSON.parse(
  readFileSync(join(mobileDir, 'linking.config.json'), 'utf8')
);

const appleApplicationPrefix =
  process.env.APPLE_APPLICATION_PREFIX?.trim() ??
  linking.appleApplicationPrefix;
const androidFingerprintInput = [
  ...(linking.androidSha256CertFingerprints ?? []),
];
if (process.env.ANDROID_SHA256_CERT_FINGERPRINTS?.trim()) {
  androidFingerprintInput.push(process.env.ANDROID_SHA256_CERT_FINGERPRINTS);
}
if (process.env.ANDROID_SHA256_CERT_FINGERPRINT?.trim()) {
  androidFingerprintInput.push(process.env.ANDROID_SHA256_CERT_FINGERPRINT);
}
const androidFingerprints = normalizeAndroidFingerprints(
  androidFingerprintInput
);

if (!/^[A-Z0-9]{10}$/.test(appleApplicationPrefix ?? '')) {
  throw new Error(
    'APPLE_APPLICATION_PREFIX must be the 10-character prefix from the signed iOS application identifier'
  );
}

const applicationId = 'com.groupi.mobile';
const publicDirectory = join(
  repositoryDir,
  'packages',
  'web',
  'public',
  '.well-known'
);
const components = linking.pathPrefixes.flatMap(pathPrefix => [
  {
    '/': pathPrefix,
    comment: `Open the Groupi route ${pathPrefix}`,
  },
  {
    '/': `${pathPrefix}/*`,
    comment: `Open Groupi routes under ${pathPrefix}`,
  },
]);

const appleAssociation = {
  applinks: {
    details: [
      {
        appIDs: [`${appleApplicationPrefix}.${applicationId}`],
        components,
      },
    ],
  },
  webcredentials: {
    apps: [`${appleApplicationPrefix}.${applicationId}`],
  },
};

const androidAssociation = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: applicationId,
      sha256_cert_fingerprints: androidFingerprints,
    },
  },
];

const androidPasskeyOrigins = androidFingerprints.map(
  fingerprintToAndroidPasskeyOrigin
);

mkdirSync(publicDirectory, { recursive: true });
writeFileSync(
  join(publicDirectory, 'apple-app-site-association'),
  `${JSON.stringify(appleAssociation, null, 2)}\n`
);

if (androidFingerprints.length > 0) {
  writeFileSync(
    join(publicDirectory, 'assetlinks.json'),
    `${JSON.stringify(androidAssociation, null, 2)}\n`
  );
}

process.stdout.write(
  `Wrote Apple association${androidFingerprints.length > 0 ? ' and Android asset links' : ''} for ${linking.appLinkHost}.\n`
);
if (androidPasskeyOrigins.length > 0) {
  process.stdout.write(
    `Configure PASSKEY_ANDROID_ORIGINS=${androidPasskeyOrigins.join(',')} on the matching Convex deployment.\n`
  );
}
