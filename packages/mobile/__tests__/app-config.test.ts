import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';

import appConfig from '../app.config';
import { APP_LINK_PATH_PREFIXES } from '../src/lib/public-urls';

describe('native app-link configuration', () => {
  it('uses the shared Groupi brand icon across Expo and checked-in iOS assets', () => {
    const webIcon = readFileSync(
      new URL('../../web/public/icons/icon-1024x1024.png', import.meta.url)
    );
    const expoIcon = readFileSync(
      new URL('../assets/icon.png', import.meta.url)
    );
    const iosIcon = readFileSync(
      new URL(
        '../ios/Groupi/Images.xcassets/AppIcon.appiconset/App-Icon-1024x1024@1x.png',
        import.meta.url
      )
    );

    expect(appConfig.icon).toBe('./assets/icon.png');
    expect(appConfig.android.adaptiveIcon.backgroundColor).toBe('#8200AD');
    expect(expoIcon.equals(webIcon)).toBe(true);
    expect(iosIcon.equals(webIcon)).toBe(true);
  });

  it('is linked to the production Expo project', () => {
    expect(appConfig.owner).toBe('theiasurette');
    expect(appConfig.extra.eas.projectId).toBe(
      '15aeaffd-755c-4f24-96b9-dd9f1bc25e6f'
    );
  });

  it('keeps native passkey ceremonies on the iOS main queue', () => {
    const packageJson = JSON.parse(
      readFileSync(new URL('../../../package.json', import.meta.url), 'utf8')
    ) as {
      pnpm?: { patchedDependencies?: Record<string, string> };
    };
    const patchPath =
      packageJson.pnpm?.patchedDependencies?.[
        '@lobehub/expo-better-auth-passkey@1.0.2'
      ];

    expect(patchPath).toBe(
      'patches/@lobehub__expo-better-auth-passkey@1.0.2.patch'
    );
    if (!patchPath) {
      throw new Error('Native passkey dependency patch is not configured');
    }

    const nativePatch = readFileSync(
      new URL(`../../../${patchPath}`, import.meta.url),
      'utf8'
    );

    expect(nativePatch.match(/\.runOnQueue\(\.main\)/g)).toHaveLength(2);
  });

  it('declares matching iOS and Android associations for the public host', () => {
    expect(appConfig.ios.associatedDomains).toEqual([
      'applinks:www.groupi.gg',
      'webcredentials:www.groupi.gg',
    ]);
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
    expect(entitlements).toContain('webcredentials:www.groupi.gg');
    expect(manifest).toContain('android:autoVerify="true"');
    for (const pathPrefix of APP_LINK_PATH_PREFIXES) {
      expect(manifest).toContain(`android:pathPrefix="${pathPrefix}"`);
    }
  });
});
