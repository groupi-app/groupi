import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import appConfig from '../app.config';
import { APP_LINK_PATH_PREFIXES } from '../src/lib/public-urls';

describe('native app-link configuration', () => {
  it('declares matching iOS and Android associations for the public host', () => {
    expect(appConfig.ios.associatedDomains).toEqual(['applinks:www.groupi.gg']);
    expect(appConfig.android.intentFilters).toHaveLength(
      APP_LINK_PATH_PREFIXES.length
    );
    expect(appConfig.android.intentFilters).toEqual(
      expect.arrayContaining(
        APP_LINK_PATH_PREFIXES.map(pathPrefix =>
          expect.objectContaining({
            autoVerify: true,
            data: [
              {
                scheme: 'https',
                host: 'www.groupi.gg',
                pathPrefix,
              },
            ],
          })
        )
      )
    );
  });

  it('keeps checked-in native projects aligned with Expo config', () => {
    const entitlements = readFileSync(
      new URL('../ios/Groupi/Groupi.entitlements', import.meta.url),
      'utf8'
    );
    const manifest = readFileSync(
      new URL('../android/app/src/main/AndroidManifest.xml', import.meta.url),
      'utf8'
    );

    expect(entitlements).toContain('applinks:www.groupi.gg');
    expect(manifest).toContain('android:autoVerify="true"');
    for (const pathPrefix of APP_LINK_PATH_PREFIXES) {
      expect(manifest).toContain(`android:pathPrefix="${pathPrefix}"`);
    }
  });
});
