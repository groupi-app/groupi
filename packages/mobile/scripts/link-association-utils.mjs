import { Buffer } from 'node:buffer';

const SHA256_CERTIFICATE_FINGERPRINT = /^([0-9A-F]{2}:){31}[0-9A-F]{2}$/;

export function normalizeAndroidFingerprints(values) {
  const fingerprints = values
    .flatMap(value => value.split(','))
    .map(fingerprint => fingerprint.trim().toUpperCase());

  if (
    fingerprints.some(
      fingerprint =>
        !fingerprint || !SHA256_CERTIFICATE_FINGERPRINT.test(fingerprint)
    )
  ) {
    throw new Error(
      'Android SHA-256 certificate fingerprints must contain 32 colon-separated bytes'
    );
  }

  return [...new Set(fingerprints)];
}

export function fingerprintToAndroidPasskeyOrigin(fingerprint) {
  const [normalizedFingerprint] = normalizeAndroidFingerprints([fingerprint]);
  const certificateDigest = Buffer.from(
    normalizedFingerprint.replaceAll(':', ''),
    'hex'
  ).toString('base64url');

  return `android:apk-key-hash:${certificateDigest}`;
}
