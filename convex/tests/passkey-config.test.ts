import { describe, expect, it } from 'vitest';

import { resolvePasskeyConfig } from '../lib/passkeyConfig';

describe('passkey configuration', () => {
  it('derives the relying party from the canonical site URL', () => {
    expect(resolvePasskeyConfig({ siteUrl: 'https://www.groupi.gg/' })).toEqual(
      {
        origin: 'https://www.groupi.gg',
        rpID: 'www.groupi.gg',
        rpName: 'Groupi',
        siteOrigin: 'https://www.groupi.gg',
      }
    );
  });

  it('allows a parent domain as a relying party', () => {
    expect(
      resolvePasskeyConfig({
        siteUrl: 'https://auth.example.com',
        rpId: 'example.com',
        rpName: 'Example',
      })
    ).toEqual({
      origin: 'https://auth.example.com',
      rpID: 'example.com',
      rpName: 'Example',
      siteOrigin: 'https://auth.example.com',
    });
  });

  it('trusts configured Android signing-certificate origins', () => {
    const playSigningOrigin =
      'android:apk-key-hash:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA';
    const previewSigningOrigin =
      'android:apk-key-hash:BBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBBB';

    expect(
      resolvePasskeyConfig({
        siteUrl: 'https://www.groupi.gg',
        androidOrigins: ` ${playSigningOrigin},${previewSigningOrigin},${playSigningOrigin} `,
      })
    ).toMatchObject({
      origin: [
        'https://www.groupi.gg',
        playSigningOrigin,
        previewSigningOrigin,
      ],
      siteOrigin: 'https://www.groupi.gg',
    });
  });

  it('rejects malformed Android signing-certificate origins', () => {
    expect(() =>
      resolvePasskeyConfig({
        siteUrl: 'https://www.groupi.gg',
        androidOrigins: 'https://www.groupi.gg',
      })
    ).toThrow('PASSKEY_ANDROID_ORIGINS');
    expect(() =>
      resolvePasskeyConfig({
        siteUrl: 'https://www.groupi.gg',
        androidOrigins: 'android:apk-key-hash:not-a-sha256-digest',
      })
    ).toThrow('PASSKEY_ANDROID_ORIGINS');
    expect(() =>
      resolvePasskeyConfig({
        siteUrl: 'https://www.groupi.gg',
        androidOrigins:
          'android:apk-key-hash:w873D1alwFLJfrrUMIICkiPFCLB24Qxk0lZVeigieX8=',
      })
    ).toThrow('PASSKEY_ANDROID_ORIGINS');
    expect(() =>
      resolvePasskeyConfig({
        siteUrl: 'https://www.groupi.gg',
        androidOrigins:
          'android:apk-key-hash:AAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA,',
      })
    ).toThrow('PASSKEY_ANDROID_ORIGINS');
  });

  it('rejects missing, insecure, and unrelated production configuration', () => {
    expect(() => resolvePasskeyConfig({})).toThrow('SITE_URL is required');
    expect(() =>
      resolvePasskeyConfig({ siteUrl: 'http://www.groupi.gg' })
    ).toThrow('must use HTTPS');
    expect(() =>
      resolvePasskeyConfig({
        siteUrl: 'https://www.groupi.gg',
        rpId: 'example.com',
      })
    ).toThrow('must match SITE_URL');
  });

  it('continues to support localhost development', () => {
    expect(
      resolvePasskeyConfig({ siteUrl: 'http://localhost:3000' })
    ).toMatchObject({
      origin: 'http://localhost:3000',
      rpID: 'localhost',
    });
  });
});
