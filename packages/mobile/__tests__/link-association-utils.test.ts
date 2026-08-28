import { describe, expect, it } from 'vitest';

import {
  fingerprintToAndroidPasskeyOrigin,
  normalizeAndroidFingerprints,
} from '../scripts/link-association-utils.mjs';

const EAS_SIGNING_FINGERPRINT =
  'C3:CE:F7:0F:56:A5:C0:52:C9:7E:BA:D4:30:82:02:92:23:C5:08:B0:76:E1:0C:64:D2:56:55:7A:28:22:79:7F';

describe('native link association configuration', () => {
  it('normalizes and deduplicates signing certificate fingerprints', () => {
    expect(
      normalizeAndroidFingerprints([
        EAS_SIGNING_FINGERPRINT.toLowerCase(),
        ` ${EAS_SIGNING_FINGERPRINT} `,
      ])
    ).toEqual([EAS_SIGNING_FINGERPRINT]);
  });

  it('rejects incomplete signing certificate fingerprints', () => {
    expect(() => normalizeAndroidFingerprints(['AA:BB:CC'])).toThrow(
      '32 colon-separated bytes'
    );
    expect(() =>
      normalizeAndroidFingerprints([`${EAS_SIGNING_FINGERPRINT},`])
    ).toThrow('32 colon-separated bytes');
  });

  it('converts the certificate fingerprint to the Android WebAuthn origin', () => {
    expect(fingerprintToAndroidPasskeyOrigin(EAS_SIGNING_FINGERPRINT)).toBe(
      'android:apk-key-hash:w873D1alwFLJfrrUMIICkiPFCLB24Qxk0lZVeigieX8'
    );
  });
});
