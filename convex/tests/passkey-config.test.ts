import { describe, expect, it } from 'vitest';

import { resolvePasskeyConfig } from '../lib/passkeyConfig';

describe('passkey configuration', () => {
  it('derives the relying party from the canonical site URL', () => {
    expect(resolvePasskeyConfig({ siteUrl: 'https://www.groupi.gg/' })).toEqual(
      {
        origin: 'https://www.groupi.gg',
        rpID: 'www.groupi.gg',
        rpName: 'Groupi',
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
    });
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
