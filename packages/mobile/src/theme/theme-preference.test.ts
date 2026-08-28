import { describe, expect, it } from 'vitest';

import { normalizeMobileThemePreference } from './theme-preference';

describe('normalizeMobileThemePreference', () => {
  it('strips Convex document metadata from the mutation payload', () => {
    const preference = normalizeMobileThemePreference({
      _id: 'preference-1',
      _creationTime: 123,
      personId: 'person-1',
      updatedAt: 456,
      selectedThemeType: 'base',
      selectedThemeId: 'ocean-dark',
      useSystemPreference: true,
      systemLightThemeId: 'ocean-light',
      systemDarkThemeId: 'ocean-dark',
    } as never);

    expect(preference).toEqual({
      selectedThemeType: 'base',
      selectedThemeId: 'ocean-dark',
      selectedCustomThemeId: undefined,
      useSystemPreference: false,
      systemLightThemeId: 'ocean-light',
      systemDarkThemeId: 'ocean-dark',
    });
    expect(preference).not.toHaveProperty('_id');
    expect(preference).not.toHaveProperty('_creationTime');
    expect(preference).not.toHaveProperty('personId');
    expect(preference).not.toHaveProperty('updatedAt');
  });

  it('uses a single explicit default theme', () => {
    expect(normalizeMobileThemePreference()).toEqual({
      selectedThemeType: 'base',
      selectedThemeId: 'groupi-light',
      selectedCustomThemeId: undefined,
      useSystemPreference: false,
      systemLightThemeId: 'groupi-light',
      systemDarkThemeId: 'groupi-dark',
    });
  });
});
