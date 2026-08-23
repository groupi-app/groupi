import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const mobileDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const repositoryDir = join(mobileDir, '..', '..');
const linking = JSON.parse(
  readFileSync(join(mobileDir, 'linking.config.json'), 'utf8')
);

const appleApplicationPrefix = process.env.APPLE_APPLICATION_PREFIX?.trim();
const androidFingerprint =
  process.env.ANDROID_SHA256_CERT_FINGERPRINT?.trim().toUpperCase();

if (!/^[A-Z0-9]{10}$/.test(appleApplicationPrefix ?? '')) {
  throw new Error(
    'APPLE_APPLICATION_PREFIX must be the 10-character prefix from the signed iOS application identifier'
  );
}

if (!/^([0-9A-F]{2}:){31}[0-9A-F]{2}$/.test(androidFingerprint ?? '')) {
  throw new Error(
    'ANDROID_SHA256_CERT_FINGERPRINT must be the Play App Signing SHA-256 certificate fingerprint'
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
};

const androidAssociation = [
  {
    relation: ['delegate_permission/common.handle_all_urls'],
    target: {
      namespace: 'android_app',
      package_name: applicationId,
      sha256_cert_fingerprints: [androidFingerprint],
    },
  },
];

mkdirSync(publicDirectory, { recursive: true });
writeFileSync(
  join(publicDirectory, 'apple-app-site-association'),
  `${JSON.stringify(appleAssociation, null, 2)}\n`
);
writeFileSync(
  join(publicDirectory, 'assetlinks.json'),
  `${JSON.stringify(androidAssociation, null, 2)}\n`
);

process.stdout.write(`Wrote link associations for ${linking.appLinkHost}.\n`);
