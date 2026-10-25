import { readFileSync, writeFileSync } from 'node:fs';
import { dirname, join } from 'node:path';
import process from 'node:process';
import { fileURLToPath } from 'node:url';

const mobileDir = join(dirname(fileURLToPath(import.meta.url)), '..');
const packageJson = JSON.parse(
  readFileSync(join(mobileDir, 'package.json'), 'utf8')
);
const version = packageJson.version;

if (typeof version !== 'string' || !/^\d+\.\d+\.\d+$/.test(version)) {
  throw new Error(`Unsupported mobile package version: ${String(version)}`);
}

function replaceVersion(relativePath, pattern, replacement) {
  const path = join(mobileDir, relativePath);
  const source = readFileSync(path, 'utf8');

  if (!source.match(pattern)) {
    throw new Error(`Could not synchronize ${relativePath}`);
  }

  writeFileSync(path, source.replace(pattern, replacement));
}

replaceVersion(
  'app.config.ts',
  /version: '\d+\.\d+\.\d+',/,
  `version: '${version}',`
);
replaceVersion(
  'android/app/build.gradle',
  /versionName "\d+\.\d+\.\d+"/,
  `versionName "${version}"`
);
replaceVersion(
  'ios/Groupi/Info.plist',
  /(<key>CFBundleShortVersionString<\/key>\s*<string>)\d+\.\d+\.\d+(<\/string>)/,
  `$1${version}$2`
);
replaceVersion(
  'ios/Groupi.xcodeproj/project.pbxproj',
  /MARKETING_VERSION = \d+\.\d+(?:\.\d+)?;/g,
  `MARKETING_VERSION = ${version};`
);

process.stdout.write(`Synchronized native mobile version ${version}.\n`);
